import { PricedValue, PriceScale } from "../../models/PriceScale";
import { TimedValue, TimePointIndex } from "../../models/times";
import { SeriesPaneViewBase } from "./SeriesPaneViewBase";
import { ChartModel } from "../../models/Chart";
import { Series } from "../../models/Series";
import { TimeScale } from "../../models/TimeScale";
import { undefinedIfNull } from "../../helpers/strict-type-checkers";
import { BarPrice, Bar } from "../../models/bar";
import { SeriesBarColorer } from "../../models/SeriesBarColorer";
import { Coordinate } from "../../models/Coordinate";

export abstract class LinePaneViewBase<ItemType extends PricedValue & TimedValue> extends SeriesPaneViewBase<ItemType> {
    protected constructor(series: Series, model: ChartModel) {
        super(series, model);
    }

    protected _convertToCoordinates(priceScale: PriceScale, timeScale: TimeScale, firstValue: number): void {
        timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemVisibleRange));
        priceScale.pointsArrayToCoordinates(this._items, firstValue, undefinedIfNull(this._itemVisibleRange));
    }

    protected abstract _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer): ItemType;

    protected _createRawItemBase(time: TimePointIndex, price: BarPrice): PricedValue & TimedValue {
        return {
            time,
            price,
            x: NaN as Coordinate,
            y: NaN as Coordinate
        };
    }

    protected _fillRawPoints(): void {
        const barValueGetter = this._series.barFunction();
        const newItems: ItemType[] = [];
        const colorer = this._series.barColorer();

        this._series.bars().each((index: TimePointIndex, bar: Bar) => {
            const value = barValueGetter(bar.value);
            const item = this._createRawItem(index, value, colorer);
            newItems.push(item);
            return false;
        });
        this._items = newItems;
    }
}