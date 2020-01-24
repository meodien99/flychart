import { PlotValue, PlotRow } from "./plot-data";
import { TimePointIndex, TimePoint } from "./times";
import { Nominal } from "../helpers/nominal";
import { lowerbound, upperbound } from '../helpers/binary-search';
import { ensureNotNull, assert } from "../helpers/assertions";

const CHUNK_SIZE = 30;

export const enum PlotRowSearchMode {
    NearestLeft = -1,
    Exact = 0,
    NearestRight = 1
};

export type FoldingFunction<PlotValueTuple extends PlotValue[], T> = (index: TimePointIndex, value: PlotValueTuple, acc: T) => T;
export type EnumeratingFunction<TimeType, PlotValueTuple extends PlotValue[]> = (index: TimePointIndex, bar: PlotRow<TimeType, PlotValueTuple>) => boolean;
export type PlotRowPredicate<PlotValueTuple extends PlotValue[]> = (index: TimePointIndex, value: PlotValueTuple) => boolean;
export type ReducingFunction<PlotValueTuple extends PlotValue[], T> = (acc: T, index: TimePointIndex, value: PlotValueTuple) => T;

export type PlotInfo = {
    name: string,
    offset: number
};

export type PlotInfoList = ReadonlyArray<PlotInfo>;

export type PlotFunctionMap<PlotValueTuple extends PlotValue[]> = Map<string, (row: PlotValueTuple) => PlotValue>;

type EmptyValuePredicate<PlotValueTuple extends PlotValue[]> = (value: PlotValueTuple) => boolean

export type MinMax = {
    min: number,
    max: number
};

export type PlotRowIndex = Nominal<number, 'PlotRowIndex'>;

export class PlotList<TimeType, PlotValueTuple extends PlotValue[] = PlotValue[]> {
    private _rows: PlotRow<TimeType, PlotValueTuple>[] = [];
    // some plotList instances are just readonly views of sub-range of data stored in another PlotList
    // _start and _end fields are used to implement such views
    private _start: number = 0;
    // end is an after-last index
    private _end: number = 0;
    private _shareRead: boolean = false;
    private _minMaxCache: Map<string, Map<number, MinMax | null>> = new Map();
    private _rowSearchCache: Map<TimePointIndex, Map<PlotRowSearchMode, PlotRow<TimeType, PlotValueTuple>>> = new Map();
	private _rowSearchCacheWithoutEmptyValues: Map<TimePointIndex, Map<PlotRowSearchMode, PlotRow<TimeType, PlotValueTuple>>> = new Map();

    private readonly _plotFunctions: PlotFunctionMap<PlotValueTuple>;
    private readonly _emptyValuePredicate: EmptyValuePredicate<PlotValueTuple> | null;

    public constructor(plotFunctions: PlotFunctionMap<PlotValueTuple> | null = null, emptyValuePredicate: EmptyValuePredicate<PlotValueTuple> | null = null) {
        this._plotFunctions = plotFunctions || new Map();
        this._emptyValuePredicate = emptyValuePredicate;
    }

    public size(): number {
        return this._rows.length;
    }

    public first(): PlotRow<TimeType, PlotValueTuple> | null {
        return this.size() > 0 ? this._rows[this._start as PlotRowIndex] : null;
    }   
    
    public last(): PlotRow<TimeType, PlotValueTuple> | null {
        return this.size() > 0 ? this._rows[(this._end - 1) as PlotRowIndex] : null;
    }

    public firstIndex(): TimePointIndex | null {
        return this.size() > 0 ? this._indexAt(this._start as PlotRowIndex) : null;
    }

    public lastIndex(): TimePointIndex | null {
        return this.size() > 0 ? this._indexAt((this._end - 1) as PlotRowIndex) : null;
    }

    public isEmpty(): boolean {
        return this.size() === 0;
    }

    public contains(index: TimePointIndex): boolean {
        return this._search(index, PlotRowSearchMode.Exact) !== null;
    }

    public valueAt(index: TimePointIndex): PlotRow<TimeType, PlotValueTuple> | null {
        return this.search(index);
    }

