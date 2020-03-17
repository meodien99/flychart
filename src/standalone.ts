import { __assign } from 'tslib';

import * as ChartsModule from './index';

// put all exports from package to window.LightweightCharts object
// tslint:disable-next-line:no-any
(window as any).Charts = ChartsModule;