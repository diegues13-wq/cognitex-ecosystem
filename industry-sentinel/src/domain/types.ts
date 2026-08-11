import type { IndustryReading, Millis } from '@cognitex/data';

/**
 * The manufacturing domain.
 *
 * Every function in `src/domain` takes `IndustryReading[]` — the schema
 * `@cognitex/data` defines for this platform — and returns plain numbers. The
 * previous app had no domain layer at all: OEE was whatever the generator had
 * written into the `battery` field, availability was the string "98.2%"
 * hardcoded in the sidebar, and "próximo servicio: 340 hrs" was hardcoded too.
 */

export type MachineType = 'cnc' | 'press' | 'robot' | 'conveyor' | 'molder';

export interface Machine {
    /** Matches `IndustryReading.assetId`. */
    id: string;
    name: string;
    area: string;
    type: MachineType;
    /** rpm at nameplate. The denominator of the performance factor. */
    ratedSpeed: number;
    /** °C. Bearing temperature above this is a fault, not a warm day. */
    temperatureAlarm: number;
    /** mm/s RMS. Vibration at or above this is ISO 10816 zone D. */
    vibrationAlarm: number;
    /** W. Sustained draw above this is an overload. */
    powerAlarm: number;
}

/**
 * The scheduled production window, in local hours, half-open: `[start, end)`.
 *
 * Half-open on purpose. The generator this replaces tested `hour >= 6 && hour
 * <= 22`, which counts the whole of the 22:00 hour and makes the shift 17
 * hours long — so availability was computed against a denominator an hour
 * larger than the plant actually schedules.
 */
export interface Shift {
    startHour: number;
    endHour: number;
}

/** A continuous stop inside scheduled time. */
export interface DowntimeEpisode {
    assetId: string;
    from: Millis;
    /** When production resumed, or the last scheduled reading if it had not. */
    to: Millis;
    /**
     * Closed at the resuming reading, so it is exact when `resolved` and a
     * lower bound otherwise — never an extrapolation past the last thing the
     * console actually saw.
     */
    durationMs: number;
    /**
     * True only when the machine was observed turning again. False when the
     * shift or the window ended with the machine still stopped.
     */
    resolved: boolean;
}

/** A reading paired with the machine it came from, for per-machine views. */
export interface MachineReadings {
    machine: Machine;
    readings: IndustryReading[];
}
