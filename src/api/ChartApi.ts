import { DeepPartial, merge, clone } from "../helpers/strict-type-checkers";
import { PriceFormat, percisionByMinMove, SeriesOptions } from "../models/SeriesOptions";
import { IChartApi, MouseEventParams, TimeRangeChangeEventHandler, MouseEventHandler } from "./ichart-api";
import { DataUpdatesConsumer, SeriesApiBase } from "./seriesApiBase";
import { Delegate } from "../helpers/delegate";
import { Series } from "../models/Series";
import { ChartOptions } from "../models/Chart";
import { TimeRange, ITimeScaleApi } from "./itime-scale-api";
import { DataLayer } from "./DataLayer";
import { TimeScaleApi } from "./TimeScaleApi";
import { PriceScaleApi } from "./PriceScaleApi";
import { ChartWidget, MouseEventParamsImpl } from "../ui/ChartWidget";
import { ISeriesApi } from "./iseries-api";
import { ensureDefined } from "../helpers/assertions";
// import { HistogramSeriesParams, IHistogramSeriesApi } from "./ihistogram-series-api";
import { LineSeriesParams, ILineSeriesApi } from "./iline-series-api";
import { SeriesUpdatePacket } from "./data-layer";
import { TimedData } from "./timed-data";
import { Palette } from "../models/Palette";
import { IPriceScaleApi } from "./iprice-scale-api";
import { seriesOptionsDefaults } from "./options/params-series-options";
import { LineSeriesApi } from "./line-series-api";
import { TimePointIndex } from "../models/time-data";

function patchPriceFormat(priceFormat?: DeepPartial<PriceFormat>): void {
    if(priceFormat === undefined) {
        return;
    }

    if(priceFormat.minMove !== undefined && priceFormat.precision === undefined) {
        priceFormat.precision = percisionByMinMove(priceFormat.minMove);
    }
}

export class ChartApi implements IChartApi, DataUpdatesConsumer {
    private _chartWidget: ChartWidget;
    private _dataLayer: DataLayer = new DataLayer();

    private readonly _timeRangeChanged: Delegate<TimeRange | null> = new Delegate();
    private readonly _seriesMap: Map<SeriesApiBase, Series> = new Map();
    private readonly _seriesMapReversed: Map<Series, SeriesApiBase> = new Map();

    private readonly _clickedDelegate: Delegate<MouseEventParams> = new Delegate();
    private readonly _crossHairMovedDelegate: Delegate<MouseEventParams> = new Delegate();

    private readonly _priceScaleApi: PriceScaleApi;
    private readonly _timeScaleApi: TimeScaleApi;

    public constructor(container: HTMLElement, options: ChartOptions) {
        this._chartWidget = new ChartWidget(container, options);
        this._chartWidget.model().timeScale().visibleBarsChanged().subscribe(this._onVisibleBarsChanged.bind(this));

        this._chartWidget.clicked().subscribe((param: MouseEventParamsImpl) => this._clickedDelegate.fire(this._convertMouseParams(param)), this);
 		this._chartWidget.crossHairMoved().subscribe((param: MouseEventParamsImpl) => this._crossHairMovedDelegate.fire(this._convertMouseParams(param)), this);

 		const model = this._chartWidget.model();
 		this._priceScaleApi = new PriceScaleApi(model);
 		this._timeScaleApi = new TimeScaleApi(model);
    }


 	public remove(): void {
        this._chartWidget.model().timeScale().visibleBarsChanged().unsubscribeAll(this);
        this._chartWidget.clicked().unsubscribeAll(this);
        this._chartWidget.crossHairMoved().unsubscribeAll(this);
        this._priceScaleApi.destroy();
        this._timeScaleApi.destroy();
        this._chartWidget.destroy();
        delete this._chartWidget;
        this._seriesMap.forEach((series: Series, api: SeriesApiBase) => {
            api.destroy();
        });
        this._seriesMap.clear();
        this._seriesMapReversed.clear();
        this._timeRangeChanged.destroy();
        this._clickedDelegate.destroy();
        this._crossHairMovedDelegate.destroy();
        this._dataLayer.destroy();
        delete this._dataLayer;
    }

    public resize(height: number, width: number, forceRepaint?: boolean): void {
        this._chartWidget.resize(height, width, forceRepaint);
    }

