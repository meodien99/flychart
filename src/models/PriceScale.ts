import { Coordinate } from "./Coordinate";
import { BarPrice, BarCoordinates, BarPrices } from "./bar";
import { BarsRange } from "./BarsRange";
import { PercentageFormatter } from "../formatters/PercentageFormatter";
import { PriceFormatter } from "../formatters/PriceFormatter";
import { LocalizationOptions } from "./localization-options";
import { Delegate } from "../helpers/delegate";
import { PriceRange } from "./PriceRange";
import { IDataSource } from "./idata-source";
import { IPriceDataSource } from "./iprice-data-source";
import { IFormatter } from "../formatters/iformatter";
import { DeepPartial, merge } from "../helpers/strict-type-checkers";
import { ensureDefined, ensure, ensureNotNull } from "../helpers/assertions";
import { ISubscription } from "../helpers/isubscription";
import { canConvertPriceRangeFromLog, convertPriceRangeFromLog, convertPriceRangeToLog, toPercent, toIndexedTo100, fromPercent, fromIndexedTo100, toLog, fromLog, toPercentRange, toIndexedTo100Range } from "./price-scale-helpers";
import { PriceDataSource } from "./PriceDataSource";
import { PriceTickMarkBuilder } from "./PriceTickMarkBuilder";
import { Series } from "./Series";
import { LayoutOptions } from "./LayoutOptions";
import { SeriesItemsIndexesRange } from "./times";

export const enum PriceScaleMode {
    Normal,
    Logarithmic,
    Percentage,
    IndexedTo100
};

export type PriceScaleState = {
    autoScale: boolean,
    isInverted: boolean,
    mode: PriceScaleMode
};

export type PriceMark = {
    coord: Coordinate,
    label: string,
};

export type PricedValue = {
    price: BarPrice,
    y: Coordinate
};

export type PriceScaleMargins = {
    top: number,
    bottom: number,
};

export type PriceAxisPosition = 'left' | 'right' | 'none';

export type PriceScaleOptions = {
    autoScale: boolean,
    mode: PriceScaleMode,
    invertScale: boolean,
    alignLabels: boolean,
    position: PriceAxisPosition,
    scaleMargins: PriceScaleMargins,
    borderVisible: boolean,
    borderColor: string
};

type RangeCache = {
    isValid: boolean,
    visibleBars: BarsRange | null
};

// actually price should be BarPrice
type PriceTransformer = (price: number, baseValue: number) => number;

const percentageFormatter = new PercentageFormatter();
const defaultPriceFormatter = new PriceFormatter(100, 1);

export class PriceScale {
    private readonly _layoutOptions: LayoutOptions;
    private readonly _localizationOptions: LocalizationOptions;
    private readonly _options: PriceScaleOptions;

    private _height: number = 0;
    private _internalHeightCache: number | null = null;
    private _internalHeightChanged: Delegate = new Delegate();

    private _priceRange: PriceRange | null = null;
    private _priceRangeSnapshot: PriceRange | null = null;
    private _priceRangeChanged: Delegate<PriceRange | null, PriceRange | null> = new Delegate();
    private _invalidatedForRange: RangeCache = {isValid: false, visibleBars: null};

    private _markBuilder: PriceTickMarkBuilder;
    private _onMarksChanged: Delegate = new Delegate();

    private _modeChanged: Delegate<PriceScaleState, PriceScaleState> = new Delegate();

    private _dataSources: IDataSource[] = [];
    private _cachedOrderedSources: IDataSource[] | null = null;
    private _sourcesForAutoScale: IPriceDataSource[] | null = null;
    private _hasSeries: boolean = false;
    private _mainSource: IPriceDataSource | null = null;

    private _marksCache: PriceMark[] | null =  null;

    private _scaleStartPoint: number | null = null;
    private _scrollStartPoint: number | null = null;
    
    private _formatter: IFormatter = defaultPriceFormatter;

    private readonly _optionsChanged: Delegate = new Delegate();

    public constructor(options: PriceScaleOptions, layoutOptions: LayoutOptions, localizationOptions: LocalizationOptions) {
        this._options = options;
        this._layoutOptions = layoutOptions;
        this._localizationOptions = localizationOptions;
        this._markBuilder = new PriceTickMarkBuilder(this, 100, this._coordinateToLogical.bind(this), this._logicalToCoordinate.bind(this));
    }

    public options(): PriceScaleOptions {
        return this._options;
    }

