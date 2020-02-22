import { DeepPartial } from "../helpers/strict-type-checkers";
import { LineSeriesParams, ILineSeriesApi } from "./iline-series-api";

export interface IChartApi {
    remove(): void;

    resize(height: number, width: number, forceRepaint?: boolean): void;

    addLineSeries(lineParams?: DeepPartial<LineSeriesParams>): ILineSeriesApi;
}