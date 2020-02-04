import {barFunctions, Bar, BarFunction} from './bar';
import { TimePoint, TimePointIndex } from './times';
import { PlotList, PlotFunctionMap, EnumeratingFunction, PlotRowSearchMode } from './PlotList';
import { PlotRow } from './plot-data';

export const enum TimePointIndexSearchMode {
    FromLeft = -1,
    FromRight = 1
};

//Plot's index in plot list tuple for series (or overlay study)
//@see {Bar}
export const enum SeriesPlotIndex {
    Open = 0,
    High = 1,
    Low = 2,
    Close = 3,
    Color = 4
};

type SeriesPriceSource = keyof typeof barFunctions;

const seriesSource: SeriesPriceSource[] = ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'];

export function barFunction(priceSource: SeriesPriceSource): BarFunction {
    return barFunctions[priceSource];
}

function seriesPlotFunctionMap(): PlotFunctionMap<Bar['value']> {
    const result: PlotFunctionMap<Bar['value']> = new Map();

    seriesSource.forEach((plot: keyof typeof barFunctions) => {
        result.set(plot, barFunction(plot));
    });
    
    return result;
}

export class SeriesData {
    private _bars: PlotList<TimePoint, Bar['value']>;

    public constructor() {
        this._bars = new PlotList<TimePoint, Bar['value']>(seriesPlotFunctionMap());
    }

    public bars(): PlotList<TimePoint, Bar['value']> {
        return this._bars;
    }

    public size(): number {
        return this._bars.size();
    }

    public each(func: EnumeratingFunction<TimePoint, Bar['value']>): void {
        this._bars.each(func);
    }

    public clear(): void {
        this._bars.clear();
    }

    public isEmpty(): boolean {
        return this._bars.isEmpty();
    }

    public first(): PlotRow<TimePoint, Bar['value']> | null {
        return this._bars.first();
    }

    public last(): PlotRow<TimePoint, Bar['value']> | null {
        return this._bars.last();
    }

    public search(index: TimePointIndex, options?: PlotRowSearchMode): PlotRow<TimePoint, Bar['value']> | null {
        return this.bars().search(index, options);
    }

    public valueAt(index: TimePointIndex): Bar | null {
        return this.search(index);
    }
}