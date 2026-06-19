import { useState, useRef, useEffect, useCallback } from 'react';
import { Brain, Send, Train, AlertTriangle, Zap, TrendingUp, Bot, User, Lightbulb, Sparkles } from 'lucide-react';
import PropTypes from 'prop-types';

const GEMINI_KEY  = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const HAS_AI = !!GEMINI_KEY;

const SUGGESTIONS = [
    { label: 'Estado de la flota',    query: '¿Cómo está la eficiencia general de la flota?' },
    { label: 'OTP Puntualidad',       query: '¿Cuál es el OTP actual y los trenes con más retrasos?' },
    { label: 'Energía eléctrica',     query: '¿Cuántos kWh ha consumido la flota eléctrica hoy y cuál es el costo estimado?' },
    { label: 'Mantenimiento MTBF',    query: '¿Cuál es el MTBF y MTTR de la flota? ¿Qué trenes necesitan mantenimiento urgente?' },
    { label: 'Seguridad RAMS',        query: '¿Hay incidentes activos de seguridad? Análisis de causas raíz.' },
    { label: 'Sostenibilidad CO₂',    query: '¿Cuánto CO₂ ha emitido la flota? Comparativa eléctrico vs diésel.' },
    { label: 'Predicción de fallos',  query: '¿Cuáles son los componentes con mayor riesgo de fallo en los próximos 30 días?' },
    { label: 'Optimización de rutas', query: '¿Qué rutas tienen bajo rendimiento y qué cambios operacionales recomiendas?' },
];

const AI_PREDICTIONS = [
    { trainId: 'MEX-003', component: 'Rodamiento eje 3',         daysToFailure: 2,  confidence: 97, severity: 'CRITICO', action: 'OT WO-2026-0143 EN CURSO' },
    { trainId: 'BRZ-002', component: 'Motor tracción — temp.',   daysToFailure: 8,  confidence: 88, severity: 'ALTO',    action: 'Inspección urgente' },
    { trainId: 'COL-001', component: 'Pastillas de freno',       daysToFailure: 19, confidence: 91, severity: 'MEDIO',   action: 'OT WO-2026-0142 programada' },
    { trainId: 'USA-004', component: 'Pantógrafo slider carbono',daysToFailure: 45, confidence: 78, severity: 'BAJO',    action: 'Monitoreo continuo' },
];

const ANOMALIES = [
    { trainId: 'USA-001', metric: 'Consumo energético',      detail: '+18% vs baseline de ruta RT-001', type: 'ENERGIA' },
    { trainId: 'BRZ-003', metric: 'Nivel combustible',       detail: 'Bajo 18% — reabastecimiento', type: 'COMBUSTIBLE' },
    { trainId: 'ARG-002', metric: 'Retrasos recurrentes',    detail: 'RT-015 — 3 retrasos esta semana', type: 'OTP' },
    { trainId: 'CHI-001', metric: 'Temperatura pantógrafo',  detail: '+12°C sobre nominal', type: 'TEMPERATURA' },
];

const RECOMMENDATIONS = [
    'RT-009 (Lima-Cuzco) presenta OTP por debajo del 80% en horarios pico 07:00-09:00. Revisar programación de salidas y mantenimiento de vía.',
    'Tren USA-001 consume 18% más energía de lo nominal. Auditar perfil de velocidad, estado del pantógrafo y condición de vía.',
    'Implementar mantenimiento preventivo adelantado para MEX-003 basado en predicción de temperatura anormal en rodamiento.',
    'La ruta RT-016 (Montevideo) reporta el mejor OTP de la red (97.2%) — analizar y replicar las prácticas operativas.',
];

const SEVERITY_COLORS = {
    CRITICO: 'text-red-400 bg-red-500/10 border-red-500/30',
    ALTO:    'text-amber-400 bg-amber-500/10 border-amber-500/30',
    MEDIO:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    BAJO:    'text-slate-400 bg-slate-700/30 border-slate-700/40',
};

const TYPE_ICON = { ENERGIA: '⚡', COMBUSTIBLE: '⛽', OTP: '⏱', TEMPERATURA: '🌡️' };

// ── Build context string for Gemini ───────────────────────────────────────────
function buildContext(kpis, snapshot) {
    const active = snapshot.filter(t => t.status === 'EN_SERVICIO').length;
    const maint  = snapshot.filter(t => t.status === 'EN_MANTENIMIENTO').length;
    return [
        'CONTEXTO DEL SISTEMA FERROVIARIO (Transport-Sentinel — Américas):',
        `- Flota total: ${snapshot.length} trenes (${active} en servicio, ${maint} en mantenimiento)`,
        `- OTP global: ${kpis.otp ?? '—'}%`,
        `- MTBF: ${kpis.mtbf ?? '—'} horas`,
        `- MTTR: ${kpis.mttr ?? '—'} horas`,
        `- Disponibilidad: ${kpis.ramsDisponibilidad ?? '—'}%`,
        `- Incidentes hoy: ${kpis.incidentesHoy ?? 0}`,
        `- Alertas activas: ${kpis.alertasActivas ?? 0}`,
        `- Trenes en ruta actualmente: ${active} de ${snapshot.length}`,
        '- Red ferroviaria: 16 rutas activas en USA, Canadá, México, Panamá, Colombia, Venezuela, Ecuador, Perú, Bolivia, Chile, Argentina, Uruguay, Brasil',
        'Responde siempre en español. Sé conciso pero completo. Usa viñetas cuando sea útil.',
    ].join('\n');
}

