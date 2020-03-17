import { TimedValue, SeriesItemsIndexesRange } from "../models/time-data";
import { PricedValue } from "../models/PriceScale";
import { LinePoint, LineType, LineWidth, LineStyle, setLineStyle } from "./draw-line-renderer";
import { IPaneRenderer } from "./ipane-renderer";
import { walkLine } from "./walk-line";

export type LineItem = TimedValue & PricedValue & LinePoint;

export interface PaneRendererLineData {
    lineType: LineType;
    items: LineItem[];
    lineColor: string;
    lineWidth: LineWidth;
    lineStyle: LineStyle;
    visibleRange: SeriesItemsIndexesRange | null;
};

export class PaneRendererLine implements IPaneRenderer {
    protected _data: PaneRendererLineData | null = null;

    public setData(data: PaneRendererLineData) {
        this._data = data;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if(this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
            return;
        }

        ctx.lineCap = 'square';
        ctx.lineWidth = this._data.lineWidth;

        setLineStyle(ctx, this._data.lineStyle);

        ctx.strokeStyle = this._data.lineColor;
        ctx.lineJoin = 'miter';

        ctx.beginPath();
        walkLine(ctx, this._data.items, this._data.lineType, this._data.visibleRange);
        ctx.stroke();
    }
}
