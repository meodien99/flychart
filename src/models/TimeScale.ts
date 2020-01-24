import { Coordinate } from "./Coordinate";
import { ChartModel } from "./Chart";
import { TimePointIndex, TimePoint, TickMark, TimedValue } from "./times";
import { Delegate } from "../helpers/delegate";
import { LabelCache } from "./FormattedLabelCache";
import { BarsRange } from './BarsRange';
import { TickMarks } from './TickMarks';
import { TimePoints } from './TimePoints';
import { DateFormatter } from "../formatters/DateFormatter";
import { DateTimeFormatter } from "../formatters/DateTimeFormatter";
import { LocalizationOptions } from "./localization-options";
import { DeepPartial, merge, isInteger } from "../helpers/strict-type-checkers";
import { ensureNotNull, ensure } from "../helpers/assertions";
import { ISubscription } from "../helpers/isubscription";
import { clamp } from '../helpers/math'; 

const enum Constants {
    DefaultAnimationDuration = 400,
    MaxBarSpacing = 50,
    MinBarSpacing = 0.5,
    MinVisibleBarsCount = 5
}

export const enum MarkSpanBorder {
    Minute = 20,
    Hour = 30,
    Day = 40,
    Week = 50,
    Month = 60,
    Year = 70
}

interface TransitionState {
    barSpacing: number,
    rightOffset: number
}

export type TimeMark = {
    coord: Coordinate,
    label: string,
    span: number,
    major: boolean
}

export type TimeScaleOptions = {
    rightOffset: number,
    barSpacing: number,
    fixedLeftEdge: boolean,
    lockVisibleTimeRangeOnResize: boolean,
    rightBarStaysOnScroll: boolean,
    borderVisible: boolean,
    borderColor: string,
    visible: boolean,
    timeVisible: boolean,
    secondsVisible: boolean
};

export class TimeScale {
    private readonly _options: TimeScaleOptions;
    private readonly _model: ChartModel;
    private readonly _localizationOptions: LocalizationOptions;

    private _dateTimeFormatter!: DateFormatter | DateTimeFormatter;
    private _width: number = 0;
    private _baseIndexOrNull?: TimePointIndex = null;
    private _rightOffset: number;
    private _points: TimePoints = new TimePoints();
    
    private readonly _barSpacingChanged: Delegate<number, number> = new Delegate();
    private _barSpacing: number;
    private _scrollStartPoint?: Coordinate = null;
    private _scaleStartPoint?: Coordinate = null;

    private readonly _tickMarks: TickMarks = new TickMarks();
    private _formattedBySpan: Map<number, LabelCache> = new Map();
    
    private _visibleBars?: BarsRange = null;
    private _visibleBarsInvalidated: boolean = true;

    private readonly _visibleBarsChanged: Delegate = new Delegate();
    private readonly _optionsApplied: Delegate = new Delegate();

    private _leftEdgeIndex?: TimePointIndex = null;
    private _commonTransitionStartState?: TransitionState = null;
    private _timeMarksCache?: TimeMark[] = null;

    private _labels: TimeMark[] = [];

    public constructor(model: ChartModel, options: TimeScaleOptions, localizationOptions: LocalizationOptions) {
        this._options = options;
 		this._localizationOptions = localizationOptions;
        this._model = model;
         
        const {rightOffset, barSpacing} = options;
        this._rightOffset = rightOffset;
        this._barSpacing = barSpacing;

        this._updateDateTimeFormatter();
    }

    public options(): TimeScaleOptions {
        return this._options;
    }

    public applyLocalizationOptions(localizationOptions: DeepPartial<LocalizationOptions>): void {
        merge(this._localizationOptions, localizationOptions);

        this._validateTickMarks();
        this._updateDateTimeFormatter();
    }

