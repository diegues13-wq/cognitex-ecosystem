import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';

import type { FleetKpis, RamsMetric, TrainSnapshot, WorkOrder } from '../domain/types';
import { CHAT_FAILURE_MESSAGE, ChatError, streamChat } from '../services/chat';
import { Panel, StatusPill } from '../components/Panel';
import { RankedBars, type Bucket } from '../components/Charts';

/**
 * The railway assistant.
 *
 * The three sidebar panels used to be arrays of constants: predicted failures
 * for trains that had no such work order, "anomalies" naming routes that do
 * not exist (RT-009 labelled Lima–Cuzco when it is the Ecuadorian line), and
 * recommendations citing an OTP figure nothing produced. They now read the
 * same work orders and RAMS metrics as the maintenance view, so the assistant
 * screen and the maintenance screen cannot contradict each other.
 */

const SUGGESTIONS = [
    { label: 'Estado de la flota', query: '¿Cómo está la eficiencia general de la flota?' },
    { label: 'Puntualidad', query: '¿Cuál es el OTP actual y qué trenes acumulan más retraso?' },
    {
        label: 'Mantenimiento',
        query: '¿Qué trenes necesitan mantenimiento urgente según el MTBF y el MTTR actuales?',
    },
    {
        label: 'Energía',
        query: '¿Cuánta energía consume hoy la flota eléctrica y cuál es el coste estimado?',
    },
    { label: 'Seguridad', query: '¿Hay incidentes activos? Analiza las causas raíz.' },
    {
        label: 'Predicción',
        query: '¿Qué componentes tienen mayor riesgo de fallo en los próximos 30 días?',
    },
];

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming: boolean;
    /** Set when the turn ended in an error rather than an answer. */
    failed: boolean;
}

function buildContext(kpis: FleetKpis, snapshot: TrainSnapshot[]): string {
    const running = snapshot.filter((train) => train.status === 'EN_SERVICIO').length;
    const maintenance = snapshot.filter(
        (train) => train.status === 'EN_MANTENIMIENTO'
    ).length;

    return [
        'CONTEXTO DEL SISTEMA FERROVIARIO (Transport Sentinel — Américas):',
        `- Flota: ${snapshot.length} unidades (${running} en servicio, ${maintenance} en mantenimiento).`,
        `- OTP global: ${kpis.otp} %.`,
        `- MTBF: ${kpis.mtbf} h · MTTR: ${kpis.mttr} h · Disponibilidad RAMS: ${kpis.ramsDisponibilidad} %.`,
        `- Incidentes hoy: ${kpis.incidentesHoy}. Días sin accidente: ${kpis.diasSinAccidente}.`,
        `- Energía: ${kpis.energiaTotal} kWh eléctricos y ${kpis.combustibleTotal} L de diésel en la jornada.`,
        '- Red: 16 rutas en Estados Unidos, Canadá, México, Panamá, Colombia, Venezuela, Ecuador, Perú, Bolivia, Chile, Argentina, Uruguay y Brasil.',
        'IMPORTANTE: los datos anteriores provienen de un generador de simulación, no de telemetría real. Dilo si el usuario pregunta por su procedencia.',
        'Responde en español, con concisión, y usa viñetas cuando ayuden.',
    ].join('\n');
}

/** Bold and italic only. No HTML is ever constructed from model output. */
function InlineMarkdown({ text }: { text: string }) {
    const parts = useMemo(() => {
        const nodes: { key: number; text: string; strong: boolean; emphasis: boolean }[] = [];
        const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
        let last = 0;
        let key = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
            if (match.index > last) {
                nodes.push({
                    key: key++,
                    text: text.slice(last, match.index),
                    strong: false,
                    emphasis: false,
                });
            }
            nodes.push({
                key: key++,
                text: match[1] ?? match[2] ?? '',
                strong: match[1] !== undefined,
                emphasis: match[2] !== undefined,
            });
            last = match.index + match[0].length;
        }
        if (last < text.length) {
            nodes.push({ key: key++, text: text.slice(last), strong: false, emphasis: false });
        }
        return nodes;
    }, [text]);

    return (
        <>
            {parts.map((part) =>
                part.strong ? (
                    <strong key={part.key} className="font-semibold text-ice">
                        {part.text}
                    </strong>
                ) : part.emphasis ? (
                    <em key={part.key}>{part.text}</em>
                ) : (
                    <span key={part.key}>{part.text}</span>
                )
            )}
        </>
    );
}