    public addLineSeries(lineParams?: DeepPartial<LineSeriesParams>): ILineSeriesApi {
        lineParams = lineParams || {};
        const model = this._chartWidget.model();
        const inputOptions = lineParams.options || {};
        patchPriceFormat(inputOptions.priceFormat);
        const options = merge(clone(seriesOptionsDefaults), inputOptions) as SeriesOptions;
        const series = model.createSeries('Line', options, Boolean(lineParams.overlay), lineParams.title, lineParams.scaleMargins);
        const res = new LineSeriesApi(series, this);
        this._seriesMap.set(res, series);
        this._seriesMapReversed.set(series, res);
        return res;
    }

    public removeSeries(seriesApi: ISeriesApi): void {
        const seriesObj = seriesApi as SeriesApiBase;
        const series = ensureDefined(this._seriesMap.get(seriesObj));

        const update = this._dataLayer.removeSeries(series);
        const model = this._chartWidget.model();
        model.removeSeries(series);
        const timeScaleUpdate = update.timeScaleUpdate;
        model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, true);
        timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
            key.setData(value.update, false);
        });
        model.updateTimeScaleBaseIndex(0 as TimePointIndex);
        this._seriesMap.delete(seriesObj);
        this._seriesMapReversed.delete(series);
    }

    public applyNewData(series: Series, data: TimedData[], palette?: Palette): void {
        const update = this._dataLayer.setSeriesData(series, data, palette);
        const model = this._chartWidget.model();
        const timeScaleUpdate = update.timeScaleUpdate;
        model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, true);
        timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
            key.setData(value.update, series === key, palette);
        });
        model.updateTimeScaleBaseIndex(0 as TimePointIndex);
    }

    public updateData(series: Series, data: TimedData, palette?: Palette): void {
        const update = this._dataLayer.updateSeriesData(series, data, palette);
        const model = this._chartWidget.model();
        const timeScaleUpdate = update.timeScaleUpdate;
        model.updateTimeScale(timeScaleUpdate.index, timeScaleUpdate.changes, timeScaleUpdate.marks, false);
        timeScaleUpdate.seriesUpdates.forEach((value: SeriesUpdatePacket, key: Series) => {
            key.updateData(value.update);
        });
        model.updateTimeScaleBaseIndex(0 as TimePointIndex);
    }

    public subscribeClick(handler: MouseEventHandler): void {
        this._clickedDelegate.subscribe(handler);
    }

    public unsubscribeClick(handler: MouseEventHandler): void {
        this._clickedDelegate.unsubscribe(handler);
    }

    public subscribeCrossHairMove(handler: MouseEventHandler): void {
        this._crossHairMovedDelegate.subscribe(handler);
    }

    public unsubscribeCrossHairMove(handler: MouseEventHandler): void {
        this._crossHairMovedDelegate.unsubscribe(handler);
    }

    public subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
        this._timeRangeChanged.subscribe(handler);
    }

    public unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void {
        this._timeRangeChanged.unsubscribe(handler);
    }

    // TODO: add more subscriptions

    public priceScale(): IPriceScaleApi {
        return this._priceScaleApi;
    }

    public timeScale(): ITimeScaleApi {
        return this._timeScaleApi;
    }

    public applyOptions(options: DeepPartial<ChartOptions>): void {
        this._chartWidget.applyOptions(options);
    }

    public options(): ChartOptions {
        return this._chartWidget.options();
    }

    public disableBranding(): void {
        this._chartWidget.disableBranding();
    }

    private _onVisibleBarsChanged(): void {
        if (this._timeRangeChanged.hasListeners()) {
            this._timeRangeChanged.fire(this.timeScale().getVisibleRange());
        }
    }

    private _mapSeriesToApi(series: Series): ISeriesApi {
        return ensureDefined(this._seriesMapReversed.get(series));
    }

    private _convertMouseParams(param: MouseEventParamsImpl): MouseEventParams {
        const seriesPrices = new Map<ISeriesApi, number>();
        param.seriesPrices.forEach((price: number, series: Series) => {
            seriesPrices.set(this._mapSeriesToApi(series), price);
        });
        return {
            time: param.time && (param.time.businessDay || param.time.timestamp),
            point: param.point,
            seriesPrices,
        };
    }
}