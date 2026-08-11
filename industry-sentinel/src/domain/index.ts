/**
 * The manufacturing domain.
 *
 * Pure functions of typed readings: no React, no Firestore, no date library.
 * That is what makes them testable, and they are the product — OEE, downtime,
 * MTBF and a maintenance horizon are the numbers a plant acts on. The console
 * is a way of looking at them.
 */

export type { DowntimeEpisode, Machine, MachineReadings, MachineType, Shift } from './types';

export {
    DEFAULT_MACHINE,
    MACHINES,
    PRODUCTION_SHIFT,
    findMachine,
} from './machines';

export {
    DAY_MS,
    HOUR_MS,
    formatDuration,
    isScheduled,
    shiftHours,
    shortStamp,
    startOfDay,
} from './shift';

export {
    computeOee,
    isRunning,
    oeeConsistency,
    plantOee,
    type OeeBreakdown,
    type OeeConsistency,
} from './oee';

export {
    downtimeEpisodes,
    reliability,
    worstEpisodes,
    type Reliability,
} from './reliability';

export {
    forecastMaintenance,
    maintenanceQueue,
    vibrationTrend,
    vibrationZone,
    type MaintenanceForecast,
    type VibrationTrend,
    type VibrationZone,
} from './maintenance';

export { machineStatus, rank, worst } from './thresholds';

export { activeAlerts, deriveAlerts } from './alarms';

export {
    MEASUREMENTS,
    dailyOee,
    latestFor,
    toSeries,
    type Measurement,
    type MeasurementMeta,
} from './series';
