import { DateFormat } from "../formatters/date-format";
import { BusinessDay, UTCTimestamp } from "./time-data";
import { BarPrice } from "./bar";

export type TimeFormatterFn = (time: BusinessDay | UTCTimestamp) => string;
export type PriceFormatterFn = (priceValue: BarPrice) => string;

export type LocalizationOptions = {
    /**
 	 * Current locale, which will be used for formatting dates.
 	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
 	 */
    locale: string,
    priceFormatter?: PriceFormatterFn,
    timeFormatter?: TimeFormatterFn,
    dateFormat: DateFormat 
}