    public applyOptions(options: DeepPartial<PriceScaleOptions>): void {
        merge(this._options, options);

        this.updateFormatter();

        if(options.mode !== undefined) {
            this.setMode({mode: options.mode});
        }

        this._optionsChanged.fire();

        if(options.scaleMargins !== undefined) {
            const top = ensureDefined(options.scaleMargins.top);
            const bottom = ensureDefined(options.scaleMargins.bottom);

            if(top < 0 || top > 1) {
                throw new Error(`Invalid top margin - expect value between 0 and 1, given top=${top}`);
            }

            if(bottom < 0 || bottom > 1 || top + bottom > 1) {
                throw new Error(`Invalid bottom margin - expect value between 0 and 1, given bottom=${bottom}`);
            }

            if(top + bottom > 1) {
                throw new Error(`Invalid margins - sum of margings must be less than 1, given=${top + bottom}`);
            }

            this._invalidateInternalHeightCache();
            this._marksCache = null;
        }
    }

    public optionsChanged(): ISubscription {
        return this._optionsChanged;
    }

    public isAutoScale(): boolean {
        return this._options.autoScale;
    }

    public isLog(): boolean {
        return this._options.mode === PriceScaleMode.Logarithmic;
    }

    public isPercentage(): boolean {
        return this._options.mode === PriceScaleMode.Percentage;
    }

    public isIndexedTo100(): boolean {
        return this._options.mode === PriceScaleMode.IndexedTo100;
    }

    public mode(): PriceScaleState {
        return {
            autoScale: this._options.autoScale,
            isInverted: this._options.invertScale,
            mode: this._options.mode
        }
    }

    public setMode(newMode: Partial<PriceScaleState>): void {
        const oldMode = this.mode();
        let priceRange: PriceRange | null = null;

        if(newMode.autoScale !== undefined) {
            this._options.autoScale = newMode.autoScale;
        }

        if(newMode.mode !== undefined) {
            this._options.mode = newMode.mode;
            if(newMode.mode === PriceScaleMode.Percentage || newMode.mode === PriceScaleMode.IndexedTo100) {
                this._options.autoScale = true;
            }

            this._invalidatedForRange.isValid = false;
        }

        // defined which scale converted from
        if(oldMode.mode === PriceScaleMode.Logarithmic && newMode.mode !== oldMode.mode) {
            if(canConvertPriceRangeFromLog(this._priceRange)) {
                priceRange = convertPriceRangeFromLog(this._priceRange);

                if(priceRange !== null) {
                    this.setPriceRange(priceRange);
                }
            } else {
                this._options.autoScale = true;
            }
        }

        // defined which scale converted to
        if(newMode.mode === PriceScaleMode.Logarithmic && newMode.mode !== oldMode.mode) {
            priceRange = convertPriceRangeToLog(this._priceRange);

            if(priceRange !== null) {
                this.setPriceRange(priceRange);
            }
        }

        const modeChanged = oldMode.mode !== this._options.mode;
        if(modeChanged && (oldMode.mode === PriceScaleMode.Percentage || this.isPercentage())) {
            this.updateFormatter();
        }

        if(modeChanged && (oldMode.mode === PriceScaleMode.IndexedTo100 || this.isIndexedTo100())) {
            this.updateFormatter();
        }

        if(newMode.isInverted !== undefined && oldMode.isInverted !== newMode.isInverted) {
            this._options.invertScale = newMode.isInverted;
            this._onIsInvertedChanged();
        }

        this._modeChanged.fire(oldMode, this.mode());
    }

    public modeChanged(): ISubscription<PriceScaleState, PriceScaleState> {
        return this._modeChanged;
    }

    public fontSize(): number {
        return this._layoutOptions.fontSize;
    }

    public height(): number {
        return this._height;
    }

    public setHeight(value: number): void {
        if(this._height === value) {
            return;
        }

        this._height = value;
        this._invalidateInternalHeightCache();
        this._marksCache = null;
    }

    public topMargin(): number {
        return this.isInverted() ? this._options.scaleMargins.bottom : this._options.scaleMargins.top;
    }

    public bottomMargin(): number {
        return this.isInverted() ? this._options.scaleMargins.top : this._options.scaleMargins.bottom;
    }

    public internalHeight(): number { 
        if(this._internalHeightCache) {
            return this._internalHeightCache;
        }

        const rs = this.height() * (1 - this.topMargin() - this.bottomMargin());
        this._internalHeightCache = rs;

        return rs;
    }

