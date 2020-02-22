import { BarPrice } from "../models/bar";
import { Coordinate } from "../models/Coordinate";

export interface IPriceFormatter {
    format(price: BarPrice): string;
}

export interface ISeriesApi {
    priceFormatter(): IPriceFormatter;
    priceToCoordinate(price: BarPrice): Coordinate | null;
}