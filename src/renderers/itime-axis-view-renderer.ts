import { TextWidthCache } from "../models/TextWidthCache";

export type TimeAxisViewRendererOptions = {
    baselineOffset: number,
    borderSize: number,
    font: string,
    fontSize: number, 
    paddingBottom: number,
    paddingTop: number,
    tickLength: number,
    paddingHorizontal: number,
    widthCache: TextWidthCache
};

export interface ITimeAxisViewRenderer {
    draw(ctx: CanvasRenderingContext2D, rendererOptions: TimeAxisViewRendererOptions): void;
}