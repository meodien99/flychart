import { IDataSource } from "./idata-source";
import { IFormatter } from "../formatters/iformatter";
import { ChartModel } from "./Chart";
import { TimePointIndex } from "./times";
import { PriceRange } from "./PriceRange";

export interface IPriceDataSource extends IDataSource {
    firstValue(): number | null;
    formatter(): IFormatter;
    priceLineColor(lastBarColor: string): string;
    model(): ChartModel;
    base(): number;
    priceRange(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): PriceRange | null;
}