import { IPaneView } from "./ipane-view";
import { HorizontalLineRendererData, HorizontalLineRenderer } from "../../renderers/HorizontalLineRenderer";
import { Coordinate } from "../../models/Coordinate";
import { LineStyle } from "../../renderers/draw-line-renderer";
import { Series } from "../../models/Series";
import { ChartModel } from "../../models/Chart";
import { IPaneRenderer } from "../../renderers/ipane-renderer";

export abstract class SeriesHorizontalLinePaneView implements IPaneView {
    protected readonly _lineRendererData: HorizontalLineRendererData = {
        width: 0,
 		height: 0,
 		y: 0 as Coordinate,
 		color: 'rgba(0, 0, 0, 0)',
 		lineWidth: 1,
 		lineStyle: LineStyle.Solid,
 		visible: false,
    };

    protected readonly _series: Series;
    protected readonly _model: ChartModel;
    protected readonly _lineRenderer: HorizontalLineRenderer = new HorizontalLineRenderer();
    
    private _invalidated: boolean = true;

    protected constructor(series: Series) {
        this._series = series;
        this._model = series.model();
        this._lineRenderer.setData(this._lineRendererData);
    }

    public update(): void {
        this._invalidated = true;
    }

    public renderer(): IPaneRenderer {
        if(this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }

        return this._lineRenderer;
    }

    protected abstract _updateImpl(): void
}