import { Coordinate } from "./Coordinate";
import { PriceRange } from "./PriceRange";
import { log10 } from "../helpers/math";

const enum Constants {
    LogicalOffset = 4,
    CoordOffset = 0.0001,
}

export function fromPercent(value: number, baseValue: number): number {
    if (baseValue < 0) {
        value = -value;
    }

    return (value / 100) * baseValue + baseValue;
}

export function toPercent(value: number, baseValue: number): Coordinate {
    const result = 100 * (value - baseValue) / baseValue;
    return (baseValue < 0 ? -result : result) as Coordinate;
}

export function toPercentRange(priceRange: PriceRange, baseValue: number): PriceRange {
    const minPercent = toPercent(priceRange.minValue(), baseValue);
    const maxPercent = toPercent(priceRange.maxValue(), baseValue);
    return new PriceRange(minPercent, maxPercent);
}

export function fromIndexedTo100(value: number, baseValue: number): number {
    value -= 100;
    if (baseValue < 0) {
        value = -value;
    }

    return (value / 100) * baseValue + baseValue;
}

export function toIndexedTo100(value: number, baseValue: number): Coordinate {
    const result = 100 * (value - baseValue) / baseValue + 100;
    return (baseValue < 0 ? -result : result) as Coordinate;
}

export function toIndexedTo100Range(priceRange: PriceRange, baseValue: number): PriceRange {
    const minPercent = toIndexedTo100(priceRange.minValue(), baseValue);
    const maxPercent = toIndexedTo100(priceRange.maxValue(), baseValue);
    return new PriceRange(minPercent, maxPercent);
}

export function toLog(price: number): Coordinate {
    const m = Math.abs(price);
    if (m < 1e-8) {
        return 0 as Coordinate;
    }

    const res = log10(m + Constants.CoordOffset) + Constants.LogicalOffset;
    return ((price < 0) ? -res : res) as Coordinate;
}

export function fromLog(logical: number): number {
    const m = Math.abs(logical);
    if (m < 1e-8) {
        return 0;
    }

    const res = Math.pow(10, m - Constants.LogicalOffset) - Constants.CoordOffset;
    return (logical < 0) ? -res : res;
}

export function convertPriceRangeToLog(priceRange: PriceRange | null): PriceRange | null {
    if (priceRange === null) {
        return null;
    }

    const min = toLog(priceRange.minValue());
    const max = toLog(priceRange.maxValue());

    return new PriceRange(min, max);
}

export function canConvertPriceRangeFromLog(priceRange: PriceRange | null): boolean {
    if (priceRange === null) {
        return false;
    }

    const min = fromLog(priceRange.minValue());
    const max = fromLog(priceRange.maxValue());

    return isFinite(min) && isFinite(max);
}

export function convertPriceRangeFromLog(priceRange: PriceRange | null): PriceRange | null {
    if (priceRange === null) {
        return null;
    }

    const min = fromLog(priceRange.minValue());
    const max = fromLog(priceRange.maxValue());

    return new PriceRange(min, max);
}