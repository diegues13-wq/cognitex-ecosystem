/**
 * dataGenerator.js — Mock productivity loop data for Productivity Sentinel.
 *
 * Simulates 30 days of "closed-loop" personal improvement data:
 * failures logged, root causes identified, adjustments proposed and verified.
 */

import { subDays, format, startOfWeek, getWeek } from 'date-fns';

// ── Root Cause Taxonomy ────────────────────────────────────────────────────────
export const CAUSAS_RAIZ = {
    evitacion_conflicto: { label: 'Evitación de conflicto', emoji: '🫤', color: '#ef4444' },
    sobrecompromiso:     { label: 'Sobrecompromiso',         emoji: '📋', color: '#f97316' },
    falta_descomposicion:{ label: 'Falta de descomposición', emoji: '🧩', color: '#eab308' },
    gestion_energia:     { label: 'Gestión de energía',      emoji: '⚡', color: '#3b82f6' },
    distraccion_entorno: { label: 'Distracción/entorno',     emoji: '📱', color: '#a855f7' },
    miedo_exposicion:    { label: 'Miedo a exponerse',       emoji: '😟', color: '#ec4899' },
    perfeccionismo:      { label: 'Perfeccionismo/parálisis',emoji: '🔄', color: '#14b8a6' },
};

// Weighted distribution for root causes
const CAUSA_WEIGHTS = [
    { key: 'sobrecompromiso',      weight: 28 },
    { key: 'evitacion_conflicto',  weight: 25 },
    { key: 'falta_descomposicion', weight: 15 },
    { key: 'gestion_energia',      weight: 12 },
    { key: 'distraccion_entorno',  weight: 10 },
    { key: 'perfeccionismo',       weight:  7 },
    { key: 'miedo_exposicion',     weight:  3 },
];

// ── Goals / Setpoints ─────────────────────────────────────────────────────────
export const METAS = [
    { id: 'meta-1', nombre: 'Bloques de trabajo profundo', metrica: 'horas/día',  unidad: 'h',    valor_objetivo: 3,  categoria: 'productividad' },
    { id: 'meta-2', nombre: 'Compromisos cumplidos',        metrica: '%/semana',   unidad: '%',    valor_objetivo: 90, categoria: 'fiabilidad' },
    { id: 'meta-3', nombre: 'Conversaciones difíciles',     metrica: 'por semana', unidad: 'conv', valor_objetivo: 2,  categoria: 'comunicacion' },
];

