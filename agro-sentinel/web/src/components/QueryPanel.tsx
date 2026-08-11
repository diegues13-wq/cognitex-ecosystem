import { useId, useState, type FormEvent } from 'react';
import { StatusDot } from '@cognitex/ui';

import { EXAMPLES, answerQuery } from '../domain';
import type { Alarm, GreenhouseSample, QueryAnswer } from '../domain';
import { formatDateTime, formatValue } from '../format';

/**
 * Asking the window a question.
 *
 * This is keyword search over the loaded readings, and it says so on screen.
 * What it replaces was a 266-line chat window branded "Agro-Sentinel AI" that
 * matched six regexes, formatted the result as markdown with emoji, and
 * displayed underneath it a **fabricated** BigQuery statement labelled
 * "BIGQUERY SQL" — a query that was never executed, against a table that no
 * deployed infrastructure has ever created.
 *
 * The answer is typed, so the number here is formatted by the same code as
 * the number on the metric card, and cannot drift from it.
 */

export interface QueryPanelProps {
    samples: readonly GreenhouseSample[];
    alarms: readonly Alarm[];
}

export function QueryPanel({ samples, alarms }: QueryPanelProps) {
    const inputId = useId();
    const [text, setText] = useState('');
    const [asked, setAsked] = useState('');
    const [answer, setAnswer] = useState<QueryAnswer | null>(null);

    const ask = (question: string) => {
        const trimmed = question.trim();
        if (!trimmed) return;

        setAsked(trimmed);
        setAnswer(answerQuery(trimmed, { samples, alarms }));
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        ask(text);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                    <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ice">
                        Pregunta sobre las lecturas cargadas
                    </label>
                    <input
                        id={inputId}
                        type="text"
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="¿Cuál fue la temperatura máxima?"
                        className="min-h-12 w-full rounded-lg border border-steel/25 bg-navy-900 px-3 text-ice outline-none focus:border-[var(--color-brand)]"
                    />
                </div>
                <button
                    type="submit"
                    className="min-h-12 rounded-lg px-5 font-semibold text-navy-900"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                >
                    Consultar
                </button>
            </form>

            <div>
                <p className="label-mono mb-2">Ejemplos</p>
                <ul className="flex flex-wrap gap-2">
                    {EXAMPLES.map((example) => (
                        <li key={example}>
                            <button
                                type="button"
                                onClick={() => {
                                    setText(example);
                                    ask(example);
                                }}
                                className="min-h-9 rounded-full border border-steel/25 px-3 text-xs text-steel transition-colors hover:bg-navy-700 hover:text-ice"
                            >
                                {example}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div aria-live="polite" className="min-h-24">
                {answer && <Answer question={asked} answer={answer} />}
            </div>
        </div>
    );
}

function Answer({ question, answer }: { question: string; answer: QueryAnswer }) {
    return (
        <article className="panel-raised p-4">
            <p className="label-mono mb-3">{question}</p>
            <AnswerBody answer={answer} />
        </article>
    );
}

const INTENT_LABEL: Record<'max' | 'min' | 'mean' | 'latest', string> = {
    max: 'Máximo',
    min: 'Mínimo',
    mean: 'Promedio',
    latest: 'Última lectura',
};

function AnswerBody({ answer }: { answer: QueryAnswer }) {
    if (answer.kind === 'help') {
        return (
            <div className="text-sm text-steel">
                <p>
                    No entendí la pregunta. Esto es una búsqueda por palabras clave sobre las
                    lecturas cargadas, no un modelo de lenguaje. Prueba con:
                </p>
                <ul className="mt-2 list-disc pl-5">
                    {answer.examples.map((example) => (
                        <li key={example}>{example}</li>
                    ))}
                </ul>
            </div>
        );
    }

    if (answer.kind === 'empty') {
        return <p className="text-sm text-steel">{answer.reason}</p>;
    }

    if (answer.kind === 'alarms') {
        return (
            <div>
                <p className="text-sm text-ice">
                    {answer.total === 0
                        ? 'Ninguna alarma activa en el periodo.'
                        : `${answer.total} alarma${answer.total === 1 ? '' : 's'} activa${
                              answer.total === 1 ? '' : 's'
                          }.`}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-steel">
                    {answer.standing.slice(0, 5).map((alarm) => (
                        <li key={alarm.id}>
                            {alarm.level === 'CRITICAL' ? 'Crítica' : 'Aviso'} · {alarm.channel} ·{' '}
                            {formatDateTime(alarm.raisedAt)}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (answer.kind === 'status') {
        return (
            <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-ice">
                    <StatusDot status={answer.conditions.length === 0 ? 'ok' : 'warning'} />
                    {answer.conditions.length === 0
                        ? 'Todos los canales dentro de límites'
                        : `${answer.conditions.length} canal(es) fuera de límites`}
                </p>
                <p className="text-steel">
                    Última lectura {formatDateTime(answer.sample.at)} · riesgo Botrytis{' '}
                    {answer.risk.level} — {answer.risk.reason}
                </p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-sm text-steel">
                {INTENT_LABEL[answer.intent]} de {answer.channel.label.toLowerCase()}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
                <span
                    className="text-[length:var(--text-metric)] leading-none font-semibold tabular"
                    data-metric
                >
                    {answer.value.toFixed(answer.channel.precision)}
                </span>
                <span className="text-sm text-steel">{answer.channel.unit}</span>
            </p>
            <p className="mt-2 text-xs text-steel">
                {answer.at !== null && <>Medido {formatDateTime(answer.at)} · </>}
                {answer.stats.count} lecturas · rango{' '}
                {formatValue(answer.stats.min, answer.channel)} –{' '}
                {formatValue(answer.stats.max, answer.channel)}
            </p>
        </div>
    );
}
