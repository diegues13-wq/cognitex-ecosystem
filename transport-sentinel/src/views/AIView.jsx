import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Train, AlertTriangle, Zap, TrendingUp, Bot, User, Lightbulb } from 'lucide-react';
import PropTypes from 'prop-types';
import { askAI } from '../services/dataService.js';
import { isMockAuth } from '../firebase.js';

const SUGGESTIONS = [
    { label: 'Estado de la flota',    query: '¿Cómo está la eficiencia general de la flota?' },
    { label: 'OTP Puntualidad',       query: '¿Cuál es el OTP actual de la red ferroviaria?' },
    { label: 'Km Recorridos',         query: '¿Cuántos km han recorrido los trenes hoy?' },
    { label: 'Combustible',           query: '¿Cuánto combustible se ha consumido?' },
    { label: 'Energía eléctrica',     query: '¿Cuántos kWh ha consumido la flota eléctrica?' },
    { label: 'Carga pasajeros',       query: '¿Cuál es la carga de pasajeros hoy?' },
    { label: 'Toneladas carga',       query: '¿Cuántas toneladas se han transportado?' },
    { label: 'Mantenimiento MTBF',    query: '¿Cuál es el MTBF de la flota y qué trenes necesitan mantenimiento?' },
    { label: 'Seguridad RAMS',        query: '¿Hay incidentes activos de seguridad?' },
    { label: 'Sostenibilidad CO₂',    query: '¿Cuánto CO₂ ha emitido la flota?' },
];

const AI_PREDICTIONS = [
    { trainId: 'FRE-004', component: 'Rodamiento eje 3',        daysToFailure: 2,  confidence: 97, severity: 'CRITICO', action: 'OT WO-2026-0143 EN CURSO' },
    { trainId: 'FRE-001', component: 'Motor tracción — temp.',  daysToFailure: 8,  confidence: 88, severity: 'ALTO',    action: 'Programar inspección urgente' },
    { trainId: 'PAX-003', component: 'Pastillas de freno',      daysToFailure: 19, confidence: 91, severity: 'MEDIO',   action: 'OT WO-2026-0142 programada' },
    { trainId: 'PAX-007', component: 'Pantógrafo slider',       daysToFailure: 45, confidence: 78, severity: 'BAJO',    action: 'Monitoreo continuo' },
];

const ANOMALIES = [
    { trainId: 'PAX-007', metric: 'Consumo energético', detail: '+18% vs baseline de ruta', type: 'ENERGIA' },
    { trainId: 'FRE-003', metric: 'Nivel combustible',  detail: 'Bajo 18% — reabastecimiento', type: 'COMBUSTIBLE' },
    { trainId: 'PAX-003', metric: 'Retrasos recurrentes', detail: 'RT-003 — 3 retrasos esta semana', type: 'OTP' },
];

const RECOMMENDATIONS = [
    'Ruta RT-003 (Valencia-Maracay) presenta OTP por debajo del 80% en horarios pico 07:00-09:00. Revisar programación de salidas.',
    'El tren PAX-007 consume 18% más energía de lo nominal. Auditar perfil de velocidad y estado del pantógrafo.',
    'Implementar mantenimiento preventivo adelantado para FRE-001 basado en predicción de temperatura anormal en motor de tracción.',
];

