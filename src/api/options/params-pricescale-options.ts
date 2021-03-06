import { PriceScaleOptions, PriceScaleMode } from "../../models/PriceScale";

 export const priceScaleOptionsDefaults: PriceScaleOptions = {
    autoScale: true,
    mode: PriceScaleMode.Normal,
    invertScale: false,
    alignLabels: true,
    position: 'right',
    borderVisible: true,
    borderColor: '#2B2B43',
    scaleMargins: {
        bottom: 0.1,
        top: 0.2,
    },
};