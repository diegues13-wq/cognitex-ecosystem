import type { Millis } from '@cognitex/data';

import {
    ROOT_CAUSE_IDS,
    addDays,
    startOfDay,
    toDateKey,
    type AdjustmentStatus,
    type Constraint,
    type EnergyLevel,
    type FailureEntry,
    type RootCause,
} from '../domain';

/**
 * The demonstration log.
 *
 * Deterministic, and this time actually deterministic: the original seeded its
 * own LCG and then drew the root cause with `Math.random()` inside
 * `weightedRandom`, so every reload produced a different Pareto under a
 * comment claiming a fixed seed. One generator, one seed, one stream.
 *
 * It is only ever reached when Firebase is not configured, and everything it
 * produces is labelled `simulado` on screen.
 */

/** Numerical Recipes' LCG — small, fast, and identical across engines. */
function seeded(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x1_0000_0000;
    };
}

function pick<T>(random: () => number, items: readonly T[]): T {
    const item = items[Math.floor(random() * items.length)];
    // items is never empty at any call site, but the index type says otherwise.
    return item ?? items[0]!;
}

function weighted(random: () => number, weights: readonly [RootCause, number][]): RootCause {
    const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
    let point = random() * total;

    for (const [cause, weight] of weights) {
        point -= weight;
        if (point <= 0) return cause;
    }
    return weights[weights.length - 1]?.[0] ?? ROOT_CAUSE_IDS[0];
}

/**
 * The shape of a plausible improvement loop: over-commitment dominates,
 * exposure fear is rare. Kept from the original because the distribution is
 * what makes the Pareto demonstration worth looking at.
 */
const CAUSE_WEIGHTS: readonly [RootCause, number][] = [
    ['sobrecompromiso', 28],
    ['evitacion_conflicto', 25],
    ['falta_descomposicion', 15],
    ['gestion_energia', 12],
    ['distraccion_entorno', 10],
    ['perfeccionismo', 7],
    ['miedo_exposicion', 3],
];

const FAILURES: Record<RootCause, readonly string[]> = {
    sobrecompromiso: [
        'Acepté una reunión más con el día ya lleno',
        'Dije que sí a un proyecto adicional sin revisar la carga',
        'Me comprometí con cinco tareas pudiendo cerrar tres',
        'Cedí mi bloque de trabajo profundo para ayudar a un colega',
    ],
    evitacion_conflicto: [
        'Pospuse por tercera vez la llamada difícil con el cliente',
        'Evité dar la observación negativa en la revisión del equipo',
        'No planteé el problema de alcance con el responsable',
        'Dejé pasar el comentario fuera de lugar en la reunión',
    ],
    falta_descomposicion: [
        'Bloqueé «avanzar el proyecto» sin definir el primer paso',
        'La tarea se veía grande y no la empecé',
        'No dividí el entregable en subtareas accionables',
        'Intenté hacerlo todo de una vez en lugar de iterar',
    ],
    gestion_energia: [
        'Programé trabajo profundo a las 15:00, ya agotado',
        'Salté el descanso de mediodía y perdí el foco por la tarde',
        'Abrí el correo al empezar y perdí el impulso de la mañana',
        'Dormí cuatro horas y el día no rindió',
    ],
    distraccion_entorno: [
        'Trabajé con el teléfono desbloqueado sobre el escritorio',
        'Dejé la mensajería abierta durante el bloque de enfoque',
        'El puesto estaba desordenado y me dispersé',
        'Revisé redes seis veces antes del mediodía',
    ],
    perfeccionismo: [
        'Reescribí el correo cuatro veces en lugar de enviarlo',
        'Retuve el borrador porque «no estaba listo»',
        'Invertí tres horas en formato y no en contenido',
        'No entregué a tiempo esperando que quedara perfecto',
    ],
    miedo_exposicion: [
        'No presenté la idea en la reunión por temor al juicio',
        'Dejé sin publicar el artículo ya terminado',
        'No pedí la observación que necesitaba para avanzar',
    ],
};