    public internalHeightChanged(): ISubscription {
        return this._internalHeightChanged;
    }

    public priceRange(): PriceRange | null {
        this._makeSureItIsValid();

        return this._priceRange;
    }

    public priceRangeChanged(): ISubscription<PriceRange | null, PriceRange | null> {
        return this._priceRangeChanged;
    }

    public setPriceRange(newPriceRange: PriceRange | null, isForceSetValue?: boolean, onlyPriceScaleUpdate?: boolean): void {
        const oldPriceRange = this._priceRange;

        if(!isForceSetValue && !(oldPriceRange === null && newPriceRange !== null) && (oldPriceRange === null || oldPriceRange.equals(newPriceRange))) {
            return;
        }

        this._marksCache = null;
        this._priceRange = newPriceRange;

        if(!onlyPriceScaleUpdate) {
            this._priceRangeChanged.fire(oldPriceRange, newPriceRange);
        }
    }

    public isEmpty(): boolean {
        this._makeSureItIsValid();
        return this._height === 0 || !this._priceRange || this._priceRange.isEmpty();
    }

    public invertedCoordinate(coordinate: number): number {
        return this.isInverted() ? coordinate : this.height() - 1 - coordinate;
    }

    public priceToCoordinate(price: number, baseValue: number, keepItFloat?: boolean): Coordinate {
        if(this.isPercentage()) {
            price = toPercent(price, baseValue);
        } else if(this.isIndexedTo100()) {
            price = toIndexedTo100(price, baseValue);
        }

        return this._logicalToCoordinate(price, baseValue, keepItFloat);
    }

    public pointsArrayToCoordinates<T extends PricedValue>(points: T[], baseValue: number, visibleRange?: SeriesItemsIndexesRange): void {
        this._makeSureItIsValid();

        const bh = this.bottomMargin() * this.height();
        const range = ensureNotNull<PriceRange>(this.priceRange());
        const min = range.minValue();
        const max = range.maxValue();
        const ih = (this.internalHeight() - 1);
        const isInverted = this.isInverted();

        const hmm = ih/(max - min);

        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? points.length : visibleRange.to;

        const transformFn = this._getCoordinateTransformer();

        for(let i = fromIndex; i < toIndex; i++) {
            const point = points[i];
            const price = point.price;

            if(isNaN(price))
                continue;

            let logical = price;
            if(transformFn !== null) {
                logical = transformFn(point.price, baseValue) as BarPrice;
            }

            const invCoordinate = bh + hmm + (logical - min);
            const coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            point.y = Math.round(coordinate) as Coordinate;
        }
    }

    public barPricesToCoordinates<T extends BarPrices & BarCoordinates>(pricesList: T[], baseValue: number, visibleRange?: SeriesItemsIndexedRange): void {
        this._makeSureItIsValid();

        const bh = this.bottomMargin() * this.height();

        const range = ensureNotNull<PriceRange>(this.priceRange());
        const min = range.minValue();
        const max = range.maxValue();
        const ih = (this.internalHeight() - 1);
        const isInverted = this.isInverted();

        const hmm = ih / (max - min);

        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? pricesList.length : visibleRange.to;

        const transformFn = this._getCoordinateTransformer();

        for(let i = fromIndex; i < toIndex; i++) {
            const bar = pricesList[i];

            let openLogical = bar.open;
            let highLogical = bar.high;
            let lowLogical = bar.low;
            let closeLogical = bar.close;

            if(transformFn !== null) {
                openLogical = transformFn(bar.open, baseValue) as BarPrice;
                highLogical = transformFn(bar.high, baseValue) as BarPrice;
                lowLogical = transformFn(bar.low, baseValue) as BarPrice;
                closeLogical = transformFn(bar.close, baseValue) as BarPrice;
            }

            let invCoordinate = bh + hmm * ((openLogical as any) - min);
            let coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.openY = Math.round(coordinate) as Coordinate;

            invCoordinate = bh + hmm * ((highLogical as any) - min);
            coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.highY = Math.round(coordinate) as Coordinate;

            invCoordinate = bh + hmm * ((lowLogical as any) - min);
            coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.lowY = Math.round(coordinate) as Coordinate;

            invCoordinate = bh + hmm * ((closeLogical as any) - min);
            coordinate = isInverted ? invCoordinate : this._height - 1 - invCoordinate;
            bar.closeY = Math.round(coordinate) as Coordinate;
        }
    }

