import { Coordinate } from "../../models/Coordinate";
import { IPaneRenderer } from "../../renderers/ipane-renderer";

export interface IPaneView {
    renderer(height: number, width: number, addAnchor?: boolean): IPaneRenderer | null;
    clickHandler?(x: Coordinate, y: Coordinate): void;
    moveHandler?(x: Coordinate, y: Coordinate): void;
}