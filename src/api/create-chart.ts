import { DeepPartial, isString, clone, merge } from "../helpers/strict-type-checkers";
import { ChartOptions } from "../models/Chart";
import { IChartApi } from "./ichart-api";
import { ensureNotNull } from "../helpers/assertions";
import { ChartApi } from './ChartApi';
import { chartOptionsDefaults } from './options/params-chart-options';

export { LineStyle, LineType, LineWidth } from '../renderers/draw-line-renderer';

export { BarPrice } from '../models/bar';
export { CrossHairMode } from '../models/CrossHair';
export { PriceScaleMode } from '../models/PriceScale';
export { UTCTimestamp } from '../models/time-data';

export { BarData } from './ibar-series-api-base';
export { IChartApi, MouseEventParams } from './ichart-api';
export { HistogramData } from './ihistogram-series-api';
export { LineData } from './iline-series-api';
export { ISeriesApi } from './iseries-api';

export { isBusinessDay, isUTCTimestamp } from './timed-data';

export function createChart(container: string | HTMLElement, options?: DeepPartial<ChartOptions>): IChartApi {
    const htmlElement = ensureNotNull(
        isString(container) ? document.getElementById(container) : container
    );
    const chartOptions = (options === undefined) ?
        clone(chartOptionsDefaults) :
        merge(clone(chartOptionsDefaults), options) as ChartOptions;

    return new ChartApi(htmlElement, chartOptions);
}