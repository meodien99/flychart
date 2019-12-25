export function isBaseDecimal(value: number): boolean {
    if(value < 0)
        return false;

    for(let current = value; current > 1; current /= 10) {
        if(current%10 !== 0) {
            return false;
        }
    }

    return true;
}

export function equal(n1: number, n2: number, epsilon: number): boolean {
    return Math.abs(n1 - n2) < epsilon;
}

export function greaterOrEquals(n1: number, n2: number, epsilon: number): boolean {
    return (n2 - n1) <= epsilon;
}

export function min(arr: number[]): number {
    if(!arr.length)
        throw Error('Array is empty!');

    let len = arr.length, minValue = Infinity;

    while(len--) {
        if(arr[len] < minValue)
            minValue = arr[len]
    }

    return minValue;
}

export function max(arr: number[]): number {
    if(!arr.length)
        throw Error('Array is empty!');

    let len = arr.length, maxValue = -Infinity;

    while(len--) {
        if(arr[len] > maxValue)
            maxValue = arr[len]
    }

    return maxValue;
}

export function log10(n: number): number {
    if(n <= 0)
        return NaN;

    return Math.log(n) / Math.log(10);
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}