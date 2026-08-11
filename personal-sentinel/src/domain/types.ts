import type { Millis } from '@cognitex/data';

/**
 * The workforce-safety domain.
 *
 * Every function in `src/domain` takes `PersonalReading[]` — the schema
 * `@cognitex/data` defines for this platform — and returns plain numbers.
 *
 * The reading this replaces aliased its physics into agro-sentinel's field
 * names: heart rate lived in `vpd`, fatigue in `humidity`, body temperature in
 * `temp`, and man-down in `co2` as a 0/1 whose polarity the generator itself
 * described as "inverted logic for simplicity". `PersonalReading.manDown` is a
 * boolean and means what it says.
 */

export type WorkerRole =
    | 'soldador'
    | 'supervisor'
    | 'conductor'
    | 'quimico'
    | 'electricista';

/**
 * Personal protective equipment.
 *
 * Only the smart helmet is instrumented: it is the wearable that reports the
 * readings this console is built on. Everything else is declared at the gate
 * and the platform has no way to verify it — which the EPP view says out loud
 * instead of showing a green tick for a measurement nobody took.
 */
export type PpeItem =
    | 'casco'
    | 'chaleco'
    | 'guantes'
    | 'gafas'
    | 'botas'
    | 'respirador'
    | 'arnes'
    | 'proteccion_auditiva';

export interface Worker {
    /** Matches `PersonalReading.assetId`. */
    id: string;
    name: string;
    area: string;
    role: WorkerRole;
    /** Years. Drives the age-predicted maximum heart rate. */
    age: number;
    /** bpm at rest, from the worker's own baseline, not a population mean. */
    restingHeartRate: number;
    /** What the role requires on site. */
    requiredPpe: readonly PpeItem[];
}

/** The scheduled shift, in local hours, half-open: `[start, end)`. */
export interface Shift {
    startHour: number;
    endHour: number;
}

/** A continuous stretch of a reading above a physiological limit. */
export interface ExposureWindow {
    assetId: string;
    from: Millis;
    /** When the reading came back under the limit, or the last sample seen. */
    to: Millis;
    durationMs: number;
    /** Highest value observed inside the window. */
    peak: number;
    /** False when the window ended with the worker still over the limit. */
    resolved: boolean;
}

/**
 * A fall detected by the wearable.
 *
 * The single most consequential thing this platform reports, and the one the
 * old console got backwards: the generator wrote `co2: isWorking ? 1 : 0` and
 * the dashboard rendered `stats.co2 === 1 ? 'ALERTA' : 'OK'`, so in history
 * mode every worked hour read as a man-down alarm and every idle hour read as
 * fine.
 */
export interface ManDownEpisode {
    assetId: string;
    from: Millis;
    to: Millis;
    durationMs: number;
    /** False when the feed ended with the alarm still raised. */
    resolved: boolean;
}
