import { Nominal } from "../helpers/nominal";

import { Coordinate } from "./Coordinate";
import { TimePoint } from "./time-data";
import { PlotValue } from './plot-data';
import { SeriesPlotIndex } from "./SeriesData";

export type Bar = {
    time: TimePoint,
    value: [PlotValue, PlotValue, PlotValue, PlotValue, PlotValue]
}

export type BarPrice = Nominal<number, 'BarPrice'>;

export interface BarPrices {
    open: BarPrice,
    high: BarPrice,
    low: BarPrice,
    close: BarPrice
};

export interface BarCoordinates {
    openY: Coordinate,
    highY: Coordinate,
    lowY: Coordinate,
    closeY: Coordinate
};

/**
 * bar's function based on plot index (or overlay study)
 * @see {SeriesData}
 */
export const barFunctions = {
    open: (bar: Bar['value']) => bar[SeriesPlotIndex.Open] as BarPrice,
    high: (bar: Bar['value']) => bar[SeriesPlotIndex.High] as BarPrice,
    low: (bar: Bar['value']) => bar[SeriesPlotIndex.Low] as BarPrice,
    close: (bar: Bar['value']) => bar[SeriesPlotIndex.Close] as BarPrice,

    hl2: (bar: Bar['value']) => ( 
        (bar[SeriesPlotIndex.High] as number) + 
        (bar[SeriesPlotIndex.Low] as number)
    ) / 2 as BarPrice,

    hlc3: (bar: Bar['value']) => (
        (bar[SeriesPlotIndex.High] as number) +
        (bar[SeriesPlotIndex.Low] as number) +
        (bar[SeriesPlotIndex.Close] as number)
    ) / 3 as BarPrice,

    ohlc4: (bar: Bar['value']) => (
        (bar[SeriesPlotIndex.Open] as number) +
        (bar[SeriesPlotIndex.High] as number) +
        (bar[SeriesPlotIndex.Low] as number) +
        (bar[SeriesPlotIndex.Close] as number)
    ) / 4 as BarPrice
};

export type BarFunction = (bar: Bar['value']) => BarPrice