    public coordinateToPrice(coordinate: Coordinate, baseValue: number): BarPrice {
        const logical = this._coordinateToLogical(coordinate, baseValue);
        return this.logicalToPrice(logical, baseValue);
    }

    public logicalToPrice(logical: number, baseValue: number): BarPrice {
        let value = logical;
        if(this.isPercentage()) {
            value = fromPercent(value, baseValue);
        } else if(this.isIndexedTo100()) {
            value = fromIndexedTo100(value, baseValue);
        }

        return value as BarPrice;
    }

    public dataSources(): ReadonlyArray<IDataSource> {
        return this._dataSources;
    }

    public orderedSources(): ReadonlyArray<IDataSource> {
        if(this._cachedOrderedSources) {
            return this._cachedOrderedSources;
        }

        let sources: IDataSource[] = [];

        for(let i = 0; i < this._dataSources.length; i++) {
            const ds = this._dataSources[i];
            if(ds.zorder() === null) {
                ds.setZorder(i + 1);
            }

            sources.push(ds);
        }

        sources = sortSources(sources);
        this._cachedOrderedSources = sources;

        return this._cachedOrderedSources;
    }

    public hasSeries(): boolean {
        return this._hasSeries;
    }

    public addDataSource(source: IDataSource): void {
        if(this._dataSources.indexOf(source) !== -1) {
            return;
        }

        if((source instanceof Series)) {
            this._hasSeries = true;
        }

        this._dataSources.push(source);
        this._mainSource = null;
        this._sourcesForAutoScale = null;

        this.updateFormatter();
        this.invalidateSourcesCache();
    }

    public removeDataSource(source: IDataSource): void {
        const index = this._dataSources.indexOf(source);
        if(index === -1) {
            throw new Error('source is not attached to scale');
        }

        this._dataSources.splice(index, 1);
        if(source instanceof Series) {
            this._hasSeries = false;
        }

        if(!this.mainSource()) {
            this.setMode({
                autoScale: true
            });
        }

        this._mainSource = null;
        this._sourcesForAutoScale = null;
        this.updateFormatter();
        this.invalidateSourcesCache();
    }

    public mainSource(): IPriceDataSource | null {
        if(this._mainSource !== null) {
            return this._mainSource;
        }

        let priceSource: IPriceDataSource | null = null;

        for(let i = 0; i < this._dataSources.length; i++) {
            const source = this._dataSources[i];
            if(source instanceof Series) {
                priceSource = source;
            }

            if((priceSource === null) && (source instanceof PriceDataSource)) {
                priceSource = source;
            }
        }

        this._mainSource = priceSource;
        return this._mainSource;
    }

    public isInverted(): boolean {
        return this._options.invertScale;
    }

    public marks(): PriceMark[] {
        if(this._marksCache)
            return this._marksCache;

        this._markBuilder.rebuildTickMarks();
        this._marksCache = this._markBuilder.marks();
        this._onMarksChanged.fire();

        return this._marksCache;
    }

    public onMarksChanged(): ISubscription {
        return this._onMarksChanged;
    }

    public startScale(x: number): void {
        if(this.isPercentage() || this.isIndexedTo100()) {
            return;
        }

        if(this._scaleStartPoint !== null || this._priceRangeSnapshot !== null) {
            return;
        }

        if(this.isEmpty()) {
            return;
        }

        // invert x
        this._scaleStartPoint = this._height - x;
        this._priceRangeSnapshot = ensureNotNull<PriceRange>(this.priceRange()).clone();
    }

    public scaleTo(x: number): void {
        if(this.isPercentage() || this.isIndexedTo100()) {
            return;
        }

        if(this._scaleStartPoint === null) {
            return;
        }

        this.setMode({
            autoScale: false
        });

        // invert x
        x = this._height - x;

        if(x < 0) {
            x = 0;
        }

        let scaleCoeff = (this._scaleStartPoint + (this._height - 1) * 0.2) / (x + (this._height - 1) * 0.2);
        const newPriceRange = ensureNotNull<PriceRange>(this._priceRangeSnapshot).clone();

        scaleCoeff = Math.max(scaleCoeff, 0.1);
        newPriceRange.scaleArroundCenter(scaleCoeff);
        this.setPriceRange(newPriceRange);
    }

    public endScale(): void {
        if(this.isPercentage() || this.isIndexedTo100()) {
            return;
        }

        this._scaleStartPoint = null;
        this._priceRangeSnapshot = null;
    }

