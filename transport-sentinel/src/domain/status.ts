import type { Status } from '@cognitex/theme';

import type {
    IncidentSeverity,
    MaintUrgency,
    ServiceKind,
    Traction,
    TrainStatus,
    WorkOrderPriority,
    WorkOrderStatus,
} from './types';

/**
 * Railway vocabulary, translated once into the shared status set.
 *
 * Every view used to carry its own colour table — CCO, Fleet, Maintenance,
 * Safety and the map each hardcoded their own green/amber/red hexes for the
 * same three train states, and they had already drifted apart. There is one
 * table per concept here, and the colour itself comes from the theme.
 */

export const TRAIN_STATUS_LABEL: Record<TrainStatus, string> = {
    EN_SERVICIO: 'En servicio',
    EN_MANTENIMIENTO: 'Mantenimiento',
    STANDBY: 'Standby',
    RETIRADO: 'Retirado',
};

export const TRAIN_STATUS: Record<TrainStatus, Status> = {
    EN_SERVICIO: 'ok',
    EN_MANTENIMIENTO: 'warning',
    STANDBY: 'offline',
    RETIRADO: 'alert',
};

/**
 * Spanish labels for the enum values, which are stored unaccented.
 *
 * The views used to render the raw value under a `capitalize` utility, which
 * produced "Electrico" — and, applied to a whole specification table, also
 * "240 Km/H" and "7.200 KW". Units are not words.
 */
export const TRACTION_LABEL: Record<Traction, string> = {
    electrico: 'Eléctrico',
    diesel: 'Diésel',
    hibrido: 'Híbrido',
};

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
    pasajeros: 'Pasajeros',
    carga: 'Carga',
    mixto: 'Mixto',
};

export const WORK_ORDER_STATUS_LABEL: Record<WorkOrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    EN_CURSO: 'En curso',
    COMPLETADO: 'Completado',
    VENCIDO: 'Vencido',
};

export const WORK_ORDER_STATUS: Record<WorkOrderStatus, Status> = {
    PENDIENTE: 'offline',
    EN_CURSO: 'warning',
    COMPLETADO: 'ok',
    VENCIDO: 'alert',
};

export const WORK_ORDER_PRIORITY: Record<WorkOrderPriority, Status> = {
    ALTA: 'alert',
    MEDIA: 'warning',
    BAJA: 'offline',
};

export const INCIDENT_SEVERITY: Record<IncidentSeverity, Status> = {
    CRITICO: 'alert',
    MAYOR: 'warning',
    MENOR: 'offline',
};

export const MAINT_URGENCY: Record<MaintUrgency, Status> = {
    CRITICA: 'alert',
    PROXIMA: 'warning',
    OK: 'ok',
};

export const MAINT_URGENCY_LABEL: Record<MaintUrgency, string> = {
    CRITICA: 'Crítica',
    PROXIMA: 'Próxima',
    OK: 'Al día',
};

/**
 * Wall-clock formatting for the console.
 *
 * 24-hour, always. `toLocaleTimeString('es-EC')` defaults to a 12-hour clock
 * with "p. m." — which is how the alert ticker came to render "01:44 p. m."
 * next to a timetable that is entirely in railway time. Operations run on a
 * 24-hour clock; a console that disagrees with the timetable on the wall
 * creates exactly the transcription errors it exists to prevent.
 */
export function formatClock(at: number, withSeconds = false): string {
    return new Date(at).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        ...(withSeconds ? { second: '2-digit' } : {}),
        hour12: false,
    });
}

/**
 * On-time performance, as a status.
 *
 * Three minutes is the UIC threshold this operation books as "on time", and
 * it was already the number every view compared against — just written out
 * inline in five different places.
 */
export const ON_TIME_LIMIT_MIN = 3;

export function delayStatus(delayMin: number): Status {
    if (delayMin <= ON_TIME_LIMIT_MIN) return 'ok';
    return delayMin <= 10 ? 'warning' : 'alert';
}

/** A percentage against a floor: at or above target is fine, 5 points below is a warning. */
export function targetStatus(value: number, target: number): Status {
    if (value >= target) return 'ok';
    return value >= target - 5 ? 'warning' : 'alert';
}

/** A percentage against a ceiling — MTTR hours, empty-wagon share. */
export function ceilingStatus(value: number, ceiling: number): Status {
    if (value <= ceiling) return 'ok';
    return value <= ceiling * 1.25 ? 'warning' : 'alert';
}
