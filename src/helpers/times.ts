import {TimedValue, TimePointIndex} from '../models/times';
import { lowerbound, upperbound } from './binary-search';
import { BarsRange } from '../models/BarsRange';

function lowerBoundItemsCompare(timed: TimedValue, time: TimePointIndex) {
    return timed.time < time
}

function uperBoundItemsCompare(time: TimePointIndex, timed: TimedValue) {
    return time < timed.time;
}

export type SeriesItemsIndexesRange = {
    from: number,
    to: number
}

export function visibleTimedValue(items: TimedValue[], range: BarsRange): SeriesItemsIndexesRange {
    const from = lowerbound<TimedValue, TimePointIndex>(items, range.firstBar(), lowerBoundItemsCompare);
    const to = upperbound<TimedValue, TimePointIndex>(items, range.lastBar(), uperBoundItemsCompare);

    return {from, to};
}