import {makeFont} from '../helpers/make-font';

import { ChartModel } from "../models/Chart";
import { PriceAxisViewRendererOptions } from "./iprice-axis-view-renderer";

const enum RendererConstants {
    BorderSize = 1,
    TickLength = 4,
    OffsetSize = 1
};

export class PriceAxisRendererOptionsProvider {
    private readonly _chartModel: ChartModel;

    private readonly _rendererOptions: PriceAxisViewRendererOptions = {
        borderSize: RendererConstants.BorderSize,
        tickLength: RendererConstants.TickLength,
        offsetSize: RendererConstants.OffsetSize,
        fontSize: NaN,
        font: '',
        fontFamily: '',
        color: '',
        paddingBottom: 0,
        paddingInner: 0,
        paddingTop: 0,
        paddingOuter: 0,
        baselineOffset: 0
    };

    public constructor(chartModel: ChartModel) {
        this._chartModel = chartModel;
    }

    public options(): PriceAxisViewRendererOptions {
        const rendererOptions = this._rendererOptions;

        const currentFontSize = this._fontSize();
        const currentFontFamily = this._fontFamily();

        if(rendererOptions.fontSize !== currentFontSize || rendererOptions.fontFamily !== currentFontFamily) {
            rendererOptions.fontSize = currentFontSize;
            rendererOptions.fontFamily = currentFontFamily;
            rendererOptions.font = makeFont(currentFontSize, currentFontFamily);
            rendererOptions.paddingTop = Math.floor(currentFontSize/3.5);
            rendererOptions.paddingBottom = rendererOptions.paddingTop;
            rendererOptions.paddingInner = Math.max(
                Math.ceil(currentFontSize/2 - rendererOptions.tickLength/2),
                0
            );
            rendererOptions.paddingOuter = Math.ceil(currentFontSize/2 + rendererOptions.tickLength/2);
            rendererOptions.baselineOffset = Math.round(currentFontSize/5);
        }

        rendererOptions.color = this._textColor();

        return this._rendererOptions;
    }

    private _fontSize(): number {
        return this._chartModel.options().layout.fontSize;
    }

    private _textColor(): string {
        return this._chartModel.options().layout.textColor;
    }

    private _fontFamily(): string {
        return this._chartModel.options().layout.fontFamily;
    }
}