    /**
     * @return true if new index is added or false if existing index is updated
     */
    public add(index: TimePointIndex, time: TimeType, value: PlotValueTuple): boolean {
        if(this._shareRead) {
            return false;
        }

        const row = {index, value, time};
        const pos = this._search(index, PlotRowSearchMode.Exact);
        this._rowSearchCache.clear();
        this._rowSearchCacheWithoutEmptyValues.clear();

        if(pos === null) {
            this._rows.splice(this._lowerbound(index), 0, row);
            this._start = 0;
            this._end = this._rows.length;

            return true;
        } else {
            this._rows[pos] = row;
 			return false;
        }
    }

    public search(index: TimePointIndex, searchMode: PlotRowSearchMode = PlotRowSearchMode.Exact, skipEmptyValues?: boolean): PlotRow<TimeType, PlotValueTuple> | null {
        const pos = this._search(index, searchMode, skipEmptyValues);
        if(pos === null) 
            return null;

        const item = this._valueAt(pos);

        return {
            index: this._indexAt(pos),
            time: item.time,
            value: item.value
        };
    }

    /**
 	 * Execute fun on each element.
 	 * Stops iteration if callback function returns true.
 	 * @param fun Callback function on each element function(index, value): boolean
    */
    public each(func: EnumeratingFunction<TimeType, PlotValueTuple>): void {
        for(let i = this._start; i < this._end; i++) {
            const index = this._indexAt(i as PlotRowIndex);
            const item = this._valueAt(i as PlotRowIndex);
            if(func(index, item)) {
                break;
            }
        }
    }

    /**
 	 * @returns Readonly collection of elements in range
 	*/
    public range(start: TimePointIndex, end: TimePointIndex): PlotList<TimeType, PlotValueTuple> {
        const copy = new PlotList<TimeType, PlotValueTuple>(this._plotFunctions, this._emptyValuePredicate);
        copy._rows = this._rows;
        copy._start = this._lowerbound(start);
        copy._end = this._upperbound(end);

        copy._shareRead = true;
        return copy;
    }

    public minMaxOnRangeCached(start: TimePointIndex, end: TimePointIndex, plots: PlotInfoList): MinMax | null {
        // this code works for single series only
        // could fail after whitespaces implementation

        if (this.isEmpty()) {
            return null;
        }

        let result: MinMax | null = null;

        for (const plot of plots) {
            const plotMinMax = this._minMaxOnRangeCachedImpl(start, end, plot);
            result = mergeMinMax(result, plotMinMax);
        }

        return result;
    }

    public merge(plotRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>): PlotRow<TimeType, PlotValueTuple> | null {
        if (this._shareRead) {
            return null;
        }

        if (plotRows.length === 0) {
            return null;
        }

        // if we get a bunch of history - just prepend it
        if (this.isEmpty() || plotRows[plotRows.length - 1].index < this._rows[0].index) {
            return this._prepend(plotRows);
        }

        // if we get new rows - just append it
        if (plotRows[0].index > this._rows[this._rows.length - 1].index) {
            return this._append(plotRows);
        }

        // if we get update for the last row - just replace it
        if (plotRows.length === 1 && plotRows[0].index === this._rows[this._rows.length - 1].index) {
            this._updateLast(plotRows[0]);
            return plotRows[0];
        }

        return this._merge(plotRows);
    }

    public remove(start: TimePointIndex): PlotRow<TimeType, PlotValueTuple> | null {
        if (this._shareRead) {
            return null;
        }

        const startOffset = this._search(start, PlotRowSearchMode.NearestRight);
        if (startOffset === null) {
            return null;
        }

        const removedPlotRows = this._rows.splice(startOffset);
        // _start should never be modified in this method
        this._end = this._rows.length;

        this._minMaxCache.clear();
        this._rowSearchCache.clear();
        this._rowSearchCacheWithoutEmptyValues.clear();

        return removedPlotRows.length > 0 ? removedPlotRows[0] : null;
    }

    private _indexAt(offset: PlotRowIndex): TimePointIndex {
        return this._rows[offset].index;
    }

    private _valueAt(offset: PlotRowIndex): PlotRow<TimeType, PlotValueTuple> {
        return this._rows[offset];
    }

