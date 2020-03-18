import { Series } from "../../models/Series";
import { SeriesHorizontalLinePaneView } from "./SeriesHorizontalLinePaneView";
import { LineStyle } from "../../renderers/draw-line-renderer";

export class SeriesPriceLinePaneView extends SeriesHorizontalLinePaneView {
    public constructor(series: Series) {
        super(series);
        this._lineRendererData.lineStyle = LineStyle.Dotted;
    }

    protected _updateImpl(): void {
        this._lineRendererData.visible = false;

        if (!this._series.options().priceLineVisible) {
            return;
        }

        const data = this._series.lastValueData(undefined, true);
        if (data.noData) {
            return;
        } 

        this._lineRendererData.visible = true;
        this._lineRendererData.y = data.coordinate;
        this._lineRendererData.color = this._series.priceLineColor(data.color);
        this._lineRendererData.width = this._model.timeScale().width();
        this._lineRendererData.height = this._series.priceScale().height();
        this._lineRendererData.lineWidth = this._series.options().priceLineWidth;
    }
}