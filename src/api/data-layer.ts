import { PlotRow } from "../models/plot-data";
import { Bar } from "../models/bar";
import { Series } from "../models/Series";
import { TimePoint, TimePointIndex } from "../models/time-data";

export interface TickMarkPacket {
    span: number;
    time: TimePoint;
    index: TimePointIndex;
}

export interface SeriesUpdatePacket {
    update: PlotRow<Bar['time'], Bar['value']>[];
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