// ── Restrictions (Kanban) ─────────────────────────────────────────────────────
export const RESTRICTIONS = [
    { id: 'r-1', descripcion: 'Sobrecompromiso crónico',         causa_raiz: 'sobrecompromiso',     estado: 'activa',          dias_activa: 22, metas_afectadas: ['meta-1', 'meta-2'] },
    { id: 'r-2', descripcion: 'Evitar conversaciones incómodas', causa_raiz: 'evitacion_conflicto', estado: 'en_experimento',  dias_activa:  8, metas_afectadas: ['meta-3'] },
    { id: 'r-3', descripcion: 'Perfeccionismo en entregas',       causa_raiz: 'perfeccionismo',      estado: 'neutralizada',    dias_activa:  0, metas_afectadas: ['meta-1'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function weightedRandom(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
        r -= item.weight;
        if (r <= 0) return item.key;
    }
    return items[items.length - 1].key;
}

function seededPseudoRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

const FALLOS_TEMPLATES = {
    sobrecompromiso:     ['Acepté una reunión de más cuando ya tenía el día lleno', 'Dije que sí a un proyecto adicional sin revisar mi carga', 'Me comprometí con 5 tareas cuando solo podía completar 3', 'Accedí a ayudar a un colega sacrificando mi bloque de trabajo profundo'],
    evitacion_conflicto: ['Pospuse la llamada difícil con el cliente por tercera vez', 'Evité dar feedback negativo en la revisión del equipo', 'No confronté el problema de scope con el stakeholder', 'Dejé pasar el comentario inapropiado en la reunión'],
    falta_descomposicion:['Bloqueé "trabajar en el proyecto" sin definir el primer paso', 'La tarea parecía grande así que no la empecé', 'No dividí el entregable en subtareas accionables', 'Intenté hacer todo de una vez en lugar de iterar'],
    gestion_energia:     ['Programé trabajo profundo para las 3pm cuando ya estoy agotado', 'No tomé el descanso de mediodía y perdí el foco', 'Revisé email a primera hora y perdí el impulso creativo', 'Trasnochué la noche anterior y no rendí hoy'],
    distraccion_entorno: ['Fui a trabajar con el teléfono desbloqueado en el escritorio', 'Trabajé con Slack abierto durante el bloque de enfoque', 'El espacio de trabajo estaba desordenado y me distraje', 'Revisé redes sociales 6 veces en la mañana'],
    perfeccionismo:      ['Reescribí el email 4 veces en lugar de enviarlo', 'Pospuse enviar el borrador porque "no estaba listo"', 'Invertí 3h en formato en lugar de en contenido', 'No entregué a tiempo esperando que fuera perfecto'],
    miedo_exposicion:    ['No presenté la idea en la reunión por miedo a ser juzgado', 'Evité publicar el artículo terminado', 'No pedí el feedback que necesitaba para crecer'],
};

const AJUSTES_TEMPLATES = {
    sobrecompromiso:     ['Antes de decir sí, preguntar: ¿qué tengo que quitar para hacer esto?', 'Establecer límite máximo de 3 compromisos nuevos por día', 'Revisar el calendario antes de aceptar cualquier solicitud', 'Decir "necesito revisar mi agenda" antes de comprometerme'],
    evitacion_conflicto: ['Agendar la conversación difícil en los próximos 2 días', 'Preparar los 3 puntos clave que quiero comunicar antes de la llamada', 'Enviar el mensaje antes de las 10am para no posponer más', 'Usar el framework: "Observé X, siento Y, necesito Z"'],
    falta_descomposicion:['Definir el próximo paso físico de la tarea en 2 minutos o menos', 'Dividir el proyecto en sprints de 25 minutos', 'Escribir la primera acción concreta antes de cerrar el día', 'Usar la regla: la tarea no entra al día si no tiene un verbo de acción'],
    gestion_energia:     ['Mover el bloque de trabajo profundo a las 9-11am mañana', 'Agendar un descanso de 20 min a las 2pm', 'No revisar email antes de completar la primera tarea del día', 'Dormir antes de las 11pm para tener energía mañana'],
    distraccion_entorno: ['Poner el teléfono en otra habitación durante el bloque de enfoque', 'Usar modo "No molestar" en todas las apps de 9-12am', 'Limpiar el escritorio físico antes de empezar', 'Cerrar todas las tabs excepto la tarea activa'],
    perfeccionismo:      ['Enviar el borrador aunque no esté perfecto con nota "draft"', 'Establecer un tiempo límite: 30 min máx por email importante', 'Practicar el "suficientemente bueno": ¿cumple el objetivo? Envía.', 'Recordar que hecho es mejor que perfecto'],
    miedo_exposicion:    ['Compartir la idea primero con una persona de confianza', 'Publicar el borrador en un canal interno antes del externo', 'Pedir feedback explícitamente como práctica deliberada'],
};

// ── Main Generator ────────────────────────────────────────────────────────────
export function generateEntries(days = 30) {
    const rng = seededPseudoRandom(42);
    const entries = [];
    const today = new Date();
    let idCounter = 1;

    for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
        const date = subDays(today, dayOffset);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayIndex = days - 1 - dayOffset; // 0 = oldest day, 29 = today

        // Number of entries per day: 1-3
        const numEntries = rng() < 0.3 ? 1 : rng() < 0.6 ? 2 : 3;

        // Recurrence rate decreases over time
        // Days 0-9 (oldest): ~75% recurrence
        // Days 10-19 (middle): ~50%
        // Days 20-29 (recent): ~25%
        let recurrenceThreshold;
        if (dayIndex < 10) recurrenceThreshold = 0.75;
        else if (dayIndex < 20) recurrenceThreshold = 0.50;
        else recurrenceThreshold = 0.25;

        for (let e = 0; e < numEntries; e++) {
            const causa = weightedRandom(CAUSA_WEIGHTS);
            const falloList = FALLOS_TEMPLATES[causa];
            const ajusteList = AJUSTES_TEMPLATES[causa];
            const falloIdx = Math.floor(rng() * falloList.length);
            const ajusteIdx = Math.floor(rng() * ajusteList.length);

            // Implementation rate ~65%
            const implementado = rng() < 0.65 ? 'si' : rng() < 0.7 ? 'parcial' : 'no';

            // nivel_energia: weighted toward 3-4
            const energiaRand = rng();
            let nivel_energia;
            if (energiaRand < 0.05) nivel_energia = 1;
            else if (energiaRand < 0.15) nivel_energia = 2;
            else if (energiaRand < 0.45) nivel_energia = 3;
            else if (energiaRand < 0.85) nivel_energia = 4;
            else nivel_energia = 5;

            // Acierto
            const aciertos = ['Mantuve el foco en la tarea principal', 'Completé el bloque de trabajo profundo', 'Tuve una conversación difícil y fue bien', 'Dije que no a algo que no era prioritario', 'Terminé el día sin deuda de compromisos'];
            const acierto = rng() < 0.7 ? aciertos[Math.floor(rng() * aciertos.length)] : '';

            // Meta asociada
            const metaRand = rng();
            const meta_id = metaRand < 0.5 ? 'meta-1' : metaRand < 0.8 ? 'meta-2' : 'meta-3';

            entries.push({
                id: `entry-${idCounter++}`,
                date: dateStr,
                fallo: falloList[falloIdx],
                fallo_normalizado: falloList[falloIdx],
                causa_raiz: causa,
                ajuste: ajusteList[ajusteIdx],
                implementado,
                es_recurrente: rng() < recurrenceThreshold,
                acierto,
                nivel_energia,
                meta_id,
                fecha: date,
            });
        }
    }

    return entries;
}

// ── KPI Time Series ───────────────────────────────────────────────────────────
export function generateKPISeries(entries) {
    const today = new Date();
    const series = [];

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const date = subDays(today, dayOffset);
        const dateStr = format(date, 'yyyy-MM-dd');

        // Entries up to this day
        const upToNow = entries.filter(e => e.date <= dateStr);
        if (upToNow.length === 0) {
            series.push({ date: format(date, 'dd/MM'), logging_adherence: 0, implementation_rate: 0, recurrence_rate: 100 });
            continue;
        }

        // Days with at least 1 entry
        const uniqueDays = new Set(upToNow.map(e => e.date)).size;
        const totalDays = 30 - dayOffset;
        const logging_adherence = Math.round((uniqueDays / totalDays) * 100);

        // Implementation rate
        const withAdjust = upToNow.filter(e => e.ajuste);
        const implemented = withAdjust.filter(e => e.implementado === 'si' || e.implementado === 'parcial');
        const implementation_rate = withAdjust.length > 0 ? Math.round((implemented.length / withAdjust.length) * 100) : 0;

        // Recurrence rate
        const recurring = upToNow.filter(e => e.es_recurrente);
        const recurrence_rate = Math.round((recurring.length / upToNow.length) * 100);

        series.push({
            date: format(date, 'dd/MM'),
            logging_adherence,
            implementation_rate,
            recurrence_rate,
        });
    }

    return series;
}

