const defaultReplacementRegex = /[2-9]/g;

type CachedTick = {
    width: number,
    tick: number
};

export class TextWidthCache {
    private readonly _maxSize: number;

    private _actualSize: number = 0;
    private _usageTick: number = 1;
    private _oldestTick: number = 1;

    private _cache: Record<string, CachedTick> = {};
    private _tick2Labels: Record<number, string> = {};

    public constructor(size: number = 50) {
        this._maxSize = size;
    }

    public reset(): void {
        this._actualSize = 0;
        this._cache = {};
        this._usageTick = 1;
        this._oldestTick = 1;
        this._tick2Labels = {};
    }

    public measureText(ctx: CanvasRenderingContext2D, text: string, optimizationReplacementRegex?: RegExp): number {
        const regex = optimizationReplacementRegex || defaultReplacementRegex;
        const cacheStr = String(text).replace(regex, '0');

        if(this._cache[cacheStr]) {
            return this._cache[cacheStr].width;
        }

        if(this._actualSize === this._maxSize) {
            const oldestValue = this._tick2Labels[this._oldestTick];
            delete this._tick2Labels[this._oldestTick];
            delete this._cache[oldestValue];

            this._oldestTick++;
            this._actualSize--;
        }

        const width = ctx.measureText(cacheStr).width;

        if(width === 0 && !!text.length) {
            // measureText can return 0 in FireFox depending on a canvas size
            // dont cache it
            return 0;
        }

        this._cache[cacheStr] = {
            width,
            tick: this._usageTick
        };

        this._tick2Labels[this._usageTick] = cacheStr;
        this._actualSize++;
        this._usageTick++;

        return width;
    }
}