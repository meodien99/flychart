export type DeepPartial<T> = {
    // tslint:disable-next-line:array-type
    [P in keyof T]?: T[P] extends Array<infer U>
        //tslint:disable-next-line:array-type
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer X>
        ? ReadonlyArray<DeepPartial<X>>
        : DeepPartial<T[P]>
};

export function merge(obj1: Record<string, any>, obj2: Record<string, any>): Record<string, any> {
    const obj = {...obj1};

    for(const i in obj2) {
        if(typeof obj2[i] !== 'object' || !obj.hasOwnProperty(i)) {
            obj[i] = obj2[i];
        } else {
            merge(obj[i], obj2[i]);
        }
    }
    return obj;
}

export function isNumber(value: unknown): value is number {
    return (typeof value === 'number') && (isFinite(value))
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isInteger(value: unknown): boolean {
    return isNumber(value) && (value % 1 === 0);
}

export function isNaN(value: number): boolean {
    return !(value <= 0) && !(value > 0);
}

export function clone<T>(object: T): T {
    const o = object as any;

    if(!o || typeof o !== 'object') {
        return o;
    }

    let c: any = Array.isArray(o) ? [] : {};

    for(const p in o) {
        if(o.hasOwnProperty(p)) {
            const v = o[p];
            if(v && typeof v === 'object') {
                c[p] = clone(v);
            } else {
                c[p] = v;
            }
        }
    }

    return c;
}

export function notNull<T>(t: T | null): t is T {
    return t !== null;
}

export function undefinedIfNull<T>(t: T | null): T | undefined {
    return (t === null) ? undefined : t;
}