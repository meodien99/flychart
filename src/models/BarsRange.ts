import { TimePointIndex } from "./times";
import {assert} from '../helpers/assertions';

export class BarsRange {
    private readonly _firstBar: TimePointIndex;
    private readonly _lastBar: TimePointIndex;

    public constructor(firstBar: TimePointIndex, lastBar: TimePointIndex) {
        assert(firstBar <= lastBar, 'The last bar in the bars range must be greater than or equal the first bar')
        
        this._firstBar = firstBar;
        this._lastBar = lastBar;
    }

    public firstBar(): TimePointIndex {
        return this._firstBar;
    }

    public lastBar(): TimePointIndex {
        return this._lastBar;
    }

    public count(): number {
        return this._lastBar - this._firstBar + 1;
    }

    public contains(index: TimePointIndex): boolean {
        return this._firstBar <= index && index <= this._lastBar;
    }

    public equals(other: BarsRange): boolean {
        return this._firstBar === other.firstBar() && this._lastBar === other.lastBar();
    }
}