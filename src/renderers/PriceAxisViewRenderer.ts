import { IPriceAxisViewRenderer, PriceAxisViewRendererData, PriceAxisViewRendererCommonData, PriceAxisViewRendererOptions } from "./iprice-axis-view-renderer";
import { TextWidthCache } from "../models/TextWidthCache";
import { resetTransparency } from "../helpers/colors";

export class PriceAxisViewRenderer implements IPriceAxisViewRenderer {
    private _data: PriceAxisViewRendererData;
    private _commonData: PriceAxisViewRendererCommonData;

    public constructor(data: PriceAxisViewRendererData, commondData: PriceAxisViewRendererCommonData) {
        this._data = data;
        this._commonData = commondData;
    }

    public setData(data: PriceAxisViewRendererData, commondData: PriceAxisViewRendererCommonData): void {
        this._data = data;
        this._commonData = commondData;
    }

    public draw(
        ctx: CanvasRenderingContext2D,
        rendererOptions: PriceAxisViewRendererOptions,
        textWidthCache: TextWidthCache,
        width: number,
        align: 'left' | 'right'
    ): void {
        if(!this._data.visible) {
            return;
        }

        const fontSize = rendererOptions.fontSize;
        ctx.font = rendererOptions.font;

        const tickSize = this._data.tickVisible ? rendererOptions.tickLength : 0;
        const horzBorder = this._data.borderVisible ? rendererOptions.borderSize : 0;
 		const paddingTop = rendererOptions.paddingTop;
 		const paddingBottom = rendererOptions.paddingBottom;
 		const paddingInner = rendererOptions.paddingInner;
 		const paddingOuter = rendererOptions.paddingOuter;
 		const text = this._data.text;
 		const textWidth = Math.ceil(textWidthCache.measureText(ctx, text));
 		const baselineOffset = rendererOptions.baselineOffset;
 		const totalHeight = rendererOptions.fontSize + paddingTop + paddingBottom;
        const totalWidth = horzBorder + textWidth + paddingInner + paddingOuter + tickSize;
        
        const yMid = this._commonData.fixedCoordinate || this._commonData.coordinate;
        const yTop = yMid - Math.floor(fontSize/2) - paddingTop - 0.5;
        const yBottom = yTop + totalHeight;

        const isAlignRight = align === 'right';
        
        const xInside = isAlignRight ? width - horzBorder - 0.5 : 0.5;

        let xOutside = xInside, xTick, xText;

        ctx.fillStyle = resetTransparency(this._commonData.background);
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';

        if(text) {
            if(isAlignRight) {
                /**
                 * 2            1
                 *              
                 *            6 5
                 * 
                 * 3            4
                 */
                xOutside = xInside - totalWidth;
                xTick = xInside - tickSize;
                xText = xOutside + paddingOuter;
            } else {
                /**
                 * 2            1
                 *              
                 * 6 5
                 * 
                 * 3            4
                 */
                xOutside = xInside + totalWidth;
                xTick = xInside + tickSize;
                xText = xInside + horzBorder + tickSize + paddingInner;
            }

            ctx.beginPath();
            ctx.moveTo(xInside, yTop);
            ctx.lineTo(xOutside, yTop);
            ctx.lineTo(xOutside, yBottom);
            ctx.lineTo(xInside, yBottom);
            ctx.fill();

            if(this._data.tickVisible) {
                ctx.beginPath();
                ctx.strokeStyle = this._commonData.color;
                ctx.moveTo(xInside, yMid);
                ctx.lineTo(xTick, yMid);
                ctx.stroke();
            }

            ctx.textAlign = 'left';
            ctx.fillStyle = this._commonData.color;

            ctx.fillText(text, xText, yBottom - paddingBottom - baselineOffset);
        }
    }

    public height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number {
        if(!this._data.visible) {
            return 0;
        }

        return rendererOptions.fontSize + rendererOptions.paddingTop + rendererOptions.paddingBottom;
    }
}