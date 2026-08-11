import { evaluateSample, tallyAlarms } from './alarms';
import { botrytisRisk, type BotrytisRisk } from './agronomy';
import { findChannel } from './farms';
import { latestSample, statsFor, type ChannelStats } from './series';
import type { Alarm, AlarmCondition, Channel, ChannelId, GreenhouseSample } from './types';

/**
 * Answering a question typed in Spanish about the loaded window.
 *
 * This is keyword matching over measurements. It is *not* a language model,
 * and the view says so — the panel it feeds is labelled "búsqueda por
 * palabras clave" rather than "Agro-Sentinel AI".
 *
 * What it replaces claimed otherwise. `services/dataService.js` matched the
 * same handful of regexes, formatted the result as a markdown blob with
 * emoji, and printed alongside it a **fabricated** BigQuery statement under
 * the heading "BIGQUERY SQL" — a query that was never sent anywhere, against
 * a table that `terraform` has never created. A user reading that panel had
 * every reason to believe a warehouse had been queried.
 *
 * The answer here is a typed value, not prose: the view renders it, so the
 * numbers on screen are the same numbers the rest of the console shows,
 * formatted by the same code.
 */

export type QueryIntent = 'max' | 'min' | 'mean' | 'latest' | 'alarms' | 'status' | 'help';

export interface ParsedQuery {
    intent: QueryIntent;
    /** Null when the question named no channel. */
    channel: ChannelId | null;
}

/**
 * Strips accents and case so "máximo" and "maximo" are one word.
 *
 * Subscript digits are folded too: the console writes CO₂ with U+2082, so a
 * user copying the suggested question would otherwise ask about a channel
 * whose name they had typed correctly and get the help text back.
 */
function normalise(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/₂/g, '2')
        .toLowerCase()
        .trim();
}

/**
 * Channel keywords, matched on word boundaries.
 *
 * Two details that a plain `includes` gets wrong, and the old
 * `analyzeLocally` did get wrong: "par" is a prefix of "para", so
 * `/par|rad|light/` classified "¿la temperatura para hoy?" as a question
 * about radiation; and "humedad de suelo" has to be tested before "humedad",
 * or every soil question answers about the air.
 */
const CHANNEL_WORDS: readonly (readonly [ChannelId, readonly string[]])[] = [
    ['soilMoisture', ['humedad de suelo', 'humedad del suelo', 'suelo', 'sustrato', 'riego']],
    ['vpd', ['vpd', 'deficit', 'presion de vapor', 'vapor']],
    ['co2', ['co2', 'dioxido', 'carbono']],
    ['par', ['par', 'radiacion', 'luz', 'luminosidad', 'ppfd']],
    ['batteryPct', ['bateria', 'pila', 'carga']],
    ['rssiDbm', ['rssi', 'senal', 'cobertura', 'radio']],
    ['airTemperature', ['temperatura', 'temp', 'calor', 'frio', 'grados']],
    ['humidity', ['humedad', 'hr']],
];

/** `\b` around each phrase, so a keyword never matches inside a longer word. */
const CHANNEL_PATTERNS: readonly (readonly [ChannelId, RegExp])[] = CHANNEL_WORDS.map(
    ([id, words]) => [id, new RegExp(`\\b(${words.join('|')})\\b`)] as const
);

const INTENT_WORDS: readonly (readonly [QueryIntent, RegExp])[] = [
    ['alarms', /alarma|alerta|falla|critic|aviso/],
    ['status', /estado|resumen|situacion|como esta|como va|diagnostico/],
    ['max', /maxim|mas alt|mayor|pico|tope|highest/],
    ['min', /minim|mas baj|menor|lowest/],
    ['mean', /promedio|media|average|medio/],
    ['latest', /ahora|actual|ultim|reciente|current/],
];

export function parseQuery(text: string): ParsedQuery {
    const query = normalise(text);

    const channel = CHANNEL_PATTERNS.find(([, pattern]) => pattern.test(query))?.[0] ?? null;

    const intent = INTENT_WORDS.find(([, pattern]) => pattern.test(query))?.[0];

    if (intent) return { intent, channel };
    // A bare channel name — "co2" — is a request for its current value.
    if (channel) return { intent: 'latest', channel };

    return { intent: 'help', channel: null };
}

export interface StatAnswer {
    kind: 'stat';
    intent: Extract<QueryIntent, 'max' | 'min' | 'mean' | 'latest'>;
    channel: Channel;
    /** The number the question asked for. */
    value: number;
    /** When it was measured. Null for an average, which happened at no instant. */
    at: number | null;
    stats: ChannelStats;
}

export interface AlarmsAnswer {
    kind: 'alarms';
    standing: Alarm[];
    total: number;
}

export interface StatusAnswer {
    kind: 'status';
    sample: GreenhouseSample;
    conditions: AlarmCondition[];
    risk: BotrytisRisk;
}

export interface EmptyAnswer {
    kind: 'empty';
    /** Already translated, and specific about what is missing. */
    reason: string;
}

export interface HelpAnswer {
    kind: 'help';
    examples: readonly string[];
}

export type QueryAnswer = StatAnswer | AlarmsAnswer | StatusAnswer | EmptyAnswer | HelpAnswer;

export const EXAMPLES: readonly string[] = [
    '¿Cuál fue la temperatura máxima?',
    '¿Cuál es el promedio de humedad?',
    '¿Hay alarmas activas?',
    '¿Cuál fue el pico de CO₂?',
    '¿Cómo está la humedad del suelo?',
    '¿Cómo está el invernadero?',
];

export function answerQuery(
    text: string,
    context: { samples: readonly GreenhouseSample[]; alarms: readonly Alarm[] }
): QueryAnswer {
    const { intent, channel } = parseQuery(text);

    if (intent === 'help') return { kind: 'help', examples: EXAMPLES };

    if (intent === 'alarms') {
        const tally = tallyAlarms(context.alarms);
        return {
            kind: 'alarms',
            standing: context.alarms.filter((alarm) => alarm.clearedAt === null),
            total: tally.standing,
        };
    }

    const newest = latestSample(context.samples);
    if (!newest) {
        return { kind: 'empty', reason: 'No hay lecturas en el periodo seleccionado.' };
    }

    if (intent === 'status') {
        return {
            kind: 'status',
            sample: newest,
            conditions: evaluateSample(newest),
            risk: botrytisRisk(newest.airTemperature, newest.humidity),
        };
    }

    // Every remaining intent is about one channel; temperature is the default
    // only because it is the one a grower asks about most.
    const id = channel ?? 'airTemperature';
    const stats = statsFor(context.samples, id);

    if (!stats) {
        return {
            kind: 'empty',
            reason: `No hay lecturas de ${findChannel(id).label.toLowerCase()} en el periodo.`,
        };
    }

    const picked =
        intent === 'max'
            ? { value: stats.max, at: stats.maxAt }
            : intent === 'min'
              ? { value: stats.min, at: stats.minAt }
              : intent === 'mean'
                ? { value: stats.mean, at: null }
                : { value: stats.latest, at: stats.latestAt };

    return {
        kind: 'stat',
        intent,
        channel: findChannel(id),
        value: picked.value,
        at: picked.at,
        stats,
    };
}
