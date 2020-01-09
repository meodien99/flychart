import { RedColor, GreenColor, BlueColor, AlphaColor, Rgb, Rgba } from "./color";

//https://www.color-hex.com/color
const namedColorRgbHexStrings = {
    aliceblue: '#f0f8ff',
 	antiquewhite: '#faebd7',
 	aqua: '#00ffff',
 	aquamarine: '#7fffd4',
 	azure: '#f0ffff',
 	beige: '#f5f5dc',
 	bisque: '#ffe4c4',
 	black: '#000000',
 	blanchedalmond: '#ffebcd',
 	blue: '#0000ff',
 	blueviolet: '#8a2be2',
 	brown: '#a52a2a',
 	burlywood: '#deb887',
 	cadetblue: '#5f9ea0',
 	chartreuse: '#7fff00',
 	chocolate: '#d2691e',
 	coral: '#ff7f50',
 	cornflowerblue: '#6495ed',
 	cornsilk: '#fff8dc',
 	crimson: '#dc143c',
 	cyan: '#00ffff',
 	darkblue: '#00008b',
 	darkcyan: '#008b8b',
 	darkgoldenrod: '#b8860b',
 	darkgray: '#a9a9a9',
 	darkgreen: '#006400',
 	darkkhaki: '#bdb76b',
 	darkmagenta: '#8b008b',
 	darkolivegreen: '#556b2f',
 	darkorange: '#ff8c00',
 	darkorchid: '#9932cc',
 	darkred: '#8b0000',
 	darksalmon: '#e9967a',
 	darkseagreen: '#8fbc8f',
 	darkslateblue: '#483d8b',
 	darkslategray: '#2f4f4f',
 	darkturquoise: '#00ced1',
 	darkviolet: '#9400d3',
 	deeppink: '#ff1493',
 	deepskyblue: '#00bfff',
 	dimgray: '#696969',
 	dodgerblue: '#1e90ff',
 	feldspar: '#d19275',
 	firebrick: '#b22222',
 	floralwhite: '#fffaf0',
 	forestgreen: '#228b22',
 	fuchsia: '#ff00ff',
 	gainsboro: '#dcdcdc',
 	ghostwhite: '#f8f8ff',
 	gold: '#ffd700',
 	goldenrod: '#daa520',
 	gray: '#808080',
 	green: '#008000',
 	greenyellow: '#adff2f',
 	honeydew: '#f0fff0',
 	hotpink: '#ff69b4',
 	indianred: '#cd5c5c',
 	indigo: '#4b0082',
 	ivory: '#fffff0',
 	khaki: '#f0e68c',
 	lavender: '#e6e6fa',
 	lavenderblush: '#fff0f5',
 	lawngreen: '#7cfc00',
 	lemonchiffon: '#fffacd',
 	lightblue: '#add8e6',
 	lightcoral: '#f08080',
 	lightcyan: '#e0ffff',
 	lightgoldenrodyellow: '#fafad2',
 	lightgreen: '#90ee90',
 	lightgrey: '#d3d3d3',
 	lightpink: '#ffb6c1',
 	lightsalmon: '#ffa07a',
 	lightseagreen: '#20b2aa',
 	lightskyblue: '#87cefa',
 	lightslateblue: '#8470ff',
 	lightslategray: '#778899',
 	lightsteelblue: '#b0c4de',
 	lightyellow: '#ffffe0',
 	lime: '#00ff00',
 	limegreen: '#32cd32',
 	linen: '#faf0e6',
 	magenta: '#ff00ff',
 	maroon: '#800000',
 	mediumaquamarine: '#66cdaa',
 	mediumblue: '#0000cd',
 	mediumorchid: '#ba55d3',
 	mediumpurple: '#9370d8',
 	mediumseagreen: '#3cb371',
 	mediumslateblue: '#7b68ee',
 	mediumspringgreen: '#00fa9a',
 	mediumturquoise: '#48d1cc',
 	mediumvioletred: '#c71585',
 	midnightblue: '#191970',
 	mintcream: '#f5fffa',
 	mistyrose: '#ffe4e1',
 	moccasin: '#ffe4b5',
 	navajowhite: '#ffdead',
 	navy: '#000080',
 	oldlace: '#fdf5e6',
 	olive: '#808000',
 	olivedrab: '#6b8e23',
 	orange: '#ffa500',
 	orangered: '#ff4500',
 	orchid: '#da70d6',
 	palegoldenrod: '#eee8aa',
 	palegreen: '#98fb98',
 	paleturquoise: '#afeeee',
 	palevioletred: '#d87093',
 	papayawhip: '#ffefd5',
 	peachpuff: '#ffdab9',
 	peru: '#cd853f',
 	pink: '#ffc0cb',
 	plum: '#dda0dd',
 	powderblue: '#b0e0e6',
 	purple: '#800080',
 	red: '#ff0000',
 	rosybrown: '#bc8f8f',
 	royalblue: '#4169e1',
 	saddlebrown: '#8b4513',
 	salmon: '#fa8072',
 	sandybrown: '#f4a460',
 	seagreen: '#2e8b57',
 	seashell: '#fff5ee',
 	sienna: '#a0522d',
 	silver: '#c0c0c0',
 	skyblue: '#87ceeb',
 	slateblue: '#6a5acd',
 	slategray: '#708090',
 	snow: '#fffafa',
 	springgreen: '#00ff7f',
 	steelblue: '#4682b4',
 	tan: '#d2b48c',
 	teal: '#008080',
 	thistle: '#d8bfd8',
 	tomato: '#ff6347',
 	turquoise: '#40e0d0',
 	violet: '#ee82ee',
 	violetred: '#d02090',
 	wheat: '#f5deb3',
 	white: '#ffffff',
 	whitesmoke: '#f5f5f5',
 	yellow: '#ffff00',
 	yellowgreen: '#9acd32',
}

