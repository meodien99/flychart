import { PriceMark, PriceScale } from "./PriceScale";
import { min } from "../helpers/math";
import { Coordinate } from "./Coordinate";
import { PriceTickSpanCalculator } from "./PriceTickSpanCalculator";

export type CoordinateToLogicalConverter = (x: number, firstValue: number) => number;
export type LogicalToCoordinateConverter = (x: number, firstValue: number, keepItFloat: boolean) => number;

const TICK_DENSITY = 2.5;

export class PriceTickMarkBuilder {
    private _marks: PriceMark[] = [];
    private _base: number;
    private readonly _priceScale: PriceScale;
    private readonly _coordinateToLogicalFunc: CoordinateToLogicalConverter;
    private readonly _logicalToCoordinateFunc: LogicalToCoordinateConverter;

    public constructor(
        priceScale: PriceScale,
        base: number,
        coordinateToLogicalFunc: CoordinateToLogicalConverter,
        logicalToCoordinateFunc: LogicalToCoordinateConverter
    ) {
        this._priceScale = priceScale;
        this._base = base;
        this._coordinateToLogicalFunc = coordinateToLogicalFunc;
        this._logicalToCoordinateFunc = logicalToCoordinateFunc;
    }

    public base(): number {
        return this._base;
    }

    public setBase(base: number): void {
        if (base < 0) {
            throw new Error('base < 0');
        }
        this._base = base;
    }

    public tickSpan(high: number, low: number): number {
        if (high < low) {
            throw new Error('high < low');
        }

        const scaleHeight = this._priceScale.height();
        const markHeight = this._tickMarkHeight();

        const maxTickSpan = (high - low) * markHeight / scaleHeight;

        const spanCalculator1 = new PriceTickSpanCalculator(this._base, [2, 2.5, 2]);
        const spanCalculator2 = new PriceTickSpanCalculator(this._base, [2, 2, 2.5]);
        const spanCalculator3 = new PriceTickSpanCalculator(this._base, [2.5, 2, 2]);

        const spans = [];

        spans.push(spanCalculator1.tickSpan(high, low, maxTickSpan));
        spans.push(spanCalculator2.tickSpan(high, low, maxTickSpan));
        spans.push(spanCalculator3.tickSpan(high, low, maxTickSpan));

        return min(spans);
    }

    public rebuildTickMarks(): void {
        const priceScale = this._priceScale;

        if (priceScale.isEmpty()) {
            this._marks = [];
            return;
        }

        const mainSource = priceScale.mainSource();
        if (mainSource === null) {
            this._marks = [];
            return;
        }

        const firstValue = mainSource.firstValue();
        if (firstValue === null) {
            this._marks = [];
            return;
        }

        const scaleHeight = priceScale.height();

        const bottom = this._coordinateToLogicalFunc(scaleHeight - 1, firstValue);
        const top = this._coordinateToLogicalFunc(0, firstValue);

        const high = Math.max(bottom, top);
        const low = Math.min(bottom, top);
        if (high === low) {
            this._marks = [];
            return;
        }

        let span = this.tickSpan(high, low);
        let mod = high % span;
        mod += mod < 0 ? span : 0;

        const sign = (high >= low) ? 1 : -1;
        let prevCoord = null;

        let targetIndex = 0;

        for (let logical = high - mod; logical > low; logical -= span) {
            const coord = this._logicalToCoordinateFunc(logical, firstValue, true);

            if (prevCoord !== null) {
                // check if there is place for it
                // this is required for log scale
                if (Math.abs(coord - prevCoord) < this._tickMarkHeight()) {
                    continue;
                }
            }

            if (targetIndex < this._marks.length) {
                this._marks[targetIndex].coord = Math.round(coord) as Coordinate;
                this._marks[targetIndex].label = priceScale.formatLogical(logical);
            } else {
                this._marks.push({
                    coord: Math.round(coord) as Coordinate,
                    label: priceScale.formatLogical(logical),
                });
            }

            targetIndex++;

            prevCoord = coord;
            if (priceScale.isLog()) {
                // recalc span
                span = this.tickSpan(logical * sign, low);
            }
        }
        this._marks.length = targetIndex;
    }

    public marks(): PriceMark[] {
        return this._marks;
    }

    private _fontHeight(): number {
        return this._priceScale.fontSize();
    }

    private _tickMarkHeight(): number {
        return Math.ceil(this._fontHeight() * TICK_DENSITY);
    }
}