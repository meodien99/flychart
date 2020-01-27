import { rgbToBlackWhiteString, parseRgb } from "../../helpers/colors";

export abstract class TimeAxisView {
    protected _text: string = '';
    protected _background: string = '#585858';
    protected _coordinate: number = 0;

    public text(): string {
        return this._text;
    }

    public background(): string {
        return this._background;
    }

    public color(): string {
        const bgBW = rgbToBlackWhiteString(parseRgb(this._background), 150);
        return bgBW === 'black' ? 'white' : 'black';
    }

    public coordinate(): number {
        return this._coordinate;
    }

    public abstract renderer(): TimeAxisViewRenderer;
}