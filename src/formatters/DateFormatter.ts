import { IFormatter } from './iformatter';
import { DateFormatFn, DateFormat, dateFormatFunctions } from './date-format';

export class DateFormatter implements IFormatter {
    private readonly _locale: string;
    private readonly _dateFormatFn: DateFormatFn;

    public constructor(dateFormat: DateFormat = 'dd-MM-yyyy', locale: string = 'default') {
        this._dateFormatFn = dateFormatFunctions[dateFormat];
        this._locale = locale;
    }

    public format(date: Date): string {
        return this._dateFormatFn(date, this._locale);
    }
}