import type { PlatformId, Status } from '@cognitex/theme';

/**
 * Domain schemas.
 *
 * These exist because the apps used to share one physical row shape copied
 * from agro-sentinel and alias their own physics into its field names:
 *
 *     vpd:     parseFloat(vib.toFixed(2)),   // vibration in the VPD slot
 *     battery: Math.round(oee),              // OEE in the battery slot
 *     co2:     isWorking ? 1 : 0,            // man-down in the CO2 slot
 *
 * `co2` therefore meant parts-per-million in agro, watts in industry and a
 * boolean alarm in personal. That is not a naming nit: it already produced a
 * live defect, where personal-sentinel's history view read every worked hour
 * as a man-down alert because the writer and the reader disagreed about the
 * slot's polarity.
 *
 * Every measurement now carries its own name and unit, and the union is
 * discriminated by platform so a reading from one console cannot typecheck
 * as another's.
 */

/** Milliseconds since epoch. Firestore Timestamps are converted at the edge. */
export type Millis = number;

export interface BaseReading {
    /** Tenant. Every document carries it; rules enforce it. */
    orgId: string;
    /** The thing being measured — machine, worker, greenhouse, train. */
    assetId: string;
    at: Millis;
}

export interface AgroReading extends BaseReading {
    platform: 'agro';
    /** °C */
    airTemperature: number;
    /** % RH */
    humidity: number;
    /** kPa — vapour pressure deficit, the real thing, in agro only. */
    vpd: number;
    /** ppm */
    co2: number;
    /** % volumetric water content */
    soilMoisture: number;
    /** µmol/m²/s */
    par: number;
}

export interface IndustryReading extends BaseReading {
    platform: 'industry';
    /** °C */
    temperature: number;
    /** mm/s RMS */
    vibration: number;
    /** W */
    power: number;
    /** rpm */
    speed: number;
    /** 0-100 */
    oee: number;
}

export interface PersonalReading extends BaseReading {
    platform: 'personal';
    /** bpm */
    heartRate: number;
    /** 0-100, higher is more fatigued */
    fatigue: number;
    /** °C */
    bodyTemperature: number;
    /** 0-100 */
    wearableBattery: number;
    /**
     * True when the wearable detected a fall.
     *
     * A boolean, not a 0/1 in a numeric slot — the previous encoding was
     * documented in the generator as "inverted logic for simplicity" and the
     * dashboard read it the other way round.
     */
    manDown: boolean;
}

export interface TransportReading extends BaseReading {
    platform: 'transport';
    /** km/h */
    speed: number;
    /** km */
    odometer: number;
    /** kWh consumed since the previous reading */
    energy: number;
    /** Minutes late; negative is early. */
    delayMinutes: number;
    lat: number;
    lng: number;
}

export interface ProductivityReading extends BaseReading {
    platform: 'productivity';
    /** Planned tasks completed over planned, 0-100 (PPC). */
    planCompliance: number;
    /** Open constraints blocking work. */
    openConstraints: number;
    /** Root-cause code from the platform's taxonomy. */
    rootCause: string;
}

export type Reading =
    | AgroReading
    | IndustryReading
    | PersonalReading
    | TransportReading
    | ProductivityReading;

/** Narrows a reading union to one platform. */
export type ReadingFor<P extends PlatformId> = Extract<Reading, { platform: P }>;

/**
 * An alert, identical in shape everywhere so the shared UI can render any
 * platform's feed. Previously the REST API emitted `{time, priority}` while
 * the client generator emitted `{timestamp, severity}`, so the ticker showed
 * a blank time and the critical filter never matched anything.
 */
export interface Alert {
    id: string;
    orgId: string;
    assetId: string;
    at: Millis;
    status: Status;
    /** Short, human, already translated. */
    message: string;
    acknowledgedAt: Millis | null;
}

/** A single number on a dashboard, with everything needed to render it. */
export interface Metric {
    id: string;
    label: string;
    value: number;
    unit: string;
    /** Digits after the decimal point. */
    precision: number;
    status: Status;
    /** Change versus the previous period, as a fraction. Null when unknown. */
    trend: number | null;
}