const SEVERITY_COLORS = {
    CRITICO: 'text-red-400 bg-red-500/10 border-red-500/30',
    ALTO:    'text-amber-400 bg-amber-500/10 border-amber-500/30',
    MEDIO:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    BAJO:    'text-slate-400 bg-slate-700/30 border-slate-700/40',
};

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-rail/20' : 'bg-violet-500/20'}`}>
                {isUser ? <User size={12} className="text-rail-glow" /> : <Bot size={12} className="text-violet-400" />}
            </div>
            <div className={`max-w-[80%] rounded-xl p-2.5 text-[11px] font-mono leading-relaxed ${
                isUser
                    ? 'bg-rail/10 border border-rail/20 text-slate-200 rounded-tr-none'
                    : 'bg-occ-800/60 border border-occ-700/40 text-slate-300 rounded-tl-none'
            }`}>
                {msg.content.split('\n').map((line, i) => {
                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>');
                    return <p key={i} className="mb-0.5 last:mb-0" dangerouslySetInnerHTML={{ __html: bold }} />;
                })}
                {msg.sql && (
                    <div className="mt-2 pt-2 border-t border-occ-700/40">
                        <p className="text-[9px] text-slate-600 mb-1">SQL equivalente:</p>
                        <pre className="text-[9px] text-green-400/70 overflow-x-auto whitespace-pre-wrap">{msg.sql}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AIView({ kpis, snapshot }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `¡Hola! Soy **Transport-Sentinel AI**, especialista en operaciones ferroviarias.\n\nEstoy conectado a los datos de la flota en tiempo real. Puedo responder sobre puntualidad OTP, kilometraje, consumo energético, mantenimiento predictivo RAMS, carga de pasajeros, toneladas transportadas o el estado general de la red.\n\n¿En qué puedo ayudarte?`,
            sql: null,
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSend(query) {
        const text = query || input.trim();
        if (!text) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text, sql: null }]);
        setLoading(true);
        try {
            const result = await askAI(text, snapshot[0]?.id || 'PAX-001', { kpis, snapshot });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.answer || 'No pude generar una respuesta. Intenta reformular la pregunta.',
                sql: result.sql || null,
            }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar la consulta. Por favor intenta de nuevo.', sql: null }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 overflow-hidden min-h-0">
            {/* LEFT: Chat */}
            <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                        <Brain size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Transport-Sentinel AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="status-dot-active" />
                            <span className="text-[9px] font-mono text-green-400">{isMockAuth ? 'Modo Simulación Activo' : 'Conectado — Gemini Pro'}</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                    {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                    {loading && (
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot size={12} className="text-violet-400" />
                            </div>
                            <div className="bg-occ-800/60 border border-occ-700/40 rounded-xl rounded-tl-none px-3 py-2">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                <div className="flex-shrink-0 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.slice(0, 5).map(s => (
                        <button
                            key={s.label}
                            onClick={() => handleSend(s.query)}
                            disabled={loading}
                            className="text-[9px] font-mono px-2.5 py-1 rounded-lg bg-occ-800/60 border border-occ-700/40 text-slate-400 hover:text-rail-glow hover:border-rail/30 transition-all disabled:opacity-40"
                        >
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
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-rail to-accent flex items-center justify-center disabled:opacity-40 hover:shadow-[0_0_15px_rgba(29,111,165,0.5)] transition-all"
                    >
                        <Send size={14} className="text-white" />
                    </button>
                </div>
            </div>

            {/* RIGHT: AI Insights panel */}
            <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
                {/* Predictive maintenance */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain size={12} className="text-violet-400" />
                        <span className="mono-label text-violet-400">Mantenimiento Predictivo IA</span>
                    </div>
                    <div className="space-y-2">
                        {AI_PREDICTIONS.map(p => (
                            <div key={p.trainId + p.component} className={`rounded-lg border p-2 text-[9px] font-mono ${SEVERITY_COLORS[p.severity]}`}>
                                <div className="flex justify-between mb-0.5">
                                    <span className="font-bold">{p.trainId}</span>
                                    <span>Fallo en <span className="font-bold">{p.daysToFailure}d</span></span>
                                </div>
                                <p className="text-current opacity-80">{p.component}</p>
                                <div className="flex justify-between mt-0.5 opacity-70">
                                    <span>{p.action}</span>
                                    <span>conf. {p.confidence}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Anomalies */}
                <div className="occ-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={12} className="text-amber-400" />
                        <span className="mono-label text-amber-400">Anomalías Detectadas</span>
                    </div>
                    <div className="space-y-2">
                        {ANOMALIES.map((a, i) => (
                            <div key={i} className="text-[9px] font-mono flex items-start gap-2 pb-2 border-b border-occ-700/30 last:border-0 last:pb-0">
                                <AlertTriangle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p><span className="text-rail-glow font-bold">{a.trainId}</span> — {a.metric}</p>
                                    <p className="text-slate-500">{a.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="occ-card p-3 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={12} className="text-green-400" />
                        <span className="mono-label text-green-400">Recomendaciones IA</span>
                    </div>
                    <div className="space-y-3">
                        {RECOMMENDATIONS.map((rec, i) => (
                            <div key={i} className="text-[9px] font-mono flex items-start gap-2 pb-2 border-b border-occ-700/30 last:border-0 last:pb-0">
                                <TrendingUp size={10} className="text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-slate-400 leading-relaxed">{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fleet health scores */}
                <div className="occ-card p-3">
                    <p className="mono-label mb-2">Score de Salud por Tren</p>
                    <div className="space-y-1.5">
                        {snapshot.slice(0, 6).map(t => {
                            const score = Math.round(70 + Math.random() * 28);
                            return (
                                <div key={t.id} className="flex items-center gap-2 text-[9px] font-mono">
                                    <span className="text-slate-500 w-14 flex-shrink-0">{t.id}</span>
                                    <div className="flex-1 h-1.5 bg-occ-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                    <span className={`w-6 text-right font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

AIView.propTypes = {
    kpis:     PropTypes.object,
    snapshot: PropTypes.array,
};

AIView.defaultProps = { kpis: {}, snapshot: [] };
