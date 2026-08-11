/**
 * The workforce-safety domain.
 *
 * Pure functions of typed readings: no React, no Firestore, no date library.
 * That is what makes them testable, and they are the product — a fatigue
 * score, an exposure window and a man-down episode are what a safety officer
 * acts on. The console is a way of looking at them.
 */

export type {
    ExposureWindow,
    ManDownEpisode,
    PpeItem,
    Shift,
    Worker,
    WorkerRole,
} from './types';

export {
    DEFAULT_WORKER,
    INSTRUMENTED_PPE,
    PPE_LABEL,
    ROLE_LABEL,
    WORKERS,
    WORK_SHIFT,
    findWorker,
} from './workers';

export {
    HOUR_MS,
    formatDuration,
    hoursOnShift,
    isOnShift,
    shiftHours,
    shortStamp,
    startOfDay,
} from './shift';

export { rank, worst } from './thresholds';

export {
    BODY_TEMPERATURE_LIMIT,
    DRIVER_LABEL,
    dailyFatigue,
    dominantDriver,
    fatigueBand,
    heartRateReserve,
    maxHeartRate,
    scoreFatigue,
    thermalLoad,
    type DailyFatigue,
    type FatigueBand,
    type FatigueDrivers,
    type FatigueScore,
} from './fatigue';

export {
    EXPOSURE_LIMITS,
    crewExposure,
    exposureBudget,
    exposureThreshold,
    exposureWindows,
    recentWindows,
    type ExposureBudget,
    type ExposureKind,
    type ExposureLimit,
} from './exposure';

export { activeAlerts, deriveAlerts, manDownEpisodes, openManDown } from './safety';

export {
    STALE_AFTER_MS,
    crewCoverage,
    ppeCompliance,
    ppeStatuses,
    wearableCoverage,
    type PpeCompliance,
    type PpeStatus,
    type PpeVerification,
    type WearableCoverage,
} from './ppe';

export {
    MEASUREMENTS,
    latestFor,
    toSeries,
    type Measurement,
    type MeasurementMeta,
} from './series';