function Bubble({ message }: { message: Message }) {
    const user = message.role === 'user';

    return (
        <li className={`flex gap-2 ${user ? 'flex-row-reverse' : ''}`}>
            <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-steel/25"
                aria-hidden="true"
            >
                {user ? <User size={13} /> : <Bot size={13} />}
            </span>
            <div
                className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${
                    user ? 'bg-navy-700 text-ice' : 'occ-panel-inset text-ice'
                }`}
                style={
                    message.failed
                        ? { borderColor: 'color-mix(in srgb, var(--color-alert) 45%, transparent)' }
                        : undefined
                }
            >
                <p className="sr-only">{user ? 'Usted' : 'Asistente'}</p>
                {message.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1 last:mb-0">
                        <InlineMarkdown text={line} />
                    </p>
                ))}
                {message.streaming && (
                    <span
                        className="ml-0.5 inline-block h-3.5 w-1.5 align-text-bottom"
                        style={{ backgroundColor: 'var(--color-brand)' }}
                        aria-hidden="true"
                    />
                )}
            </div>
        </li>
    );
}

export interface AIViewProps {
    kpis: FleetKpis;
    snapshot: TrainSnapshot[];
    orders: WorkOrder[];
    rams: RamsMetric[];
    demoMode: boolean;
}

export default function AIView({ kpis, snapshot, orders, rams, demoMode }: AIViewProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            streaming: false,
            failed: false,
            content:
                'Soy el asistente de **Transport Sentinel**. Tengo delante el estado de la flota, la puntualidad, el consumo energético, el plan de mantenimiento y el registro de incidentes.\n\n¿Qué necesita revisar?',
        },
    ]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    const send = useCallback(
        async (query: string) => {
            const prompt = query.trim();
            if (!prompt || busy) return;

            const turnId = `turn-${Date.now()}`;
            setInput('');
            setBusy(true);
            setMessages((previous) => [
                ...previous,
                { id: `${turnId}-user`, role: 'user', content: prompt, streaming: false, failed: false },
                {
                    id: turnId,
                    role: 'assistant',
                    content: '',
                    streaming: true,
                    failed: false,
                },
            ]);

            const update = (patch: Partial<Message>) => {
                setMessages((previous) =>
                    previous.map((message) =>
                        message.id === turnId ? { ...message, ...patch } : message
                    )
                );
            };

            try {
                await streamChat({
                    prompt,
                    systemInstruction: `Eres el asistente de operaciones ferroviarias de Transport Sentinel, experto en normas UIC, RAMS/EN 50126 e IEC 62290. ${buildContext(kpis, snapshot)}`,
                    onText: (text) => update({ content: text }),
                });
                update({ streaming: false });
            } catch (error) {
                const failure = error instanceof ChatError ? error.failure : 'unavailable';
                update({
                    content: CHAT_FAILURE_MESSAGE[failure],
                    streaming: false,
                    failed: true,
                });
            } finally {
                setBusy(false);
            }
        },
        [busy, kpis, snapshot]
    );

    // The predicted failures the maintenance planner is already looking at.
    const predicted = orders
        .filter((order) => order.aiPredictedFailureDate !== null)
        .sort((a, b) => (a.remainingLifePct ?? 100) - (b.remainingLifePct ?? 100))
        .slice(0, 5);

    const health: Bucket[] = useMemo(
        () =>
            [...rams]
                .sort((a, b) => a.healthScore - b.healthScore)
                .slice(0, 8)
                .map((metric) => ({
                    label: metric.trainId,
                    title: `${metric.trainName}: disponibilidad ${metric.availability} %`,
                    value: metric.healthScore,
                    color:
                        metric.healthScore >= 75
                            ? 'var(--color-ok)'
                            : metric.healthScore >= 55
                              ? 'var(--color-warn)'
                              : 'var(--color-alert)',
                })),
        [rams]
    );

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex flex-col gap-3">
                {demoMode && (
                    <Panel>
                        <p className="text-sm text-ice">
                            El asistente requiere una sesión verificada.
                        </p>
                        <p className="mt-1 text-sm text-steel">
                            Esta consola está en modo demo, sin autenticación real, y las consultas
                            al modelo se facturan — por eso el servidor las rechaza sin una
                            identidad. El resto de las secciones funciona con normalidad.
                        </p>
                    </Panel>
                )}

                <ul
                    className="m-0 flex max-h-[28rem] list-none flex-col gap-3 overflow-y-auto p-0"
                    aria-live="polite"
                    aria-label="Conversación con el asistente"
                >
                    {messages.map((message) => (
                        <Bubble key={message.id} message={message} />
                    ))}
                    <div ref={endRef} />
                </ul>

                <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((suggestion) => (
                        <button
                            key={suggestion.label}
                            type="button"
                            onClick={() => void send(suggestion.query)}
                            disabled={busy || demoMode}
                            className="min-h-9 rounded-lg border border-steel/25 px-3 text-xs text-steel hover:text-ice disabled:opacity-40"
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void send(input);
                    }}
                    className="flex gap-2"
                >
                    <label htmlFor="ai-prompt" className="sr-only">
                        Pregunta sobre la operación ferroviaria
                    </label>
                    <input
                        id="ai-prompt"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Pregunte sobre la operación ferroviaria…"
                        disabled={busy || demoMode}
                        className="min-h-12 flex-1 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)] disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={busy || demoMode || input.trim() === ''}
                        className="flex size-12 items-center justify-center rounded-lg text-navy-900 disabled:opacity-40"
                        style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                        <Send size={16} aria-hidden="true" />
                        <span className="sr-only">Enviar</span>
                    </button>
                </form>
            </section>

            <div className="flex flex-col gap-4">
                <Panel title="Fallos previstos">
                    {predicted.length === 0 ? (
                        <p className="text-sm text-steel">
                            Ninguna orden abierta tiene una fecha de fallo prevista.
                        </p>
                    ) : (
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                            {predicted.map((order) => (
                                <li key={order.id} className="text-sm">
                                    <p className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-ice">{order.assetId}</span>
                                        {order.remainingLifePct !== null && (
                                            <StatusPill
                                                status={
                                                    order.remainingLifePct <= 15
                                                        ? 'alert'
                                                        : order.remainingLifePct <= 40
                                                          ? 'warning'
                                                          : 'ok'
                                                }
                                            >
                                                {order.remainingLifePct} % de vida
                                            </StatusPill>
                                        )}
                                    </p>
                                    <p className="text-xs text-steel">{order.component}</p>
                                    <p className="text-xs text-steel">
                                        Fallo previsto {order.aiPredictedFailureDate}
                                        {order.aiConfidencePct !== null &&
                                            ` · confianza ${order.aiConfidencePct} %`}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Salud de flota — menores primero">
                    <RankedBars
                        data={health}
                        label="Índice de salud por unidad, de menor a mayor"
                        max={100}
                        format={(value) => `${Math.round(value)}`}
                    />
                </Panel>
            </div>
        </div>
    );
}