    private _search(index: TimePointIndex, searchMode: PlotRowSearchMode, skipEmptyValues?: boolean): PlotRowIndex | null {
        const exactPos = this._bsearch(index);

        if(exactPos === null && searchMode !== PlotRowSearchMode.Exact) {
            switch(searchMode) {
                case PlotRowSearchMode.NearestRight: 
                    return this._searchNearestLeft(index, skipEmptyValues);
                case PlotRowSearchMode.NearestRight: {
                    return this._searchNearestRight(index, skipEmptyValues);
                }
                default:
                    throw new TypeError('unknown search mode');
            }
        }

        // there's a found value or search mode is Exact
        if(!skipEmptyValues || exactPos === null || searchMode === PlotRowSearchMode.Exact) {
            return exactPos;
        }

        // skipEmptyValues is true, additionally check for emptiness
        switch(searchMode) {
            case PlotRowSearchMode.NearestLeft: 
                return this._nonEmptyNearestLeft(exactPos);
            case PlotRowSearchMode.NearestRight:
                return this._nonEmptyNearestRight(exactPos);
            default:
                throw new TypeError('Unknown search mode');
        }
    }

    private _nonEmptyNearestRight(index: PlotRowIndex): PlotRowIndex | null {
        const predicate = ensureNotNull<EmptyValuePredicate<PlotValueTuple>>(this._emptyValuePredicate);
        while(index < this._end && predicate(this._valueAt(index).value)) {
            index = (index + 1) as PlotRowIndex;
        }

        return index === this._end ? null : index;
    }

    private _nonEmptyNearestLeft(index: PlotRowIndex): PlotRowIndex | null {
        const predicate = ensureNotNull<EmptyValuePredicate<PlotValueTuple>>(this._emptyValuePredicate);
        while(index >= this._start && predicate(this._valueAt(index).value)) {
            index = (index - 1) as PlotRowIndex;
        }

        return index < this._start ? null : index;
    }

    private _searchNearestLeft(index: TimePointIndex, skipEmptyValues?: boolean): PlotRowIndex | null {
        let nearestLeftPos = this._lowerbound(index);
        if(nearestLeftPos > this._start) {
            nearestLeftPos = nearestLeftPos - 1;
        }

        const result = (nearestLeftPos !== this._end && this._indexAt(nearestLeftPos as PlotRowIndex) < index) ?  nearestLeftPos as PlotRowIndex : null;
        if(skipEmptyValues && result !== null) {
            return this._nonEmptyNearestLeft(result);
        }        

        return result;
    }

    private _searchNearestRight(index: TimePointIndex, skipEmptyValues?: boolean): PlotRowIndex | null {
        const nearestRightPos = this._upperbound(index);

        const result = (nearestRightPos !== this._end && index < this._indexAt(nearestRightPos as PlotRowIndex)) ? nearestRightPos as PlotRowIndex : null;

        if(skipEmptyValues && result !== null) {
            return this._nonEmptyNearestRight(result);
        }

        return result;
    }

    private _bsearch(index: TimePointIndex): PlotRowIndex | null {
        const start = this._lowerbound(index);

        if(start !== this._end && !(index < this._rows[start as PlotRowIndex].index)) {
            return start as PlotRowIndex;
        }

        return null;
    }

    private _lowerbound(index: TimePointIndex): number {
        return lowerbound(
            this._rows,
            index, 
            (a: PlotRow<TimeType, PlotValueTuple>, b: TimePointIndex) => a.index < b,
            this._start,
            this._end
        );
    }

    private _upperbound(index: TimePointIndex): number {
        return upperbound(
            this._rows,
            index,
            (a: TimePointIndex, b: PlotRow<TimeType, PlotValueTuple>) => b.index > a,
            this._start,
            this._end
        );
    }

    /**
 	 * @param endIndex Non-inclusive end
 	 */
    private _plotMinMax(startIndex: number, endIndex: number, plot: PlotInfo): MinMax | null {
        let result: MinMax | null = null;

        const func = this._plotFunctions.get(plot.name);

        if(func === undefined) {
            throw new Error(`Plot "${plot.name}" is not registered`);
        }

        for(let i = startIndex; i < endIndex; i++) {
            const values = this._rows[i as PlotRowIndex].value;

            const v = func(values);
            if(v === undefined || v === null || Number.isNaN(v))
                continue;

            if(result === null) {
                result = {min: v, max: v};
            } else {
                if(v < result.min) {
                    result.min = v;
                }

                if(v > result.min) {
                    result.max = v;
                }
            }
        }

        return result;
    }

