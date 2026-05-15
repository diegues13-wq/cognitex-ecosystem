import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Brush, ReferenceLine
} from 'recharts';
import {
    Droplets, Thermometer, Activity, Leaf, MessageSquareText,
    History, Map as MapIcon, ShieldAlert, LayoutDashboard, Menu,
    LogOut, ChevronRight, Battery, Signal, Sun, Sprout, Zap,
    CloudRain, RefreshCw, Wifi, WifiOff, FlaskConical
} from 'lucide-react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ChatAssistant from './components/ChatAssistant';
import { LOCATIONS, generateNextPoint } from './utils/dataGenerator';
import { fetchLiveData, fetchHistoricalData, isMockMode } from './services/dataService';
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import logo from './assets/cognitex_logo.png';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

// ─── Optimal agronomic reference ranges ──────────────────────────────────────
const OPTIMAL = {
    temp:          { lo: 18, hi: 28 },
    humidity:      { lo: 55, hi: 85 },
    vpd:           { lo: 0.4, hi: 1.2 },
    co2:           { lo: 400, hi: 1200 },
    soil_moisture: { lo: 45, hi: 80 },
    par:           { lo: 200, hi: 800 },
};

// ─── Chart widget (defined outside Dashboard to avoid re-creation) ────────────
function ChartWidget({ title, color, dataKey, activeData, mode, isFieldMode, selectedVariable, unit, optimalLo, optimalHi }) {
    const gradId = `grad_${dataKey}`;
    const glowId = `glow_${dataKey}`;
    const lastVal = activeData.length > 0 ? activeData[activeData.length - 1][dataKey] : null;
    const isOutOfRange = lastVal !== null && optimalLo !== undefined && (lastVal < optimalLo || lastVal > optimalHi);

    return (
        <div className={`p-5 rounded-2xl relative min-h-[220px] h-full flex flex-col group transition-all duration-300 overflow-hidden
            ${isFieldMode
                ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                : `bg-industrial-900/30 backdrop-blur-xl border hover:bg-industrial-900/50 transition-all
                   ${isOutOfRange ? 'border-red-500/30 shadow-[0_0_20px_-5px_rgba(239,68,68,0.25)]' : 'border-white/10 hover:border-white/20'}`
            }`}
        >
            {!isFieldMode && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />}

            <div className="flex justify-between items-center mb-4 px-1 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all
                        ${isFieldMode ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10 group-hover:scale-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'}`}
                        style={{ color }}
                    >
                        <Activity size={15} />
                    </div>
                    <div>
                        <h3 className={`text-[10px] font-extrabold tracking-widest uppercase mb-0.5 ${isFieldMode ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-200'}`}>{title}</h3>
                        <div className={`text-lg font-black leading-none font-mono flex items-baseline gap-1 ${isFieldMode ? 'text-gray-900' : 'text-white'}`}>
                            {lastVal !== null ? lastVal : '--'}
                            <span className={`text-[10px] font-normal ${isFieldMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span>
                        </div>
                    </div>
                </div>
                {isOutOfRange && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse">FUERA RANGO</span>
                )}
                {!isOutOfRange && optimalLo !== undefined && lastVal !== null && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ÓPTIMO</span>
                )}
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeData} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                            {!isFieldMode && (
                                <filter id={glowId} height="300%" width="300%" x="-75%" y="-75%">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            )}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isFieldMode ? '#e5e7eb' : '#ffffff'} vertical={false} opacity={isFieldMode ? 1 : 0.06} />
                        <XAxis dataKey={mode === 'LIVE' ? 'time' : 'displayDate'} stroke={isFieldMode ? '#9ca3af' : '#334155'} minTickGap={45} tick={{ fontSize: 8, fill: isFieldMode ? '#6b7280' : '#475569', fontWeight: 600 }} tickLine={false} axisLine={false} />
                        <YAxis stroke={isFieldMode ? '#9ca3af' : '#334155'} tick={{ fontSize: 8, fill: isFieldMode ? '#6b7280' : '#475569', fontWeight: 600 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={32} />
                        <Tooltip
                            contentStyle={{ backgroundColor: isFieldMode ? '#fff' : 'rgba(7,7,15,0.92)', backdropFilter: 'blur(12px)', borderColor: isFieldMode ? '#e5e7eb' : 'rgba(255,255,255,0.1)', color: isFieldMode ? '#111' : '#fff', borderRadius: '10px', fontSize: '11px', padding: '10px 14px' }}
                            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        {/* Optimal zone reference band */}
                        {optimalLo !== undefined && <ReferenceLine y={optimalLo} stroke={color} strokeDasharray="4 4" strokeOpacity={0.35} strokeWidth={1} />}
                        {optimalHi !== undefined && <ReferenceLine y={optimalHi} stroke={color} strokeDasharray="4 4" strokeOpacity={0.35} strokeWidth={1} />}
                        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradId})`} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: color }} filter={!isFieldMode ? `url(#${glowId})` : undefined} />
                        {mode === 'HISTORY' && selectedVariable !== 'ALL' && <Brush dataKey="displayDate" height={10} stroke={color} fill={isFieldMode ? '#f3f4f6' : '#0a0a0a'} />}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

ChartWidget.propTypes = {
    title: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired, dataKey: PropTypes.string.isRequired,
    activeData: PropTypes.array.isRequired, mode: PropTypes.string.isRequired,
    isFieldMode: PropTypes.bool, selectedVariable: PropTypes.string,
    unit: PropTypes.string, optimalLo: PropTypes.number, optimalHi: PropTypes.number,
};

// ─── Chart config ─────────────────────────────────────────────────────────────
const CHART_CONFIG = [
    { variable: 'TEMP',         dataKey: 'temp',         color: '#f97316', title: 'TEMPERATURA AMBIENTAL', unit: '°C',         ...OPTIMAL.temp },
    { variable: 'HUMIDITY',     dataKey: 'humidity',     color: '#06b6d4', title: 'HUMEDAD RELATIVA',      unit: '%',          ...OPTIMAL.humidity },
    { variable: 'VPD',          dataKey: 'vpd',          color: '#a855f7', title: 'DÉFICIT PRESIÓN VAPOR', unit: 'kPa',        ...OPTIMAL.vpd },
    { variable: 'CO2',          dataKey: 'co2',          color: '#10b981', title: 'CONCENTRACIÓN CO2',     unit: 'ppm',        ...OPTIMAL.co2 },
    { variable: 'SOIL_MOISTURE',dataKey: 'soil_moisture',color: '#84cc16', title: 'HUMEDAD DE SUELO',      unit: '%',          ...OPTIMAL.soil_moisture },
    { variable: 'PAR',          dataKey: 'par',          color: '#fbbf24', title: 'RADIACIÓN PAR',         unit: 'µmol/m²s',  ...OPTIMAL.par },
];

const SENSOR_FILTERS = [
    { id: 'ALL',          label: 'Resumen Global',    icon: LayoutDashboard, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'TEMP',         label: 'Monitor Térmico',   icon: Thermometer,     color: 'text-orange-400',  activeBg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    { id: 'HUMIDITY',     label: 'Humedad Relativa',  icon: Droplets,        color: 'text-cyan-400',    activeBg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
    { id: 'VPD',          label: 'Presión VPD',       icon: Activity,        color: 'text-purple-400',  activeBg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
    { id: 'CO2',          label: 'Concentración CO2', icon: Leaf,            color: 'text-emerald-400', activeBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'SOIL_MOISTURE',label: 'Humedad Suelo',     icon: CloudRain,       color: 'text-lime-400',    activeBg: 'bg-lime-500/10',    border: 'border-lime-500/20' },
    { id: 'PAR',          label: 'Radiación PAR',     icon: Zap,             color: 'text-yellow-400',  activeBg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
];

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard({ onLogout }) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mode, setMode] = useState('LIVE');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFieldMode, setIsFieldMode] = useState(false);
    const [selectedFarm, setSelectedFarm] = useState(LOCATIONS[0].id);
    const [historicalData, setHistoricalData] = useState([]);
    const [liveData, setLiveData] = useState([]);
    const [selectedVariable, setSelectedVariable] = useState('ALL');
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
    });

    // ── Load data on farm change ──────────────────────────────────────────────
    const loadData = useCallback(async (farmId) => {
        setIsLoading(true);
        try {
            const [live, history] = await Promise.all([
                fetchLiveData(farmId),
                fetchHistoricalData(farmId, 200),
            ]);
            setLiveData(live);
            setHistoricalData(history);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to load sensor data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(selectedFarm); }, [selectedFarm, loadData]);

    // ── Real-time ticker: add a new point every 5s in LIVE mode ──────────────
    useEffect(() => {
        if (mode !== 'LIVE') return;
        const ticker = setInterval(() => {
            setLiveData(prev => {
                if (prev.length === 0) return prev;
                const next = generateNextPoint(prev[prev.length - 1], selectedFarm);
                const updated = [...prev.slice(-71), next]; // keep last 72 readings
                setLastRefresh(new Date());
                return updated;
            });
        }, 5000);
        return () => clearInterval(ticker);
    }, [mode, selectedFarm]);

    // ── Active (filtered) data ────────────────────────────────────────────────
    const activeData = useMemo(() => {
        if (mode === 'LIVE') return liveData;
        if (!historicalData.length) return [];
        try {
            const start = startOfDay(parseISO(dateRange.start));
            const end = endOfDay(parseISO(dateRange.end));
            return historicalData.filter(d => isWithinInterval(parseISO(d.timestamp), { start, end }));
        } catch { return []; }
    }, [mode, historicalData, dateRange, liveData]);

    const stats = activeData.length > 0 ? activeData[activeData.length - 1] : {};

    // ── Farm status for map markers ───────────────────────────────────────────
    const activeSensors = useMemo(() => LOCATIONS.map(loc => {
        const isSelected = loc.id === selectedFarm;
        const cur = isSelected && liveData.length > 0 ? liveData[liveData.length - 1] : { temp: loc.baseTemp, humidity: loc.baseHum };
        return {
            ...loc,
            temp: cur.temp || loc.baseTemp,
            humidity: cur.humidity || loc.baseHum,
            status: (cur.temp > 32 || cur.humidity < 35) ? 'ALERTA' : 'OK',
        };
    }), [selectedFarm, liveData]);

    // ── Alarm statistics ──────────────────────────────────────────────────────
    const alarmStats = useMemo(() => {
        if (!activeData.length) return { counts: [], recent: [] };
        let tempCount = 0, humCount = 0, vpdCount = 0, co2Count = 0, soilCount = 0;
        const events = [];

        activeData.forEach(d => {
            if (d.temp > 38) {
                tempCount++;
                events.push({ time: d.displayDate, type: 'CALOR CRÍTICO', value: `${d.temp}°C`, priority: 'CRITICAL' });
            }
            if (d.co2 > 1800) {
                co2Count++;
                events.push({ time: d.displayDate, type: 'FUGA CO2', value: `${d.co2} ppm`, priority: 'CRITICAL' });
            }
            if (d.humidity < 25) {
                humCount++;
                events.push({ time: d.displayDate, type: 'SEQUEDAD', value: `${d.humidity}%`, priority: 'WARNING' });
            }
            if (d.vpd > 2.0 || d.vpd < 0.15) {
                vpdCount++;
                events.push({ time: d.displayDate, type: 'RIESGO VPD', value: `${d.vpd} kPa`, priority: 'WARNING' });
            }
            if (d.soil_moisture !== undefined && d.soil_moisture < 25) {
                soilCount++;
                events.push({ time: d.displayDate, type: 'ESTRÉS HÍDRICO', value: `${d.soil_moisture}%`, priority: 'WARNING' });
            }
            if (d.battery < 15) {
                events.push({ time: d.displayDate, type: 'BATERÍA BAJA', value: `${d.battery}%`, priority: 'WARNING' });
            }
        });

        return {
            counts: [
                { name: 'Calor',  count: tempCount, color: '#ef4444' },
                { name: 'Hum.',   count: humCount,  color: '#06b6d4' },
                { name: 'VPD',    count: vpdCount,  color: '#a855f7' },
                { name: 'CO2',    count: co2Count,  color: '#10b981' },
                { name: 'Suelo',  count: soilCount, color: '#84cc16' },
            ],
            recent: [...events].reverse().slice(0, 12),
        };
    }, [activeData]);

    // ── Pest risk model (simplified Botrytis predictor) ───────────────────────
    const pestRisk = useMemo(() => {
        if (!stats.humidity || !stats.temp) return { level: 'BAJO', pct: 20, color: 'text-emerald-400' };
        // Botrytis thrives in high humidity + moderate temp
        const score = ((stats.humidity - 60) / 40) * 50 + ((stats.temp > 20 ? stats.temp - 20 : 0) / 10) * 50;
        const pct = Math.max(5, Math.min(99, Math.round(score)));
        if (pct > 70) return { level: 'ALTO',   pct, color: 'text-red-400' };
        if (pct > 40) return { level: 'MEDIO',  pct, color: 'text-yellow-400' };
        return { level: 'BAJO', pct, color: 'text-emerald-400' };
    }, [stats]);

    const totalAlarms = alarmStats.recent.length;
    const currentFarm = LOCATIONS.find(l => l.id === selectedFarm);

    return (
        <div className={`flex h-screen font-sans selection:bg-emerald-500/30 overflow-hidden transition-colors duration-500 ${isFieldMode ? 'bg-[#f0f2f5] text-gray-900' : 'bg-black text-industrial-100'}`}>
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#064e3b15_0%,_#000_80%)] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.025] pointer-events-none z-0" />

            {/* Mobile overlay */}
            {isMobileMenuOpen && <div className="fixed inset-0 bg-black/90 z-[60] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

            {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
            <aside className={`w-68 bg-[#030a06] border-r border-white/5 flex flex-col z-[70] fixed lg:relative h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ width: '260px', minWidth: '260px' }}>
                {/* Brand */}
                <div className="relative p-6 flex flex-col items-center border-b border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/25 to-transparent" />
                    <img src={logo} alt="Cognitex" className="h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.4)] mb-3 relative z-10" />
                    <div className="text-center relative z-10">
                        <h2 className="text-lg font-black text-white tracking-tight">AGRO<span className="text-emerald-400">SENTINEL</span></h2>
                        <span className="text-[8px] text-emerald-500/60 tracking-[0.2em] font-mono block mt-0.5 uppercase">IoT Intelligence Platform</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
                    <div className="space-y-1">
                        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-3 mb-2">Vistas</h3>
                        {SENSOR_FILTERS.map(item => (
                            <button key={item.id} onClick={() => setSelectedVariable(item.id)}
                                className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                                    ${selectedVariable === item.id ? `${item.color} ${item.activeBg} ${item.border} border shadow-[0_0_15px_-5px_currentColor]` : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <item.icon size={14} className={selectedVariable === item.id ? 'drop-shadow-[0_0_6px_currentColor]' : ''} />
                                    {item.label}
                                </div>
                                {selectedVariable === item.id && <ChevronRight size={12} />}
                            </button>
                        ))}
                    </div>

                    {/* Farm selector */}
                    <div className="space-y-1 pt-1 border-t border-white/5">
                        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-3 mb-2">Fincas</h3>
                        {LOCATIONS.map(loc => {
                            const isActive = loc.id === selectedFarm;
                            const sensor = activeSensors.find(s => s.id === loc.id);
                            return (
                                <button key={loc.id} onClick={() => setSelectedFarm(loc.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all
                                        ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Sprout size={12} />
                                        <span className="font-medium truncate">{loc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${sensor?.status === 'ALERTA' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <span className="font-mono text-[9px]">{loc.region}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Device health */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-3 mb-2">Estado Dispositivos</h3>
                        <div className="px-3 space-y-2.5">
                            {[
                                { icon: Battery, label: 'Batería', val: `${stats.battery ?? '--'}%`, ok: (stats.battery ?? 100) > 20, okColor: 'text-emerald-400', warnColor: 'text-red-400' },
                                { icon: Signal, label: 'Señal RSSI', val: `${stats.rssi ?? '--'} dBm`, ok: (stats.rssi ?? -60) > -80, okColor: 'text-blue-400', warnColor: 'text-red-400' },
                                { icon: FlaskConical, label: 'EC Suelo', val: `${stats.soil_ec ?? '--'} mS/cm`, ok: true, okColor: 'text-gray-300', warnColor: 'text-gray-300' },
                            ].map(({ icon: Icon, label, val, ok, okColor, warnColor }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                                        <Icon size={12} className={ok ? okColor : warnColor} /> {label}
                                    </div>
                                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/5 bg-black/20">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all border border-white/5 hover:border-red-500/20 group">
                        <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> CERRAR SESIÓN
                    </button>
                    <div className="mt-3 flex justify-center items-center gap-2 opacity-40">
                        {isMockMode()
                            ? <><WifiOff size={8} className="text-yellow-400" /><span className="text-[8px] font-mono text-yellow-500">MODO SIMULACIÓN</span></>
                            : <><Wifi size={8} className="text-emerald-400" /><span className="text-[8px] font-mono text-emerald-400">LIVE API</span></>
                        }
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto h-full z-10" style={{ scrollbarWidth: 'thin' }}>
                <div className="max-w-[1800px] mx-auto p-5 lg:p-7 space-y-6">

                    {/* Top bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg">
                                <Menu size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight leading-tight">PANEL DE CONTROL</h1>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${mode === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                                    {mode === 'LIVE' ? 'Telemetría en tiempo real' : 'Modo historial'}
                                    <span className="text-gray-700">·</span>
                                    <span>{currentFarm?.name}</span>
                                    <span className="text-gray-700">·</span>
                                    <span>{currentFarm?.crop}</span>
                                    {isLoading && <RefreshCw size={10} className="animate-spin text-gray-400 ml-1" />}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                            {/* Mock mode badge */}
                            {isMockMode() && (
                                <span className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1.5">
                                    <WifiOff size={9} /> DATOS SIMULADOS
                                </span>
                            )}

                            {/* Date range (history mode) */}
                            {mode === 'HISTORY' && (
                                <div className="flex gap-2 items-center">
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                                        className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50" />
                                    <span className="text-gray-600 text-xs">—</span>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                                        className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50" />
                                </div>
                            )}

                            {/* Last refresh */}
                            <div className="text-[9px] font-mono text-gray-600 hidden lg:block">
                                ACT: {format(lastRefresh, 'HH:mm:ss')}
                            </div>

                            {/* Mode toggle */}
                            <div className={`p-1.5 rounded-xl flex items-center gap-1 border ${isFieldMode ? 'bg-white border-gray-200' : 'bg-white/5 border-white/5'}`}>
                                <button onClick={() => setIsFieldMode(f => !f)} title="Modo Campo"
                                    className={`p-2 rounded-lg transition-all ${isFieldMode ? 'bg-yellow-400 text-black shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
                                    <Sun size={13} />
                                </button>
                                <div className={`w-px h-5 ${isFieldMode ? 'bg-gray-200' : 'bg-white/10'}`} />
                                <button onClick={() => setMode('LIVE')}
                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition-all ${mode === 'LIVE' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${mode === 'LIVE' ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
                                    VIVO
                                </button>
                                <button onClick={() => setMode('HISTORY')}
                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition-all ${mode === 'HISTORY' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>
                                    <History size={12} /> HISTORIAL
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── KPI CARDS (6 cards) ────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {[
                            { title: 'VPD',          sub: 'Déficit Vapor',     val: stats.vpd,          unit: 'kPa',       icon: Activity,     color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  opt: OPTIMAL.vpd },
                            { title: 'TEMPERATURA',  sub: 'Ambiental',         val: stats.temp,         unit: '°C',        icon: Thermometer,  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  opt: OPTIMAL.temp },
                            { title: 'HUMEDAD',      sub: 'Relativa',          val: stats.humidity,     unit: '%',         icon: Droplets,     color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    opt: OPTIMAL.humidity },
                            { title: 'CO2',          sub: 'Concentración',     val: stats.co2,          unit: 'ppm',       icon: Leaf,         color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    opt: OPTIMAL.co2 },
                            { title: 'SUELO',        sub: 'Humedad',           val: stats.soil_moisture,unit: '%',         icon: CloudRain,    color: 'text-lime-400',    bg: 'bg-lime-500/10',    border: 'border-lime-500/20',    opt: OPTIMAL.soil_moisture },
                            { title: 'PAR',          sub: 'Radiación',         val: stats.par,          unit: 'µmol/m²s', icon: Zap,          color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  opt: OPTIMAL.par },
                        ].map(card => (
                            <KpiCard key={card.title} {...card} isFieldMode={isFieldMode} />
                        ))}
                    </div>

                    {/* ── AGRONOMY ROW ──────────────────────────────────────── */}
                    {selectedVariable === 'ALL' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* GDD */}
                            <div className={`rounded-2xl p-4 flex items-center justify-between group hover:border-yellow-500/30 transition-all relative overflow-hidden ${isFieldMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-industrial-900/30 backdrop-blur-xl border border-white/10'}`}>
                                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400"><Sun size={20} /></div>
                                    <div>
                                        <h4 className="text-gray-400 text-[9px] font-extrabold tracking-widest uppercase">Grados Día (GDD)</h4>
                                        <p className="text-[9px] text-gray-500">Acumulado temporada</p>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <span className="text-xl font-black text-white font-mono">{stats.gdd ? Math.round(stats.gdd) : '—'}</span>
                                    <span className="text-xs text-yellow-500 font-bold ml-1">°Día</span>
                                    <div className="text-[8px] text-gray-500 mt-0.5">~{currentFarm?.crop} · {currentFarm?.area_ha} ha</div>
                                </div>
                            </div>

                            {/* Pest risk */}
                            <div className={`rounded-2xl p-4 flex items-center justify-between group hover:border-red-500/30 transition-all relative overflow-hidden ${isFieldMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-industrial-900/30 backdrop-blur-xl border border-white/10'}`}>
                                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`p-2.5 rounded-xl border text-current ${pestRisk.level === 'ALTO' ? 'bg-red-500/10 border-red-500/20 text-red-400' : pestRisk.level === 'MEDIO' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-400 text-[9px] font-extrabold tracking-widest uppercase">Riesgo Fitosanitario</h4>
                                        <p className="text-[9px] text-gray-500">Modelo Botrytis predictivo</p>
                                    </div>
                                </div>
                                <div className="relative z-10 text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        <div className="h-1.5 w-20 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 transition-all" style={{ width: `${pestRisk.pct}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold ${pestRisk.color}`}>{pestRisk.level}</span>
                                    </div>
                                    <div className="text-[8px] text-gray-500">Botrytis: {pestRisk.pct}% probabilidad</div>
                                </div>
                            </div>

                            {/* Active alarms summary */}
                            <div className={`rounded-2xl p-4 flex items-center justify-between group transition-all relative overflow-hidden ${isFieldMode ? 'bg-white border border-gray-200 shadow-sm' : `bg-industrial-900/30 backdrop-blur-xl border ${totalAlarms > 0 ? 'border-red-500/20 shadow-[0_0_20px_-8px_rgba(239,68,68,0.3)]' : 'border-white/10'}`}`}>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`p-2.5 rounded-xl border ${totalAlarms > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-400 text-[9px] font-extrabold tracking-widest uppercase">Alarmas Activas</h4>
                                        <p className="text-[9px] text-gray-500">Periodo seleccionado</p>
                                    </div>
                                </div>
                                <div className="relative z-10 text-right">
                                    <span className={`text-2xl font-black font-mono ${totalAlarms > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{totalAlarms}</span>
                                    <div className="text-[8px] text-gray-500 mt-0.5">{alarmStats.counts.filter(c => c.count > 0).map(c => c.name).join(' · ') || 'Sin eventos'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CHARTS + MAP ──────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Charts */}
                        <div className="lg:col-span-8 flex flex-col gap-5">
                            {selectedVariable === 'ALL' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[220px]">
                                        {CHART_CONFIG.slice(0, 2).map(c => (
                                            <ChartWidget key={c.variable} {...c} activeData={activeData} mode={mode} isFieldMode={isFieldMode} selectedVariable={selectedVariable} optimalLo={c.lo} optimalHi={c.hi} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[220px]">
                                        {CHART_CONFIG.slice(2, 4).map(c => (
                                            <ChartWidget key={c.variable} {...c} activeData={activeData} mode={mode} isFieldMode={isFieldMode} selectedVariable={selectedVariable} optimalLo={c.lo} optimalHi={c.hi} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[220px]">
                                        {CHART_CONFIG.slice(4, 6).map(c => (
                                            <ChartWidget key={c.variable} {...c} activeData={activeData} mode={mode} isFieldMode={isFieldMode} selectedVariable={selectedVariable} optimalLo={c.lo} optimalHi={c.hi} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="min-h-[500px]">
                                    {(() => {
                                        const cfg = CHART_CONFIG.find(c => c.variable === selectedVariable) || CHART_CONFIG[0];
                                        return <ChartWidget {...cfg} activeData={activeData} mode={mode} isFieldMode={isFieldMode} selectedVariable={selectedVariable} optimalLo={cfg.lo} optimalHi={cfg.hi} />;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Map + Alerts */}
                        <div className="lg:col-span-4 flex flex-col gap-5">
                            {/* Map */}
                            <div className={`rounded-2xl overflow-hidden min-h-[280px] flex-1 relative flex flex-col ${isFieldMode ? 'border border-gray-200 shadow-sm' : 'bg-industrial-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-colors'}`}>
                                <div className="absolute top-3 left-3 z-[400] bg-black/80 px-2.5 py-1.5 rounded-lg backdrop-blur border border-white/10">
                                    <h3 className="text-[9px] font-bold text-emerald-400 flex gap-1.5 items-center tracking-widest uppercase"><MapIcon size={10} /> Mapa de Fincas</h3>
                                </div>
                                <MapContainer center={[-1.5, -78.5]} zoom={6} scrollWheelZoom className="flex-1 w-full z-0 grayscale contrast-110 brightness-[0.55]">
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    {activeSensors.map(sensor => (
                                        <Marker key={sensor.id} position={[sensor.lat, sensor.lng]} eventHandlers={{ click: () => setSelectedFarm(sensor.id) }} opacity={selectedFarm === sensor.id ? 1 : 0.55}>
                                            <Popup className="text-black text-xs">
                                                <strong>{sensor.name}</strong><br />
                                                {sensor.temp?.toFixed(1)}°C · {sensor.humidity?.toFixed(0)}% HR<br />
                                                <span className={sensor.status === 'ALERTA' ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{sensor.status}</span>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>

                            {/* Alert feed */}
                            <div className={`rounded-2xl p-5 flex-1 min-h-[280px] flex flex-col ${isFieldMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-industrial-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-colors'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold flex items-center gap-2 text-white tracking-widest uppercase">
                                        <ShieldAlert size={14} className="text-red-500" /> Feed de Alarmas
                                    </h3>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono border ${totalAlarms > 0 ? 'bg-red-500/10 text-red-400 border-red-500/15' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'}`}>
                                        {totalAlarms}
                                    </span>
                                </div>

                                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                                    {alarmStats.recent.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <ShieldAlert size={20} className="text-emerald-700" />
                                            </div>
                                            <span className="text-xs text-gray-500">Sistemas nominales</span>
                                        </div>
                                    ) : alarmStats.recent.map((row, i) => (
                                        <div key={i} className={`flex justify-between items-center p-2.5 rounded-xl border transition-all group cursor-pointer
                                            ${row.priority === 'CRITICAL'
                                                ? 'bg-red-500/5 border-red-500/15 hover:bg-red-500/10'
                                                : 'bg-yellow-500/5 border-yellow-500/15 hover:bg-yellow-500/10'
                                            }`}>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <ShieldAlert size={10} className={row.priority === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'} />
                                                    <span className={`text-[10px] font-bold ${row.priority === 'CRITICAL' ? 'text-red-200' : 'text-yellow-200'}`}>{row.type}</span>
                                                </div>
                                                <span className="text-[9px] text-gray-600 font-mono pl-3.5">{row.time.split('T')[1]?.substring(0, 5) ?? row.time}</span>
                                            </div>
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${row.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Chat button */}
            {!isChatOpen && (
                <button onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-7 right-7 p-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-110 active:scale-95 z-50">
                    <MessageSquareText size={22} />
                    {totalAlarms > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-black text-[9px] text-white font-bold flex items-center justify-center">
                            {Math.min(totalAlarms, 9)}
                        </div>
                    )}
                </button>
            )}

            <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} data={historicalData} locationId={selectedFarm} />
        </div>
    );
}

Dashboard.propTypes = { onLogout: PropTypes.func.isRequired };

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, sub, val, unit, icon: Icon, color, bg, border, opt, isFieldMode }) {
    const isAlert = val !== undefined && val !== null && opt && (val < opt.lo || val > opt.hi);

    return (
        <div className={`p-4 rounded-2xl relative overflow-hidden group transition-all duration-300
            ${isFieldMode
                ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                : `bg-industrial-900/30 backdrop-blur-xl border hover:bg-industrial-900/50 hover:-translate-y-0.5
                   ${isAlert ? 'border-red-500/40 shadow-[0_0_20px_-8px_rgba(239,68,68,0.4)]' : 'border-white/10 hover:border-white/20'}`
            }`}
        >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-25 transition-opacity ${bg}`} />
            <div className="relative z-10">
                <div className={`w-9 h-9 rounded-xl ${bg} ${border} border flex items-center justify-center ${color} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                </div>
                <p className={`text-[9px] font-extrabold tracking-widest uppercase mb-0.5 ${isFieldMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                <p className={`text-[8px] font-mono ${isFieldMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{sub}</p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black tracking-tighter ${isFieldMode ? 'text-gray-900' : 'text-white'}`}>{val ?? '--'}</span>
                    <span className={`text-[9px] ${isFieldMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span>
                </div>
                {isAlert && (
                    <div className="mt-1.5 flex items-center gap-1 text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20 w-fit animate-pulse">
                        <ShieldAlert size={8} /> FUERA RANGO
                    </div>
                )}
                {!isAlert && val !== undefined && val !== null && opt && (
                    <div className="mt-1.5 flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" /> ÓPTIMO
                    </div>
                )}
            </div>
        </div>
    );
}

KpiCard.propTypes = {
    title: PropTypes.string.isRequired, sub: PropTypes.string.isRequired,
    val: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    unit: PropTypes.string.isRequired, icon: PropTypes.elementType.isRequired,
    color: PropTypes.string, bg: PropTypes.string, border: PropTypes.string,
    opt: PropTypes.shape({ lo: PropTypes.number, hi: PropTypes.number }),
    isFieldMode: PropTypes.bool,
};
