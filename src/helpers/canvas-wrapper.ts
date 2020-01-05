import { ensureNotNull } from './assertions';
import { isNumber } from './strict-type-checkers';

const fontSizeRegex = /(\d+(?:\.\d+)?)(px|em|rem|pt)/g;

const ctx = document.createElement('canvas').getContext('2d') || {} as any;

const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1;

const devicePixelRatio = window.devicePixelRatio || 1;
const ratio = devicePixelRatio / backingStoreRatio;

export class CanvasWrapper implements CanvasRenderingContext2D {
    public readonly canvas: HTMLCanvasElement;
    private readonly _ctx: CanvasRenderingContext2D;
    private readonly _rto: number;

    public constructor(originalCtx: CanvasRenderingContext2D, rto: number) {
        this.canvas = originalCtx.canvas;
        this._ctx = originalCtx;
        this._rto = rto;
    }

    public restore(): void {
        this._ctx.restore();
    }

    public save(): void {
        this._ctx.save();
    }

    public getTransform(): DOMMatrix {
        return this._ctx.getTransform();
    }

    public resetTransform(): void {
        this._ctx.resetTransform();
    }

    public rotate(angle: number): void {
        this._ctx.rotate(angle);
    }

    public scale(x: number, y: number): void {
        this._ctx.scale(x, y);
    }

