import { LineData } from "./iline-series-api";
import { ISeriesApi } from "./iseries-api";
import { DeepPartial } from "../helpers/strict-type-checkers";
import { HistogramSeriesOptions } from "../models/SeriesOptions";
import { SeriesParams } from "./series-params-base";

 export interface HistogramData extends LineData {
    color?: string;
}

export interface IHistogramSeriesApi extends ISeriesApi {
    setData(data: HistogramData[]): void;
    update(bar: HistogramData): void;
    applyOptions(options: DeepPartial<HistogramSeriesOptions>): void;
    options(): HistogramSeriesOptions;
}

export type HistogramSeriesParams = SeriesParams<HistogramSeriesOptions>;