import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ReferenceLine, ResponsiveContainer, Area, ComposedChart,
} from 'recharts';
import { generateControlLoopData, METAS } from '../utils/dataGenerator';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const sp = payload.find(p => p.dataKey === 'setpoint');
    const pv = payload.find(p => p.dataKey === 'actual');
    const err = pv && sp ? (pv.value - sp.value).toFixed(2) : null;

    return (
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-gray-400 font-mono mb-2">{label}</p>
            {sp && <p className="text-violet-400">SP: <strong>{sp.value}</strong></p>}
            {pv && <p className="text-gray-200">PV: <strong>{pv.value}</strong></p>}
            {err !== null && (
                <p className={parseFloat(err) < 0 ? 'text-red-400' : 'text-emerald-400'}>
                    Error: <strong>{err}</strong>
                </p>
            )}
        </div>
    );
};

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string,
};

export default function ControlLoopPanel() {
    const [selectedMeta, setSelectedMeta] = useState('meta-1');
    const data = generateControlLoopData(selectedMeta, 30);
    const meta = METAS.find(m => m.id === selectedMeta);

    const latestError = data.length > 0 ? data[data.length - 1].error : 0;
    const latestActual = data.length > 0 ? data[data.length - 1].actual : 0;
    const setpoint = meta?.valor_objetivo || 0;

    // Show every 5th label
    const tickFormatter = (val, idx) => idx % 5 === 0 ? val : '';

    return (
        <div className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Lazo de Control</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{meta?.nombre} — SP vs PV</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border font-mono ${
                        latestError >= -0.3
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : latestError >= -1
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                        Error actual: {latestError > 0 ? '+' : ''}{latestError} {meta?.unidad}
                    </div>
                    <select
                        value={selectedMeta}
                        onChange={e => setSelectedMeta(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/40 transition-all"
                        style={{ colorScheme: 'dark' }}
                    >
                        {METAS.map(m => (
                            <option key={m.id} value={m.id} className="bg-[#0d0d14]">{m.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Legend inline */}
            <div className="px-6 pt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-px border-t-2 border-dashed border-violet-400" />
                    <span className="text-[10px] text-gray-400">SP (Setpoint / Meta)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-px bg-gray-300" />
                    <span className="text-[10px] text-gray-400">PV (Valor Real)</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] text-gray-500">SP = {setpoint} {meta?.unidad} | PV actual = {latestActual} {meta?.unidad}</span>
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 py-4" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#475569"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={tickFormatter}
                            interval={0}
                        />
                        <YAxis
                            stroke="#475569"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Error area (between actual and setpoint) */}
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="none"
                            fill="url(#errorGrad)"
                            baseValue={setpoint}
                            fillOpacity={1}
                        />
                        {/* Setpoint line — dashed violet */}
                        <Line
                            type="monotone"
                            dataKey="setpoint"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            dot={false}
                            activeDot={false}
                        />
                        {/* Actual (PV) line */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#d1d5db"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#fff', strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
