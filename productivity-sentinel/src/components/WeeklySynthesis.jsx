import { useState } from 'react';
import PropTypes from 'prop-types';
import { Brain, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getWeeklySynthesis, CAUSAS_RAIZ } from '../utils/dataGenerator';

export default function WeeklySynthesis({ entries }) {
    const [loading, setLoading] = useState(false);
    const [synthesis, setSynthesis] = useState(() => getWeeklySynthesis(entries));

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            setSynthesis(getWeeklySynthesis(entries));
            setLoading(false);
        }, 1200);
    };

    const { weekNum, causasDominantes, restriccionPrioritaria, experimento } = synthesis;

    return (
        <div className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                        <Brain size={16} className="text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                            Síntesis Semanal{' '}
                            <span className="text-violet-400">— Semana {weekNum}</span>
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Análisis automático del lazo de mejora</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all flex items-center justify-center">
                        <ChevronLeft size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all flex items-center justify-center">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Causas dominantes */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Causas Dominantes</p>
                    <div className="space-y-3">
                        {causasDominantes.map((c, i) => (
                            <div key={c.key} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-600 w-4">{i + 1}.</span>
                                <span className="text-base">{c.emoji}</span>
                                <span className="text-sm font-semibold text-white flex-1">{c.label}</span>
                                <div className="flex items-center gap-3 min-w-[140px]">
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
                                            style={{ width: `${c.pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-violet-300 font-mono w-10 text-right">{c.pct}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Restricción prioritaria */}
                {restriccionPrioritaria && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest mb-3">Restricción Prioritaria</p>
                        <p className="text-sm text-gray-200 leading-relaxed">
                            &ldquo;
                            {restriccionPrioritaria.descripcion === 'Sobrecompromiso crónico'
                                ? 'El sobrecompromiso bloquea simultáneamente tus metas de trabajo profundo y fiabilidad. Es la restricción de mayor apalancamiento para atacar esta semana.'
                                : restriccionPrioritaria.descripcion}
                            &rdquo;
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-red-400/60">
                                {CAUSAS_RAIZ[restriccionPrioritaria.causa_raiz]?.emoji}{' '}
                                {CAUSAS_RAIZ[restriccionPrioritaria.causa_raiz]?.label}
                            </span>
                            {restriccionPrioritaria.dias_activa > 0 && (
                                <span className="text-[10px] font-mono text-gray-600">· Activa {restriccionPrioritaria.dias_activa} días</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Experimento */}
                <div className="bg-violet-600/5 border border-violet-500/15 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-bold text-violet-400/80 uppercase tracking-widest">Experimento de la Semana</p>

                    <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Hipótesis</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{experimento.hipotesis}</p>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Acción</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{experimento.accion}</p>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Métrica de Éxito</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                            <p className="text-sm text-violet-300 font-medium">{experimento.metrica}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/15 border border-violet-500/25 text-xs font-bold text-violet-300 hover:bg-violet-600/25 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Generando...' : 'Generar nueva síntesis'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        <ChevronLeft size={13} />
                        Semana anterior
                    </button>
                </div>
            </div>
        </div>
    );
}

WeeklySynthesis.propTypes = {
    entries: PropTypes.array.isRequired,
};
