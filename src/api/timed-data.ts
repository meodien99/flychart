import { UTCTimestamp, BusinessDay, TimePoint, TimePointIndex } from "../models/times";
import { Series } from "../models/Series";
import { isNumber } from "util";

export type Time = UTCTimestamp | BusinessDay | string;

export interface TimedData {
    time: Time
}


export function isBusinessDay(time: Time): time is BusinessDay {
    return !isNumber(time);
}

export function isUTCTimestamp(time: Time): time is UTCTimestamp {
    return isNumber(time);
}

export interface TimedData {
    time: Time;
}

type TimeConverter = (time: Time) => TimePoint;

function businessDayConverter(time: Time): TimePoint {
    if (!isBusinessDay(time)) {
        throw new Error('time must be of type BusinessDay');
    }
    const date = new Date();
    date.setUTCFullYear(time.year);
    date.setUTCMonth(time.month - 1);
    date.setUTCDate(time.day);
    date.setUTCHours(0, 0, 0, 0);
    return {
        timestamp: Math.round(date.getTime() / 1000) as UTCTimestamp,
        businessDay: time,
    };
}

function timestampConverter(time: Time): TimePoint {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        timestamp: time,
    };
}

function selectTimeConverter(data: TimedData[]): TimeConverter | null {
    if (data.length === 0) {
        return null;
    }
    if (isBusinessDay(data[0].time)) {
        return businessDayConverter;
    }
    return timestampConverter;
}

export function convertTime(time: Time): TimePoint {
    if (isBusinessDay(time)) {
        return businessDayConverter(time);
    }
    return timestampConverter(time);
}

function hours(count: number): number {
    return count * 60 * 60 * 1000;
}
function minutes(count: number): number {
    return count * 60 * 1000;
}
function seconds(count: number): number {
    return count * 1000;
}

const spanDivisors = [
    {
        divisor: 1, span: 20,
    },
    {
        divisor: seconds(1), span: 19,
    },
    {
        divisor: minutes(1), span: 20,
    },
    {
        divisor: minutes(5), span: 21,
    },
    {
        divisor: minutes(30), span: 22,
    },
    {
        divisor: hours(1), span: 30,
    },
    {
        divisor: hours(3), span: 31,
    },
    {
        divisor: hours(6), span: 32,
    },
    {
        divisor: hours(12), span: 33,
    },
];

function spanByTime(time: TimePoint, previousTime: TimePoint | null): number {
    // function days(count) { return count * 24 * 60 * 60 * 1000; }
    if (previousTime !== null) {
        const lastTime = new Date(previousTime.timestamp * 1000);
        const currentTime = new Date(time.timestamp * 1000);

        if (currentTime.getUTCFullYear() !== lastTime.getUTCFullYear()) {
            return 70;
        } else if (currentTime.getUTCMonth() !== lastTime.getUTCMonth()) {
            return 60;
        } else if (currentTime.getUTCDate() !== lastTime.getUTCDate()) {
            return 50;
        }

        for (let i = spanDivisors.length - 1; i >= 0; --i) {
            if (Math.floor(lastTime.getTime() / spanDivisors[i].divisor) !== Math.floor(currentTime.getTime() / spanDivisors[i].divisor)) {
                return spanDivisors[i].span;
            }
        }
    }
    return 20;
}

interface TimePointData {
    mapping: Map<Series, TimedData>;
    index: TimePointIndex;
    timePoint: TimePoint;
}

function compareTimePoints(a: TimePoint, b: TimePoint): boolean {
    return a.timestamp < b.timestamp;
}

export function stringToBusinessDay(value: string): BusinessDay {
    // string must be yyyy-mm-dd
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
    }
    return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
    };
}
