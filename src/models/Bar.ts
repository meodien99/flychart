import { Nominal } from "../types/nominal";
import { Coordinate } from "./Coordinate";

export type BarPrice = Nominal<Number, 'BarPrice'>;

export interface BarPrices {
    open: BarPrice,
    high: BarPrice,
    low: BarPrice,
    volume: BarPrice
};

export interface BarCoordinates {
    openY: Coordinate,
    highY: Coordinate,
    lowY: Coordinate,
    closeY: Coordinate
};