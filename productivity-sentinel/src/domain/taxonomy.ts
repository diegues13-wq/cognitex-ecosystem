import type { Goal, RootCause } from './types';

/**
 * The root-cause taxonomy.
 *
 * Seven causes, closed. The previous version carried an emoji and a hardcoded
 * hex per cause (`#ef4444`, `#f97316`, …), which is how a purple app ended up
 * drawing a red-orange-yellow Pareto that matched nothing else on screen.
 * Colour is no longer part of the taxonomy: the Pareto derives a ramp from
 * `--color-brand`, so the chart follows the platform accent automatically.
 *
 * `counterMeasure` is new and load-bearing — the weekly synthesis used to
 * hardcode a single experiment about over-commitment regardless of what the
 * data said. Each cause now carries the standard response, so the experiment
 * follows the dominant cause.
 */

export interface RootCauseMeta {
    id: RootCause;
    label: string;
    /** Two words, for table cells and axis labels. */
    short: string;
    /** What the cause means, so the taxonomy is applied consistently. */
    definition: string;
    /** The standard counter-measure, used to seed the weekly experiment. */
    counterMeasure: string;
}

/**
 * Declaration order is the tie-break for equal Pareto counts, so a chart never
 * reorders itself between renders on tied data.
 */
export const ROOT_CAUSE_IDS = [
    'sobrecompromiso',
    'evitacion_conflicto',
    'falta_descomposicion',
    'gestion_energia',
    'distraccion_entorno',
    'perfeccionismo',
    'miedo_exposicion',
] as const satisfies readonly RootCause[];

export const ROOT_CAUSES: Record<RootCause, RootCauseMeta> = {
    sobrecompromiso: {
        id: 'sobrecompromiso',
        label: 'Sobrecompromiso',
        short: 'Sobrecompromiso',
        definition: 'Se aceptaron más compromisos de los que la capacidad del día permite.',
        counterMeasure:
            'Fijar un tope de tres compromisos diarios y, ante cada solicitud nueva, decidir qué sale.',
    },
    evitacion_conflicto: {
        id: 'evitacion_conflicto',
        label: 'Evitación de conflicto',
        short: 'Evitación',
        definition: 'Se pospuso una conversación difícil que bloqueaba el avance.',
        counterMeasure:
            'Agendar la conversación pendiente dentro de 48 horas con los tres puntos ya escritos.',
    },
    falta_descomposicion: {
        id: 'falta_descomposicion',
        label: 'Falta de descomposición',
        short: 'Descomposición',
        definition: 'La tarea entró al plan sin un primer paso concreto y accionable.',
        counterMeasure:
            'Ninguna tarea entra al plan del día sin un verbo de acción y un primer paso de menos de dos minutos.',
    },
    gestion_energia: {
        id: 'gestion_energia',
        label: 'Gestión de energía',
        short: 'Energía',
        definition: 'El trabajo se programó en una franja horaria sin la energía que exige.',
        counterMeasure:
            'Mover el bloque de mayor exigencia a la primera franja del día y proteger el descanso de media jornada.',
    },
    distraccion_entorno: {
        id: 'distraccion_entorno',
        label: 'Distracción del entorno',
        short: 'Distracción',
        definition: 'El entorno físico o digital interrumpió el bloque de trabajo.',
        counterMeasure:
            'Sacar el teléfono de la sala y cerrar los canales de mensajería durante el bloque de enfoque.',
    },
    perfeccionismo: {
        id: 'perfeccionismo',
        label: 'Perfeccionismo',
        short: 'Perfeccionismo',
        definition: 'El entregable se retuvo buscando una calidad por encima de la requerida.',
        counterMeasure:
            'Fijar un tiempo límite por entregable y enviarlo marcado como borrador al vencerlo.',
    },
    miedo_exposicion: {
        id: 'miedo_exposicion',
        label: 'Miedo a exponerse',
        short: 'Exposición',
        definition: 'El trabajo terminado no se compartió por temor al juicio ajeno.',
        counterMeasure:
            'Compartir primero con una persona de confianza y fijar la fecha de publicación en el mismo acto.',
    },
};

/** Runtime guard for values arriving from Firestore or a form. */
export function isRootCause(value: unknown): value is RootCause {
    return typeof value === 'string' && value in ROOT_CAUSES;
}

/**
 * The goals under control.
 *
 * All three are computed from the failure log. That is the whole change from
 * the previous set: `Bloques de trabajo profundo` and `Conversaciones
 * difíciles` had no data behind them anywhere in the app, and the control-loop
 * chart filled the gap with a seeded random walk labelled "valor real".
 */
export const GOALS: readonly Goal[] = [
    {
        id: 'goal-ppc',
        name: 'Cumplimiento del plan (PPC)',
        definition:
            'Ajustes verificados como implementados sobre ajustes cuya verificación ya venció, por semana.',
        signal: 'ppc',
        unit: '%',
        target: 90,
        tolerance: 10,
        direction: 'higher',
        precision: 0,
    },
    {
        id: 'goal-energy',
        name: 'Energía sostenida',
        definition: 'Nivel de energía medio declarado al registrar, por día.',
        signal: 'energy',
        unit: '/5',
        target: 4,
        tolerance: 0.5,
        direction: 'higher',
        precision: 1,
    },
    {
        id: 'goal-recurrence',
        name: 'Recurrencia de fallos',
        definition:
            'Porcentaje de fallos cuya causa raíz ya se había registrado en los 14 días previos.',
        signal: 'recurrence',
        unit: '%',
        target: 30,
        tolerance: 10,
        direction: 'lower',
        precision: 0,
    },
];

export function findGoal(goalId: string): Goal | null {
    return GOALS.find((goal) => goal.id === goalId) ?? null;
}
