import { Coordinate } from "../models/Coordinate";
import { LineWidth, LineStyle } from "./draw-line-renderer";
import { TextWidthCache } from "../models/TextWidthCache";

export type PriceAxisViewRendererCommonData = {
    activeBackground?: string,
    background: string,
    borderColor?: string,
    color: string,
    coordinate: Coordinate,
    floatCoordinate?: Coordinate,
    fixedCoordinate?: Coordinate
};

export type PriceAxisViewRendererData = {
    visible: boolean,
    text: string,
    tickVisible: boolean,
    borderVisible: boolean,
    lineWidth?: LineWidth,
    lineStyle: LineStyle
};

export type PriceAxisViewRendererOptions = {
    baselineOffset: number,
    borderSize: number,
    offsetSize: number,
    font: string,
    fontFamily: string,
    color: string,
    fontSize: number,
    paddingBottom: number,
    paddingInner: number,
    paddingOuter: number,
    paddingTop: number,
    tickLength: number
};

export interface IPriceAxisViewRenderer {
    draw(
        ctx: CanvasRenderingContext2D,
        rendererOptions: PriceAxisViewRendererOptions,
        textWidthCache: TextWidthCache,
        width: number,
        algin: 'left' | 'right' | 'center'
    ): void;

    height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number;

    setData(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void;
}

export type IPriceAxisViewRendererConstructor = new(
    data: PriceAxisViewRendererData,
    commonData: PriceAxisViewRendererCommonData
) => IPriceAxisViewRenderer