    public startScroll(x: number): void {
        if(this.isAutoScale()) {
            return;
        }

        if(this._scrollStartPoint !== null || this._priceRangeSnapshot !== null) {
            return;
        }

        if(this.isEmpty()) {
            return;
        }

        this._scrollStartPoint = x;
        this._priceRangeSnapshot = ensureNotNull<PriceRange>(this.priceRange()).clone();
    }

    public scrollTo(x: number): void {
        if(this.isAutoScale()) {
            return;
        } 

        if(this._scrollStartPoint === null) {
            return;
        }

        const priceUnitsPerPixel = ensureNotNull<PriceRange>(this.priceRange()).length() / (this.height() - 1);
        let pixelDelta = x - this._scrollStartPoint;

        if(this.isInverted()) {
            pixelDelta *= -1;
        }

        const priceDelta = pixelDelta * priceUnitsPerPixel;
        const newPriceRange = ensureNotNull<PriceRange>(this._priceRangeSnapshot).clone();

        newPriceRange.shift(priceDelta);
        this.setPriceRange(newPriceRange, true);
        this._marksCache = null;
    }

    public endScroll(): void {
        if(this.isAutoScale()) {
            return;
        }

        if(this._scrollStartPoint === null) {
            return;
        }

        this._scrollStartPoint = null;
        this._priceRangeSnapshot = null;
    }

    public formatter(): IFormatter {
        if(!this._formatter) {
            this.updateFormatter();
        }

        return this._formatter;
    }

    public formatPrice(price: number, firstValue: number): string {
        switch(this._options.mode) {
            case PriceScaleMode.Percentage: {
                return this.formatter().format(toPercent(price, firstValue));
            }
            case PriceScaleMode.IndexedTo100: {
                return this.formatter().format(toIndexedTo100(price, firstValue));
            }
            default: {
                return this._formatPrice(price as BarPrice);
            }
        }
    }

    public formatLogical(logical: number): string {
        switch(this._options.mode) {
            case PriceScaleMode.Percentage:
            case PriceScaleMode.IndexedTo100: {
                return this.formatter().format(logical);
            }
            default: {
                return this._formatPrice(logical as BarPrice);
            }
        }
    }

    public formatPriceAbsolute(price: number): string {
        return this._formatPrice(price as BarPrice, this._mainSourceFormatter());
    }

    public formatPricePercentage(price: number, baseValue: number): string {
        price = toPercent(price, baseValue);
        return percentageFormatter.format(price);
    }

    public sourcesForAutoScale(): ReadonlyArray<IPriceDataSource> {
        if(this._sourcesForAutoScale === null) {
            this._recalculateSourcesForAutoScale();
        }

        return ensureNotNull<IPriceDataSource[]>(this._sourcesForAutoScale);
    }

    public recalculatePriceRange(visibleBars: BarsRange): void {
        this._invalidatedForRange = {
            visibleBars: visibleBars,
            isValid: false
        };
    }

    public updateAllViews(): void {
        this._dataSources.forEach((s: IDataSource) => s.updateAllViews());
    }

    public updateFormatter(): void {
        this._marksCache = null;
        const mainSource = this.mainSource();

        let base = 100;
        if(mainSource !== null) {
            base = mainSource.base();
        }

        this._formatter = defaultPriceFormatter;

        if(this.isPercentage()) {
            this._formatter = percentageFormatter;
            base = 100;
        } else if(this.isIndexedTo100()) {
            this._formatter = new PriceFormatter(100, 1);
            base = 100;
        } else {
            if(mainSource !== null) {
                // user
                this._formatter = mainSource.formatter();
            }
        }

        this._markBuilder = new PriceTickMarkBuilder(
            this, 
            base,
            this._coordinateToLogical.bind(this),
            this._logicalToCoordinate.bind(this)
        );

        this._markBuilder.rebuildTickMarks();
    }

    public invalidateSourcesCache(): void {
        this._cachedOrderedSources = null;
    }

    private _makeSureItIsValid(): void {
        if(!this._invalidatedForRange.isValid) {
            this._invalidatedForRange.isValid = true;
            this._recalculatePriceRangeImpl();
        }
    }

    private _invalidateInternalHeightCache(): void {
        this._internalHeightCache = null;
        this._internalHeightChanged.fire();
    }

