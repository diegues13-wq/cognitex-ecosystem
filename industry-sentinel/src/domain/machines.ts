import type { Machine, Shift } from './types';

/**
 * The plant.
 *
 * Same five machines the old `LOCATIONS` array carried, with the fields the
 * calculations actually need. `baseTemp` and `baseVib` were only ever used as
 * placeholder values to render when no data had arrived; what the domain needs
 * is the rated speed and the alarm limits, which the old app hardcoded inline
 * at each comparison site (`d.temp > 85`, `d.vpd > 6`, `d.co2 > 5000`) — the
 * same threshold for an injection moulder running at 210 °C as for a robot arm
 * running at 35 °C.
 */
export const MACHINES: readonly Machine[] = [
    {
        id: 'MACH-01',
        name: 'Torno CNC X1',
        area: 'Mecanizado',
        type: 'cnc',
        ratedSpeed: 1800,
        temperatureAlarm: 75,
        vibrationAlarm: 7.1,
        powerAlarm: 5200,
    },
    {
        id: 'MACH-02',
        name: 'Prensa hidráulica',
        area: 'Estampado',
        type: 'press',
        ratedSpeed: 1200,
        temperatureAlarm: 85,
        vibrationAlarm: 11.2,
        powerAlarm: 6500,
    },
    {
        id: 'ROBO-01',
        name: 'Brazo Kuka A',
        area: 'Ensamblaje',
        type: 'robot',
        ratedSpeed: 2400,
        temperatureAlarm: 60,
        vibrationAlarm: 2.8,
        powerAlarm: 3000,
    },
    {
        id: 'CONV-01',
        name: 'Transportador principal',
        area: 'Logística',
        type: 'conveyor',
        ratedSpeed: 900,
        temperatureAlarm: 65,
        vibrationAlarm: 4.5,
        powerAlarm: 2200,
    },
    {
        id: 'INJ-01',
        name: 'Inyectora de plástico',
        area: 'Plásticos',
        type: 'molder',
        ratedSpeed: 600,
        temperatureAlarm: 245,
        vibrationAlarm: 4.5,
        powerAlarm: 8000,
    },
];

/** The first machine, used as the default selection. Never undefined. */
export const DEFAULT_MACHINE: Machine = MACHINES[0]!;

export function findMachine(id: string): Machine | null {
    return MACHINES.find((machine) => machine.id === id) ?? null;
}

/**
 * Two shifts, 06:00 to 22:00, which is what the plant schedules.
 *
 * Anything outside it is not downtime: a machine that is off at 03:00 is off
 * because nobody is working, and counting it against availability is how a
 * well-run single-shift plant ends up reporting 33%.
 */
export const PRODUCTION_SHIFT: Shift = { startHour: 6, endHour: 22 };
