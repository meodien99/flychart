import { DeepPartial } from "../helpers/strict-type-checkers";
import { LineSeriesParams, ILineSeriesApi } from "./iline-series-api";
import { UTCTimestamp, BusinessDay } from "../models/time-data";
import { Point } from "../models/Point";
import { ISeriesApi } from "./iseries-api";
import { TimeRange, ITimeScaleApi } from "./itime-scale-api";
import { IPriceScaleApi } from "./iprice-scale-api";
import { ChartOptions } from "../models/Chart";

export interface MouseEventParams {
    time?: UTCTimestamp | BusinessDay;
    point?: Point;
    seriesPrices: Map<ISeriesApi, number>;
}

export type MouseEventHandler = (param: MouseEventParams) => void;
export type TimeRangeChangeEventHandler = (timeRange: TimeRange | null) => void;

export interface IChartApi {
    remove(): void;

    resize(height: number, width: number, forceRepaint?: boolean): void;

    addLineSeries(lineParams?: DeepPartial<LineSeriesParams>): ILineSeriesApi;

    subscribeClick(handler: MouseEventHandler): void;
 	unsubscribeClick(handler: MouseEventHandler): void;

 	subscribeCrossHairMove(handler: MouseEventHandler): void;
 	unsubscribeCrossHairMove(handler: MouseEventHandler): void;

 	subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;
 	unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

 	// TODO: add more subscriptions

 	priceScale(): IPriceScaleApi;
 	timeScale(): ITimeScaleApi;

 	applyOptions(options: DeepPartial<ChartOptions>): void;
 	options(): ChartOptions;

 	disableBranding(): void;
}

