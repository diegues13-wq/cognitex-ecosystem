import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, X, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';
import PropTypes from 'prop-types';
import { askAI } from '../services/dataService';
import { format } from 'date-fns';

const SUGGESTIONS = [
    { label: '🌡 Temperatura máxima', query: '¿Cuál fue la temperatura máxima este mes?' },
    { label: '💧 Humedad promedio',   query: '¿Cuál es el promedio de humedad?' },
    { label: '⚠️ Alarmas activas',    query: '¿Cuáles son las alarmas activas?' },
    { label: '🌿 Estado del CO2',     query: '¿Cuál fue el pico de CO2?' },
    { label: '🪱 Humedad de suelo',   query: '¿Cómo está la humedad del suelo?' },
    { label: '☀️ Radiación PAR',      query: '¿Cuál fue la radiación PAR máxima?' },
    { label: '📋 Estado general',     query: '¿Cómo está el estado del invernadero?' },
    { label: '🔋 Batería sensores',   query: '¿Hay sensores con batería baja?' },
];

// Renders **bold** markdown inline, preserving newlines
function MarkdownText({ text }) {
    const lines = text.split('\n');
    return (
        <>
            {lines.map((line, li) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <span key={li}>
                        {parts.map((part, pi) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={pi} className="font-bold text-white">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={pi}>{part}</span>;
                        })}
                        {li < lines.length - 1 && <br />}
                    </span>
                );
            })}
        </>
    );
}

MarkdownText.propTypes = { text: PropTypes.string.isRequired };

function SqlBlock({ sql }) {
    const [open, setOpen] = useState(false);
    if (!sql) return null;
    return (
        <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-black/40 text-[10px] font-mono text-gray-500 hover:text-gray-300 transition-colors"
            >
                <span>BIGQUERY SQL</span>
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {open && (
                <pre className="px-3 py-2 text-[10px] font-mono text-emerald-400 bg-black/60 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {sql}
                </pre>
            )}
        </div>
    );
}

SqlBlock.propTypes = { sql: PropTypes.string };

export default function ChatAssistant({ isOpen, onClose, data, locationId }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: '¡Hola! Soy **Agro-Sentinel AI**.\n\nEstoy conectado a los datos de tus sensores. Puedes preguntarme sobre temperaturas, alarmas, humedad, CO2, radiación PAR o el estado general del cultivo.',
            ts: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const handleSend = async (text = input) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        setMessages(prev => [...prev, { role: 'user', text: trimmed, ts: new Date() }]);
        setInput('');
        setShowSuggestions(false);
        setLoading(true);

        try {
            const response = await askAI(trimmed, locationId, data);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: response.answer,
                sql: response.sql,
                ts: new Date(),
            }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: '⚠️ **Error de conexión**\n\nNo pude contactar al servicio de análisis. Verifica tu conexión e inténtalo de nuevo.',
                isError: true,
                ts: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-[420px] h-[640px] flex flex-col rounded-2xl overflow-hidden shadow-[0_0_60px_-10px_rgba(168,85,247,0.4)] border border-purple-500/20 bg-[#0d0d14] z-50"
            style={{ animation: 'slideUp 0.25s ease-out' }}
        >
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/40 backdrop-blur shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <Sparkles size={18} className="text-purple-400" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d0d14]"></span>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm leading-tight">Agro-Sentinel AI</p>
                        <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                            Conectado · {locationId}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                    <X size={15} />
                </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ffffff10 transparent' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border mt-0.5
                            ${msg.role === 'user'
                                ? 'bg-purple-500/20 border-purple-500/30'
                                : msg.isError ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/20'
                            }`}
                        >
                            {msg.role === 'user'
                                ? <User size={13} className="text-purple-300" />
                                : <Bot size={13} className={msg.isError ? 'text-red-400' : 'text-emerald-400'} />
                            }
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-purple-600/30 border border-purple-500/30 text-purple-100 rounded-tr-sm'
                                    : msg.isError
                                        ? 'bg-red-900/20 border border-red-500/20 text-red-300 rounded-tl-sm'
                                        : 'bg-white/5 border border-white/8 text-gray-200 rounded-tl-sm'
                                }`}
                            >
                                <MarkdownText text={msg.text} />
                                {msg.sql && <SqlBlock sql={msg.sql} />}
                            </div>
                            <span className="text-[9px] text-gray-600 px-1">
                                {msg.ts ? format(msg.ts, 'HH:mm') : ''}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 mt-0.5">
                            <Bot size={13} className="text-emerald-400" />
                        </div>
                        <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Suggestions ── */}
            {showSuggestions && (
                <div className="px-4 pb-2 shrink-0">
                    <p className="text-[9px] font-mono text-gray-600 mb-2 tracking-wider">SUGERENCIAS RÁPIDAS</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(s.query)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/30 rounded-full text-[11px] text-gray-400 hover:text-purple-200 transition-all"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Input ── */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-black/20 shrink-0">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={e => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                            }}
                            placeholder="Pregunta sobre temperatura, alarmas, cultivo..."
                            className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm resize-none overflow-hidden outline-none transition-all leading-relaxed"
                            style={{ minHeight: '46px' }}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="w-11 h-11 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] shrink-0"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
                <p className="text-[9px] text-gray-700 mt-2 text-center font-mono">Enter para enviar · Shift+Enter nueva línea</p>
            </div>
        </div>
    );
}

ChatAssistant.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    data: PropTypes.array,
    locationId: PropTypes.string,
};

ChatAssistant.defaultProps = {
    data: [],
    locationId: 'GH-AMB-01',
};