    private _invalidateCacheForRow(row: PlotRow<TimeType, PlotValueTuple>): void {
        const chunkIndex = Math.floor(row.index/CHUNK_SIZE);

        this._minMaxCache.forEach((cacheItem: Map<number, MinMax | null>) => cacheItem.delete(chunkIndex));
    }

    private _prepend(plotRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>): PlotRow<TimeType, PlotValueTuple> {
        assert(!this._shareRead, 'collection should not be readonly');
        assert(plotRows.length !== 0, 'plotRows should not be empty');

        this._rowSearchCache.clear();
        this._rowSearchCacheWithoutEmptyValues.clear();
        this._minMaxCache.clear();

        this._rows = plotRows.concat(this._rows);

        this._start = 0;
        this._end = this._rows.length;

        return plotRows[0];
    }

    private _append(plotRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>): PlotRow<TimeType, PlotValueTuple> {
        assert(!this._shareRead, 'collection should not be readonly');
        assert(plotRows.length !== 0, 'plotRows should not be empty');

        this._rowSearchCache.clear();
        this._rowSearchCacheWithoutEmptyValues.clear();
        this._minMaxCache.clear();

        this._rows = this._rows.concat(plotRows);

        this._start = 0;
        this._end = this._rows.length;

        return plotRows[0];
    }

    private _updateLast(plotRow: PlotRow<TimeType, PlotValueTuple>): void {
        assert(!this.isEmpty(), 'plot list should not be empty');
 		const currentLastRow = this._rows[this._end - 1];
        assert(currentLastRow.index === plotRow.index, 'last row index should match new row index');
         
        this._invalidateCacheForRow(plotRow);

        this._rowSearchCache.delete(plotRow.index);
        this._rowSearchCacheWithoutEmptyValues.delete(plotRow.index);

        this._rows[this._end - 1] = plotRow;
    }

    private _merge(plotRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>): PlotRow<TimeType, PlotValueTuple> {
        assert(plotRows.length !== 0, 'plot rows should not be empty');
        this._rowSearchCache.clear();
        this._rowSearchCacheWithoutEmptyValues.clear();
        this._minMaxCache.clear();

        this._rows = mergePlotRows(this._rows, plotRows);

        this._start = 0;
        this._end = this._rows.length;

        return plotRows[0];
    }

    private _minMaxOnRangeCachedImpl(start: TimePointIndex, end: TimePointIndex, plotInfo: PlotInfo): MinMax | null {
        // this code works for single series only
         // could fail after whitespaces implementation
        if(this.isEmpty()) {
            return null;
        }

        let result: MinMax | null = null;

        // assume that bar indexes only increase
        const firstIndex = ensureNotNull(this.firstIndex());
        const lastIndex = ensureNotNull(this.lastIndex());

        let s = start - plotInfo.offset;
        let e = end - plotInfo.offset;

        s = Math.max(s, firstIndex);
        e = Math.min(e, lastIndex);

        const cachedLow = Math.ceil(s/CHUNK_SIZE) * CHUNK_SIZE;
        const cachedHigh = Math.max(cachedLow, Math.floor(e/CHUNK_SIZE) * CHUNK_SIZE);
        
        {
            const startIndex = this._lowerbound(s as TimePointIndex);
            const endIndex = this._upperbound(Math.min(e, cachedLow, end) as TimePointIndex); // non-inclusive end
            const plotMinMax = this._plotMinMax(startIndex, endIndex, plotInfo);
            result = mergeMinMax(result, plotMinMax);
        };

        let minMaxCache = this._minMaxCache.get(plotInfo.name);

        if(minMaxCache === undefined) {
            minMaxCache = new Map();
            this._minMaxCache.set(plotInfo.name, minMaxCache);
        }

        // now go cached
        for(let c = Math.max(cachedLow + 1, s); c < cachedHigh; c += CHUNK_SIZE) {
            const chunkIndex = Math.floor(c / CHUNK_SIZE);
            let chunkMinMax = minMaxCache.get(chunkIndex);
            if(chunkMinMax === undefined) {
                const chunkStart = chunkIndex * CHUNK_SIZE;
                const chunkEnd = Math.min((chunkIndex + 1) * CHUNK_SIZE - 1, this._rows.length - 1);
                chunkMinMax = this._plotMinMax(chunkStart, chunkEnd, plotInfo);

                minMaxCache.set(chunkIndex, chunkMinMax);
            }

            result = mergeMinMax(result, chunkMinMax);
        }

        // tail
        {
            const startIndex = this._lowerbound(cachedHigh as TimePointIndex);
            const endIndex = this._upperbound(Math.min(e, cachedLow, end) as TimePointIndex); // non-inclusive end
            const plotMinMax = this._plotMinMax(startIndex, endIndex, plotInfo);
            result = mergeMinMax(result, plotMinMax);
        }

        return result;
    }
}

