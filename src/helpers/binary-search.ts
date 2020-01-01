function lowerbound(
    array,
    value,
    compareFnc,
    start = 0,
    to = array.length
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

function upperbound(
    array,
    value,
    compareFnc,
    start = 0,
    to = array.length
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