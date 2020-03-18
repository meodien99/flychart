import { assert, ensureNotNull } from "../helpers/assertions";
import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { ISubscription } from '../helpers/isubscription';
import { DeepPartial, merge } from '../helpers/strict-type-checkers'
import { PriceAxisViewRendererOptions } from '../renderers/iprice-axis-view-renderer';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';

import { InvalidateMask, InvalidateLevel } from './InvalidateMask';
import { WatermarkOptions, Watermark } from "./Watermark";
import { LayoutOptions } from "./LayoutOptions";
import { PriceScaleOptions, PriceScaleMargins, PriceScale } from "./PriceScale";
import { TimeScaleOptions, TimeScale } from "./TimeScale";
import { CrossHairOptions, CrossHair } from "./CrossHair";
import { Point } from './Point';
import { LocalizationOptions } from "./localization-options";
import { Series } from "./Series";
import { IDataSource } from "./idata-source";
import { TimePointIndex, TimePoint, TickMark } from "./time-data";
import { DEFAULT_STRETCH_FACTOR, Pane } from "./Pane";
import { Magnet } from "./Magnet";
import { Grid, GridOptions } from "./Grid";
import { SeriesOptions, SeriesType } from "./SeriesOptions";
import { Coordinate } from "./Coordinate";
import { IPriceDataSource } from "./iprice-data-source";

export interface HandleScrollOptions {
    mouseWheel: boolean;
    pressedMouseMove: boolean;
}

export interface HandleScaleOptions {
    mouseWheel: boolean;
    pinch: boolean;
    axisPressedMouseMove: boolean;
}

type InvalidateHandler = (mask: InvalidateMask) => void;

export interface ChartOptions {
    width: number;
    height: number;
    watermark: WatermarkOptions;
    layout: LayoutOptions;
    priceScale: PriceScaleOptions;
    timeScale: TimeScaleOptions;
    crossHair: CrossHairOptions;
    grid: GridOptions;
    localization: LocalizationOptions;
    handleScroll: HandleScrollOptions;
    handleScale: HandleScaleOptions;
}

export class ChartModel implements IDestroyable {
    private readonly _options: ChartOptions;
    private readonly _invalidateHandler: InvalidateHandler;

    private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;

    private readonly _timeScale: TimeScale;
    private readonly _panes: Pane[] = [];
    private readonly _grid: Grid;
    private readonly _crossHair: CrossHair;
    private readonly _magnet: Magnet;
    private readonly _watermark: Watermark;

    private _serieses: Series[] = [];

    private _width: number = 0;
    private _initialTimeScrollPos: number | null = null;
    private _hoveredSource: IDataSource | null = null;
    private readonly _mainPriceScaleOptionsChanged: Delegate = new Delegate();
    private _crossHairMoved: Delegate<TimePointIndex | null, Point | null> = new Delegate();

    public constructor(invalidateHandler: InvalidateHandler, options: ChartOptions) {
        this._invalidateHandler = invalidateHandler;
        this._options = options;

        this._rendererOptionsProvider = new PriceAxisRendererOptionsProvider(this);

        this._timeScale = new TimeScale(this, options.timeScale, this._options.localization);
        this._grid = new Grid();
        this._crossHair = new CrossHair(this, options.crossHair);
        this._magnet = new Magnet(options.crossHair);
        this._watermark = new Watermark(this, options.watermark);

        this.createPane();
        this._panes[0].setStretchFactor(DEFAULT_STRETCH_FACTOR * 2);
        this._panes[0].addDataSource(this._watermark, true, false);
    }

    public updatePane(pane: Pane): void {
        const inv = this._paneInvalidationMask(pane, InvalidateLevel.None);
        this._invalidate(inv);
    }

    public fullUpdate(): void {
        this._invalidate(new InvalidateMask(InvalidateLevel.Full));
    }

    public lightUpdate(): void {
        this._invalidate(new InvalidateMask(InvalidateLevel.Light));
    }

    public updateSource(source: IDataSource): void {
        const inv = this._invalidationMaskForSource(source);
        this._invalidate(inv);
    }

    public hoveredSource(): IDataSource | null {
        return this._hoveredSource;
    }

    public setHoveredSource(source: IDataSource | null): void {
        this._hoveredSource = source;
    }

    public options(): ChartOptions {
        return this._options;
    }

