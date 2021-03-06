import { isNumber } from "../helpers/strict-type-checkers";

export class PriceRange {
    private _minValue: number;
    private _maxValue: number;

    public constructor(minValue: number, maxValue: number) {
        this._maxValue = maxValue;
        this._minValue = minValue;
    }

    public equals(pr: PriceRange | null): boolean {
        if(pr === null)
            return false;
        
        return this._minValue === pr.minValue() && this._maxValue === pr.maxValue();
    }

    public clone(): PriceRange {
        return new PriceRange(this._minValue, this._maxValue);
    }

    public minValue(): number {
        return this._minValue;
    }

    public setMinValue(v: number): void {
        this._minValue = v;
    }

    public maxValue(): number {
        return this._maxValue;
    }

    public setMaxValue(v: number): void {
        this._maxValue = v;
    }

    public length(): number {
        return this._maxValue - this._minValue;
    }

    public isEmpty(): boolean {
        return this._maxValue === this._minValue || Number.isNaN(this._maxValue) || Number.isNaN(this._minValue);
    }

    public merge(anotherRange: PriceRange): PriceRange {
        return new PriceRange(
            Math.min(this.minValue(), anotherRange.minValue()),
            Math.max(this.maxValue(), anotherRange.maxValue())
        );
    }

    public apply(min: number, max: number): void {
        this._minValue = Math.min(this._minValue, min);
 		this._maxValue = Math.max(this._maxValue, max);
    }

    public set(min: number, max: number): void {
        this._minValue = min;
 		this._maxValue = max;
    }

    public scaleAroundCenter(coeff: number): void {
        if(!isNumber(coeff))
            return;

        const delta = this.length();
        if(delta === 0)
            return;

        const center = (this._maxValue + this._minValue) / 2;
        let maxDelta = this._maxValue - center;
 		let minDelta = this._minValue - center;
 		maxDelta *= coeff;
        minDelta *= coeff;
        
        this._maxValue = center + maxDelta;
 		this._minValue = center + minDelta;
    }

    public shift(delta: number): void {
        if(!isNumber(delta)) {
            return;
        }

        this._maxValue += delta;
        this._minValue += delta;
    }

    public containsStrictly(priceRange: PriceRange): boolean {
        return priceRange.minValue() > this._minValue && priceRange.maxValue() < this._maxValue;
    }
}