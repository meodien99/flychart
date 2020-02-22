import { DeepPartial } from "../helpers/strict-type-checkers";
import { LineSeriesOptions } from "../models/SeriesOptions";
import { SeriesParams } from "./series-params-base";
import { ISeriesApi } from "./iseries-api";
import { TimedData } from "./timed-data";

export interface LineData extends TimedData {
    value: number;
}

export interface ILineSeriesApiBase extends ISeriesApi {
    setData(data: LineData[]): void;
    update(bar: LineData): void;
}

export interface ILineSeriesApi extends ILineSeriesApiBase {
    applyOptions(options: DeepPartial<LineSeriesOptions>): void;
    options(): LineSeriesOptions;
}

export type LineSeriesParams = SeriesParams<LineSeriesOptions>