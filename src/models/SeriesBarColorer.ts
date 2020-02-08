import { Series } from "./Series";
import { TimePointIndex, TimePoint } from "./times";
import { ensureNotNull, ensure } from "../helpers/assertions";
import { Bar } from "./bar";
import { PlotList } from "./PlotList";
import { SeriesPlotIndex } from "./SeriesData";
import { Palette } from "./Palette";

export type PrecomputedBars = {
    value: Bar,
    previousValue?: Bar
};

export type BarColorerStyle = {
    barColor: string,
    barBorderColor: string, // for candle only
    barWickColor: string, // for candle only
}

const emptyResult: BarColorerStyle = {
    barColor:'',
    barBorderColor: '',
    barWickColor: ''
};

export class SeriesBarColorer {
    private _series: Series;

    public constructor(series: Series)  {
        this._series = series;
    }

    // precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
    // Used to avoid binary search if bars are already known
    public barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
        const targetType = this._series.seriesType();
        switch(targetType) {
            case 'Line': 
                return this._lineStyle();
            case 'Area':
                return this._areaStyle();
            case 'Bar':
                return this._barStyle(barIndex, precomputedBars);
            case 'Candle':
                return this._candleStyle(barIndex, precomputedBars);
            case 'Histogram':
                return this._histogramStyle(barIndex, precomputedBars);
        }

        throw new Error('unknown chart style');
    }

    private _lineStyle(): BarColorerStyle {
        const result = {...emptyResult};
        result.barColor =  this._series.options().lineStyle.color;
        return result;
    }

    private _areaStyle(): BarColorerStyle {
        const result = {...emptyResult};
        result.barColor = this._series.options().areaStyle.lineColor;
        return result;
    }

    private _barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
        const result = {...emptyResult};
        const barStyle = this._series.options().barStyle;

        const {upColor, downColor} = barStyle;
        const borderUpColor = upColor;
        const borderDownColor = downColor;

        const currentBar = ensureNotNull<Bar>(this._findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar.value[SeriesPlotIndex.Open]) <= ensure(currentBar.value[SeriesPlotIndex.Close]);

        result.barColor = isUp ? upColor : downColor;
        result.barBorderColor = isUp ? borderUpColor : borderDownColor;

        return result;
    }

    private _candleStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
        const result = { ...emptyResult };
        const candleStyle = this._series.options().candleStyle;

        const upColor = candleStyle.upColor;
        const downColor = candleStyle.downColor;
        const borderUpColor = candleStyle.borderUpColor;
        const borderDownColor = candleStyle.borderDownColor;

        const wickUpColor = candleStyle.wickUpColor;
        const wickDownColor = candleStyle.wickDownColor;

        const currentBar = ensureNotNull<Bar>(this._findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar.value[SeriesPlotIndex.Open]) <= ensure(currentBar.value[SeriesPlotIndex.Close]);

        result.barColor = isUp ? upColor : downColor;
        result.barBorderColor = isUp ? borderUpColor : borderDownColor;
        result.barWickColor = isUp ? wickUpColor : wickDownColor;

        return result;
    }

    private _histogramStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): BarColorerStyle {
        const result = {...emptyResult};
        const currentBar = ensureNotNull<Bar>(this._findBar(barIndex, precomputedBars));
        const color = currentBar.value[SeriesPlotIndex.Color];
        if(color !== undefined && color !== null) {
            const palette = ensureNotNull<Palette>(this._series.palette());
            result.barColor = palette.colorByIndex(color);
        } else {
            result.barColor = this._series.options().histogramStyle.color;
        }

        return result;
    }

    private _getSeriesBars(): PlotList<TimePoint, Bar['value']> {
        return this._series.bars();
    }

    private _findBar(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars): Bar | null {
        if(precomputedBars !== undefined) {
            return precomputedBars.value;
        }

        return this._getSeriesBars().valueAt(barIndex);
    }
}