    public applyOptions(options: DeepPartial<TimeScaleOptions>, localizationOptions?: DeepPartial<LocalizationOptions>): void {
        merge(this._options, options);

        if(this._options.fixedLeftEdge) {
            const firstIndex = this._points.firstIndex();

            if(firstIndex !== null) {
                this.setLeftEdgeFix(firstIndex);
            }
        } else {
            this._leftEdgeIndex = null;
        }

        if(options.rightOffset !== undefined) {
            this.setRightOffset(options.rightOffset);
        }

        if(options.barSpacing !== undefined) {
            this.setBarSpacing(options.barSpacing);
        }

        this._validateTickMarks();
        this._updateDateTimeFormatter();

        this._optionsApplied.fire();
    }

    public setRightOffset(offset: number): void {
        this._visibleBarsInvalidated = true;
        this._rightOffset = offset;
        this._correctOffset();
        this._model.recalculatedAllPanes();
        this._model.lightUpdate();
    }

    public isEmpty(): boolean {
        return this._width === 0 || this._points.size() === 0;
    }

    public tickMarks(): TickMarks {
        return this._tickMarks;
    }

    public points(): TimePoints {
        return this._points;
    }

    public width(): number {
        return this._width;
    }

    public setWidth(width: number): void {
        if(!isFinite(width) || width <= 0) {
            return;
        }

        if(this._width === width)
            return;

        this._visibleBarsInvalidated = true;

        if(this._options.lockVisibleTimeRangeOnResize && this._width) {
            // recalulate bar spacing
            const newBarSpacing = this._barSpacing * width / this._width;
            this._tryToUpdateBarSpacing(newBarSpacing);
        }

        // if time scale is scrolled to the end of data we have fixed right edge
        // keep the left instead of right
        // we need it to avoid "shaking" if the last bar visibility affects time scale width
        if(this._leftEdgeIndex !== null) {
            const firstVisibleBar = ensureNotNull<BarsRange>(this.visibleBars()).firstBar();

            // firstVisibleBar could be less than this._leftEdgeIndex
            // since index is a center of bar
            if(firstVisibleBar <= this._leftEdgeIndex) {
                const delta = this._width - width;
                // reduce _rightOffset means move right
                // we could move more than required - this will be fixed by _correctOffset()
                this._rightOffset -= Math.round(delta/this._barSpacing) + 1;
            }
        }

        this._width = width;
        this._correctOffset();
    }

    public indexToCoordinate(index: TimePointIndex, keepFloat?: boolean): Coordinate {
        if(this.isEmpty() || !isInteger(index))
            return 0 as Coordinate;

        const baseIndex = this.baseIndex();
        const deltaFromRight = baseIndex + this._rightOffset - index;
        const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing;

        if(keepFloat) {
            return coordinate as Coordinate;
        }

        return Math.round(coordinate) as Coordinate;
    }

    public indexesToCoordinates<T extends TimedValue>(points: T[], visibleRange?: SeriesItemsIndexesRange): void {
        const baseIndex = this.baseIndex();
        const indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
        const indexTo = (visibleRange === undefined) ? points.length : visibleRange.to;

        for(let i = indexFrom; i < indexTo; i++) {
            const index = points[i].time;
            const deltaFromRight = baseIndex + this._rightOffset - index;
            const coordinate = this._width - (deltaFromRight + 0.5) * this._barSpacing;
            points[i].x = Math.round(coordinate) as Coordinate
        }
    }

    public indexToUserTime(index: TimePointIndex): TimePoint | null {
        return this._tickMarks.indexToTime(index);
    }

    public coordinateToIndex(x: Coordinate): TimePointIndex {
        return Math.ceil(this._coordinateToFloatIndex(x)) as TimePointIndex;
    }

    public barSpacing(): number {
        return this._barSpacing;
    }

    public setBarSpacing(newBarSpacing: number): void {
        newBarSpacing = getValidBarSpacing(newBarSpacing);
        if(!this._tryToUpdateBarSpacing(newBarSpacing)) {
            return;
        }

        // do not allow scroll out of visible bars
        this._correctOffset();
    }

