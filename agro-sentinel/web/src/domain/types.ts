import type { AgroReading, Millis } from '@cognitex/data';

/**
 * The greenhouse domain.
 *
 * `AgroReading` from `@cognitex/data` is the measurement row and it is used
 * unchanged: agro is the one platform whose field names were already honest —
 * `vpd` here really is a vapour pressure deficit in kPa, not a vibration
 * amplitude wearing the name.
 *
 * What the shared type does not carry is the *gateway's own* health: battery,
 * radio signal, soil EC and soil temperature are properties of the hardware
 * and the substrate rather than of the air, and no other platform records
 * them. They live here, nullable, because a reading that arrives through the
 * shared `readings` collection legitimately has none of them.
 */

/** Battery, radio and substrate probes. Null when the source does not report them. */
export interface DeviceHealth {
    /** % of pack capacity. */
    batteryPct: number | null;
    /** dBm; less negative is better. */
    rssiDbm: number | null;
    /** mS/cm. */
    soilEc: number | null;
    /** °C, measured in the substrate rather than the air. */
    soilTemperature: number | null;
}

/** One instant at one greenhouse: the shared reading plus the gateway's health. */
export interface GreenhouseSample extends AgroReading, DeviceHealth {}

/** Every numeric channel an alarm or a chart can address. */
export type ChannelId =
    | 'airTemperature'
    | 'humidity'
    | 'vpd'
    | 'co2'
    | 'soilMoisture'
    | 'par'
    | 'batteryPct'
    | 'rssiDbm';

export interface Channel {
    id: ChannelId;
    /** Already translated, already the label a grower would use. */
    label: string;
    short: string;
    unit: string;
    /** Digits after the decimal point when displayed. */
    precision: number;
    /** True when a higher number is better; drives nothing but wording. */
    higherIsBetter: boolean;
}

/**
 * A farm.
 *
 * `id` is the sensor ID the cloud pipeline validates against
 * `^GH-[A-Z]{3}-\d{2}$` (cloud/main.py:30). The five here are the five in
 * `KNOWN_SENSOR_IDS` (cloud/main.py:29), so the console and the ingest
 * function agree on the identifier — which the edge agent does not.
 */
export interface Farm {
    id: string;
    name: string;
    city: string;
    region: 'SIERRA' | 'COSTA' | 'AMAZONIA';
    lat: number;
    lng: number;
    /** °C, the local annual mean the generator varies around. */
    baseTemperature: number;
    /** % RH, likewise. */
    baseHumidity: number;
    crop: string;
    hectares: number;
    /** Metres above sea level. Cayambe is why 0 °C is a real reading here. */
    altitude: number;
}

/** Alarm urgency, in the two levels cloud/main.py defines. */
export type AlarmLevel = 'CRITICAL' | 'WARNING';

/** Which side of the band was crossed. */
export type Breach = 'HIGH' | 'LOW';

/** One channel's limits at one level. `null` means the level has no such limit. */
export interface Band {
    low: number | null;
    high: number | null;
}

/** An alarm condition detected in a single sample. */
export interface AlarmCondition {
    channel: ChannelId;
    level: AlarmLevel;
    breach: Breach;
    value: number;
    /** The limit that was crossed. */
    limit: number;
}

/**
 * A latched alarm.
 *
 * ISA-18.2 distinguishes the *condition* (true right now) from the *alarm*
 * (raised at some instant, possibly acknowledged, possibly returned to
 * normal). The Python function only ever computes conditions and re-writes
 * them on every message, so an operator cannot acknowledge anything and a
 * value oscillating around a limit re-announces itself forever.
 */
export interface Alarm {
    /** Stable across updates: one alarm per channel per level per episode. */
    id: string;
    farmId: string;
    channel: ChannelId;
    level: AlarmLevel;
    breach: Breach;
    /** Worst value seen while the alarm has been standing. */
    peak: number;
    value: number;
    limit: number;
    raisedAt: Millis;
    /** Set when the value came back inside the limit plus its deadband. */
    clearedAt: Millis | null;
    acknowledgedAt: Millis | null;
}

/** A thermal scan of one greenhouse, as `cloud/thermal.py` writes it. */
export interface ThermalScan {
    id: string;
    farmId: string;
    at: Millis;
    /** °C, the hottest pixel the analysis reports. */
    maxTemperature: number;
    /** °C in the air at the same moment, for the delta. */
    ambientTemperature: number | null;
    anomaly: boolean;
    description: string;
    /**
     * True when the numbers came from `cloud/thermal.py`'s hardcoded literal
     * rather than from a vision model. Rendered, not hidden: every scan that
     * function has ever written says 42.5 °C.
     */
    stub: boolean;
}

export type { AgroReading, Millis };
