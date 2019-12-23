export type DeepPartial<T> = {
    // tslint:disable-next-line:array-type
    [P in keyof T]?: T[P] extends Array<infer U>
        //tslint:disable-next-line:array-type
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer X>
        ? ReadonlyArray<DeepPartial<X>>
        : DeepPartial<T[P]>
};