    public barSpacingChanged(): ISubscription<number, number> {
        return this._barSpacingChanged;
    }

    public rightOffset(): number {
        return this._rightOffset;
    }

    public setLeftEdgeFix(index: TimePointIndex): void {
        this._leftEdgeIndex = index;

        const delta = ensureNotNull<BarsRange>(this.visibleBars()).firstBar() - index;
        if(delta < 0) {
            const leftEdgeOffset = this._rightOffset - delta - 1;
            this.scrollToOffsetAnimated(leftEdgeOffset, 500);
        }
    }

    public marks(): TimeMark[] | null {
        if(this.isEmpty()) {
            return null;
        }

        if(this._timeMarksCache !== null) {
            return this._timeMarksCache;
        }

        const spacing = this._barSpacing;
        const fontSize = this._model.options().layout.fontSize;

        const maxLabelWidth = (fontSize + 4) * 5;
        const indexPerLabel = Math.round(maxLabelWidth/spacing);

        const visbileBars = ensureNotNull<BarsRange>(this.visibleBars());

        const firstBar = Math.max(visbileBars.firstBar(), visbileBars.firstBar() - indexPerLabel);
        const lastBar = Math.max(visbileBars.lastBar(), visbileBars.lastBar() - indexPerLabel);

        const items = this._tickMarks.build(spacing, maxLabelWidth);

        let targetIndex = 0;

        for(const tm of items) {
            if(!(firstBar <= tm.index && tm.index <= lastBar)) {
                continue;
            }

            const time = this._tickMarks.indexToTime(tm.index);
            if(time === null) {
                continue;
            }

            const coord = this.indexToCoordinate(tm.index);
            const label = this._formatLabel(time, tm.span);
            const span = tm.span;
            const major = false;

            if(targetIndex < this._labels.length) {
                const lbl = this._labels[targetIndex];
                lbl.coord = coord;
                lbl.label = label;
                lbl.span = span;
                lbl.major = major;
            } else {
                this._labels.push({
                    coord,
                    label,
                    span,
                    major,
                    // major: tm.label >= TimeConstants.DaySpan ? 1 : 0, // ??? there is no label in tick-marks.ts
                });
            }
            targetIndex++;
        }

        this._labels.length = targetIndex;

        this._timeMarksCache = this._labels;

        return this._labels;
    }

    public restoreDefault(): void {
        this._visibleBarsInvalidated = true;

        this.setBarSpacing(this._options.barSpacing);
        this.setRightOffset(this._options.rightOffset);
    }

    public setBaseIndex(baseIndex: TimePointIndex): void {
        this._visibleBarsInvalidated = true;
        this._baseIndexOrNull = baseIndex;
        this._correctOffset();
    }

    /**
     * Zoom in/out the scale around a `zoomPoint` on `scale` value.
     * @param zoomPoint - X coordinate of the point to apply the zoom.
     *  If `rightBarStayOnScroll` option is disabled, then will be used to restore right offset.
     * @param scale - Zoom value (in 1/10 parts of current bar spacing).
     *  Negative value means zoom out, otherwise zoom in
     */
    public zoom(zoomPoint: Coordinate, scale: number): void {
        const floatIndexAtZoomPoint = this._coordinateToFloatIndex(zoomPoint);

        const barSpacing = this.barSpacing();
        const newBarSpacing = barSpacing * scale * (barSpacing / 10);

        // zoom in/out bar spacing
        this.setBarSpacing(newBarSpacing);

        if(!this._options.rightBarStaysOnScroll) {
            // and then correct right offset to move index under zoomPoint back to its coordinate
            this.setRightOffset(this.rightOffset() + (floatIndexAtZoomPoint - this._coordinateToFloatIndex(zoomPoint)));
        }
    }
    
