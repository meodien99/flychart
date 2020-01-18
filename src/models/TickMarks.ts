import { TickMark, TimePoint } from "./times";
import { Delegate } from "../helpers/delegate";
import { ensureDefined } from "../helpers/assertions";

function sortIndexASC(a: TickMark, b: TickMark): number {
    return a.index - b.index;
}

export class TickMarks {
    private _minIndex: number = Infinity;
    private _maxIndex: number = -Infinity;

    // Hash of tick marks
    private _marksByIndex: Map<number, TickMark> = new Map();

    // Sparse array with ordered arrays of tick marks
    private _markBySpan: (TickMark[] | undefined)[] = [];
    private _changed: Delegate = new Delegate();
    private _cache?: TickMark[] = null;
    private _maxBar: number = NaN;

    public reset(): void {
        this._marksByIndex.clear();
        this._markBySpan = [];
        this._minIndex = Infinity;
        this._maxIndex = -Infinity;
        this._cache = null;
        this._changed.fire()
    }

    public merge(tickMarks: TickMark[]): void {
        const marksBySpan = this._markBySpan;
        const unsortedSpans: Record<number, boolean> = {};

        for(const tickMark of tickMarks) {
            const {index, span} = tickMark;

            const existingTickMark = this._marksByIndex.get(index);
            if(existingTickMark) {
                if(existingTickMark.index === index && existingTickMark.span === span) {
                    // just update time (if it differs)
                    existingTickMark.time = tickMark.time;
                    continue;
                }

                // TickMark exists, but it differs -> remove it first
                this._removeTickMark(existingTickMark);
            }

            // Set into hash
            this._marksByIndex.set(index, tickMark);
            if(this._minIndex > index) {
                this._minIndex = index;
            }

            if(this._maxIndex < index) {
                this._maxIndex = index;
            }

            // store it in span arrays
            let marks = marksBySpan[span];
            if(marks === undefined) {
                marks = [];
                marksBySpan[span] = marks;
            }

            marks.push(tickMark);
            unsortedSpans[span] = true;
        }

        // clean up and sort arrays
        for(let span= marksBySpan.length; span--;) {
            const marks = marksBySpan[span];
            if(marks === undefined)
                continue;

            if(marks.length === 0)
                delete marksBySpan[span];

            if(unsortedSpans[span]) {
                marks.sort(sortIndexASC);
            }
        }

        this._cache = null;
        this._changed.fire();
    }

    public indexToTime(index: number): TimePoint | null {
        const tickMark = this._marksByIndex.get(index);

        if(tickMark === undefined) {
            return null;
        }

        return tickMark.time;
    }

    public nearestIndex(time: number): number {
        let left = this._minIndex;
        let right = this._maxIndex;

        while(right - left > 2) {
            if(ensureDefined(this._marksByIndex.get(left)).time.timestamp * 1000 === time) {
                return left;
            }

            if(ensureDefined(this._marksByIndex.get(right)).time.timestamp * 1000 === time) {
                return right;
            }

            const center = Math.round((left + right)/2);
            if(ensureDefined(this._marksByIndex.get(center)).time.timestamp * 1000 > time) {
                right = center;
            } else {
                left = center;
            }
        }

        return left;
    }

    public build(spacing: number, maxWidth: number): TickMark[] {
        const maxBar = Math.ceil(maxWidth/spacing);

        if(this._maxBar === maxBar && this._cache) {
            return this._cache;
        }

        this._maxBar = maxBar;
        let marks: TickMark[] = [];

        for(let span = this._markBySpan.length; span--;) {
            if(!this._markBySpan[span])
                continue;

            // built tickMarks are now prevMarks, and marks it as new array
            const prevMarks = marks;
            marks = [];

            const prevMarksLength = prevMarks.length;
            let prevMarksPointer: number = 0;
            const currentSpan = ensureDefined(this._markBySpan[span]);
            const currentSpanLength = currentSpan.length;

            let leftIndex = Infinity;
            let rightIndex = -Infinity;

            for(let i = 0; i < currentSpanLength; i++) {
                const mark = currentSpan[i];
                const currentIndex = mark.index;

                // determine indexes with which current index will be compared 
                // all marks to the right is moved to new array
                while(prevMarksPointer < prevMarksLength) {
                    const lastMark = prevMarks[prevMarksPointer];
                    const lastIndex = lastMark.index;

                    if(lastIndex < currentIndex) {
                        prevMarksPointer++;
                        marks.push(lastMark);
                        leftIndex = lastIndex;
                        rightIndex = Infinity;
                    } else {
                        rightIndex = lastIndex;
                        break;
                    }
                }

                if(rightIndex - currentIndex >= maxBar && currentIndex - leftIndex >= maxBar) {
                    // TickMark fits. Place it into new array
                    marks.push(mark);
                    leftIndex = currentIndex;
                }
            }

            // place all unused tickMarks into new array
            for(; prevMarksPointer < prevMarksLength; prevMarksPointer++) {
                marks.push(prevMarks[prevMarksPointer])
            }
        }

        this._cache = marks;
        return this._cache;
    }

    private _removeTickMark(tickMark: TickMark): void {
        const index = tickMark.index;

        if(this._marksByIndex.get(index) !== tickMark) {
            return;
        }

        this._marksByIndex.delete(index);

        if(index <= this._minIndex) {
            this._minIndex++;
        }

        if(index >= this._maxIndex) {
            this._maxIndex--;
        }

        if(this._maxIndex < this._minIndex) {
            this._minIndex = Infinity;
            this._maxIndex = -Infinity;
        }

        const spanArray = ensureDefined(this._markBySpan[tickMark.span]);
        const position = spanArray.indexOf(tickMark);

        if(position !== -1) {
            // keeps array sorted
            spanArray.splice(position, 1);
        }
    }
}