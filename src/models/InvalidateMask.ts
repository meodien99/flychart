export const enum InvalidateLevel {
    None = 0,
    Cursor = 1,
    Light = 2,
    Full = 3
}

export type PaneInvalidation = {
    level: InvalidateLevel,
    autoScale?: boolean
}

function mergePaneInvalidation(beforeValue: PaneInvalidation | undefined, newValue: PaneInvalidation): PaneInvalidation {
    if(beforeValue === newValue)
        return newValue;

    const level = Math.max(beforeValue === undefined ? 0 : beforeValue.level, newValue.level);
    const autoScale = (beforeValue === undefined ? false : beforeValue.autoScale) || newValue.autoScale;

    return {level, autoScale};
}

export class InvalidateMask {
    private _invalidatedPanes: Map<number, PaneInvalidation> = new Map();
    private _globalLevel: InvalidateLevel;
    private _force: boolean = false;
    private _fitContent: boolean = false;

    public constructor(globalLevel: InvalidateLevel) {
        this._globalLevel = globalLevel;
    }

    public invalidatePane(paneIndex: number, invalidation: PaneInvalidation): void {
        const prevValue = this._invalidatedPanes.get(paneIndex);
        const newValue = mergePaneInvalidation(prevValue, invalidation);

        this._invalidatedPanes.set(paneIndex, newValue);
    }

    public invalidateAll(level: InvalidateLevel): void {
        this._globalLevel = Math.max(this._globalLevel, level);
    }

    public fullInvalidation(): InvalidateLevel {
        return this._globalLevel;
    }

    public invalidateForPane(paneIndex: number): PaneInvalidation {
        const paneInvalidation = this._invalidatedPanes.get(paneIndex);
        if(paneInvalidation === undefined) {
            return {
                level: this._globalLevel
            }
        }

        return {
            level: Math.max(this._globalLevel, paneInvalidation.level),
            autoScale: paneInvalidation.autoScale
        };
    }

    public setFitContent(): void {
        this._fitContent = true;
    }

    public getFitContent(): boolean {
        return this._fitContent;
    }

    public merge(other: InvalidateMask): void {
        this._force = this._force || other._force;
        this._fitContent = this._fitContent || other._fitContent;
        this._globalLevel = this._globalLevel || other._globalLevel;
        other._invalidatedPanes.forEach((invalidation: PaneInvalidation, index: number) => {
            this.invalidatePane(index, invalidation);
        });
    }
}