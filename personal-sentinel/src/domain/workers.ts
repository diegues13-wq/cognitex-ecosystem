import type { PpeItem, Shift, Worker, WorkerRole } from './types';

/**
 * The crew.
 *
 * The same five people the old `LOCATIONS` array carried, with the fields the
 * calculations need. `baseHR` and `baseFatigue` were only placeholders to
 * render before data arrived; what the domain needs is an age and a resting
 * heart rate, because cardiac strain is a fraction of *this* worker's reserve
 * and not a number you can compare to a fixed 120 bpm for everyone.
 */
export const WORKERS: readonly Worker[] = [
    {
        id: 'WRK-001',
        name: 'J. Pérez',
        area: 'Fundición',
        role: 'soldador',
        age: 46,
        restingHeartRate: 68,
        requiredPpe: ['casco', 'gafas', 'guantes', 'botas', 'chaleco', 'proteccion_auditiva'],
    },
    {
        id: 'WRK-002',
        name: 'M. Rodríguez',
        area: 'Ensamblaje',
        role: 'supervisor',
        age: 38,
        restingHeartRate: 62,
        requiredPpe: ['casco', 'chaleco', 'botas', 'gafas'],
    },
    {
        id: 'WRK-003',
        name: 'A. Solís',
        area: 'Logística',
        role: 'conductor',
        age: 52,
        restingHeartRate: 71,
        requiredPpe: ['casco', 'chaleco', 'botas', 'proteccion_auditiva'],
    },
    {
        id: 'WRK-004',
        name: 'L. Chen',
        area: 'Químicos',
        role: 'quimico',
        age: 31,
        restingHeartRate: 58,
        requiredPpe: ['casco', 'gafas', 'guantes', 'botas', 'respirador'],
    },
    {
        id: 'WRK-005',
        name: 'K. Ivanov',
        area: 'Alta tensión',
        role: 'electricista',
        age: 44,
        restingHeartRate: 66,
        requiredPpe: ['casco', 'gafas', 'guantes', 'botas', 'arnes'],
    },
];

export const DEFAULT_WORKER: Worker = WORKERS[0]!;

export function findWorker(id: string): Worker | null {
    return WORKERS.find((worker) => worker.id === id) ?? null;
}

export const ROLE_LABEL: Record<WorkerRole, string> = {
    soldador: 'Soldador',
    supervisor: 'Supervisor',
    conductor: 'Conductor',
    quimico: 'Químico',
    electricista: 'Electricista',
};

export const PPE_LABEL: Record<PpeItem, string> = {
    casco: 'Casco inteligente',
    chaleco: 'Chaleco reflectivo',
    guantes: 'Guantes',
    gafas: 'Gafas de seguridad',
    botas: 'Botas dieléctricas',
    respirador: 'Respirador',
    arnes: 'Arnés',
    proteccion_auditiva: 'Protección auditiva',
};

/**
 * The one item the platform can actually verify.
 *
 * The smart helmet is the wearable; its telemetry is the readings this console
 * reads. Nothing else on the list has a sensor, so nothing else gets a tick.
 */
export const INSTRUMENTED_PPE: readonly PpeItem[] = ['casco'];

/** One shift, 08:00 to 17:00 — nine hours with an hour for lunch. */
export const WORK_SHIFT: Shift = { startHour: 8, endHour: 17 };
