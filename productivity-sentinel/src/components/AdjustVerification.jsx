import { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, Check, Minus, X } from 'lucide-react';

export default function AdjustVerification({ pendingAdjust, onVerify }) {
    const [verified, setVerified] = useState(false);
    const [chosen, setChosen] = useState(null);

    if (!pendingAdjust || verified) return null;

    const handleVerify = (status) => {
        setChosen(status);
        setVerified(true);
        onVerify(status);
    };

    return (
        <div className="bg-[#0d0d14] border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mb-0.5">Verificación de ayer</p>
                    <p className="text-sm text-gray-300 leading-snug">
                        Ajuste propuesto:{' '}
                        <span className="text-white font-medium">&ldquo;{pendingAdjust}&rdquo;</span>
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">¿Lo implementaste ayer?</p>
                </div>
            </div>

            <div className="flex gap-2 shrink-0">
                <button
                    onClick={() => handleVerify('si')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        chosen === 'si'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300'
                    }`}
                >
                    <Check size={13} /> Sí
                </button>
                <button
                    onClick={() => handleVerify('parcial')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        chosen === 'parcial'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300'
                    }`}
                >
                    <Minus size={13} /> Parcial
                </button>
                <button
                    onClick={() => handleVerify('no')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        chosen === 'no'
                            ? 'bg-red-500/20 border-red-500/40 text-red-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300'
                    }`}
                >
                    <X size={13} /> No
                </button>
            </div>
        </div>
    );
}

AdjustVerification.propTypes = {
    pendingAdjust: PropTypes.string,
    onVerify: PropTypes.func.isRequired,
};
