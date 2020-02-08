import { Pane } from "./Pane";
import { ISubscription } from "../helpers/isubscription";
import { PriceScale } from "./PriceScale";
import { TimeAxisView } from "../views/time-axis/TimeAxisView";
import { IPaneView } from "../views/pane/ipane-view";
import { IPriceAxisView } from "../views/price-axis/iprice-axis-view";

export type DataSourceTextIcon = {
    type: 'text',
    text: string
};

export type DataSourceSvgIcon = {
    type: 'svg',
    svgCode: string
};

export type DataSourceIcon = DataSourceTextIcon | DataSourceSvgIcon;

export interface IDataSource {
    zorder(): number | null;
    setZorder(value: number): void;
    priceScale(): PriceScale | null;
    setPriceScale(scale: PriceScale | null): void;

    isVisible(): boolean;
    updateAllViews(): void;

    priceAxisViews(pane?: Pane, priceScale?: PriceScale): ReadonlyArray<IPriceAxisView>;
    timeAxisViews(): ReadonlyArray<TimeAxisView>;
    paneViews(pane: Pane): ReadonlyArray<IPaneView>;

    onPriceScaleChanged(): ISubscription;

    destroy?(): void;
}