    public startScale(x: Coordinate): void {
        if(this._scrollStartPoint) {
            this.endScroll();
        }

        if(this._scaleStartPoint !== null || this._commonTransitionStartState !== null) {
            return;
        }

        if(this.isEmpty()) {
            return;
        }

        this._scaleStartPoint = x;
        this._saveCommonTransitionsStartState();
    }

    public scaleTo(x: Coordinate): void {
        if(this._commonTransitionStartState === null) {
            return;
        }

        const startLengthFromRight = clamp(this._width - x, 0, this._width);
        const currentLengthFromRight = clamp(this._width - ensureNotNull(this._scaleStartPoint), 0, this._width);

        if(startLengthFromRight === 0 || currentLengthFromRight === 0) {
            return;
        }

        this.setBarSpacing(
            this._commonTransitionStartState.barSpacing * startLengthFromRight / currentLengthFromRight
        );
    }

    public endScale(): void {
        if(this._scaleStartPoint === null) 
            return;

        this._scaleStartPoint = null;
        this._clearCommonTransitionsStartState();
    }

    public startScroll(x: Coordinate): void {
        if(this._scrollStartPoint !== null || this._commonTransitionStartState !== null) {
            return;
        }

        if(this.isEmpty()) {
            return;
        }

        this._scrollStartPoint = x;
        this._saveCommonTransitionsStartState();
    }

    public scrollTo(x: Coordinate): void {
        this._visibleBarsInvalidated = true;
        if(this._scrollStartPoint === null) {
            return;
        }

        const shiftInLogical = (this._scrollStartPoint - x)/ this.barSpacing();
        this._rightOffset = ensureNotNull<TransitionState>(this._commonTransitionStartState).rightOffset + shiftInLogical;

        // do not allow scroll out of visible bars
        this._correctOffset();
    }

    public endScroll(): void {
        if(this._scrollStartPoint === null) {
            return;
        }

        this._scrollStartPoint = null;
        this._clearCommonTransitionsStartState();
    }

    public scrollToRealtime(): void {
        this.scrollToOffsetAnimated(this._options.rightOffset);
    }

    public scrollToOffsetAnimated(offset: number, animationDuration: number = Constants.DefaultAnimationDuration): void {
        if(!isFinite(offset)) {
            throw new RangeError('offset is required and must be finite number');
        }

        if (!isFinite(animationDuration) || animationDuration <= 0) {
            throw new RangeError('animationDuration (optional) must be finite positive number');
        }

        const source = this._rightOffset;
        const animationStart = new Date().getTime();

        const animationFn = () => {
            const animationProgress = (new Date().getTime() - animationStart) / animationDuration;
            const finishAnimation = animationProgress >= 1;
            const rightOffset = finishAnimation ? offset : source + (offset - source) * animationProgress;
            this.setRightOffset(rightOffset);

            if(!finishAnimation) {
                setTimeout(animationFn, 20);
            }
        };

        animationFn();
    }

    public scrollStartPoint(): Coordinate | null {
        return this._scrollStartPoint;
    }

    public update(index: TimePointIndex, values: TimePoint[], marks: TickMark[]): void {
        this._visibleBarsInvalidated = true;
        if(values.length > 0) {
            // we have some time points to merge
            const oldSize = this._points.size();
            this._points.merge(index, values);

            if(this._rightOffset < 0 && (this._points.size() === oldSize + 1)) {
                this._rightOffset -= 1;
                this._visibleBarsInvalidated = true;
            }
        }

        this._tickMarks.merge(marks);
        this._correctOffset();
    }

    public visibleBarsChanged(): ISubscription {
        return this._visibleBarsChanged;
    }

    public optionsApplied(): ISubscription {
        return this._optionsApplied;
    }