    public applyOptions(options: DeepPartial<ChartOptions>): void {
        // TODO: implement this
        merge(this._options, options);
        if (options.priceScale !== undefined) {
            this.mainPriceScale().applyOptions(options.priceScale);
            this._mainPriceScaleOptionsChanged.fire();
        }

        if (options.timeScale !== undefined) {
            this._timeScale.applyOptions(options.timeScale);
        }

        if (options.localization !== undefined) {
            this._timeScale.applyLocalizationOptions(options.localization);
            this.mainPriceScale().updateFormatter();
        }

        this.fullUpdate();
    }

    public updateAllPaneViews(): void {
        this._panes.forEach((p: Pane) => p.updateAllViews());
    }

    public timeScale(): TimeScale {
        return this._timeScale;
    }

    public panes(): Pane[] {
        return this._panes;
    }

    public gridSource(): Grid {
        return this._grid;
    }

    public watermarkSource(): Watermark | null {
        return this._watermark;
    }

    public crossHairSource(): CrossHair {
        return this._crossHair;
    }

    public crossHairMoved(): ISubscription<TimePointIndex | null, Point | null> {
        return this._crossHairMoved;
    }

    public width(): number {
        return this._width;
    }

    public setPaneHeight(pane: Pane, height: number): void {
        pane.setHeight(height);
        this.recalculateAllPanes();
        this.lightUpdate();
    }

    public setWidth(width: number): void {
        this._width = width;
        this._timeScale.setWidth(this._width);
        this._panes.forEach((pane: Pane) => pane.setWidth(width));
        this.recalculateAllPanes();
    }

    public createPane(index?: number): Pane {
        const pane = new Pane(this._timeScale, this);

        if (index !== undefined) {
            this._panes.splice(index, 0, pane);
        } else {
            // adding to the end - common case
            this._panes.push(pane);
        }

        const actualIndex = (index === undefined) ? this._panes.length - 1 : index;

        // we always do autoscaling on the creation
        // if autoscale option is true, it is ok, just recalculate by invalidation mask
        // if autoscale option is false, autoscale anyway on the first draw
        // also there is a scenario when autoscale is true in constructor and false later on applyOptions
        const mask = new InvalidateMask(InvalidateLevel.None);
        mask.invalidatePane(actualIndex, {
            level: InvalidateLevel.None,
            autoScale: true,
        });
        this.invalidate(mask);

        return pane;
    }

    public startScalePrice(pane: Pane, priceScale: PriceScale, x: number): void {
        pane.startScalePrice(priceScale, x);
    }

    public scalePriceTo(pane: Pane, priceScale: PriceScale, x: number): void {
        pane.scalePriceTo(priceScale, x);
        this._invalidate(this._paneInvalidationMask(pane, InvalidateLevel.Light));
    }

