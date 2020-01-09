import { Nominal } from "../helpers/nominal";
import { Coordinate } from "./Coordinate";

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
