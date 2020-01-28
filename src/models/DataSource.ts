import { IDataSource } from "./idata-source";
import { PriceScale } from "./PriceScale";
import { Delegate } from "../helpers/delegate";
import { ISubscription } from "../helpers/isubscription";
import { Pane } from "./Pane";
import { IPriceAxisView } from "../views/price-axis/iprice-axis-view";
import { IPaneView } from "../views/pane/ipane-view";
import { TimeAxisView } from "../views/time-axis/TimeAxisView";

export abstract class DataSource implements IDataSource {
    protected _priceScale: PriceScale | null = null;

    private _zorder: number = 0;
    private _onPriceScaleChanged: Delegate = new Delegate();

    public zorder(): number {
        return this._zorder;
    }

    public setZorder(zorder: number): void {
        this._zorder = zorder;
    }

    public priceScale(): PriceScale | null {
        return this._priceScale;
    }

    public setPriceScale(ps: PriceScale | null): void {
        this._priceScale = ps;
        this._onPriceScaleChanged.fire();
    }

    public isVisible(): boolean {
        return true;
    }

    public onPriceScaleChanged(): ISubscription {
        return this._onPriceScaleChanged;
    }

    public priceAxisViews(pane?: Pane, priceScale?: PriceScale): ReadonlyArray<IPriceAxisView> {
        return [];
    }

    public paneViews(pane?: Pane): ReadonlyArray<IPaneView> {
        return [];
    }

    public timeAxisViews(): ReadonlyArray<TimeAxisView> {
        return [];
    }

    public abstract updateAllViews(): void;
}