    public endScalePrice(pane: Pane, priceScale: PriceScale): void {
        pane.endScalePrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, InvalidateLevel.Light));
    }

    public startScrollPrice(pane: Pane, priceScale: PriceScale, x: number): void {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.startScrollPrice(priceScale, x);
    }

    public scrollPriceTo(pane: Pane, priceScale: PriceScale, x: number): void {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.scrollPriceTo(priceScale, x);
        this._invalidate(this._paneInvalidationMask(pane, InvalidateLevel.Light));
    }

    public endScrollPrice(pane: Pane, priceScale: PriceScale): void {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.endScrollPrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, InvalidateLevel.Light));
    }

    public setPriceAutoScale(pane: Pane, priceScale: PriceScale, autoScale: boolean): void {
        pane.setPriceAutoScale(priceScale, autoScale);
        this._invalidate(this._paneInvalidationMask(pane, InvalidateLevel.Light));
    }

    public resetPriceScale(pane: Pane, priceScale: PriceScale): void {
        pane.resetPriceScale(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, InvalidateLevel.Light));
    }

    public startScaleTime(position: Coordinate): void {
        this._timeScale.startScale(position);
    }

	/**
	 * Zoom in/out the chart (depends on scale value).
	 * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
	 * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
	 */
    public zoomTime(pointX: Coordinate, scale: number): void {
        const timeScale = this.timeScale();
        if (timeScale.isEmpty() || scale === 0) {
            return;
        }

        const timeScaleWidth = timeScale.width();
        pointX = Math.max(1, Math.min(pointX, timeScaleWidth)) as Coordinate;

        timeScale.zoom(pointX, scale);

        this.updateCrossHair();
        this.recalculateAllPanes();
        this.lightUpdate();
    }

    public scrollChart(x: Coordinate): void {
        this.startScrollTime(0 as Coordinate);
        this.scrollTimeTo(x);
        this.endScrollTime();
    }

    public scaleTimeTo(x: Coordinate): void {
        this._timeScale.scaleTo(x);
        this.recalculateAllPanes();
        this.lightUpdate();
    }

    public endScaleTime(): void {
        this._timeScale.endScale();
        this.lightUpdate();
    }

    public startScrollTime(x: Coordinate): void {
        this._initialTimeScrollPos = x;
        this._timeScale.startScroll(x);
    }

    public scrollTimeTo(x: Coordinate): boolean {
        let res = false;
        if (this._initialTimeScrollPos !== null && Math.abs(x - this._initialTimeScrollPos) > 20) {
            this._initialTimeScrollPos = null;
            res = true;
        }

        this._timeScale.scrollTo(x);
        this.recalculateAllPanes();
        this.updateCrossHair();
        this.lightUpdate();
        return res;
    }

    public endScrollTime(): void {
        this._timeScale.endScroll();
        this.lightUpdate();

        this._initialTimeScrollPos = null;
    }

    public resetTimeScale(): void {
        this._timeScale.restoreDefault();
        this.recalculateAllPanes();
        this.updateCrossHair();
        this.lightUpdate();
    }

    public invalidate(mask: InvalidateMask): void {
        if (this._invalidateHandler) {
            this._invalidateHandler(mask);
        }

        this._grid.invalidate();
        this.lightUpdate();
    }

    public dataSources(): ReadonlyArray<IDataSource> {
        return this._panes.reduce((arr: IDataSource[], pane: Pane) => arr.concat(pane.dataSources()), []);
    }

    public serieses(): ReadonlyArray<Series> {
        return this._serieses;
    }

    public setAndSaveCurrentPosition(x: Coordinate, y: Coordinate, pane: Pane): void {
        this._crossHair.saveOriginCoord(x, y);
        let price = NaN;
        const index = this._timeScale.coordinateToIndex(x);

        const mainSource = pane.mainDataSource();
        if (mainSource !== null) {
            const priceScale = pane.defaultPriceScale();
            if (!priceScale.isEmpty()) {
                const firstValue = ensureNotNull(mainSource.firstValue());
                price = priceScale.coordinateToPrice(y, firstValue);
            }
            price = this._magnet.align(price, index, pane);
        }

        this._crossHair.setPosition(index, price, pane);

        this._cursorUpdate();
        this._crossHairMoved.fire(this._crossHair.appliedIndex(), { x, y });
    }

    public clearCurrentPosition(): void {
        const crossHair = this.crossHairSource();
        crossHair.clearPosition();
        this._cursorUpdate();
        this._crossHairMoved.fire(null, null);
    }

    public updateCrossHair(): void {
        // rapply magnet
        const pane = this._crossHair.pane();
        if (pane !== null) {
            const x = this._crossHair.originCoordX();
            const y = this._crossHair.originCoordY();
            this.setAndSaveCurrentPosition(x, y, pane);
        }
    }

    public updateTimeScale(index: TimePointIndex, values: TimePoint[], marks: TickMark[], clearFlag: boolean): void {
        if (clearFlag) {
            // refresh timescale
            this._timeScale.reset();
        }

        this._timeScale.update(index, values, marks);
    }

    public updateTimeScaleBaseIndex(earliestRowIndex?: TimePointIndex): void {
        // get the latest series bar index
        const lastSeriesBarIndex = this._serieses.reduce(
            (currentRes: TimePointIndex | undefined, series: Series) => {
                const seriesBars = series.bars();
                if (seriesBars.isEmpty()) {
                    return currentRes;
                }
                const currentLastIndex = ensureNotNull(seriesBars.lastIndex());
                return (currentRes === undefined) ? currentLastIndex : Math.max(currentLastIndex, currentRes) as TimePointIndex;
            },
            undefined);

        if (lastSeriesBarIndex !== undefined) {
            const timeScale = this._timeScale;
            const currentBaseIndex = timeScale.baseIndex();

            const visibleBars = timeScale.visibleBars();

            // if time scale cannot return current visible bars range (e.g. time scale has zero-width)
            // then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
            // (and actually we cannot)
            if (visibleBars !== null) {
                const isLastSeriesBarVisible = visibleBars.contains(currentBaseIndex);

                if (earliestRowIndex !== undefined && earliestRowIndex > 0 && !isLastSeriesBarVisible) {
                    const compensationShift = lastSeriesBarIndex - currentBaseIndex;

                    timeScale.setRightOffset(timeScale.rightOffset() - compensationShift);
                }
            }

            timeScale.setBaseIndex(lastSeriesBarIndex);
        }

        this.updateCrossHair();
        this.recalculateAllPanes();
        this.lightUpdate();
    }

    public recalculatePane(pane: Pane | null): void {
        if (pane !== null) {
            pane.recalculate();
        }
    }

    public paneForSource(source: IDataSource): Pane | null {
        const pane = this._panes.find((p: Pane) => p.orderedSources().includes(source));
        return pane === undefined ? null : pane;
    }

    public recalculateAllPanes(): void {
        this._panes.forEach((p: Pane) => p.recalculate());
        this.updateAllPaneViews();
    }

    public destroy(): void {
        this._panes.forEach((p: Pane) => p.destroy());
        this._panes.length = 0;

        // to avoid memleaks
        this._options.localization.priceFormatter = undefined;
        this._options.localization.timeFormatter = undefined;
    }

    public setPriceAutoScaleForAllMainSources(): void {
        this._panes.map((p: Pane) => p.mainDataSource())
            .forEach((s: IPriceDataSource | null) => {
                if (s !== null) {
                    const priceScale = ensureNotNull<PriceScale>(s.priceScale());
                    priceScale.setMode({
                        autoScale: true,
                    });
                }
            });
    }

    public rendererOptionsProvider(): PriceAxisRendererOptionsProvider {
        return this._rendererOptionsProvider;
    }

    public priceAxisRendererOptions(): PriceAxisViewRendererOptions {
        return this._rendererOptionsProvider.options();
    }

    public mainPriceScaleOptionsChanged(): ISubscription {
        return this._mainPriceScaleOptionsChanged;
    }

    public mainPriceScale(): PriceScale {
        return this._panes[0].defaultPriceScale();
    }

    public createSeries(seriesType: SeriesType, options: SeriesOptions, overlay: boolean, title?: string, scaleMargins?: Partial<PriceScaleMargins>): Series {
        const pane = this._panes[0];
        const series = this._createSeries(options, seriesType, pane, overlay, title, scaleMargins);
        this._serieses.push(series);
        this.lightUpdate();
        return series;
    }

    public removeSeries(series: Series): void {
        const pane = this.paneForSource(series);

        const seriesIndex = this._serieses.indexOf(series);
        assert(seriesIndex !== -1, 'Series not found');

        this._serieses.splice(seriesIndex, 1);
        ensureNotNull<Pane>(pane).removeDataSource(series);
        if (series.destroy) {
            series.destroy();
        }
    }

    public fitContent(): void {
        const mask = new InvalidateMask(InvalidateLevel.Light);
        mask.setFitContent();
        this._invalidate(mask);
    }

    private _paneInvalidationMask(pane: Pane | null, level: InvalidateLevel): InvalidateMask {
        const inv = new InvalidateMask(level);
        if (pane !== null) {
            const index = this._panes.indexOf(pane);
            inv.invalidatePane(index, {
                level,
            });
        }
        return inv;
    }

    private _invalidationMaskForSource(source: IDataSource, invalidateType?: InvalidateLevel): InvalidateMask {
        if (invalidateType === undefined) {
            invalidateType = InvalidateLevel.Light;
        }

        return this._paneInvalidationMask(this.paneForSource(source), invalidateType);
    }

    private _invalidate(mask: InvalidateMask): void {
        if (this._invalidateHandler) {
            this._invalidateHandler(mask);
        }

        this._grid.invalidate();
    }

    private _cursorUpdate(): void {
        this._invalidate(new InvalidateMask(InvalidateLevel.Cursor));
    }

    private _createSeries(options: SeriesOptions, seriesType: SeriesType, pane: Pane, overlay: boolean, title?: string, scaleMargins?: Partial<PriceScaleMargins>): Series {
        const series = new Series(this, options, seriesType, title || '');

        pane.addDataSource(series, overlay, false);

        if (overlay && scaleMargins !== undefined) {
            series.priceScale().applyOptions({
                scaleMargins,
            });
        }
        return series;
    }
}
