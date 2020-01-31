import { Coordinate } from "./Coordinate";
import { TimePointIndex } from "./times";
import { BarPrice, BarFunction, Bar } from "./bar";
import { PriceDataSource } from "./PriceDataSource";
import { IDestroyable } from "../helpers/idestroyable";
import { IFormatter } from "../formatters/iformatter";
import { ChartModel } from "./Chart";
import { SeriesOptions, SeriesType } from "./SeriesOptions";
import { PlotRowSearchMode } from "./PlotList";
import { SeriesPlotIndex, SeriesData } from "./SeriesData";
import { SeriesPriceAxisView } from "../views/price-axis/SeriesPriceAxisView";
import { IPriceAxisView } from "../views/price-axis/iprice-axis-view";

export interface LastValueDataResult {
    noData: boolean;
}

export interface LastValueDataResultWithoutData extends LastValueDataResult {
    noData: true;
}

export interface LastValueDataResultWithData extends LastValueDataResult {
    noData: false;
    text: string;
    formattedPriceAbsolute: string;
    formattedPricePercentage: string;
    color: string;
    coordinate: Coordinate;
    floatCoordinate: Coordinate;
    index: TimePointIndex;
}

export interface LastValueDataResultWithRawPrice extends LastValueDataResultWithData {
    price: number;
}

export type LastValueDataResultWithoutRawPrice = LastValueDataResultWithoutData | LastValueDataResultWithData;

export interface MarketData {
    price: BarPrice;
    radius: number;
}

export class Series extends PriceDataSource implements IDestroyable {
    private readonly _seriesType: SeriesType;
    private _data: SeriesData = new SeriesData();
import { BarsRange } from "./BarsRange";
private readonly _priceAxisViews: IPriceAxisView[];
    private readonly _panePriceAxisView: PanePriceAxisView[];

    private _formatter!: IFormatter;
    private readonly _priceLineView: SeriesPriceLinePaneView = new SeriesPriceLinePaneView(this);
    private readonly _baseHorizontalLineView: SeriesHorizontalBaseLinePaneView = new SeriesHorizontalBaseLinePaneView(this);

    private _endOfData: boolean = false;
    private _paneView: IUpdatablePaneView | null = null;
    private _barColorerCache: SeriesBarColorer | null = null;

    private readonly _options: SeriesOptions;
    private _barFunction: BarFunction;
    private _palette: Palette = new Palette();
    private _title: string;

    public constructor(model: ChartModel, options: SeriesOptions, seriesType: SeriesType, title: string) {
        super(model);

        this._options = options;
        this._seriesType = seriesType;
        this._title = title;

        this.createPaneView();

        const priceAxisView = new SeriesPriceAxisView(this, {model});
        this._priceAxisViews = [priceAxisView];

        this._panePriceAxisView = new PanePriceAxisView(priceAxisView, this, model);

        this._recreateFormatter();
        this._updateBarFunction();

        this._barFunction = this.barFunction(); // undefined
    }

    public destroy(): void {}

    public endOfData(): boolean {
        return this._endOfData;
    }

    public priceLineColor(lastBarColor: string): string {
        return this._options.priceLineColor || lastBarColor;
    }

    public lastValueData(plot: SeriesPlotIndex | undefined, globalLast: boolean, withRawPrice?: false): LastValueDataResultWithoutRawPrice;
    public lastValueData(plot: SeriesPlotIndex | undefined, globalLast: boolean, withRawPrice: true): LastValueDataResultWithRawPrice;
    // return object with:
    // formatted price
    // raw price (if withRawPrice)
    // coordinate
    // color
    // or { "noData": true } if last value could not be found
    // NOTE: should NEVER return null or undefined!

    public lastValueData(
        plot: SeriesPlotIndex | undefined,
        globalLast: boolean,
        withRawPrice?: boolean
    ): LastValueDataResultWithoutRawPrice | LastValueDataResultWithRawPrice {
        const noDataRes: LastValueDataResultWithoutData = {noData: true};

        const priceScale = this.priceScale();

        if(this.model().timeScale().isEmpty() || priceScale.isEmpty() || this.data().isEmpty()) {
            return noDataRes;
        }

        const visibleBars = this.model().timeScale().visibleBars();
        const firstValue = this.firstValue();

        if(visibleBars === null || firstValue === null) {
            return noDataRes;
        }

        // find range of bars inside range
        // TODO: make it more optimal
        let bar: Bar | null;
        let lastIndex: TimePointIndex;
        
        if(globalLast) {
            const lastBar = this.data().bars().last();
            if(lastBar === null) {
                return noDataRes;
            }

            bar = lastBar;
            lastIndex = lastBar.index;
        } else {
            const endBar = this.data().bars().search(visibleBars.lastBar(), PlotRowSearchMode.NearestLeft);
            if(endBar === null) {
                return noDataRes;
            }

            bar = this.data().bars().valueAt(endBar.index);
            if(bar === null) {
                return noDataRes;
            }

            bar = this.data().bars().valueAt(endBar.index);
            if(bar === null) {
                return noDataRes;
            }
            
            lastIndex = endBar.index;
        }

        const price = plot !== undefined ? bar.value[plot] as number : this._barFunction(bar.value);
    }

    public data(): SeriesData {
        return this._data;
    }
}