import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { CAUSAS_RAIZ, METAS } from '../utils/dataGenerator';

export default function DailyEntry({ onSubmit }) {
    const [fallo, setFallo]           = useState('');
    const [causa, setCausa]           = useState('');
    const [ajuste, setAjuste]         = useState('');
    const [acierto, setAcierto]       = useState('');
    const [energia, setEnergia]       = useState(3);
    const [metaId, setMetaId]         = useState('');
    const [showOpcionales, setShowOpcionales] = useState(false);
    const [errors, setErrors]         = useState({});
    const [submitted, setSubmitted]   = useState(false);

    const today = format(new Date(), "EEEE d 'de' MMMM", { locale: undefined });

    const validate = () => {
        const e = {};
        if (!fallo.trim())   e.fallo  = 'El fallo es obligatorio';
        if (!causa)          e.causa  = 'Selecciona la causa raíz';
        if (!ajuste.trim())  e.ajuste = 'El ajuste es obligatorio';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        const entry = {
            id: `entry-${Date.now()}`,
            date: format(new Date(), 'yyyy-MM-dd'),
            fecha: new Date(),
            fallo: fallo.trim(),
            fallo_normalizado: fallo.trim(),
            causa_raiz: causa,
            ajuste: ajuste.trim(),
            implementado: 'pendiente',
            es_recurrente: false,
            acierto: acierto.trim(),
            nivel_energia: energia,
            meta_id: metaId || 'meta-1',
        };

        onSubmit(entry);
        setSubmitted(true);

        // Reset form after delay
        setTimeout(() => {
            setFallo('');
            setCausa('');
            setAjuste('');
            setAcierto('');
            setEnergia(3);
            setMetaId('');
            setShowOpcionales(false);
            setSubmitted(false);
        }, 2500);
    };

    if (submitted) {
        return (
            <div className="bg-industrial-900/40 border border-violet-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                </div>
                <div>
                    <p className="text-white font-bold text-lg">Fallo registrado</p>
                    <p className="text-gray-400 text-sm mt-1">El ajuste queda pendiente de verificación mañana.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-[#0d0d14] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-black/20">
                <PenLine size={16} className="text-violet-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Registro del Día</h2>
                <span className="ml-auto text-xs text-gray-500 font-mono capitalize">{today}</span>
            </div>

            <div className="p-6 space-y-6">
                {/* Fallo */}
                <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-widest">
                        ¿Qué falló hoy? <span className="text-red-400">*</span>
                        <span className="text-gray-600 normal-case tracking-normal ml-2 font-normal">(evento, no identidad)</span>
                    </label>
                    <textarea
                        rows={3}
                        value={fallo}
                        onChange={e => setFallo(e.target.value)}
                        placeholder='Hoy pospuse la llamada difícil con el cliente... (usa "hoy..." no "soy...")'
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all resize-none ${
                            errors.fallo ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20'
                        }`}
                    />
                    {errors.fallo && <p className="text-red-400 text-xs mt-1">{errors.fallo}</p>}
                    <p className="text-gray-600 text-[10px] mt-1 font-mono">Tip: usa lenguaje de evento ("hoy...") no de identidad ("soy...")</p>
                </div>

                {/* Causa Raíz */}
                <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-widest">
                        Causa Raíz <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(CAUSAS_RAIZ).map(([key, { label, emoji, color }]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setCausa(key)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                                    causa === key
                                        ? 'bg-violet-600/20 border-violet-500/50 text-white shadow-[0_0_12px_-3px_rgba(124,58,237,0.4)]'
                                        : 'bg-white/3 border-white/8 text-gray-400 hover:border-white/20 hover:text-gray-200'
                                }`}
                            >
                                <span className="text-base leading-none">{emoji}</span>
                                <span className="leading-tight">{label}</span>
                            </button>
                        ))}
                    </div>
                    {errors.causa && <p className="text-red-400 text-xs mt-1">{errors.causa}</p>}
                </div>

                {/* Ajuste */}
                <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-widest">
                        Ajuste para mañana <span className="text-red-400">*</span>
                        <span className="text-gray-600 normal-case tracking-normal ml-2 font-normal">(obligatorio)</span>
                    </label>
                    <input
                        type="text"
                        value={ajuste}
                        onChange={e => setAjuste(e.target.value)}
                        placeholder="Una acción concreta y específica que puedo ejecutar mañana..."
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
                            errors.ajuste ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20'
                        }`}
                    />
                    {errors.ajuste && <p className="text-red-400 text-xs mt-1">{errors.ajuste}</p>}
                </div>

                {/* Opcionales collapsible */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowOpcionales(s => !s)}
                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        {showOpcionales ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>Opcionales (acierto del día, energía, meta)</span>
                    </button>

                    {showOpcionales && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Acierto */}
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Acierto del día</label>
                                <input
                                    type="text"
                                    value={acierto}
                                    onChange={e => setAcierto(e.target.value)}
                                    placeholder="¿Qué salió bien hoy?"
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/15 transition-all"
                                />
                            </div>

                            {/* Nivel energía */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Nivel de energía</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setEnergia(n)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                                                energia === n
                                                    ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                                                    : 'bg-white/5 border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Meta */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Meta asociada</label>
                                <select
                                    value={metaId}
                                    onChange={e => setMetaId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="" className="bg-[#0d0d14]">Sin meta</option>
                                    {METAS.map(m => (
                                        <option key={m.id} value={m.id} className="bg-[#0d0d14]">{m.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-[0_8px_30px_-8px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                >
                    Registrar fallo
                    <span className="text-lg leading-none">&rarr;</span>
                </button>
            </div>
        </form>
    );
}

DailyEntry.propTypes = {
    onSubmit: PropTypes.func.isRequired,
};
