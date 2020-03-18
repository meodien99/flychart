import { CrossHairOptions, CrossHairMode } from "./CrossHair";
import { TimePointIndex } from "./time-data";
import { Pane } from "./Pane";
import { Series } from "./Series";
import { IDataSource } from "./idata-source";
import { SeriesPlotIndex } from "./SeriesData";
import { ensure } from "../helpers/assertions";
import { Coordinate } from "./Coordinate";

export class Magnet {
    private readonly _options: CrossHairOptions;

    public constructor(options: CrossHairOptions) {
        this._options = options;
    }

    public align(price: number, index: TimePointIndex, pane: Pane): number {
        let res = price;
        if (this._options.mode === CrossHairMode.Normal) {
            return res;
        }

        const defaultPriceScale = pane.defaultPriceScale();
        // get the main source
        const mainSource = defaultPriceScale.mainSource();

        if (defaultPriceScale.isEmpty() || mainSource === null) {
            return res;
        }

        const firstValue = mainSource.firstValue();
        if (firstValue === null) {
            return res;
        }

        const y = defaultPriceScale.priceToCoordinate(price, firstValue);

        // get all serieses from the pane
        const serieses: ReadonlyArray<Series> = pane.dataSources().filter(
            ((ds: IDataSource) => (ds instanceof Series)) as (ds: IDataSource) => ds is Series);

        const candidates = serieses.reduce(
            (acc: Coordinate[], series: Series) => {
                if (pane.isOverlay(series)) {
                    return acc;
                }
                const ps = series.priceScale();
                const bars = series.bars();
                if (ps.isEmpty() || !bars.contains(index)) {
                    return acc;
                }

                const bar = bars.valueAt(index);
                if (bar === null) {
                    return acc;
                }
                const prices = [
                    bar.value[SeriesPlotIndex.Close] as number,
                ];

                // convert bar to pixels
                const firstPrice = ensure(series.firstValue());
                return acc.concat(prices.map((barPrice: number) => ps.priceToCoordinate(barPrice, firstPrice, true)));
            },
            [] as Coordinate[]);

        if (candidates.length === 0) {
            return res;
        }

        candidates.sort((y1: Coordinate, y2: Coordinate) => Math.abs(y1 - y) - Math.abs(y2 - y));

        const nearest = candidates[0];
        res = defaultPriceScale.coordinateToPrice(nearest, firstValue);

        return res;
    }
}