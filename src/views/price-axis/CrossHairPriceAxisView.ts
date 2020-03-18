import { PriceScale } from "../../models/PriceScale";
import { CrossHairPriceAndCoordinate, CrossHair } from "../../models/CrossHair";
import { PriceAxisView } from "./PriceAxisView";
import { PriceAxisViewRendererData, PriceAxisViewRendererCommonData } from "../../renderers/iprice-axis-view-renderer";

export type CrossHairPriceAxisViewValueProvider = (priceScale: PriceScale) => CrossHairPriceAndCoordinate;

export class CrossHairPriceAxisView extends PriceAxisView {
    private _source: CrossHair;
    private _background: string = '#4c525e';
    private readonly _priceScale: PriceScale;
    private readonly _valueProvider: CrossHairPriceAxisViewValueProvider;

    public constructor(source: CrossHair, priceScale: PriceScale, valueProvider: CrossHairPriceAxisViewValueProvider) {
        super();
        this._source = source;
        this._priceScale = priceScale;
        this._valueProvider = valueProvider;
    }

    protected _updateRendererData(
        axisRendererData: PriceAxisViewRendererData,
        _: PriceAxisViewRendererData,
        commonRendererData: PriceAxisViewRendererCommonData
    ): void {
        axisRendererData.visible = false;
        if (!this._source.options().horzLine.labelVisible) {
            return;
        }

        const mainSource = this._priceScale.mainSource();
        const firstValue = mainSource !== null ? mainSource.firstValue() : null;
        if (!this._source.visible() || this._priceScale.isEmpty() || (firstValue === null)) {
            return;
        }

        commonRendererData.background = this._background;
        commonRendererData.color = this.generateTextColor(this._background);

        const value = this._valueProvider(this._priceScale);
        commonRendererData.coordinate = value.coordinate;
        axisRendererData.text = this._priceScale.formatPrice(value.price, firstValue);
        axisRendererData.visible = true;
    }
}