const ADJUSTMENTS: Record<RootCause, readonly string[]> = {
    sobrecompromiso: [
        'Antes de aceptar, preguntar qué sale del día para que esto entre',
        'Tope de tres compromisos nuevos por día',
        'Revisar la agenda antes de responder a cualquier solicitud',
    ],
    evitacion_conflicto: [
        'Agendar la conversación pendiente dentro de 48 horas',
        'Escribir los tres puntos clave antes de la llamada',
        'Enviar el mensaje antes de las 10:00 para no posponerlo',
    ],
    falta_descomposicion: [
        'Definir el primer paso físico en menos de dos minutos',
        'Partir el proyecto en bloques de veinticinco minutos',
        'Escribir la primera acción concreta antes de cerrar el día',
    ],
    gestion_energia: [
        'Mover el bloque profundo a la franja de 09:00 a 11:00',
        'Agendar veinte minutos de descanso a las 14:00',
        'No abrir el correo antes de cerrar la primera tarea',
    ],
    distraccion_entorno: [
        'Dejar el teléfono en otra habitación durante el bloque',
        'Activar «no molestar» de 09:00 a 12:00',
        'Cerrar todas las pestañas salvo la tarea activa',
    ],
    perfeccionismo: [
        'Enviar el borrador marcado como tal aunque no esté pulido',
        'Treinta minutos como máximo por correo importante',
        'Preguntar si cumple el objetivo; si lo cumple, enviarlo',
    ],
    miedo_exposicion: [
        'Compartir primero con una persona de confianza',
        'Publicar en el canal interno antes que en el externo',
        'Pedir observaciones de forma explícita como práctica',
    ],
};

const WINS: readonly string[] = [
    'Mantuve el foco en la tarea principal',
    'Completé el bloque de trabajo profundo',
    'Tuve la conversación difícil y salió bien',
    'Dije que no a algo que no era prioritario',
    'Cerré el día sin deuda de compromisos',
];

const GOAL_IDS = ['goal-ppc', 'goal-energy', 'goal-recurrence'] as const;

function energyFrom(random: () => number): EnergyLevel {
    const roll = random();
    if (roll < 0.05) return 1;
    if (roll < 0.15) return 2;
    if (roll < 0.45) return 3;
    if (roll < 0.85) return 4;
    return 5;
}

/**
 * Verification status.
 *
 * Entries from the last two days stay `pendiente`: their verification has not
 * come due yet. The original marked everything verified the moment it was
 * generated, which is why the demo never showed the pending state that the
 * whole verification banner exists for.
 */
function statusFrom(random: () => number, dayOffset: number): AdjustmentStatus {
    if (dayOffset <= 1) return 'pendiente';
    const roll = random();
    if (roll < 0.6) return 'si';
    if (roll < 0.8) return 'parcial';
    return 'no';
}

export interface GeneratedData {
    entries: FailureEntry[];
    constraints: Constraint[];
}

export function generateData(options: { orgId: string; days: number; now: Millis }): GeneratedData {
    const random = seeded(0x5eed_42);
    const entries: FailureEntry[] = [];
    let sequence = 0;

    for (let dayOffset = options.days - 1; dayOffset >= 0; dayOffset -= 1) {
        const day = startOfDay(addDays(options.now, -dayOffset));

        // A day in three has no entry at all, so adherence and the streak are
        // something other than 100%.
        if (random() < 0.3) continue;

        const count = random() < 0.55 ? 1 : random() < 0.85 ? 2 : 3;

        for (let index = 0; index < count; index += 1) {
            const cause = weighted(random, CAUSE_WEIGHTS);
            sequence += 1;

            entries.push({
                id: `gen-${sequence}`,
                orgId: options.orgId,
                date: toDateKey(day),
                at: day + (8 + index * 4) * 3_600_000 + Math.floor(random() * 3_600_000),
                failure: pick(random, FAILURES[cause]),
                rootCause: cause,
                adjustment: pick(random, ADJUSTMENTS[cause]),
                adjustmentStatus: statusFrom(random, dayOffset),
                win: random() < 0.6 ? pick(random, WINS) : '',
                energy: energyFrom(random),
                goalId: pick(random, GOAL_IDS),
            });
        }
    }

    return { entries, constraints: generateConstraints(options.orgId, options.now) };
}

function generateConstraints(orgId: string, now: Millis): Constraint[] {
    return [
        {
            id: 'gen-c-1',
            orgId,
            description: 'Sobrecompromiso crónico en la planificación diaria',
            rootCause: 'sobrecompromiso',
            status: 'activa',
            since: addDays(now, -22),
            goalIds: ['goal-ppc', 'goal-energy'],
        },
        {
            id: 'gen-c-2',
            orgId,
            description: 'Conversaciones incómodas que se aplazan',
            rootCause: 'evitacion_conflicto',
            status: 'en_experimento',
            since: addDays(now, -8),
            goalIds: ['goal-ppc'],
        },
        {
            id: 'gen-c-3',
            orgId,
            description: 'Perfeccionismo en la entrega de borradores',
            rootCause: 'perfeccionismo',
            status: 'neutralizada',
            since: addDays(now, -35),
            goalIds: ['goal-recurrence'],
        },
    ];
}
