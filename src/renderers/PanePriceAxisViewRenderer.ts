import {IPaneRenderer} from './ipane-renderer';
import { IPriceAxisViewRenderer, PriceAxisViewRendererOptions } from './iprice-axis-view-renderer';
import { TextWidthCache } from '../models/TextWidthCache';

export class PanePriceAxisViewRenderer implements IPaneRenderer {
    private _priceAxisViewRenderer: IPriceAxisViewRenderer | null = null;
    private _rendererOptions: PriceAxisViewRendererOptions | null = null;
    private _align: 'left' | 'right' = 'right';
    private _width: number = 0;
    private readonly _textWidthCache: TextWidthCache;

    public constructor(textWidthCache: TextWidthCache) {
        this._textWidthCache = textWidthCache;
    }

    public setParams(
        priceAxisViewRenderer: IPriceAxisViewRenderer,
        rendererOptions: PriceAxisViewRendererOptions,
        width: number,
        align: 'left' | 'right'
    ): void {
        this._priceAxisViewRenderer = priceAxisViewRenderer;
        this._rendererOptions = rendererOptions;
        this._width = width;
        this._align = align;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (this._rendererOptions === null || this._priceAxisViewRenderer === null) {
            return;
        }

        this._priceAxisViewRenderer.draw(ctx, this._rendererOptions, this._textWidthCache, this._width, this._align);
    }
}