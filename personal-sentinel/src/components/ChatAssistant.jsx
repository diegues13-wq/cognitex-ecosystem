import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, X, Heart, ShieldAlert } from 'lucide-react';
import PropTypes from 'prop-types';
import { generateHistoricalData } from '../utils/dataGenerator';

const SUGGESTIONS = [
    "¿Cuál fue la fatiga máxima?",
    "Muéstrame alertas de ritmo cardíaco",
    "¿Hay eventos de Man Down?",
    "¿Cuál es el promedio de temperatura corporal?"
];

export default function ChatAssistant({ isOpen, onClose, data = [] }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "¡Hola! Soy Safety-Sentinel AI. Monitoreo la salud y seguridad de los operarios en tiempo real." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await analyzeData(text, data);
            const botMsg = { role: 'assistant', text: response.answer, sql: response.sql };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = (query, dataset) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const q = query.toLowerCase();
                let answer = "";
                let sql = "";

                const isMax = q.includes('max') || q.includes('máxima') || q.includes('alta');
                const isMin = q.includes('min') || q.includes('mínima') || q.includes('baja');
                const isAvg = q.includes('promedio') || q.includes('media');

                let variable = 'vpd'; // HR stored in vpd
                let unit = 'BPM';
                let varName = 'Ritmo Cardíaco';

                if (q.includes('fatiga') || q.includes('fatigue')) { variable = 'humidity'; unit = '%'; varName = 'Nivel Fatiga'; }
                if (q.includes('temp') || q.includes('fieb')) { variable = 'temp'; unit = '°C'; varName = 'Temp. Corporal'; }
                if (q.includes('man down') || q.includes('caída')) { variable = 'co2'; unit = ''; varName = 'Man Down'; }

                let targetWorkerId = null;
                const workers = {
                    'perez': 'WRK-001',
                    'rodriguez': 'WRK-002',
                    'smith': 'WRK-003',
                    'chen': 'WRK-004'
                };

                for (const [key, id] of Object.entries(workers)) {
                    if (q.includes(key)) targetWorkerId = id;
                }

                let targetData = dataset;
                let scope = "Turno Actual";

                if (targetWorkerId) {
                    targetData = generateHistoricalData(30, 12, targetWorkerId);
                    scope = `Historial ${targetWorkerId}`;
                }

                const values = targetData.map(d => d[variable]);
                const maxVal = Math.max(...values);
                const minVal = Math.min(...values);
                const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

                const maxRecord = targetData.find(d => d[variable] === maxVal);

                if (q.includes('alarm') || q.includes('alert') || q.includes('riesgo')) {
                    const alarms = targetData.filter(d => d.vpd > 120 || d.co2 === 1);
                    if (alarms.length > 0) {
                        const last = alarms[alarms.length - 1];
                        answer = `⚠️ **ALERTA DE SEGURIDAD**: Detecté **${alarms.length} eventos** críticos.\n\nÚltimo Evento:\n👷 **Operario**: ${targetWorkerId || 'Zona Fundición'}\n💓 **Ritmo**: ${last.vpd} BPM\n🚨 **Estado**: ${last.co2 === 1 ? 'MAN DOWN' : 'TAQUICARDIA'}\n📅 **Hora**: ${last.displayDate}`;
                        sql = `SELECT * FROM ehs_alerts WHERE severity = 'HIGH'`;
                    } else {
                        answer = `✅ **Sin Novedades:** El personal se encuentra dentro de los parámetros seguros. No hay reportes de fatiga o estrés térmico.`;
                        sql = "SELECT count(*) FROM incidents WHERE status = 'OPEN'";
                    }
                }
                else if (isMax) {
                    answer = `📈 **Máximo Registrado (${varName})**\n\n👷 **Operario**: ${scope}\n📅 **Fecha**: ${maxRecord?.displayDate}\n🔢 **Valor**: ${maxVal} ${unit}`;
                    sql = `SELECT MAX(${variable}) FROM worker_logs`;
                }
                else if (isAvg) {
                    answer = `📊 **Promedio del Turno**\n\nEl ${varName} promedio es de **${avgVal} ${unit}**.`;
                    sql = `SELECT AVG(${variable}) FROM worker_logs`;
                }
                else {
                    answer = `Estoy monitoreando la seguridad del equipo. Puedes preguntar:\n- "¿Hubo alertas de ritmo cardíaco hoy?"\n- "Promedio de fatiga en turno noche"\n- "Estado de Perez"`;
                    sql = "SELECT help_topic FROM ai_safety_manual";
                }

                resolve({ answer, sql });
            }, 800);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-industrial-800 border border-industrial-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="p-4 bg-industrial-900 border-b border-industrial-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <ShieldAlert size={18} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Safety AI</h3>
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Monitoreo Activo
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-industrial-900/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user'
                            ? 'bg-orange-600 text-white rounded-br-none'
                            : 'bg-industrial-700 text-gray-100 rounded-bl-none border border-industrial-600'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                            {msg.sql && (
                                <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono text-gray-400 overflow-x-auto">
                                    QUERY: {msg.sql}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-industrial-700 rounded-2xl p-3 rounded-bl-none flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                            <span className="text-xs text-gray-400">Analyzing EHS data...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-industrial-800 border-t border-industrial-700">
                {messages.length === 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(s)}
                                className="whitespace-nowrap px-3 py-1.5 bg-industrial-700 hover:bg-industrial-600 border border-industrial-600 rounded-full text-xs text-gray-300 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pregunta sobre seguridad, fatiga..."
                        className="w-full bg-industrial-900 border border-industrial-600 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-2 p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

ChatAssistant.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    data: PropTypes.array
};
