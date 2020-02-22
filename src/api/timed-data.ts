import { UTCTimestamp, BusinessDay } from "../models/times";

export type Time = UTCTimestamp | BusinessDay | string;

export interface TimedData {
    time: Time
}