import { DeepPartial, isString, clone, merge } from "../helpers/strict-type-checkers";
import { ChartOptions } from "../models/Chart";
import { IChartApi } from "./ichart-api";
import { ensureNotNull } from "../helpers/assertions";
import { ChartApi } from './ChartApi';
import { chartOptionsDefaults } from './options/params-chart-options';

export function createChart(container: string | HTMLElement, options?: DeepPartial<ChartOptions>): IChartApi {
    const htmlElement = ensureNotNull(
        isString(container) ? document.getElementById(container) : container
    );
    const chartOptions = (options === undefined) ?
        clone(chartOptionsDefaults) :
        merge(clone(chartOptionsDefaults), options) as ChartOptions;

        return new ChartApi(htmlElement, chartOptions);
}