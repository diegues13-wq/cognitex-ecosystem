import PropTypes from 'prop-types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { CAUSAS_RAIZ } from '../utils/dataGenerator';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-white font-bold mb-1">{d?.fullLabel}</p>
            <p className="text-gray-300">Fallos: <strong>{d?.count}</strong></p>
            <p className="text-gray-400">Porcentaje: <strong>{d?.pct}%</strong></p>
            <p className="text-violet-400">Acumulado: <strong>{d?.cumPct}%</strong></p>
        </div>
    );
};

CustomTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array };

export default function ParetoPanel({ entries }) {
    // Count by cause
    const counts = {};
    entries.forEach(e => {
        counts[e.causa_raiz] = (counts[e.causa_raiz] || 0) + 1;
    });

    const total = entries.length || 1;
    let cumulative = 0;

    const data = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count], idx) => {
            cumulative += count;
            const pct = Math.round((count / total) * 100);
            const cumPct = Math.round((cumulative / total) * 100);
            return {
                key,
                label: (CAUSAS_RAIZ[key]?.label || key).split(' ').slice(0, 2).join(' '),
                fullLabel: CAUSAS_RAIZ[key]?.label || key,
                emoji: CAUSAS_RAIZ[key]?.emoji || '',
                color: CAUSAS_RAIZ[key]?.color || '#7c3aed',
                count,
                pct,
                cumPct,
                isDominant: idx < 2,
            };
        });

    return (
        <div className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Pareto de Causas Raíz</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                    Top 2 causas explican{' '}
                    <span className="text-violet-400 font-bold">
                        {(data[0]?.pct || 0) + (data[1]?.pct || 0)}%
                    </span>{' '}
                    de los fallos
                </p>
            </div>

            {/* Dominant causes badges */}
            <div className="px-6 py-3 flex flex-wrap gap-2">
                {data.slice(0, 2).map(d => (
                    <div key={d.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/25 text-[11px] text-violet-300 font-semibold">
                        <span>{d.emoji}</span>
                        <span>{d.fullLabel}</span>
                        <span className="text-violet-500 font-mono">{d.pct}%</span>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="flex-1 px-2 pb-4" style={{ minHeight: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 16, left: -15, bottom: 48 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#475569"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            angle={-30}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis
                            stroke="#475569"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {data.map(d => (
                                <Cell
                                    key={d.key}
                                    fill={d.isDominant ? d.color : `${d.color}80`}
                                    stroke={d.isDominant ? d.color : 'transparent'}
                                    strokeWidth={1}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Cumulative table */}
            <div className="px-6 pb-4">
                <div className="border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="bg-white/3">
                                <th className="text-left px-3 py-2 text-gray-600 font-bold uppercase tracking-wider">Causa</th>
                                <th className="text-right px-3 py-2 text-gray-600 font-bold uppercase tracking-wider">N</th>
                                <th className="text-right px-3 py-2 text-gray-600 font-bold uppercase tracking-wider">%</th>
                                <th className="text-right px-3 py-2 text-gray-600 font-bold uppercase tracking-wider">Acum.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, i) => (
                                <tr key={d.key} className={`border-t border-white/3 ${i < 2 ? 'bg-violet-500/5' : ''}`}>
                                    <td className="px-3 py-2 text-gray-300 flex items-center gap-1.5">
                                        <span>{d.emoji}</span>
                                        <span>{d.fullLabel}</span>
                                        {d.isDominant && <span className="ml-1 px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[9px] font-bold">DOM</span>}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-white font-bold">{d.count}</td>
                                    <td className="px-3 py-2 text-right font-mono text-gray-400">{d.pct}%</td>
                                    <td className="px-3 py-2 text-right font-mono text-violet-400">{d.cumPct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

ParetoPanel.propTypes = {
    entries: PropTypes.array.isRequired,
};
