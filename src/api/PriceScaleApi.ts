import { IPriceScaleApi } from "./iprice-scale-api";
import { IDestroyable } from "../helpers/idestroyable";
import { ChartModel } from "../models/Chart";
import { DeepPartial } from "../helpers/strict-type-checkers";
import { PriceScaleOptions, PriceScale } from "../models/PriceScale";

export class PriceScaleApi implements IPriceScaleApi, IDestroyable {
    private _chartModel: ChartModel;

    public constructor(model: ChartModel) {
        this._chartModel = model;
    }

    public destroy(): void {
        delete this._chartModel;
    }

    public applyOptions(options: DeepPartial<PriceScaleOptions>): void {
        this._chartModel.applyOptions({ priceScale: options });
    }

    public options(): PriceScaleOptions {
        return this._priceScale().options();
    }

    private _priceScale(): PriceScale {
        return this._chartModel.mainPriceScale();
    }
}