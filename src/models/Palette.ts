
export class Palette {
    private readonly _color2Index: Map<string, number> = new Map();
    private readonly _index2Color: Map<number, string> = new Map();

    public add(index: number, color: string): void {
        this._color2Index.set(color, index);
        this._index2Color.set(index, color);
    }

    public colorByIndex(index: number): string {
        return this._index2Color.get(index);
    }

    public indexByColor(color: string): number {
        return this._color2Index.get(color);
    }

    public hasColor(color: string): boolean {
        return this._color2Index.has(color);
    }

    public size(): number {
        return this._index2Color.size;
    }
}