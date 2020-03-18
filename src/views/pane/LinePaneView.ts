import { LinePaneViewBase } from "./LinePaneViewBase";
import { Series } from "../../models/Series";
import { ChartModel } from "../../models/Chart";
import { IPaneRenderer } from "../../renderers/ipane-renderer";
import { TimePointIndex } from "../../models/time-data";
import { BarPrice } from "../../models/bar";
import { PaneRendererLine, LineItem, PaneRendererLineData } from "../../renderers/PaneRendererLine";

export class SeriesLinePaneView extends LinePaneViewBase<LineItem> {
    private readonly _lineRenderer: PaneRendererLine = new PaneRendererLine();

    public constructor(series: Series, model: ChartModel) {
        super(series, model);
    }

    public renderer(height: number, width: number): IPaneRenderer {
        this._makeValid();

        const lineStyleProps = this._series.options().lineStyle;

        const data: PaneRendererLineData = {
            items: this._items,
            lineColor: lineStyleProps.color,
            lineStyle: lineStyleProps.lineStyle,
            lineType: 0,
            lineWidth: lineStyleProps.lineWidth,
            visibleRange: this._itemsVisibleRange,
        };

        this._lineRenderer.setData(data);

        return this._lineRenderer;
    }

    protected _createRawItem(time: TimePointIndex, price: BarPrice): LineItem {
        return this._createRawItemBase(time, price);
    }
}