export function mergeMinMax(first: MinMax | null, second: MinMax | null): MinMax | null {
    if(first === null) {
        return second;
    } else {
        if(second === null) {
            return first;
        } else {
            const min = Math.min(first.min, second.min);
            const max = Math.max(first.max, second.max);

            return {min, max};
        }
    }
}

/**
 * Merges two ordered plot row arrays and returns result (ordered plot row array).
 *
 * BEWARE: If row indexes from plot rows are equal, the new plot row is used.
 *
 * NOTE: Time and memory complexity are O(N+M).
 */
export function mergePlotRows<TimeType, PlotValueTuple extends PlotValue[] = PlotValue[]>(
    originalPlotRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>, 
    newPlotRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>
): PlotRow<TimeType, PlotValueTuple>[] {
    const newArraySize = calcMergedArraySize(originalPlotRows, newPlotRows);

    const result = new Array<PlotRow<TimeType, PlotValueTuple>>(newArraySize);

    let originalRowsIndex = 0;
    let newRowsIndex = 0;

    const originalRowsSize = originalPlotRows.length;
    const newRowsSize = newPlotRows.length;

    let resultRowsIndex = 0;

    while(originalRowsIndex < originalRowsSize && newRowsIndex < newRowsSize) {
        if(originalPlotRows[originalRowsIndex].index < newPlotRows[newRowsIndex].index) {
            result[resultRowsIndex] = originalPlotRows[originalRowsIndex];
            originalRowsIndex++;
        } else if(originalPlotRows[originalRowsIndex].index > newPlotRows[newRowsIndex].index) {
            result[resultRowsIndex] = newPlotRows[newRowsIndex];
            newRowsIndex++;
        } else {
            result[resultRowsIndex] = newPlotRows[newRowsIndex];
            originalRowsIndex++;
            newRowsIndex++;
        }

        resultRowsIndex++;
    }

    while(originalRowsIndex < originalRowsSize) {
        result[resultRowsIndex] = originalPlotRows[originalRowsIndex];
        originalRowsIndex++;
        resultRowsIndex++;
    }

    while (newRowsIndex < newRowsSize) {
        result[resultRowsIndex] = newPlotRows[newRowsIndex];
        newRowsIndex++;
        resultRowsIndex++;
    }

    return result;
}

function calcMergedArraySize<TimeType, PlotValueTuple extends PlotValue[] = PlotValue[]>(
    firstRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>, 
    secondRows: ReadonlyArray<PlotRow<TimeType, PlotValueTuple>>
): number {
    const firstRowsSize = firstRows.length;
    const secondRowsSize = secondRows.length;

    // new plot rows size is (first plot rows size) + (second plot rows size) - common part size
    // in this case we can just calculate common part size
    let result = firstRowsSize + secondRowsSize;

    // TODO: we can move first/second indexes to the right and first/second size to lower/upper bound of opposite array
    // to skip checking uncommon parts 
    let firstIndex = 0
    let secondIndex = 0;
    
    while(firstIndex < firstRowsSize && secondIndex < secondRowsSize) {
        if(firstRows[firstIndex].index < secondRows[secondIndex].index) {
            firstIndex++;
        } else if(firstRows[firstIndex].index > secondRows[secondIndex].index) {
            secondIndex++;
        } else {
            firstIndex++;
            secondIndex++;
            result--;
        }
    }

    return result;
}