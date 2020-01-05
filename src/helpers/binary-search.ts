export type LowerBoundComparatorType<ArrayElementType, ValueType> = (a: ArrayElementType, b: ValueType) => boolean;

export function lowerbound<ArrayElementType, ValueType>(
    array: ReadonlyArray<ArrayElementType>,
    value: ValueType,
    compareFnc: LowerBoundComparatorType<ArrayElementType, ValueType>,
    start: number = 0,
    to: number = array.length
): number {
    let count = to - start;
    while(0 < count) {
        const c: number = (count >> 1); // count/2
        const m: number = start + c;
        if(compareFnc(array[m], value)) {
            start = m + 1;
            count -= c + 1;
        } else {
            count = c;
        }
    }

    return start;
}

export type UpperBoundComparatorType<ArrayElementType, ValueType> = (a: ValueType, b: ArrayElementType) => boolean;

export function upperbound<ArrayElementType, ValueType>(
    array: ArrayElementType[],
    value: ValueType,
    compareFnc: UpperBoundComparatorType<ArrayElementType, ValueType>,
    start: number = 0,
    to: number = array.length
): number {
    let count = to - start;
    while(0 < count) {
        const c: number = (count >> 1); // count/2
        const m: number = start + c;
        if(!compareFnc(value, array[m])) {
            start = m + 1;
            count -= c + 1;
        } else {
            count = c;
        }
    }

    return start;
}