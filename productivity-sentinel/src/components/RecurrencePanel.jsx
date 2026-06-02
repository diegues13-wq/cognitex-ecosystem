import PropTypes from 'prop-types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { format, subDays, startOfWeek, getWeek } from 'date-fns';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const val = payload[0]?.value;
    const color = val <= 30 ? '#10b981' : val <= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-gray-400 font-mono mb-1">{label}</p>
            <p style={{ color }}>Recurrencia: <strong>{val}%</strong></p>
        </div>
    );
};

CustomTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string };

export default function RecurrencePanel({ entries }) {
    const today = new Date();

    // Build weekly recurrence rate
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
        const weekEnd = subDays(today, w * 7);
        const weekStart = subDays(weekEnd, 6);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        const weekEntries = entries.filter(e => e.date >= weekStartStr && e.date <= weekEndStr);
        const rate = weekEntries.length > 0
            ? Math.round((weekEntries.filter(e => e.es_recurrente).length / weekEntries.length) * 100)
            : 0;

        weeks.push({
            label: `Sem ${getWeek(weekEnd, { weekStartsOn: 1 })}`,
            rate,
            entries: weekEntries.length,
        });
    }

    // Also build daily data for last 30 days (rolling 7-day average)
    const dailyData = [];
    for (let d = 29; d >= 0; d--) {
        const date = subDays(today, d);
        const dateStr = format(date, 'yyyy-MM-dd');
        const windowStart = format(subDays(date, 6), 'yyyy-MM-dd');

        const windowEntries = entries.filter(e => e.date >= windowStart && e.date <= dateStr);
        const rate = windowEntries.length > 0
            ? Math.round((windowEntries.filter(e => e.es_recurrente).length / windowEntries.length) * 100)
            : null;

        if (rate !== null) {
            dailyData.push({
                date: format(date, 'dd/MM'),
                rate,
            });
        }
    }

    const chartData = dailyData.filter((_, i) => i % 3 === 0); // every 3rd day to reduce clutter

    const currentRate = dailyData.length > 0 ? dailyData[dailyData.length - 1].rate : 0;
    const prevRate = dailyData.length > 5 ? dailyData[dailyData.length - 6].rate : currentRate;
    const trend = currentRate < prevRate ? 'down' : currentRate > prevRate ? 'up' : 'flat';

    const statusColor = currentRate <= 30 ? 'text-emerald-400' : currentRate <= 60 ? 'text-amber-400' : 'text-red-400';
    const statusLabel = currentRate <= 30 ? 'BAJO — Bien' : currentRate <= 60 ? 'MEDIO — Regular' : 'ALTO — Crítico';

    return (
        <div className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Tendencia de Recurrencia</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">KPI Principal — promedio móvil 7 días</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border font-mono ${
                        currentRate <= 30
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : currentRate <= 60
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                        {trend === 'down' && <TrendingDown size={13} />}
                        {trend === 'up' && <TrendingUp size={13} />}
                        {trend === 'flat' && <Minus size={13} />}
                        {currentRate}%
                    </div>
                    <span className={`text-[9px] font-mono ${statusColor}`}>{statusLabel}</span>
                </div>
            </div>

            {/* Reference zones legend */}
            <div className="px-6 pt-3 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-2 rounded bg-emerald-500/20" />
                    <span className="text-[9px] text-gray-500">≤30% Bueno</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-2 rounded bg-amber-500/15" />
                    <span className="text-[9px] text-gray-500">30-60% Regular</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-2 rounded bg-red-500/15" />
                    <span className="text-[9px] text-gray-500">&gt;60% Crítico</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 px-2 py-4" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 16, left: -15, bottom: 5 }}>
                        <defs>
                            <linearGradient id="recurrGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {/* Reference areas */}
                        <ReferenceArea y1={0}  y2={30} fill="#10b981" fillOpacity={0.06} />
                        <ReferenceArea y1={30} y2={60} fill="#f59e0b" fillOpacity={0.05} />
                        <ReferenceArea y1={60} y2={100} fill="#ef4444" fillOpacity={0.05} />

                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#475569"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            interval={3}
                        />
                        <YAxis
                            stroke="#475569"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            tickFormatter={v => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} />

                        <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="#7c3aed"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Weekly summary */}
            <div className="px-6 pb-4">
                <div className="grid grid-cols-4 gap-2">
                    {weeks.map((w, i) => (
                        <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3 text-center">
                            <p className="text-[9px] text-gray-600 font-mono mb-1">{w.label}</p>
                            <p className={`text-sm font-black font-mono ${
                                w.rate <= 30 ? 'text-emerald-400' : w.rate <= 60 ? 'text-amber-400' : 'text-red-400'
                            }`}>{w.rate}%</p>
                            <p className="text-[9px] text-gray-600">{w.entries} fallos</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

RecurrencePanel.propTypes = {
    entries: PropTypes.array.isRequired,
};