// ── Gemini streaming send ─────────────────────────────────────────────────────
async function sendToGemini(prompt, kpis, snapshot, onChunk, onDone) {
    if (!HAS_AI) {
        // Fallback mock
        const mock = `**Modo simulación activo** (sin API key de Gemini)\n\nSu consulta: *${prompt}*\n\nOTP actual: **${kpis.otp ?? 87}%**. Flota: ${snapshot.length} trenes, ${snapshot.filter(t => t.status === 'EN_SERVICIO').length} en servicio.`;
        onChunk(mock);
        onDone();
        return;
    }
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            systemInstruction: `Eres Transport-Sentinel AI, asistente experto en operaciones y mantenimiento ferroviario según normas UIC, RAMS/EN 50126 e IEC 62290. ${buildContext(kpis, snapshot)}`,
        });
        const result = await model.generateContentStream(prompt);
        let buffer = '';
        for await (const chunk of result.stream) {
            buffer += chunk.text();
            onChunk(buffer);
        }
        onDone();
    } catch (err) {
        onChunk(`Error al conectar con Gemini: ${err.message}. Verifica que VITE_GEMINI_API_KEY sea válida y tenga acceso a Gemini API.`);
        onDone();
    }
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-rail/20' : 'bg-violet-500/20'}`}>
                {isUser ? <User size={12} className="text-rail-glow" /> : <Bot size={12} className="text-violet-400" />}
            </div>
            <div className={`max-w-[82%] rounded-xl p-2.5 text-[11px] font-mono leading-relaxed ${
                isUser
                    ? 'bg-rail/10 border border-rail/20 text-slate-200 rounded-tr-none'
                    : 'bg-occ-800/60 border border-occ-700/40 text-slate-300 rounded-tl-none'
            }`}>
                {msg.content.split('\n').map((line, i) => {
                    const html = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>');
                    return <p key={i} className="mb-0.5 last:mb-0" dangerouslySetInnerHTML={{ __html: html }} />;
                })}
                {msg.streaming && (
                    <span className="inline-block w-1.5 h-3 bg-violet-400/70 animate-pulse ml-0.5 align-text-bottom rounded-sm"/>
                )}
            </div>
        </div>
    );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function AIView({ kpis = {}, snapshot = [] }) {
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: `¡Hola! Soy **Transport-Sentinel AI**${HAS_AI ? ` — impulsado por **${GEMINI_MODEL}**` : ' (modo simulación)'}.\n\nEstoy conectado a los datos de la flota ferroviaria en tiempo real. Puedo analizar puntualidad OTP, consumo energético, mantenimiento predictivo RAMS, seguridad y operaciones de la red de las Américas.\n\n¿En qué puedo ayudarte hoy?`,
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async (query) => {
        const text = (query || input).trim();
        if (!text || loading) return;
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setLoading(true);

        // Add empty assistant message for streaming
        const assistantIdx = await new Promise(resolve => {
            setMessages(prev => { resolve(prev.length); return [...prev, { role: 'assistant', content: '', streaming: true }]; });
        });

        await sendToGemini(
            text, kpis, snapshot,
            (buf) => setMessages(prev => prev.map((m, i) => i === assistantIdx ? { ...m, content: buf, streaming: true } : m)),
            ()    => setMessages(prev => prev.map((m, i) => i === assistantIdx ? { ...m, streaming: false } : m)),
        );
        setLoading(false);
    }, [input, loading, kpis, snapshot]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 overflow-hidden min-h-0">

            {/* ── LEFT: Chat ── */}
            <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 flex-shrink-0 occ-card rounded-xl p-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] flex-shrink-0">
                        <Brain size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white leading-tight">Transport-Sentinel AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="status-dot-active" />
                            <span className="text-[9px] font-mono text-green-400">
                                {HAS_AI ? `${GEMINI_MODEL} — Conectado` : 'Modo Simulación Activo'}
                            </span>
                            {HAS_AI && <Sparkles size={9} className="text-violet-400"/>}
                        </div>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-[9px] font-mono text-slate-600">Flota</div>
                        <div className="text-[10px] font-mono text-slate-300">{snapshot.filter(t => t.status === 'EN_SERVICIO').length}/{snapshot.length}</div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                    {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                    {loading && messages[messages.length - 1]?.content === '' && (
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot size={12} className="text-violet-400" />
                            </div>
                            <div className="bg-occ-800/60 border border-occ-700/40 rounded-xl rounded-tl-none px-3 py-2.5">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(j => (
                                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                <div className="flex-shrink-0 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.slice(0, 6).map(s => (
                        <button key={s.label} onClick={() => handleSend(s.query)} disabled={loading}
                            className="text-[9px] font-mono px-2.5 py-1 rounded-lg bg-occ-800/60 border border-occ-700/40 text-slate-400 hover:text-rail-glow hover:border-rail/30 transition-all disabled:opacity-40">
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0">
                    <div className="flex-1 flex items-center gap-2 bg-occ-800/80 border border-occ-700/40 rounded-xl px-3 focus-within:border-rail/40 transition-colors">
                        <Train size={12} className="text-slate-600 flex-shrink-0" />
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Pregunta sobre la operación ferroviaria…"
                            disabled={loading}
                            className="flex-1 bg-transparent text-[11px] font-mono text-slate-200 placeholder-slate-600 outline-none py-2.5 disabled:opacity-50"
                        />
                    </div>
                    <button onClick={() => handleSend()} disabled={loading || !input.trim()}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-rail to-violet-600 flex items-center justify-center disabled:opacity-40 hover:shadow-[0_0_15px_rgba(29,111,165,0.5)] transition-all">
                        <Send size={14} className="text-white" />
                    </button>
                </div>
            </div>

            {/* ── RIGHT: AI Insights ── */}
            <div className="flex flex-col gap-3 overflow-y-auto min-h-0">

                {/* Predictive alerts */}
                <div className="occ-card rounded-xl p-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain size={12} className="text-violet-400"/>
                        <span className="text-[9px] font-mono font-bold text-occ-700 tracking-widest uppercase">Alertas Predictivas</span>
                    </div>
                    <div className="space-y-2">
                        {AI_PREDICTIONS.map((p, i) => (
                            <div key={i} className={`text-[9px] font-mono p-2 rounded-lg border ${SEVERITY_COLORS[p.severity]}`}>
                                <div className="flex justify-between mb-0.5">
                                    <span className="font-bold">{p.trainId}</span>
                                    <span>{p.confidence}% conf.</span>
                                </div>
                                <div className="text-slate-400 mb-0.5">{p.component}</div>
                                <div className="flex justify-between">
                                    <span>Fallo en: <strong>{p.daysToFailure}d</strong></span>
                                    <span className="text-slate-600">{p.action}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Anomaly detection */}
                <div className="occ-card rounded-xl p-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={12} className="text-amber-400"/>
                        <span className="text-[9px] font-mono font-bold text-occ-700 tracking-widest uppercase">Anomalías Detectadas</span>
                    </div>
                    <div className="space-y-2">
                        {ANOMALIES.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-[9px] font-mono border-b border-occ-700/30 pb-1.5 last:border-0 last:pb-0">
                                <span className="flex-shrink-0">{TYPE_ICON[a.type] ?? '⚠'}</span>
                                <div>
                                    <div className="text-amber-400/80 font-bold">{a.trainId} · {a.metric}</div>
                                    <div className="text-slate-500">{a.detail}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="occ-card rounded-xl p-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={12} className="text-green-400"/>
                        <span className="text-[9px] font-mono font-bold text-occ-700 tracking-widest uppercase">Recomendaciones</span>
                    </div>
                    <div className="space-y-2">
                        {RECOMMENDATIONS.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 text-[9px] font-mono pb-2 border-b border-occ-700/30 last:border-0 last:pb-0">
                                <TrendingUp size={9} className="text-green-400 flex-shrink-0 mt-0.5"/>
                                <p className="text-slate-400 leading-relaxed">{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fleet health scores */}
                <div className="occ-card rounded-xl p-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={12} className="text-rail"/>
                        <span className="text-[9px] font-mono font-bold text-occ-700 tracking-widest uppercase">Score Salud Flota</span>
                    </div>
                    <div className="space-y-1.5">
                        {snapshot.slice(0, 8).map((t, i) => {
                            const seed = t.id.charCodeAt(t.id.length - 1) * 7;
                            const score = 65 + (seed % 33);
                            return (
                                <div key={t.id} className="flex items-center gap-2 text-[9px] font-mono">
                                    <span className="text-slate-500 w-14 flex-shrink-0 truncate">{t.id}</span>
                                    <div className="flex-1 h-1.5 bg-occ-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${score >= 85 ? 'bg-green-400' : score >= 65 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${score}%` }}/>
                                    </div>
                                    <span className={`w-6 text-right font-bold ${score >= 85 ? 'text-green-400' : score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

AIView.propTypes = { kpis: PropTypes.object, snapshot: PropTypes.array };
MessageBubble.propTypes = { msg: PropTypes.object };
