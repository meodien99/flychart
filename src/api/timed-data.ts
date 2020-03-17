import { UTCTimestamp, BusinessDay, TimePoint } from "../models/time-data";
import { isNumber } from '../helpers/strict-type-checkers';

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

export function businessDayConverter(time: Time): TimePoint {
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

export function timestampConverter(time: Time): TimePoint {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        timestamp: time,
    };
}

export function convertTime(time: Time): TimePoint {
    if (isBusinessDay(time)) {
        return businessDayConverter(time);
    }
    return timestampConverter(time);
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
