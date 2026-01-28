import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { generateHistoricalData } from '../utils/dataGenerator';

const SUGGESTIONS = [
    "¿Cuál fue la temperatura máxima?",
    "Muéstrame las alarmas activas",
    "¿Cuántos registros hay cargados?",
    "¿Es óptima la humedad del suelo?"
];

export default function ChatAssistant({ isOpen, onClose, data = [] }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "¡Hola! Soy Agro-Sentinel AI. Estoy conectado a los datos en tiempo real. ¡Pídeme buscar alarmas o analizar tendencias!" }
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

        // Add User Message
        const userMsg = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // MOCK API CALL - Replace with fetch to your Cloud Function URL
            // Analyze the actual data passed prop
            const response = await analyzeData(text, data);

            const botMsg = { role: 'assistant', text: response.answer, sql: response.sql };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error connecting to the AI brain.", isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    // "AI" Logic running locally on the dataset
    const analyzeData = (query, dataset) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const q = query.toLowerCase();
                let answer = "";
                let sql = "";

                // 1. Detect Intent
                const isMax = q.includes('max') || q.includes('máxima') || q.includes('alta');
                const isMin = q.includes('min') || q.includes('mínima') || q.includes('baja');
                const isAvg = q.includes('promedio') || q.includes('media');

                // 2. Detect Variable
                let variable = 'temp';
                let unit = '°C';
                let varName = 'Temperatura';

                if (q.includes('humedad') || q.includes('humidity')) { variable = 'humidity'; unit = '%'; varName = 'Humedad'; }
                if (q.includes('co2')) { variable = 'co2'; unit = 'ppm'; varName = 'CO2'; }
                if (q.includes('vpd')) { variable = 'vpd'; unit = 'kPa'; varName = 'VPD'; }

                // 3. Global Search vs Specific Farm
                // Check if user mentioned a specific city/farm from LOCATIONS import (we need to import LOCATIONS in this file actually, or pass it)
                // For now, let's hardcode the knowledge of locations from the common utils
                const locationKeywords = {
                    'ambato': 'GH-AMB-01',
                    'duran': 'GH-DUR-01',
                    'durán': 'GH-DUR-01',
                    'cayambe': 'GH-CAY-01',
                    'oro': 'GH-ORO-01',
                    'el oro': 'GH-ORO-01',
                    'machala': 'GH-ORO-01',
                    'tena': 'GH-TEN-01',
                    'selva': 'GH-TEN-01'
                };

                let targetLocationId = null;
                let targetLocationName = "";

                for (const [key, id] of Object.entries(locationKeywords)) {
                    if (q.includes(key)) {
                        targetLocationId = id;
                        targetLocationName = key.charAt(0).toUpperCase() + key.slice(1);
                        break;
                    }
                }

                // If specific location found, we might need to mock fetch its data if not current
                // Since this is a pure frontend mock, we'll 'cheat' and generate a fresh history for that location to analyze
                let targetData = dataset;
                let scope = "Datos actuales";

                if (targetLocationId) {
                    // Use the imported generator function
                    targetData = generateHistoricalData(30, 12, targetLocationId); // Analyze last 30 days
                    scope = `Finca en ${targetLocationName}`;
                } else {
                    // Global Search Mode (if 'todas' or 'global') or just default current
                    if (q.includes('todas') || q.includes('global')) {
                        // This would be heavy, let's just stick to current or fake a global agg
                        scope = "Todas las fincas";
                    }
                }

                // EXECUTE ANALYSIS
                const values = targetData.map(d => d[variable]);
                const maxVal = Math.max(...values);
                const minVal = Math.min(...values);
                const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

                // Find specific records
                const maxRecord = targetData.find(d => d[variable] === maxVal);
                const minRecord = targetData.find(d => d[variable] === minVal);

                // GENERAL QUERIES
                if (q.includes('alarm') || q.includes('alert') || q.includes('falla')) {
                    const alarms = targetData.filter(d => d.temp > 35 || d.humidity < 30);
                    if (alarms.length > 0) {
                        const last = alarms[alarms.length - 1];
                        answer = `⚠️ **Análisis ${targetLocationId ? targetLocationName : 'Global'}**: Detecté **${alarms.length} alertas** críticas.\n\nÚltimo Incidente:\n📍 **Ubicación**: ${targetLocationId || 'Sector Activo'}\n📡 **Sensor**: ${variable.toUpperCase()}-04\n📅 **Fecha**: ${last.displayDate}\n📉 **Valor**: ${last.temp}°C / ${last.humidity}%\n\nSe requiere revisión técnica.`;
                        sql = `SELECT * FROM alerts WHERE severity = 'HIGH' AND location = '${targetLocationId || 'ANY'}'`;
                    } else {
                        answer = `✅ **${targetLocationId ? targetLocationName : 'Sistema'}:** No se encontraron anomalías en el periodo analizado. Operación nominal.`;
                        sql = "SELECT count(*) FROM alerts WHERE status = 'ACTIVE'";
                    }
                }
                else if (isMax) {
                    answer = `📈 **Máximo Registrado (${varName})**\n\n📍 **Ubicación**: ${scope}\n📡 **Sensor**: SENSOR-${variable.toUpperCase()}-01\n📅 **Fecha**: ${maxRecord?.displayDate}\n🔢 **Valor**: ${maxVal} ${unit}\n\nEste pico ocurrió durante el ciclo de mayor radiación.`;
                    sql = `SELECT MAX(${variable}) FROM sensor_logs WHERE location = '${targetLocationId || 'current'}'`;
                }
                else if (isMin) {
                    answer = `📉 **Mínimo Registrado (${varName})**\n\n📍 **Ubicación**: ${scope}\n📡 **Sensor**: SENSOR-${variable.toUpperCase()}-02\n📅 **Fecha**: ${minRecord?.displayDate}\n🔢 **Valor**: ${minVal} ${unit}`;
                    sql = `SELECT MIN(${variable}) FROM sensor_logs WHERE location = '${targetLocationId || 'current'}'`;
                }
                else if (isAvg) {
                    answer = `📊 **Promedio Operativo**\n\nLa ${varName} promedio en ${scope} durante los últimos 30 días es de **${avgVal} ${unit}**.`;
                    sql = `SELECT AVG(${variable}) FROM sensor_logs`;
                }
                else if (targetLocationId) {
                    // General lookup for a location without specific intent
                    answer = `📝 **Reporte: ${targetLocationName}**\n\nHe analizado los últimos 30 días:\n- **Temp Prom**: ${avgVal}°C\n- **Máxima**: ${maxVal}°C\n- **Estado**: ${maxVal > 35 ? '⚠️ ALERTA DE CALOR' : '✅ NOMINAL'}\n\n¿Quieres ver las alertas específicas de esta ubicación?`;
                }
                else {
                    // Fallback
                    answer = `Entendido. Puedo buscar datos específicos en el historial global.\n\nPrueba preguntando:\n- "¿Cuál fue la temperatura máxima en Ambato?"\n- "Alertas en Tena"\n- "Promedio de humedad en Cayambe"`;
                    sql = "SELECT help_topic FROM ai_capabilities";
                }

                resolve({ answer, sql });
            }, 800);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-industrial-800 border border-industrial-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 bg-industrial-900 border-b border-industrial-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Agro-Sentinel AI</h3>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-industrial-900/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-none'
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
                            <span className="text-xs text-gray-400">Analyzing data...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
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
                        placeholder="Ask about temperature, sensors, history..."
                        className="w-full bg-industrial-900 border border-industrial-600 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-2 p-1.5 bg-primary hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