function isNamedColor<NamedColors extends object>(namedColors: NamedColors, colorString: string | number | symbol): colorString is keyof NamedColors {
    return colorString in namedColors;
}

function normalizeInteger(min: number, n: number, max: number): number {
    return (
        isNaN(n) ? min :
            n < min ? min :
            n > max ? max :
            Math.round(n)
    );
}

function normalizeNumber(min: number, n: number, max: number): number {
    return (
        isNaN(n) ? min :
            n < min ? min :
            n > max ? max :
            // limit the precision of all numbers to at most 4 digits in fractional part
            Math.round(n * 10000) / 10000
    );
}


export function normalizeRedColor(red: number): RedColor {
    return normalizeInteger(0, red, 255) as RedColor;
}

export function normalizeGreenColor(green: number): GreenColor {
    return normalizeInteger(0, green, 255) as GreenColor;
}

export function normalizeBlueColor(blue: number): BlueColor {
    return normalizeInteger(0, blue, 255) as BlueColor;
}

export function normalizeAlphaColor(alpha: number): AlphaColor {
    return normalizeNumber(0, alpha, 255) as AlphaColor;
}

// #eee
// #d1c
namespace RgbShortHex {
    export const regEx = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;

    // matches = ['#', 'r', 'g', 'b']
    export function parse(matches: RegExpExecArray): Rgb {
        const redSection: string = matches[1];
        const greenSection: string = matches[2];
        const blueSection: string = matches[3];

        return [
            normalizeRedColor(parseInt(redSection.repeat(2), 16)),
            normalizeGreenColor(parseInt(greenSection.repeat(2), 16)),
            normalizeBlueColor(parseInt(blueSection.repeat(2), 16)),
        ];
    }
}

function tryParseRgbShortHexString(rgbShortHexString: string): Rgb | null {
    const matches = RgbShortHex.regEx.exec(rgbShortHexString);

    return matches !== null ? RgbShortHex.parse(matches) : null;
}

// #ee11cc
namespace RgbHex {
    export const regEx = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

    // matches = ['#', 'r', 'g', 'b']
    export function parse(matches: RegExpExecArray): Rgb {
        const redSection: string = matches[1];
        const greenSection: string = matches[2];
        const blueSection: string = matches[3];

        return [
            normalizeRedColor(parseInt(redSection.repeat(2), 16)),
            normalizeGreenColor(parseInt(greenSection.repeat(2), 16)),
            normalizeBlueColor(parseInt(blueSection.repeat(2), 16)),
        ];
    }
}

function tryParseRgbHexString(rgbHexString: string): Rgb | null {
    const matches = RgbHex.regEx.exec(rgbHexString);

    return matches !== null ? RgbHex.parse(matches) : null;
}

// rgb(0, 11, 225)
namespace RgbRepresentation {
    export const regEx = /^rgb\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*\)$/;

    // matches = ['rgb()', 'r', 'g', 'b']
    export function parse(matches: RegExpExecArray): Rgb {
        const redSection: string = matches[1];
        const greenSection: string = matches[2];
        const blueSection: string = matches[3];

        return [
            normalizeRedColor(parseInt(redSection.repeat(2), 10)),
            normalizeGreenColor(parseInt(greenSection.repeat(2), 10)),
            normalizeBlueColor(parseInt(blueSection.repeat(2), 10)),
        ];
    }
}

function tryParseRgbString(rgbString: string): Rgb | null {
    const matches = RgbRepresentation.regEx.exec(rgbString);

    return matches !== null ? RgbRepresentation.parse(matches) : null;
}

