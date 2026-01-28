import { useState, useEffect, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Brush } from 'recharts';
import { Heart, Activity, AlertTriangle, User, MessageSquareText, History, Map as MapIcon, ShieldAlert, LayoutDashboard, Menu, LogOut, ChevronRight, Gauge, BrainCircuit, HardHat, Ban, Thermometer } from 'lucide-react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ChatAssistant from './components/ChatAssistant';
import { generateHistoricalData, generateLast24hData, LOCATIONS } from './utils/dataGenerator';
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import logo from './assets/cognitex_logo.png';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function Dashboard({ onLogout }) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mode, setMode] = useState('LIVE');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFieldMode, setIsFieldMode] = useState(false);

    const [selectedWorker, setSelectedWorker] = useState(LOCATIONS[0].id);
    const [historicalData, setHistoricalData] = useState([]);
    const [liveData, setLiveData] = useState([]);

    // Filters: ALL, HR, FATIGUE, TEMP, MANDO
    const [selectedVariable, setSelectedVariable] = useState('ALL');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        const last24 = generateLast24hData(selectedWorker);
        setLiveData(last24);
        const history = generateHistoricalData(200, 12, selectedWorker);
        setHistoricalData(history);
    }, [selectedWorker]);

    const activeData = useMemo(() => {
        if (mode === 'LIVE') return liveData;
        if (historicalData.length === 0) return [];
        try {
            const start = startOfDay(parseISO(dateRange.start));
            const end = endOfDay(parseISO(dateRange.end));
            return historicalData.filter(d => {
                const date = parseISO(d.timestamp);
                return isWithinInterval(date, { start, end });
            });
        } catch (e) {
            console.error("Date parsing error", e);
            return [];
        }
    }, [mode, historicalData, dateRange, liveData]);

    const stats = activeData.length > 0 ? activeData[activeData.length - 1] : {};

    const activeSensors = useMemo(() => {
        return LOCATIONS.map(loc => {
            const isSelected = loc.id === selectedWorker;
            let current = isSelected && liveData.length > 0 ? liveData[liveData.length - 1] : { temp: 36.5, vpd: 70 };
            return {
                ...loc,
                temp: current.temp || 36.5,
                hr: current.vpd || 70, // vpd holds HR
                status: (current.vpd > 120 || current.humidity > 80) ? 'ALERTA' : 'OK', // humidity holds fatigue
            };
        });
    }, [selectedWorker, liveData]);

    const alarmStats = useMemo(() => {
        if (!activeData || activeData.length === 0) return { counts: [], recent: [] };
        const events = [];

        activeData.forEach(d => {
            if (d.vpd > 130) {
                events.push({ time: d.displayDate || d.time, type: 'TAQUICARDIA', value: `${d.vpd} BPM`, priority: 'CRITICAL' });
            }
            if (d.humidity > 90) { // Fatigue > 90%
                events.push({ time: d.displayDate || d.time, type: 'FATIGA EXTREMA', value: `${d.humidity}%`, priority: 'CRITICAL' });
            }
            if (d.temp > 38.5) { // Fever
                events.push({ time: d.displayDate || d.time, type: 'HIPERTERMIA', value: `${d.temp}°C`, priority: 'WARNING' });
            }
        });

        return { recent: [...events].reverse().slice(0, 10) };
    }, [activeData]);

    const ChartWidget = useMemo(() => {
        const Widget = ({ variable, title, color, dataKey }) => (
            <div className={`p-5 rounded-2xl relative min-h-[240px] h-full flex flex-col group transition-all duration-300 overflow-hidden ${isFieldMode ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' : 'bg-industrial-900/30 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(var(--glow-color),0.3)] hover:bg-industrial-900/50'}`} style={{ '--glow-color': color === '#f97316' ? '249,115,22' : color === '#06b6d4' ? '6,182,212' : color === '#a855f7' ? '168,85,247' : '16,185,129' }}>
                {!isFieldMode && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>}

                <div className="flex justify-between items-center mb-6 px-1 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isFieldMode ? 'bg-gray-100 border-gray-200 text-gray-600' : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-white group-hover:scale-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'}`}>
                            <Activity size={16} style={{ color: isFieldMode ? undefined : color }} className={isFieldMode ? 'text-gray-700' : ''} />
                        </div>
                        <div>
                            <h3 className={`text-[10px] font-extrabold tracking-widest uppercase mb-0.5 transition-colors ${isFieldMode ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-200'}`}>{title}</h3>
                            <div className={`text-xl font-black leading-none font-mono flex items-baseline gap-1 ${isFieldMode ? 'text-gray-900' : 'text-white'}`}>
                                {activeData.length > 0 ? activeData[activeData.length - 1][dataKey] : '--'}
                                <span className={`text-[10px] font-normal ${isFieldMode ? 'text-gray-400' : 'text-gray-500'}`}>{variable === 'BODYTEMP' ? '°C' : variable === 'HR' ? 'BPM' : '%'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`grad${variable}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isFieldMode ? '#e5e7eb' : '#ffffff'} vertical={false} opacity={isFieldMode ? 1 : 0.08} />
                            <XAxis dataKey={mode === 'LIVE' ? "time" : "displayDate"} stroke={isFieldMode ? '#9ca3af' : '#475569'} minTickGap={40} tick={{ fontSize: 9, fill: isFieldMode ? '#6b7280' : '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                            <YAxis stroke={isFieldMode ? '#9ca3af' : '#475569'} tick={{ fontSize: 9, fill: isFieldMode ? '#6b7280' : '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: isFieldMode ? '#ffffff' : 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(10px)', borderColor: isFieldMode ? '#e5e7eb' : 'rgba(255,255,255,0.1)', color: isFieldMode ? '#111827' : '#fff', borderRadius: '12px', fontSize: '11px', padding: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: isFieldMode ? '#111827' : '#fff', fontWeight: 700 }}
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad${variable})`} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: isFieldMode ? color : '#fff', shadow: `0 0 20px ${color}` }} />
                            {mode === 'HISTORY' && selectedVariable !== 'ALL' && <Brush dataKey="displayDate" height={10} stroke={color} fill={isFieldMode ? '#f3f4f6' : "#0f172a"} />}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
        Widget.propTypes = {
            variable: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            color: PropTypes.string.isRequired,
            dataKey: PropTypes.string.isRequired
        };
        return Widget;
    }, [activeData, mode, isFieldMode, selectedVariable]);

    return (
        <div className={`flex h-screen font-sans selection:bg-orange-500/30 selection:text-orange-900 overflow-hidden transition-colors duration-500 ${isFieldMode ? 'bg-[#f0f2f5] text-gray-900' : 'bg-black text-industrial-100'}`}>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#ea580c20_0%,_#000000_80%)] pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/90 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <aside className={`w-72 bg-industrial-950 border-r border-white/5 flex flex-col z-[70] fixed lg:relative h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="relative p-8 flex flex-col items-center border-b border-white/5 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-900/20 to-transparent"></div>
                    <img src={logo} alt="Cognitex" className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] mb-4 relative z-10" />
                    <div className="text-center relative z-10">
                        <h2 className="text-xl font-black text-white tracking-tight">PERSONAL<span className="text-orange-500">SENTINEL</span></h2>
                        <span className="text-[9px] text-orange-500/60 tracking-[0.2em] font-mono block mt-1 uppercase">Workforce EHS</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar relative z-10">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4 mb-2">Seguridad Industrial</h3>
                        <button onClick={() => setSelectedVariable('ALL')} className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${selectedVariable === 'ALL' ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-400 border border-orange-500/30 shadow-[0_0_25px_-5px_rgba(249,115,22,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <div className="flex items-center gap-3">
                                <LayoutDashboard size={18} className={selectedVariable === 'ALL' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''} /> DASHBOARD EHS
                            </div>
                        </button>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4 mb-2">Biométricos</h3>
                        {[
                            { id: 'HR', label: 'Ritmo Cardíaco', icon: Heart, color: 'text-red-400' },
                            { id: 'FATIGUE', label: 'Nivel Fatiga', icon: BrainCircuit, color: 'text-purple-400' },
                            { id: 'BODYTEMP', label: 'Temperatura Corporal', icon: Thermometer, color: 'text-yellow-400' },
                            { id: 'MANDOWN', label: 'Estatus Actividad', icon: Activity, color: 'text-emerald-400' }
                        ].map(item => (
                            <button key={item.id} onClick={() => setSelectedVariable(item.id)} className={`w-full group flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${selectedVariable === item.id ? `${item.color} bg-white/5 border border-white/10 shadow-[0_0_20px_-5px_currentColor]` : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                                <div className="flex items-center gap-3">
                                    <item.icon size={16} className={selectedVariable === item.id ? 'drop-shadow-[0_0_8px_currentColor]' : ''} /> {item.label}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4 mb-2">Equipamiento PPE</h3>
                        <div className="px-4 py-2 space-y-3">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3 text-gray-400 text-xs">
                                    <HardHat size={16} className="text-orange-500" /> Casco Smart
                                </div>
                                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">CONECTADO</span>
                            </div>
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3 text-gray-400 text-xs">
                                    <Activity size={16} className="text-blue-500" /> Chaleco
                                </div>
                                <span className="font-mono font-bold px-2 py-0.5 rounded text-[10px] text-blue-500 bg-blue-500/10">BATT 85%</span>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5 relative z-10 bg-black/20">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-xs font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all border border-white/5 hover:border-red-500/20 group">
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> FIN TURNO
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto relative h-full w-full z-10 custom-scrollbar">
                <div className="max-w-[1920px] mx-auto p-6 lg:p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg"><Menu size={24} /></button>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight mb-1">PANEL EHS</h1>
                                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-blink"></span>
                                    Monitoreo Personal Activo
                                    <span className="text-gray-600">|</span>
                                    {LOCATIONS.find(l => l.id === selectedWorker)?.name}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                            <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5 flex-1 md:flex-auto hover:border-white/10 transition-colors">
                                <User size={16} className="text-orange-500" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Colaborador</span>
                                    <select className="bg-transparent text-white font-bold text-sm border-none focus:ring-0 cursor-pointer p-0 w-full md:w-40" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                                        {LOCATIONS.map(loc => <option key={loc.id} value={loc.id} className="bg-industrial-950 text-gray-300">{loc.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className={`p-1.5 rounded-xl flex items-center gap-2 border transition-all ${isFieldMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/5'}`}>
                                <button onClick={() => setMode('LIVE')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] md:text-xs font-bold transition-all ${mode === 'LIVE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-gray-900'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${mode === 'LIVE' ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span> LIVE
                                </button>
                                <button onClick={() => setMode('HISTORY')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] md:text-xs font-bold transition-all ${mode === 'HISTORY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-900'}`}>
                                    <History size={14} /> TURNOS
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Metrics Mapping: vpd=HR, humidity=Fatigue, temp=BodyTemp, battery=DeviceBat */}
                        <KpiCardCompact title="RITMO CARDÍACO" subtitle="Pulsaciones" value={stats.vpd || '--'} unit="BPM" icon={<Heart size={24} />} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" isAlert={stats.vpd > 120} />
                        <KpiCardCompact title="FATIGA" subtitle="Índice Cognitivo" value={stats.humidity || '--'} unit="%" icon={<BrainCircuit size={24} />} color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" isAlert={stats.humidity > 90} />
                        <KpiCardCompact title="TEMP. CORPORAL" subtitle="Sensor Dérmico" value={stats.temp || '--'} unit="°C" icon={<Thermometer size={24} />} color="text-yellow-400" bg="bg-yellow-500/10" border="border-yellow-500/20" />
                        <KpiCardCompact title="ESTADO" subtitle="Man Down" value={stats.co2 === 1 ? 'ALERTA' : 'OK'} unit="" icon={<ShieldAlert size={24} />} color={stats.co2 === 1 ? 'text-red-500' : 'text-emerald-400'} bg={stats.co2 === 1 ? 'bg-red-500/10' : 'bg-emerald-500/10'} border={stats.co2 === 1 ? 'border-red-500/20' : 'border-emerald-500/20'} isAlert={stats.co2 === 1} />
                    </div>

                    {selectedVariable === 'ALL' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-industrial-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between group hover:border-orange-500/30 transition-colors relative overflow-hidden">
                                <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                        <Ban size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-400 text-[10px] font-extrabold tracking-widest uppercase">Zonas Prohibidas</h4>
                                        <p className="text-[10px] text-gray-500">Infracciones Hoy</p>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <span className="text-2xl font-black text-white font-mono">0</span>
                                    <span className="text-xs text-emerald-500 font-bold ml-1">✓</span>
                                    <div className="text-[9px] text-gray-500 mt-1">Cumplimiento: 100%</div>
                                </div>
                            </div>

                            <div className="bg-industrial-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between group hover:border-red-500/30 transition-colors relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-400 text-[10px] font-extrabold tracking-widest uppercase">SOS Events</h4>
                                        <p className="text-[10px] text-gray-500">Alertas Manuales</p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="text-2xl font-black text-white font-mono">0</span>
                                    </div>
                                    <div className="text-[9px] text-gray-500 mt-1 text-right">Sin incidentes reportados</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
                        <div className={`lg:col-span-8 flex flex-col gap-6 ${selectedVariable === 'ALL' ? 'h-full' : ''}`}>
                            {selectedVariable === 'ALL' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[260px]">
                                        <ChartWidget variable='HR' title='RITMO CARDÍACO' color='#f87171' dataKey='vpd' />
                                        <ChartWidget variable='FATIGUE' title='NIVEL FATIGA' color='#a855f7' dataKey='humidity' />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[260px]">
                                        <ChartWidget variable='BODYTEMP' title='TEMPERATURA' color='#fbbf24' dataKey='temp' />
                                        <ChartWidget variable='BATTERY' title='BATERÍA DISPOSITIVO' color='#10b981' dataKey='battery' />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full min-h-[500px]">
                                    <ChartWidget variable={selectedVariable} title={selectedVariable} color='#f97316'
                                        dataKey={selectedVariable === 'BODYTEMP' ? 'temp' : selectedVariable === 'HR' ? 'vpd' : 'humidity'}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-industrial-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden min-h-[300px] flex-1 relative flex flex-col hover:border-white/10 transition-colors">
                                <div className="absolute top-4 left-4 z-[400] bg-black/80 px-3 py-1.5 rounded-lg backdrop-blur border border-white/10 shadow-xl">
                                    <h3 className="text-[10px] font-bold text-orange-400 flex gap-2 items-center tracking-widest uppercase"><MapIcon size={12} /> Geo-Localización</h3>
                                </div>
                                <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={false} className="flex-1 w-full z-0 grayscale contrast-125 brightness-[0.6]">
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                </MapContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-white/20 font-black text-xl">PLANT MAP</span>
                                </div>
                            </div>

                            <div className="bg-industrial-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex-1 min-h-[300px] flex flex-col hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold flex items-center gap-2 text-white tracking-widest uppercase"><ShieldAlert size={16} className="text-red-500" /> Alertas EHS</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 font-mono">{alarmStats.recent.length}</span>
                                </div>

                                <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 space-y-3">
                                    {alarmStats.recent.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <ShieldAlert size={24} className="text-gray-700" />
                                            </div>
                                            <span className="text-xs italic">Personal Seguro</span>
                                        </div>
                                    ) : (
                                        alarmStats.recent.map((row, i) => (
                                            <div key={i} className={`flex justify-between items-center p-3 rounded-xl border transition-all group cursor-pointer ${row.priority === 'CRITICAL' ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10' : 'bg-yellow-500/5 border-yellow-500/10 hover:bg-yellow-500/10'}`}>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldAlert size={12} className={row.priority === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'} />
                                                        <span className={`text-xs font-bold transition-colors ${row.priority === 'CRITICAL' ? 'text-red-200' : 'text-yellow-200'}`}>{row.type}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-mono pl-5">{row.time.split('T')[1]?.substring(0, 5) || row.time}</span>
                                                </div>
                                                <span className={`text-xs font-mono font-bold block px-2 py-1 rounded ${row.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{row.value}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

Dashboard.propTypes = {
    onLogout: PropTypes.func.isRequired
};

function KpiCardCompact({ title, subtitle, value, unit, icon, color, bg, border, trend, isAlert }) {
    return (
        <div className={`p-6 rounded-2xl bg-industrial-900/30 backdrop-blur-xl border border-white/10 relative overflow-hidden group transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:bg-industrial-900/50 ${isAlert ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]'}`}>
            <div className={`absolute -right-8 -top-8 w-32 h-32 opacity-10 blur-[60px] transition-opacity duration-500 group-hover:opacity-30 rounded-full ${color.replace('text-', 'bg-')}`}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-4">
                    <div className={`w-12 h-12 rounded-xl ${bg} ${border} border flex items-center justify-center ${color} shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-gray-400 text-[10px] font-extrabold tracking-widest uppercase mb-1 group-hover:text-gray-200">{title}</h4>
                        <p className="text-[10px] text-gray-500 font-mono hidden md:block group-hover:text-gray-400">{subtitle}</p>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end">
                    <div className="flex items-baseline justify-end gap-1">
                        <span className={`text-3xl font-black tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_15px_currentColor] transition-all duration-300`}>{value}</span>
                        <span className={`text-xs font-medium text-gray-500 group-hover:text-gray-300`}>{unit}</span>
                    </div>
                    {trend && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                            {trend}
                        </div>
                    )}
                    {isAlert && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <ShieldAlert size={10} /> CRÍTICO
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

KpiCardCompact.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    color: PropTypes.string,
    bg: PropTypes.string,
    border: PropTypes.string,
    trend: PropTypes.string,
    isAlert: PropTypes.bool
};
