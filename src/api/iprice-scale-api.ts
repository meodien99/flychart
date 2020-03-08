import { DeepPartial } from "../helpers/strict-type-checkers";
import { PriceScaleOptions } from "../models/PriceScale";

 export interface IPriceScaleApi {
    applyOptions(options: DeepPartial<PriceScaleOptions>): void;
    options(): PriceScaleOptions;
}