    public baseIndex(): TimePointIndex {
        // null is used to known that baseIndex is not set yet
        // so in methods which should known whether it is set or not
        // we should check field `_baseIndexOrNull` instead of getter `baseIndex()`
        // see minRightOffset for example
        return this._baseIndexOrNull || 0 as TimePointIndex;
    }

    public visibleBars(): BarsRange | null {
        if(this._visibleBarsInvalidated) {
            this._visibleBarsInvalidated = false;
            this._updateVisibleBars();
        }

        return this._visibleBars;
    }

    public setVisibleRange(range: BarsRange): void {
        const len = range.lastBar() - range.firstBar();
        this._barSpacing = this._width/length;
        this._rightOffset = range.lastBar() - this.baseIndex();
        this._correctOffset();
        this._visibleBarsInvalidated = true;
        this._model.recalculateAllPanes();
        this._model.lightUpdate();
    }

    public fitContent(): void {
        const first = this._points.firstIndex();
        const last = this._points.lastIndex();

        if(first === null || last === null) {
            return;
        }

        this.setVisibleRange(new BarsRange(first - 1 as TimePointIndex, last + 1 + this._options.rightOffset as TimePointIndex));
    }

    public formatDateTime(time: TimePoint): string {
        if(this._localizationOptions.timeFormatter !== undefined) {
            return this._localizationOptions.timeFormatter(time.businessDay || time.timestamp);
        }

        return this._dateTimeFormatter.format(new Date(time.timestamp * 1000));
    }

    public fixLeftEdge(): boolean {
        return this._options.fixedLeftEdge;
    }

    private _rightOffsetForCoordinate(x: Coordinate): number {
        return (this._width + 1 - x)/this._barSpacing;
    }

    private _coordinateToFloatIndex(x: Coordinate): number {
        const deltaFromRight = this._rightOffsetForCoordinate(x);
        const baseIndex = this.baseIndex();
        const index = baseIndex + this._rightOffset - deltaFromRight;

        // javascript uses very strange rounding
        // we need rounding to avoid problems with calculation errors
        return Math.round(index * 1000000)/1000000;
    }

    private _tryToUpdateBarSpacing(newBarSpacing: number): boolean {
        const oldBarSpacing = this._barSpacing;
        if(oldBarSpacing === newBarSpacing) {
            return false;
        }

        this._visibleBarsInvalidated = true;
        this._barSpacing = newBarSpacing;
        this._barSpacingChanged.fire(oldBarSpacing, newBarSpacing);
        this._resetTimeMarksCache();

        return true;
    }

    private _correctOffset(): void {
        // block scrolling of to future
        const maxRightOffset = this._maxRightOffset();

        if(this._rightOffset > maxRightOffset) {
            this._rightOffset = maxRightOffset;
            this._visibleBarsInvalidated = true;
        }

        // block scrolling of to past
        const minRightOffset = this._minRightOffset();
        if(minRightOffset !== null && this._rightOffset < minRightOffset) {
            this._rightOffset = minRightOffset;
            this._visibleBarsInvalidated = true;
        }
    }

    private _maxRightOffset(): number {
        return (this._width / this._barSpacing) - Constants.MinVisibleBarsCount;
    }

    private _minRightOffset(): number | null {
        const firstIndex = this._points.firstIndex();
        const baseIndex = this._baseIndexOrNull;
        if(firstIndex === null || baseIndex === null) {
            return null;
        }

        if(this._leftEdgeIndex !== null) {
            const barsEstimate = this._width/this._barSpacing;
            return this._leftEdgeIndex - baseIndex + barsEstimate - 1;
        }

        return firstIndex - baseIndex - 1 + Constants.MinVisibleBarsCount;
    }


    private _updateVisibleBars(): void {
        if(this.isEmpty()) {
            this._setVisibleBars(null);
            return;
        }

        const baseIndex = this.baseIndex();
        const newBarsLength = Math.ceil(this._width/this._barSpacing) - 1;
        const rightIndex = Math.round(this._rightOffset + baseIndex) as TimePointIndex;
        const leftIndex = rightIndex - newBarsLength as TimePointIndex;

        this._setVisibleBars(new BarsRange(leftIndex, rightIndex));
    }

