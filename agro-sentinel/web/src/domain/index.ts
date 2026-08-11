/**
 * The greenhouse domain.
 *
 * Pure functions over typed data: no React, no Firestore, no clock reads. The
 * physics and the alarm rules are the product — the rest of this app is a way
 * of looking at them — so they are the part that has tests.
 *
 * What used to live here lived in a 678-line `Dashboard.jsx` instead: the VPD
 * formula sat in the data *generator*, the alarm thresholds were five
 * hardcoded comparisons inside a `useMemo`, and the "Botrytis predictor" was
 * three lines of arithmetic printed as a percentage probability.
 */

export type {
    Alarm,
    AlarmCondition,
    AlarmLevel,
    AgroReading,
    Band,
    Breach,
    Channel,
    ChannelId,
    DeviceHealth,
    Farm,
    GreenhouseSample,
    Millis,
    ThermalScan,
} from './types';

export { CHANNELS, CLIMATE_CHANNELS, DEFAULT_FARM, FARMS, findChannel, findFarm } from './farms';

export {
    actualVapourPressure,
    condensationMargin,
    dewPoint,
    saturationVapourPressure,
    vapourPressureDeficit,
} from './psychrometrics';

export {
    CRITICAL_LIMITS,
    DEADBAND,
    WARNING_LIMITS,
    acknowledgeAlarm,
    alarmPriority,
    channelStatus,
    comfortBand,
    evaluateSample,
    replayAlarms,
    sortAlarms,
    tallyAlarms,
    updateAlarms,
    type AlarmTally,
} from './alarms';

export {
    DAY_MS,
    ECUADOR_UTC_OFFSET_MS,
    botrytisRisk,
    dailyLightIntegral,
    dailyTemperature,
    farmDayKey,
    growingDegreeDays,
    startOfFarmDay,
    type BotrytisRisk,
    type DayExtremes,
    type DliResult,
    type GddResult,
    type RiskLevel,
} from './agronomy';

export {
    downsample,
    latestSample,
    statsFor,
    toSeries,
    trendOf,
    type ChannelStats,
} from './series';

export {
    EXAMPLES,
    answerQuery,
    parseQuery,
    type AlarmsAnswer,
    type EmptyAnswer,
    type HelpAnswer,
    type ParsedQuery,
    type QueryAnswer,
    type QueryIntent,
    type StatAnswer,
    type StatusAnswer,
} from './query';

export {
    gradeDelta,
    interpretScan,
    summariseScans,
    type ThermalFinding,
    type ThermalGrade,
    type ThermalSummary,
} from './thermal';
