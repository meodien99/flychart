
import { DeepPartial } from '../helpers/strict-type-checkers';
import { PriceScaleMargins } from '../models/PriceScale';
import { SeriesOptionsBase } from '../models/SeriesOptions';

 export interface SeriesParamsBase {
 	overlay: boolean;
 	title?: string;
 	scaleMargins?: PriceScaleMargins; // for overlays only
 }

 export interface SeriesParams<T extends SeriesOptionsBase> extends SeriesParamsBase {
 	options?: DeepPartial<T>;
 }