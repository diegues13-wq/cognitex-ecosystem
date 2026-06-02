import { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Check, Minus, X, RefreshCw, ClipboardList } from 'lucide-react';
import { CAUSAS_RAIZ } from '../utils/dataGenerator';

function ImplementedIcon({ status }) {
    if (status === 'si')      return <Check  size={13} className="text-emerald-400" />;
    if (status === 'parcial') return <Minus  size={13} className="text-amber-400" />;
    if (status === 'no')      return <X      size={13} className="text-red-400" />;
    return <span className="w-3 h-3 rounded-full border border-gray-600 inline-block" />;
}

ImplementedIcon.propTypes = { status: PropTypes.string };

export default function EntryLog({ entries }) {
    const [filterCausa, setFilterCausa] = useState('');

    const filtered = entries
        .filter(e => !filterCausa || e.causa_raiz === filterCausa)
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 50);

    const causasInEntries = [...new Set(entries.map(e => e.causa_raiz))];

    return (
        <div className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ClipboardList size={16} className="text-violet-400" />
                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Bitácora de Fallos</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Últimas {filtered.length} entradas</p>
                    </div>
                </div>

                <select
                    value={filterCausa}
                    onChange={e => setFilterCausa(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/40 transition-all"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="" className="bg-[#0d0d14]">Todas las causas</option>
                    {causasInEntries.map(key => (
                        <option key={key} value={key} className="bg-[#0d0d14]">
                            {CAUSAS_RAIZ[key]?.emoji} {CAUSAS_RAIZ[key]?.label || key}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/2">
                            <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap">Fecha</th>
                            <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase tracking-widest">Fallo</th>
                            <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap">Causa Raíz</th>
                            <th className="text-left px-4 py-3 text-gray-600 font-bold uppercase tracking-widest">Ajuste</th>
                            <th className="text-center px-4 py-3 text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap">Estado</th>
                            <th className="text-center px-4 py-3 text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap">Impl.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((entry, i) => {
                            const causa = CAUSAS_RAIZ[entry.causa_raiz];
                            return (
                                <tr
                                    key={entry.id}
                                    className={`border-b border-white/3 transition-colors hover:bg-white/2 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                                >
                                    <td className="px-4 py-3 text-gray-500 font-mono whitespace-nowrap">
                                        {entry.date}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 max-w-[200px]">
                                        <span className="line-clamp-2" title={entry.fallo}>{entry.fallo}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {causa ? (
                                            <span className="flex items-center gap-1.5">
                                                <span>{causa.emoji}</span>
                                                <span className="text-gray-300">{causa.label.split(' ').slice(0, 2).join(' ')}</span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">{entry.causa_raiz}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 max-w-[180px]">
                                        <span className="line-clamp-2" title={entry.ajuste}>{entry.ajuste}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {entry.es_recurrente ? (
                                            <span className="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 whitespace-nowrap">
                                                <RefreshCw size={10} /> Recurrente
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Nuevo</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <ImplementedIcon status={entry.implementado} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="px-6 py-12 text-center text-gray-600">
                        <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No hay entradas para la causa seleccionada.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

EntryLog.propTypes = {
    entries: PropTypes.array.isRequired,
};