    public setTransform(transform?: DOMMatrix2DInit): void;
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    public setTransform(
        a: number | DOMMatrix2DInit | undefined,
        b?: number,
        c?: number,
        d?: number,
        e?: number,
        f?: number
    ): void {
        if(isNumber(a)) {
            this._ctx.setTransform(a, b as number, c as number, d as number, e as number, f as number);
        } else {
            this._ctx.setTransform(a);
        }
    }

    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._ctx.transform(a, b, c, d, e, f);
    }

    public translate(x: number, y: number): void {
        this._ctx.translate(x * this._rto, y * this._rto);
    }

    public get globalAlpha(): number {
        return this._ctx.globalAlpha;
    }

    public set globalAlpha(value: number) {
        this._ctx.globalAlpha = value;
    }

    public get globalCompositeOperation(): string {
        return this._ctx.globalCompositeOperation;
    }

    public set globalCompositeOperation(value: string) {
        this._ctx.globalCompositeOperation = value;
    }

    public get imageSmoothingEnabled(): boolean {
        return this._ctx.imageSmoothingEnabled;
    }

    public set imageSmoothingEnabled(value: boolean) {
        this._ctx.imageSmoothingEnabled = value;
    }

    public get imageSmoothingQuality(): ImageSmoothingQuality {
        return this._ctx.imageSmoothingQuality;
    }

    public set imageSmoothingQuality(value: ImageSmoothingQuality) {
        this._ctx.imageSmoothingQuality = value;
    }

    public get fillStyle(): string | CanvasGradient | CanvasPattern {
        return this._ctx.fillStyle;
    }

    public set fillStyle(value: string | CanvasGradient | CanvasPattern) {
        this._ctx.fillStyle = value;
    }

    public get strokeStyle(): string | CanvasGradient | CanvasPattern {
        return this._ctx.strokeStyle;
    }

    public set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
        this._ctx.strokeStyle = value;
    }
    public createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        return this._ctx.createLinearGradient(x0 * this._rto, y0 * this._rto, x1 * this._rto, y1 * this._rto);
    }

    public createPattern(image: CanvasImageSource, repetition: string): CanvasPattern | null {
        return this._ctx.createPattern(image, repetition);
    }

    public createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
        return this._ctx.createRadialGradient(x0 * this._rto, y0 * this._rto, r0 * this._rto, x1 * this._rto, y1 * this._rto, r1 * this._rto);
    }

    public get shadowBlur(): number {
        return this._ctx.shadowBlur;
    }

    public set shadowBlur(value: number) {
        this._ctx.shadowBlur = value;
    }

    public get shadowColor(): string {
        return this._ctx.shadowColor;
    }

    public set shadowColor(value: string) {
        this._ctx.shadowColor = value;
    }

    public get shadowOffsetX(): number {
        return this._ctx.shadowOffsetX;
    }

    public set shadowOffsetX(value: number) {
        this._ctx.shadowOffsetX = value;
    }

    public get shadowOffsetY(): number {
        return this._ctx.shadowOffsetY;
    }

    public set shadowOffsetY(value: number) {
        this._ctx.shadowOffsetY = value;
    }

    public get filter(): string {
        return this._ctx.filter;
    }

    public set filter(value: string) {
        this._ctx.filter = value;
    }

    public clearRect(x: number, y: number, w: number, h: number): void {
        this._ctx.clearRect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
    }

    public fillRect(x: number, y: number, w: number, h: number): void {
        this._ctx.fillRect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
    }

    public strokeRect(x: number, y: number, w: number, h: number): void {
        this._ctx.strokeRect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
    }

    public beginPath(): void {
        this._ctx.beginPath();
    }

    public clip(fillRule?: CanvasFillRule): void;
    public clip(path: Path2D, fillRule?: CanvasFillRule): void;
    public clip(path: Path2D | CanvasFillRule | undefined, fillRule?: CanvasFillRule): void {
        if (path === 'nonzero' || path === 'evenodd' || path === undefined) {
            this._ctx.clip(path);
        } else {
            this._ctx.clip(path, fillRule);
        }
    }

    public fill(fillRule?: CanvasFillRule): void;
    public fill(path: Path2D, fillRule?: CanvasFillRule): void;
    public fill(path: Path2D | CanvasFillRule | undefined, fillRule?: CanvasFillRule): void {
        if (path === 'nonzero' || path === 'evenodd' || path === undefined) {
            this._ctx.fill(path);
        } else {
            this._ctx.fill(path, fillRule);
        }
    }

    public isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean;
    public isPointInPath(path: Path2D, x: number, y: number, fillRule?: CanvasFillRule): boolean;
    public isPointInPath(path: Path2D | number, x: number, y: number | CanvasFillRule | undefined, fillRule?: CanvasFillRule): boolean {
        return isNumber(path) ?
            this._ctx.isPointInPath(path * this._rto, x * this._rto, y as CanvasFillRule) :
            this._ctx.isPointInPath(path, x * this._rto, (y as number) * this._rto, fillRule);
    }

    public isPointInStroke(x: number, y: number): boolean;
    public isPointInStroke(path: Path2D, x: number, y: number): boolean;
    public isPointInStroke(path: Path2D | number, x: number, y?: number): boolean {
        return isNumber(path) ?
            this._ctx.isPointInStroke(path * this._rto, x * this._rto) :
            this._ctx.isPointInStroke(path, x * this._rto, (y as number) * this._rto);
    }
    public stroke(): void;
    public stroke(path: Path2D): void;
    public stroke(path?: Path2D): void {
        if (path === undefined) {
            this._ctx.stroke();
            return;
        }
        this._ctx.stroke(path);
    }

    public drawFocusIfNeeded(element: Element): void;
    public drawFocusIfNeeded(path: Path2D, element: Element): void;
    public drawFocusIfNeeded(path: Path2D | Element, element?: Element): void {
        if (element !== undefined) {
            this._ctx.drawFocusIfNeeded(path as Path2D, element);
        } else {
            this._ctx.drawFocusIfNeeded(path as Element);
        }
    }

    public scrollPathIntoView(): void;
    public scrollPathIntoView(path: Path2D): void;
    public scrollPathIntoView(path?: Path2D): void {
        if (path !== undefined) {
            this._ctx.scrollPathIntoView(path);
        } else {
            this._ctx.scrollPathIntoView();
        }

    }

    public fillText(text: string, x: number, y: number, maxWidth?: number): void {
        if (this._rto !== 1) {
            this.font = this.font.replace(
                fontSizeRegex, (w: string, m: number, u: string) => {
                    return (m * this._rto) + u;
                }
            );
        }

        if (maxWidth === undefined) {
            this._ctx.fillText(text, x * this._rto, y * this._rto);
        } else {
            this._ctx.fillText(text, x * this._rto, y * this._rto, maxWidth * this._rto);
        }

        if (this._rto !== -1) {
            this.font = this.font.replace(
                fontSizeRegex, (w: string, m: number, u: string) => {
                    return (m / this._rto) + u;
                }
            );
        }
    }

    public measureText(text: string): TextMetrics {
        return this._ctx.measureText(text);
    }
    
    strokeText(text: string, x: number, y: number, maxWidth?: number | undefined): void {
        if(this._rto !== 1) {
            this.font = this.font.replace(fontSizeRegex, (w: string, m: number, u: string) => (m * this._rto) + u)
        }

        if(maxWidth === undefined) {
            this._ctx.strokeText(text, x * this._rto, y * this._rto);
        } else {
            this._ctx.strokeText(text, x * this._rto, y * this._rto, maxWidth * this._rto);
        }

        if(this._rto !== 1) {
            this.font = this.font.replace(fontSizeRegex, (w: string, m: number, u: string) => (m / this._rto) + u)
        }
    }

    drawImage(image: CanvasImageSource, dx: number, dy: number): void;
    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
    drawImage(image: any, sx: any, sy: any, sw?: any, sh?: any, dx?: any, dy?: any, dw?: any, dh?: any) {
        if (image instanceof HTMLCanvasElement) {
            return this._drawImagePatchedSourceAndDest(image, sx, sy, sw as number, sh as number, dx as number, dy as number, dw as number, dh as number);
        } else {
            return this._drawImagePatchedSource(image, sx, sy, sw as number, sh as number, dx as number, dy as number, dw as number, dh as number);
        }
    }
    createImageData(sw: number, sh: number): ImageData;
    createImageData(imagedata: ImageData): ImageData;
    createImageData(sw: any, sh?: any) {
        throw new Error("Method not implemented.");
    }
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
        throw new Error("Method not implemented.");
    }
    putImageData(imagedata: ImageData, dx: number, dy: number): void;
    putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void;
    putImageData(imagedata: any, dx: any, dy: any, dirtyX?: any, dirtyY?: any, dirtyWidth?: any, dirtyHeight?: any) {
        throw new Error("Method not implemented.");
    }
    lineCap: CanvasLineCap;
    lineDashOffset: number;
    lineJoin: CanvasLineJoin;
    lineWidth: number;
    miterLimit: number;
    getLineDash(): number[] {
        throw new Error("Method not implemented.");
    }
    setLineDash(segments: number[]): void {
        throw new Error("Method not implemented.");
    }
    direction: CanvasDirection;
    font: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean | undefined): void {
        throw new Error("Method not implemented.");
    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        throw new Error("Method not implemented.");
    }
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    closePath(): void {
        throw new Error("Method not implemented.");
    }
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean | undefined): void {
        throw new Error("Method not implemented.");
    }
    lineTo(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    moveTo(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    rect(x: number, y: number, w: number, h: number): void {
        throw new Error("Method not implemented.");
    }
}

export function getContext2d(canvasElement: HTMLCanvasElement): CanvasRenderingContext2D | null {
    if(canvasElement.width !== Math.floor(parseInt(ensureNotNull(canvasElement.style.width)) * ratio)) {
        canvasElement.style.width = `${canvasElement.width}px`;
        canvasElement.width *= ratio;
        canvasElement.height *= ratio;
    }

    const originalCtx = canvasElement.getContext('2d');
    return originalCtx === null ? null : new CanvasWrapper(originalCtx, ratio);
}