    private _setVisibleBars(visbileBars: BarsRange | null): void {
        if(visbileBars === null && this._visibleBars === null) {
            return;
        }

        const oldVisibleBars = this._visibleBars;
        this._visibleBars = visbileBars;

        if(this._visibleBars === null || oldVisibleBars !== null && !this._visibleBars.equals(oldVisibleBars)) {
            this._visibleBarsChanged.fire();
        }

        // TODO: reset only coords in case when this._visibleBars has not been changed
		this._resetTimeMarksCache();
    }

    private _resetTimeMarksCache(): void {
        this._timeMarksCache = null;
    }

    private _validateTickMarks(): void {
        this._resetTimeMarksCache();
        this._formattedBySpan.clear();
    }

    private _updateDateTimeFormatter(): void {
        const dateFormat = this._localizationOptions.dateFormat;

        if(this._options.timeVisible) {
            this._dateTimeFormatter = new DateTimeFormatter({
                dateFormat,
                timeFormat: this._options.secondsVisible ? '%h:%m:%s' : '%h:%m',
                dateTimeSeparator: '   ',
                locale: this._localizationOptions.locale
            });
        } else {
            this._dateTimeFormatter = new DateFormatter(dateFormat, this._localizationOptions.locale);
        }
    }

    private _clearCommonTransitionsStartState(): void {
        this._clearCommonTransitionsStartState = null;
    }

    private _saveCommonTransitionsStartState(): void {
        this._commonTransitionStartState = {
            barSpacing: this.barSpacing(),
            rightOffset: this.rightOffset()
        };
    }

    private _formatLabel(time: TimePoint, span: number): string {
        let formatter = this._formattedBySpan.get(span);
        if(formatter === undefined) {
            formatter = new LabelCache((date: Date) => {
                return this._formatLabelImpl(date, span)
            });

            this._formattedBySpan.set(span, formatter);
        }

        if(time.businessDay === undefined) {
            return formatter.format(new Date(time.timestamp * 1000));
        } else {
            return formatter.format(new Date(Date.UTC(time.businessDay.year, time.businessDay.month - 1, time.businessDay.day)));
        }
    }

    private _formatLabelImpl(d: Date, span: number): string {
        const formatOptions: Intl.DateTimeFormatOptions = {};

        const timeVisible = this._options.timeVisible;
        if (span < MarkSpanBorder.Minute && timeVisible) {
            formatOptions.hour12 = false;
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
            if (this._options.secondsVisible) {
                formatOptions.second = '2-digit';
            }
        } else if (span < MarkSpanBorder.Day && timeVisible) {
            formatOptions.hour12 = false;
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
        } else if (span < MarkSpanBorder.Week) {
            formatOptions.day = 'numeric';
        } else if (span < MarkSpanBorder.Month) {
            formatOptions.day = 'numeric';
        } else if (span < MarkSpanBorder.Year) {
            formatOptions.month = 'short';
        } else {
            formatOptions.year = 'numeric';
        }

        // from given date we should use only as UTC date or timestamp
        // but to format as locale date we can convert UTC date to local date
        const localDateFromUtc = new Date(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            d.getUTCHours(),
            d.getUTCMinutes(),
            d.getUTCSeconds(),
            d.getUTCMilliseconds()
        );

        return localDateFromUtc.toLocaleString(this._localizationOptions.locale, formatOptions);
    }
}

function getValidBarSpacing(newBarSpacing: number): number {
    if(newBarSpacing < Constants.MinBarSpacing) {
        return Constants.MinBarSpacing;
    }

    if(newBarSpacing > Constants.MaxBarSpacing) {
        return Constants.MaxBarSpacing;
    }

    return newBarSpacing;
}