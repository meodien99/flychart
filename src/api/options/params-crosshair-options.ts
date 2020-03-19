import { CrossHairOptions, CrossHairMode } from "../../models/CrossHair";
import { LineStyle } from "../../renderers/draw-line-renderer";


export const crossHairOptionsDefaults: CrossHairOptions = {
    vertLine: {
        color: '#2e353c',
        width: 1,
        style: LineStyle.Dashed,
        visible: true,
        labelVisible: true,
    },
    horzLine: {
        color: '#2e353c',
        width: 1,
        style: LineStyle.Dashed,
        visible: true,
        labelVisible: true,
    },
    mode: CrossHairMode.Magnet,
};