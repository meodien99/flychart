import { IPaneView } from "./ipane-view";
import { IPriceAxisView } from "../price-axis/iprice-axis-view";
import { TextWidthCache } from "../../models/TextWidthCache";
import { IDataSource } from "../../models/idata-source";
import { ChartModel } from "../../models/Chart";
import { PanePriceAxisViewRenderer } from "../../renderers/PanePriceAxisViewRenderer";
import { IPaneRenderer } from "../../renderers/ipane-renderer";

export class PanePriceAxisView implements IPaneView {
    private _priceAxisView: IPriceAxisView;
    private readonly _textWidthCache: TextWidthCache;
    private readonly _dataSource: IDataSource;
    private readonly _chartModel: ChartModel;
    private readonly _renderer: PanePriceAxisViewRenderer;
    private _fontSize: number;

    public constructor(priceAxisView: IPriceAxisView, dataSource: IDataSource, chartModel: ChartModel) {
        this._priceAxisView = priceAxisView;
        this._textWidthCache = new TextWidthCache(50);
        this._dataSource = dataSource;
        this._chartModel = chartModel;
        this._fontSize = -1;
        this._renderer = new PanePriceAxisViewRenderer(this._textWidthCache);
    }

    public update(): void {
        this._priceAxisView.update();
    }

    public renderer(height: number, width: number): IPaneRenderer | null {
        const pane = this._chartModel.paneForSource(this._dataSource);
        if(pane === null) {
            return null;
        }

        const priceScale = this._dataSource.priceScale();
        if(priceScale === null) {
            return null;
        }

        const position = pane.priceScalePosition();
        if(position === 'overlay') {
            // both source and main source are overlay
            return null
        }

        const options = this._chartModel.priceAxisRendererOptions();
        if(options.fontSize !== this._fontSize) {
            this._fontSize = options.fontSize;
            this._textWidthCache.reset();
        }

        this._renderer.setParams(this._priceAxisView.paneRenderer(), options, width, position);
        return this._renderer;
    }
}