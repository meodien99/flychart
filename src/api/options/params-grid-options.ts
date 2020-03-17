import { GridOptions } from "../../models/Grid";
import { LineStyle } from "../../renderers/draw-line-renderer";

 export const gridOptionsDefaults: GridOptions = {
    vertLines: {
        color: '#D6DCDE',
        style: LineStyle.Solid,
        visible: true,
    },
    horzLines: {
        color: '#D6DCDE',
        style: LineStyle.Solid,
        visible: true,
    },
};