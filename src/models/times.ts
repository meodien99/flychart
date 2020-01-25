import { Nominal } from "../helpers/nominal";
import { Coordinate } from "./Coordinate";
import { BarsRange } from "./BarsRange";
import { upperbound, lowerbound } from "../helpers/binary-search";

export type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;

export type TimePointIndex = Nominal<number, 'TimePointIndex'>;

export type BusinessDay = {
    year: number,
    month: number,
    day: number
};

export type TimePoint = {
    timestamp: UTCTimestamp,
    businessDay?: BusinessDay
}

export type TickMark = {
    index: TimePointIndex,
    span: number,
    time: TimePoint
}

export type TimedValue = {
    time: TimePointIndex,
    x: Coordinate
}


export type SeriesItemsIndexesRange = {
    from: number,
    to: number
};

function lowerBoundItemsCompare(item: TimedValue, time: TimePointIndex): boolean {
    return item.time < time;
}

function upperBoundItemsCompare(time: TimePointIndex, item: TimedValue): boolean {
    return time < item.time;
}

export function visibleTimedValue(items: TimedValue[], range: BarsRange): SeriesItemsIndexesRange {
    const from = lowerbound<TimedValue, TimePointIndex>(items, range.firstBar(), lowerBoundItemsCompare);
    const to = upperbound<TimedValue, TimePointIndex>(items, range.lastBar(), upperBoundItemsCompare);

    return {from, to};
}