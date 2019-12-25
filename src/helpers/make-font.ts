/**
  * Default font family.
  * Must be used to generate font string when font is not specified.
  */
export const DEFAULT_FONT_FAMILY = `Roboto, Ubuntu, sans-serif`;

/**
 * Generates a font string, which can be used to set in canvas' font property.
 * If no family provided, [DEFAULT_FONT_FAMILY] will be used.
 */
export function makeFont(size: number, family?: string, style?: string): string {
    const s = style ? `${style}` : '';

    if(!family)
        family = DEFAULT_FONT_FAMILY;

    return `${s} ${size}px ${family}`;
}