    private _logicalToCoordinate(logical: number, baseValue: number, keepItFloat?: boolean): Coordinate {
        this._makeSureItIsValid();

        if(this.isEmpty()) {
            return 0 as Coordinate;
        }

        logical = this.isLog() && logical ? toLog(logical) : logical;

        const range = ensureNotNull<PriceRange>(this.priceRange());
        const invCoordinate = this.bottomMargin() * this.height() + (this.internalHeight() - 1) * (logical - range.minValue())/range.length();
        const coordinate = this.invertedCoordinate(invCoordinate);

        if(keepItFloat) {
            return coordinate as Coordinate;
        }

        return Math.round(coordinate) as Coordinate;
    }

    private _coordinateToLogical(coordinate: number, baseValue: number): number {
        this._makeSureItIsValid();

        if(this.isEmpty()) {
            return 0;
        }

        const invCoordinate = this.invertedCoordinate(coordinate);
        const range = ensureNotNull<PriceRange>(this.priceRange());
        const logical = range.minValue() + range.length() * ((invCoordinate - this.bottomMargin() * this.height())/(this.internalHeight() - 1));

        return this.isLog() ? fromLog(logical) : logical;
    }

    private _onIsInvertedChanged(): void {
        this._marksCache = null;
        this._markBuilder.rebuildTickMarks();
    }

    private _mainSourceFormatter(): IFormatter {
        const mainSource = ensureNotNull<IPriceDataSource>(this.mainSource());
        return mainSource.formatter();
    }

    private _recalculateSourcesForAutoScale(): void {
        function useSourceForAutoScale(source: IDataSource): source is IPriceDataSource {
            if(!(source.isVisible() || source instanceof Series)) {
                return false;
            }

            return source instanceof PriceDataSource;
        }

        this._sourcesForAutoScale = this._dataSources.filter(useSourceForAutoScale);
    }

    private _recalculatePriceRangeImpl(): void {
        const visibleBars = this._invalidatedForRange.visibleBars;
        if(visibleBars === null) {
            return;
        }

        let priceRange: PriceRange | null = null;
        const sources = this.sourcesForAutoScale();

        for(let i = 0; i < sources.length; i++) {
            const source = sources[i];
            if(!source.isVisible()) {
                continue;
            }

            const firstValue = source.firstValue();
            if(firstValue === null) {
                continue;
            }

            const startBar = visibleBars.firstBar();
            const endBar = visibleBars.lastBar();
            let sourceRange = source.priceRange(startBar, endBar);

            if(sourceRange !== null) {
                switch(this._options.mode) {
                    case PriceScaleMode.Logarithmic: {
                        sourceRange = convertPriceRangeToLog(sourceRange);
                        break;
                    }
                    case PriceScaleMode.Percentage: {
                        sourceRange = toPercentRange(sourceRange, firstValue);
                        break;
                    }
                    case PriceScaleMode.IndexedTo100: {
                        sourceRange = toIndexedTo100Range(sourceRange, firstValue);
                        break;
                    }
                }

                if(priceRange === null) {
                    priceRange = sourceRange;
                } else {
                    priceRange = priceRange.merge(ensureNotNull(sourceRange));
                }
            }
        }

        if(priceRange) {
            // keep current range is new empty
            if(priceRange.minValue() === priceRange.maxValue()) {
                priceRange = new PriceRange(priceRange.minValue() - 0.5, priceRange.maxValue() + 0.5);
            }

            this.setPriceRange(priceRange);
        } else {
            // reset empty to default
            if(this._priceRange === null) {
                this.setPriceRange(new PriceRange(-0.5, .5));
            }
        }

        this._invalidatedForRange.isValid = true;
    }

    private _getCoordinateTransformer(): PriceTransformer | null {
        if(this.isPercentage()) {
            return toPercent;
        } else if(this.isIndexedTo100()) {
            return toIndexedTo100;
        } else if(this.isLog()) {
            return toLog;
        }

        return null;
    }

    private _formatPrice(price: BarPrice, fallbackFormatter?: IFormatter): string {
        if(this._localizationOptions.priceFormatter === undefined) {
            if(fallbackFormatter === undefined) {
                fallbackFormatter = this.formatter();
            }

            return fallbackFormatter.format(price);
        }

        return this._localizationOptions.priceFormatter(price);
    }
}

export function sortSources(sources: ReadonlyArray<IDataSource>): IDataSource[] {
    return sources.slice().sort((s1: IDataSource, s2: IDataSource) => {
        return (ensureNotNull(s1.zorder()) - ensureNotNull(s2.zorder()));
    });
}