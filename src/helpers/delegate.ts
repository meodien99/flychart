import { Callback, ISubscription } from "./isubscription";
import { IDestroyable } from './idestroyable';

interface Listener<T, U> {
    callback: Callback<T, U>;
    linkedObject?: object;
    singleshot: boolean;
}

export class Delegate<T = void, U = void> implements ISubscription<T, U>, IDestroyable {
    private _listeners: Listener<T, U>[] = [];

    public subscribe(callback: Callback<T, U>, linkedObject?: object, singleshot?: boolean): void {
        const listener: Listener<T, U> = {
            callback,
            linkedObject,
            singleshot: singleshot === true
        };

        this._listeners.push(listener);
    }

    public unsubscribe(callback: Callback<T, U>): void {
        const index = this._listeners.findIndex(({callback: cb}: Listener<T, U>) => callback === cb);
        
        if(~index) {
            this._listeners.splice(index, 1);
        }
    }

    public unsubscribeAll(linkedObject: object):void {
        this._listeners = this._listeners.filter(({linkedObject: lo}: Listener<T, U>) => lo === linkedObject);
    }

    public fire(p1: T, p2: U): void {
        const listenerSnapshot = [...this._listeners];

        this._listeners = this._listeners.filter(({singleshot}: Listener<T, U>) => !singleshot);
        listenerSnapshot.forEach(({callback}: Listener<T, U>) => {
            callback(p1, p2);
        });
    }

    public hasListeners(): boolean {
        return this._listeners.length > 0;
    }

    public destroy(): void {
        this._listeners = [];
    }
}