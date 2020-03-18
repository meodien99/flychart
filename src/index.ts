export { LineStyle, LineType, LineWidth } from './renderers/draw-line-renderer';

export { CrossHairMode } from './models/CrossHair';
export { Bar } from './models/bar';
export { PriceScaleMode } from './models/PriceScale';
export { UTCTimestamp } from './models/time-data';

export { IChartApi, MouseEventParams } from './api/ichart-api';
export { BarData } from './api/ibar-series-api-base';
export { HistogramData } from './api/ihistogram-series-api';
export { LineData } from './api/iline-series-api';
export { ISeriesApi } from './api/iseries-api';

export { isBusinessDay, isUTCTimestamp } from './api/timed-data';
export { createChart } from './api/create-chart';

export function version(): string {
    return '<@VERSION@>';
}