import { ChartOptions } from '../../models/Chart';
import { layoutOptionsDefaults } from './params-layout-options';
import { crossHairOptionsDefaults } from './params-crosshair-options';
import { gridOptionsDefaults } from './params-grid-options';
import { priceScaleOptionsDefaults } from './params-pricescale-options';
import { timeScaleOptionsDefaults } from './params-timescale-options';
import { watermarkOptionsDefaults } from './params-watermark-options';

 export const chartOptionsDefaults: ChartOptions = {
    width: 0,
    height: 0,
    layout: layoutOptionsDefaults,
    crossHair: crossHairOptionsDefaults,
    grid: gridOptionsDefaults,
    priceScale: priceScaleOptionsDefaults,
    timeScale: timeScaleOptionsDefaults,
    watermark: watermarkOptionsDefaults,
    localization: {
        locale: navigator.language,
        dateFormat: 'dd MMM \'yy',
    },
    handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
    },
    handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
    },
};