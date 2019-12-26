import { Nominal } from "./nominal";

/**
 * Colors in RGB value
 * The values are integers in range [0, 255]
 */
export type RedColor = Nominal<number, 'RedColor'>;

export type GreenColor = Nominal<number, 'GreenColor'>;

export type BlueColor = Nominal<number, 'BlueColor'>;

/**
 * Alpha of the RGBA color value
 * The valid values are integers in range [0, 1]
 */
export type AlphaColor = Nominal<number, 'AlphaColor'>;

export type Rgb = [RedColor, GreenColor, BlueColor];

export type Rgba = [RedColor, GreenColor, BlueColor, AlphaColor];