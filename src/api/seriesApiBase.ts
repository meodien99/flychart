import { Series } from "../models/Series";
import { TimedData } from "./timed-data";
import { Palette } from "../models/Palette";
import { ISeriesApi, IPriceFormatter } from "./iseries-api";
import { IDestroyable } from "../helpers/idestroyable";
import { BarPrice } from "../models/bar";
import { Coordinate } from "../models/Coordinate";

export interface DataUpdatesConsumer {
    applyNewData(series: Series, data: TimedData[], palette?: Palette): void;
    updateData(series: Series, data: TimedData, palette?: Palette): void;
}

export abstract class SeriesApiBase implements ISeriesApi, IDestroyable {
    protected _series: Series;
    protected _dataUpdatesConsumer: DataUpdatesConsumer;

    protected constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
        this._series = series;
        this._dataUpdatesConsumer = dataUpdatesConsumer;
    }

    public destroy(): void {
        delete this._series;
        delete this._dataUpdatesConsumer;
    }

    public priceFormatter(): IPriceFormatter {
        return this._series.formatter();
    }

    public series(): Series {
        return this._series;
    }

    public priceToCoordinate(price: BarPrice): Coordinate | null {
        const firstValue = this._series.firstValue();

        if(firstValue === null) {
            return null;
        }

        return this._series.priceScale().priceToCoordinate(price, firstValue);
    }
}