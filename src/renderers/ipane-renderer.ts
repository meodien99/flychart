import { Coordinate } from "../models/Coordinate";

export interface IPaneRenderer {
    draw(ctx: CanvasRenderingContext2D, isHovered: boolean): void;
    drawBackground?(ctx: CanvasRenderingContext2D, isHovered: boolean): void;
    hitTest?(x: Coordinate, y: Coordinate): boolean;
}