// rgba(0, 11, 225, 0.5)
namespace RgbaRepresentation {
    export const regEx = /^rgba\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?[\d]{0,10}(?:\.\d+)?)\s*\)$/;

    // matches = ['rgb()', 'r', 'g', 'b', 'a']
    export function parse(matches: RegExpExecArray): Rgba {
        const redSection: string = matches[1];
        const greenSection: string = matches[2];
        const blueSection: string = matches[3];
        const alpha: string = matches[4];

        return [
            normalizeRedColor(parseInt(redSection.repeat(2), 10)),
            normalizeGreenColor(parseInt(greenSection.repeat(2), 10)),
            normalizeBlueColor(parseInt(blueSection.repeat(2), 10)),
            normalizeAlphaColor(parseFloat(alpha))
        ];
    }
}

function tryParseRgbaString(rgbaString: string): Rgba | null {
    const matches = RgbaRepresentation.regEx.exec(rgbaString);

    return matches !== null ? RgbaRepresentation.parse(matches) : null;
}

function isHexColor(color: string): boolean {
    return color.indexOf('#') === 0;
}

export function tryParseRgb(nameOrColorString: string): Rgb | null {
    if(!nameOrColorString || nameOrColorString.length < 1)
        return null;

    nameOrColorString = nameOrColorString.toLowerCase();

    if(isNamedColor(namedColorRgbHexStrings, nameOrColorString)) {
        const parsed = tryParseRgbHexString(namedColorRgbHexStrings[nameOrColorString]);

        if(parsed !== null) {
            return parsed;
        } else {
            throw new Error('Invalid named color definition');
        }
    }

    let parser: Function | null;

    if(isHexColor(nameOrColorString)) {
        parser = nameOrColorString.length < 6 ? tryParseRgbShortHexString : tryParseRgbHexString;
    } else {
        if(nameOrColorString.includes('rgba')) {
            const rgbaResult = tryParseRgbaString(nameOrColorString);
            if(rgbaResult !== null) {
                return [
                    rgbaResult[0], 
                    rgbaResult[1], 
                    rgbaResult[2]
                ];
            } 

            return null;
        } else {
            parser = tryParseRgbString;
        }
    }

    if(!parser)
        return null;

    return parser(nameOrColorString);
}

export function parseRgb(nameOrColorString: string): Rgb {
    const result = tryParseRgb(nameOrColorString);

    if(result) {
        return result;
    } else {
        throw new Error(`Passed color string ${nameOrColorString} does not match any of the known color representations`)
    }
}

// 0.2126 * R + 0.7152 * G + 0.0722
// http://en.wikipedia.org/wiki/Grayscale
const rgbGrayscaleWeights = [0.2126, 0.7152, 0.0722];

export function rgbToGrayscale(rgbValue: Rgb): number {
    return rgbGrayscaleWeights[0] * rgbValue[0] +
        rgbGrayscaleWeights[1] * rgbValue[1] +
        rgbGrayscaleWeights[2] * rgbValue[2];
}

export function rgbToBlackWhiteString(rgbValue: Rgb, threshold: number): 'black' | 'white' {
    if(threshold < 0 || threshold > 255)
        throw new Error(`invalid threshold value, valid values are [0, 255]`);

    return rgbToGrayscale(rgbValue) >= threshold ? 'white' : 'black';
}

export function rgba(red: number, green: number, blue: number, alpha: number): Rgba;
export function rgba(rgb: Rgb, alpha: number): Rgba;
export function rgba(redOrRgb: number | Rgb, greenOrAlpha: number, blue?: number, alpha?: number): Rgba {
    if(Array.isArray(redOrRgb)) { // rgb
        alpha = greenOrAlpha;

        return [
            redOrRgb[0],
            redOrRgb[1],
            redOrRgb[2],
            normalizeAlphaColor(alpha)
        ];
    } else {
        const red = redOrRgb,
            green = greenOrAlpha
            blue = blue || 0,
            alpha = alpha || 0;

        return [
            normalizeRedColor(red),
            normalizeGreenColor(green),
            normalizeBlueColor(blue),
            normalizeAlphaColor(alpha),
        ];
    }
}

export function rgbaToString(rgbValue: Rgba): string {
    const [red, green, blue, alpha] = rgbValue;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function resetTransparency(color: string): string {
    if(isHexColor(color)) {
        return color;
    }

    const alpha = normalizeAlphaColor(1);

    return rgbaToString(rgba(parseRgb(color), alpha));
}

export function colorWithTransparency(color: string, transparency: number): string {
    if(isHexColor(color)) {
        return color;
    }

    return rgbaToString(rgba(parseRgb(color), normalizeAlphaColor(transparency)));
}