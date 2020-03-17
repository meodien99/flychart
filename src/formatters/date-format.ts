import { numberToStringWithLeadingZero } from "./PriceFormatter";

const getMonth = (date: Date) => date.getUTCMonth() + 1;
const getDay = (date: Date) => date.getUTCDate();
const getYear = (date: Date) => date.getUTCFullYear();

const dd = (date: Date) => numberToStringWithLeadingZero(getDay(date), 2);

const MMM: DateFormatFn = (date: Date, locale?: string) => new Date(getYear(date), date.getUTCMonth(), 1).toLocaleString(locale, {month: 'short'});
const MM = (date: Date) => numberToStringWithLeadingZero(getMonth(date), 2);

const yy = (date: Date) => numberToStringWithLeadingZero(getYear(date) % 100, 2);
const yyyy = (date: Date) => numberToStringWithLeadingZero(getYear(date), 4);

export type DateFormat = 
    | 'dd MMM \'yy'
    | 'yyyy-MM-dd'
    | 'yy-MM-dd'
    | 'yy/MM/dd'
    | 'yyyy/MM/dd'
    | 'dd-MM-yy'
    | 'dd-MM-yyyy'
    | 'dd/MM/yyyy'
    | 'dd/MM/yy'
    | 'MM/dd/yy'
    | 'MM/dd/yyyy'
;

export type DateFormatFn = (date: Date, locale?: string) => string; 

export const dateFormatFunctions: Record<DateFormat, DateFormatFn> = {
    'dd MMM \'yy': (date: Date, locale?: string) => `${dd(date)} ${MMM(date, locale)} \'${yy(date)}`,
    'yyyy-MM-dd': (date: Date) => `${yyyy(date)}-${MM(date)}-${dd(date)}`,
    'yy-MM-dd': (date: Date) => `${yy(date)}-${MM(date)}-${dd(date)}`,
    'yy/MM/dd': (date: Date) => `${yy(date)}/${MM(date)}/${dd(date)}`,
    'yyyy/MM/dd': (date: Date) => `${yyyy(date)}/${MM(date)}/${dd(date)}`,
    'dd-MM-yy': (date: Date) => `${dd(date)}-${MM(date)}-${yy(date)}`,
    'dd-MM-yyyy': (date: Date) => `${dd(date)}-${MM(date)}-${yyyy(date)}`,
    'dd/MM/yyyy': (date: Date) => `${dd(date)}/${MM(date)}/${yyyy(date)}`,
    'dd/MM/yy': (date: Date) => `${dd(date)}/${MM(date)}/${yy(date)}`,
    'MM/dd/yy': (date: Date) => `${MM(date)}/${dd(date)}/${yy(date)}`,
    'MM/dd/yyyy': (date: Date) => `${MM(date)}/${dd(date)}/${yyyy(date)}`,
}