import { ChartModel } from "../../models/Chart";
import { PriceAxisView } from "./PriceAxisView";
import { Series, LastValueDataResultWithData } from "../../models/Series";
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from "../../renderers/iprice-axis-view-renderer";
import { PriceAxisLastValueMode } from "../../models/SeriesOptions";

export type SeriesPriceAxisViewData = {
    model: ChartModel
};

export class SeriesPriceAxisView extends PriceAxisView {
    private readonly _source: Series;
    private readonly _data: SeriesPriceAxisViewData;

    public constructor(source: Series, data: SeriesPriceAxisViewData) {
        super();

        this._source = source;
        this._data = data;
    }

    protected _getSource(): Series {
        return this._source;
    }

    protected _getData(): SeriesPriceAxisViewData {
        return this._data;
    }

    protected _updateRendererData(
        axisRendererData: PriceAxisViewRendererData,
 		paneRendererData: PriceAxisViewRendererData,
 		commonRendererData: PriceAxisViewRendererCommonData
    ): void {
        axisRendererData.visible = false;
        paneRendererData.visible = false;

        const seriesOptions = this._source.options();
        const showSeriesLastValue = seriesOptions.lastValueVisible;

        const showSymbolLabel = this._source.title() !== '';
        const showPriceAndPercent = seriesOptions.seriesLastValueMode === PriceAxisLastValueMode.LastPriceAndPercentageValue;

        const lastValueData = this._source.lastValueData(undefined, false);
        if(lastValueData.noData) {
            return;
        }

        if(lastValueData.noData === false) {
            if(showSeriesLastValue) {
                axisRendererData.text = this._axisText(lastValueData, showSeriesLastValue, showPriceAndPercent);
                axisRendererData.visible = axisRendererData.text.length !== 0;
            }
    
            if(showSymbolLabel || showPriceAndPercent) {
                paneRendererData.text = this._paneText(lastValueData, showSeriesLastValue, showSymbolLabel, showPriceAndPercent);
                paneRendererData.visible = paneRendererData.text.length > 0;
            }
    
            commonRendererData.background = this._source.priceLineColor(lastValueData.color);
            commonRendererData.color = this.generateTextColor(commonRendererData.background);
            commonRendererData.coordinate = lastValueData.coordinate;
            commonRendererData.floatCoordinate = lastValueData.floatCoordinate;
        }
    }

    protected _paneText(
        lastValueData: LastValueDataResultWithData,
        showSeriesLastValue: boolean,
        showSymbolLabel: boolean,
        showPriceAndPercentage: boolean
    ): string {
        let result = '';

        const title = this._source.title();

        if(showSymbolLabel && title.length !== 0) {
            result += `${title}`;
        }

        if (showSeriesLastValue && showPriceAndPercentage) {
            result += this._source.priceScale().isPercentage() ?
                lastValueData.formattedPriceAbsolute : lastValueData.formattedPricePercentage;
        }

        return result.trim();
    }

    protected _axisText(
        lastValueData: LastValueDataResultWithData,
        showSeriesLastValue: boolean,
        showPriceAndPercentage: boolean
    ): string {
        if (!showSeriesLastValue) {
            return '';
        }

        if (!showPriceAndPercentage) {
            return lastValueData.text;
        }

        return this._source.priceScale().isPercentage() ?
            lastValueData.formattedPricePercentage : lastValueData.formattedPriceAbsolute;
    }
}