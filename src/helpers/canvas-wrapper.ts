const fontSizeRegex = /(\d+(?:\.\d+)?)(px|em|rem|pt)/g;

const ctx = document.createElement('canvas').getContext('2d') || {} as any;

const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1;

const devicePixelRatio = window.devicePixelRatio || 1;
const ratio = devicePixelRatio / backingStoreRatio;

export function getContext2d(canvasElement: HTMLCanvasElement): CanvasRenderingContext2D | null {
    if(canvasElement.width !== Math.floor(parseInt(ensureNotNull(canvasElement.style.width))))
}