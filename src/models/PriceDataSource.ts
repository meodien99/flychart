import { IPriceDataSource } from "./iprice-data-source";
import { DataSource } from "./DataSource";
import { ChartModel } from "./Chart";
import { TimePointIndex } from "./time-data";
import { PriceRange } from "./PriceRange";
import { IFormatter } from "../formatters/iformatter";

export abstract class PriceDataSource extends DataSource implements IPriceDataSource {
    private readonly _model: ChartModel;

    public constructor(model: ChartModel) {
        super();
        this._model = model;
    }

    public model(): ChartModel {
        return this._model;
    }

    public base(): number {
        return 0;
    }
    
    public priceRange(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): PriceRange | null {
        return null;
    }

    public abstract firstValue(): number | null;
    public abstract formatter(): IFormatter;
    public abstract priceLineColor(lastBarColor: string): string;
}