// ── Control Loop Data ─────────────────────────────────────────────────────────
export function generateControlLoopData(metaId = 'meta-1', days = 30) {
    const meta = METAS.find(m => m.id === metaId) || METAS[0];
    const today = new Date();
    const data = [];
    const rng = seededPseudoRandom(99);

    for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
        const date = subDays(today, dayOffset);
        const dayIndex = days - 1 - dayOffset; // 0=oldest, 29=today
        const progress = dayIndex / (days - 1); // 0 to 1

        let actual;
        if (metaId === 'meta-1') {
            // Deep work hours: starts ~1.5, trends to ~2.8 with noise
            const trend = 1.5 + progress * 1.3;
            actual = parseFloat((trend + (rng() - 0.5) * 0.5).toFixed(1));
            actual = Math.max(0.5, Math.min(4, actual));
        } else if (metaId === 'meta-2') {
            // Commitments kept %: starts ~60, trends to ~82
            const trend = 60 + progress * 22;
            actual = Math.round(trend + (rng() - 0.5) * 10);
            actual = Math.max(20, Math.min(100, actual));
        } else {
            // Difficult conversations: starts ~0.5, trends to ~1.6
            const trend = 0.5 + progress * 1.1;
            actual = parseFloat((trend + (rng() - 0.5) * 0.4).toFixed(1));
            actual = Math.max(0, Math.min(4, actual));
        }

        const setpoint = meta.valor_objetivo;
        const error = parseFloat((actual - setpoint).toFixed(2));

        data.push({
            date: format(date, 'dd/MM'),
            setpoint,
            actual,
            error,
        });
    }

    return data;
}

// ── Weekly Synthesis ──────────────────────────────────────────────────────────
export function getWeeklySynthesis(entries) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekNum = getWeek(today, { weekStartsOn: 1 });

    const weekEntries = entries.filter(e => new Date(e.fecha) >= weekStart);
    const allEntries = entries;

    // Top causes this week
    const causaCounts = {};
    allEntries.forEach(e => {
        causaCounts[e.causa_raiz] = (causaCounts[e.causa_raiz] || 0) + 1;
    });
    const sortedCausas = Object.entries(causaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([key, count]) => ({
            key,
            label: CAUSAS_RAIZ[key]?.label || key,
            emoji: CAUSAS_RAIZ[key]?.emoji || '',
            count,
            pct: Math.round((count / allEntries.length) * 100),
        }));

    return {
        weekNum,
        causasDominantes: sortedCausas,
        restriccionPrioritaria: RESTRICTIONS.find(r => r.estado === 'activa') || RESTRICTIONS[0],
        experimento: {
            hipotesis: 'Si limito mis compromisos diarios a 3, la tasa de cumplimiento subirá por encima del 85%.',
            accion: 'Cada mañana, antes de revisar el email, listar máximo 3 compromisos del día. Si llega una solicitud nueva, evaluar qué se quita.',
            metrica: 'Tasa de cumplimiento de compromisos ≥ 85% al final de la semana.',
        },
        weekEntries,
    };
}
