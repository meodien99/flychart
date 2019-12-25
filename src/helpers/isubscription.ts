export type Callback<T = void, U = void> = (p1: T, p2: U) => void;

export interface ISubscription<T = void, U = void> {
    subscribe(callback: Callback<T, U>, linkedObject?: object, singleshot?: boolean): void;
    unsubscribe(callback: Callback<T, U>): void,
    unsubscribeAll(linkedObject: object): void
}