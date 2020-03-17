import { ILineSeriesApi, ILineSeriesApiBase, LineData } from "./iline-series-api";
import { DataUpdatesConsumer, SeriesApiBase } from "./seriesApiBase";
import { Series } from "../models/Series";
import { LineSeriesOptions } from "../models/SeriesOptions";
import { DeepPartial, clone } from "../helpers/strict-type-checkers";


export abstract class LineSeriesApiBase extends SeriesApiBase implements ILineSeriesApiBase {
    protected constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
        super(series, dataUpdatesConsumer);
    }

    public setData(data: LineData[]): void {
        this._dataUpdatesConsumer.applyNewData(this._series, data);
    }

    public update(bar: LineData): void {
        this._dataUpdatesConsumer.updateData(this._series, bar);
    }
}

export class LineSeriesApi extends LineSeriesApiBase implements ILineSeriesApi {
    public constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
        super(series, dataUpdatesConsumer);
    }

    public applyOptions(options: DeepPartial<LineSeriesOptions>): void {
        this._series.applyOptions(options);
    }

    public options(): LineSeriesOptions {
        return clone(this._series.options());
    }
}