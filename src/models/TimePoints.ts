import { TimePoint, TimePointIndex, UTCTimestamp } from "./time-data";

export class TimePoints {
    private _items: TimePoint[] = [];

    public clear(): void {
        this._items = [];
    }

    public size(): number {
        return this._items.length;
    }

    public firstIndex(): TimePointIndex | null {
        return this._offsetToIndex(0); 
    }

    public lastIndex(): TimePointIndex | null {
        return this._offsetToIndex(this._items.length - 1);
    }

    public merge(index: TimePointIndex, values: TimePoint[]): void {
        if(values.length === 0) {
            return;
        }

        // assume that values contains at least one TimePoint 
        if(this._items.length === 0) {
            this._items = values;
            return;
        }

        const start = index;

        if(start < 0) {
            const n = Math.abs(start);

            if(values.length < n) {
                return
            }

            // this._items = [...this._items, ...values]
            this._items = new Array<TimePoint>(n).concat(this._items);
            
            for(let i = 0; i < values.length; i++) {
                this._items[index + 1] = values[i];
            }

            return;
        }

        let i = start;
        for(; i < this._items.length && (i - start) < values.length; ++i) {
            this._items[i] = values[i - start];
        }

        const end = start + values.length;

        if(end > this._items.length) {
            const n = end - this._items.length;
            for(let j = i; j < i + n; ++j) {
                this._items.push(values[j - start]);
            }
        }
    }

    public valueAt(index: TimePointIndex): TimePoint | null {
        const offset = this._indexToOffset(index);
        if(offset !== null)
            return this._items[offset];

        return null;
    }

    public indexOf(time: UTCTimestamp, findNearest: boolean): TimePointIndex | null {
        // no timepoint avaliable
        if(this._items.length < 1) {
            return null;
        }

        // special case
        if(time > this._items[this._items.length -1].timestamp) {
            return findNearest ? this._items.length - 1 as TimePointIndex: null;
        }

        for(let i = 0; i < this._items.length; i++) {
            if(time === this._items[i].timestamp) {
                return i as TimePointIndex;
            }

            if(time < this._items[i].timestamp) {
                return findNearest ? i as TimePointIndex : null;
            }
        }

        // this code is unreachable in fact because we have special case for time > this._items[length - 1].timestamp
        return null;
    }

    public closestIndexLeft(time: TimePoint): TimePointIndex | null {
        const items = this._items;

        if(!items.length) {
            return null;
        }

        let maxOffest = items.length - 1;
        const maxTime = items[maxOffest];

        if(time.timestamp >= maxTime.timestamp) {
            return maxOffest as TimePointIndex;
        }

        let minOffset = 0;
        const minTime = items[minOffset];
        if(time.timestamp < minTime.timestamp) {
            return null;
        } else if(time.timestamp === minTime.timestamp) {
            return minOffset as TimePointIndex;
        }

        // binary search
        while(maxOffest > minOffset + 1) {
            const testOffset = (minOffset + maxOffest) >> 1;
            const testValue = items[testOffset];

            if(testValue.timestamp > time.timestamp) {
                maxOffest = testOffset;
            } else if (testValue.timestamp < time.timestamp) {
                minOffset = testOffset;
            } else if (testValue.timestamp === time.timestamp) {
                return testOffset as TimePointIndex;
            }

            return null;
        }

        return minOffset as TimePointIndex;
    }


    private _offsetToIndex(offset: number): TimePointIndex | null {
        if(0 <= offset && offset < this.size()) {
            return offset as TimePointIndex;
        }

        return null;
    }

    private _indexToOffset(index: TimePointIndex): number | null {
        if(0 <= index && index < this.size()) {
            return index as number;
        }

        return null;
    }
}