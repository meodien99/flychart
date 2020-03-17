import { IPaneRenderer } from "./ipane-renderer";
import { LineItem } from "./PaneRendererLine";
import { SeriesItemsIndexesRange } from "../models/time-data";

export interface MarksRendererData {
    items: LineItem[];
    lineColor: string;
    backColor: string;
    radius: number;
    visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneMarksRenderer implements IPaneRenderer {
    protected _data: MarksRendererData | null = null;

    public setData(data: MarksRendererData): void {
        this._data = data;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (this._data === null || this._data.visibleRange === null) {
            return;
        }

        const visibleRange = this._data.visibleRange;
        const data = this._data;

        const draw = (radius: number) => {
            ctx.beginPath();

            for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
                const point = data.items[i];
                ctx.moveTo(point.x, point.y);
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            }

            ctx.fill();
        };

        ctx.fillStyle = data.backColor;
        draw(data.radius + 2);

        ctx.fillStyle = data.lineColor;
        draw(data.radius);
    }
}