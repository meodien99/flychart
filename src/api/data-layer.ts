import { TimePoint, TimePointIndex } from "../models/times";
import { PlotRow, PlotValue } from "../models/plot-data";
import { Bar } from "../models/bar";
import { Series } from "../models/Series";
import { LineData } from "./iline-series-api";
import { TimedData } from "./timed-data";
import { Palette } from "../models/Palette";

export interface TickMarkPacket {
    span: number;
    time: TimePoint;
    index: TimePointIndex;
}

export interface SeriesUpdatePacket {
    update: PlotRow<Bar['time'], Bar['value']>[];
}

function newSeriesUpdatePacket(): SeriesUpdatePacket {
    return {
        update: [],
    };
}

export interface TimeScaleUpdatePacket {
    seriesUpdates: Map<Series, SeriesUpdatePacket>;
    changes: TimePoint[];
    index: TimePointIndex;
    marks: TickMarkPacket[];
}

export interface UpdatePacket {
    timeScaleUpdate: TimeScaleUpdatePacket;
}