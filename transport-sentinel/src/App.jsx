import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isMockAuth } from './firebase.js';
import Dashboard from './Dashboard.jsx';
import { Train, Shield, Cpu, Activity } from 'lucide-react';

const MOCK_CREDENTIALS = { email: 'demo@cognitex.com', password: 'cognitex2024' };

export default function App() {
    const [user, setUser]         = useState(null);
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    if (user) return <Dashboard user={user} onLogout={() => setUser(null)} />;

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isMockAuth) {
                if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
                    setUser({ email, displayName: 'Operador CCO', uid: 'mock-uid' });
                } else {
                    throw new Error('Credenciales incorrectas. Use demo@cognitex.com / cognitex2024');
                }
            } else {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                setUser(cred.user);
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', '').replace(' (auth/invalid-credential).', ''));
        } finally {
            setLoading(false);
        }
    }

    return (
        /*
         * No blur/filter effects here — CSS backdrop-filter and filter:blur()
         * trigger Skia Gaussian kernel using AVX2 on Linux.
         * Grid pattern uses linear-gradient (safe, no convolution).
         * Logo uses box-shadow (safe, simple raster op).
         */
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #060d1a 0%, #08142a 50%, #040810 100%)' }}
        >
            {/* Grid lines — linear-gradient, no blur */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(#1d6fa5 1px, transparent 1px), linear-gradient(90deg, #1d6fa5 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* Status pill */}
            <div className="absolute top-5 right-5 flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-[#081c10] border border-green-500/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                SISTEMA EN LÍNEA
            </div>

            {/* Logo — box-shadow only, no filter blur */}
            <div
                className="w-16 h-16 rounded-xl bg-[#1d6fa5] flex items-center justify-center mb-6"
                style={{ boxShadow: '0 0 40px rgba(29,111,165,0.35)' }}
            >
                <Train size={32} className="text-white" />
            </div>

            {/* Brand */}
            <div className="text-center mb-7">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-2xl font-black text-white tracking-tight">TRANSPORT</span>
                    <span className="text-2xl font-black text-[#1d6fa5] tracking-tight">|</span>
                    <span className="text-2xl font-black text-white tracking-tight">SENTINEL</span>
                </div>
                <p className="text-[10px] font-mono text-[#2a5070] tracking-[0.2em] uppercase">
                    Railway Fleet Management Platform
                </p>
                <p className="text-[9px] font-mono text-[#1a3550] tracking-widest mt-0.5">
                    Centro de Control de Operaciones
                </p>
            </div>

            {/* Feature pills */}
            <div className="flex items-center gap-2 mb-7 flex-wrap justify-center">
                {[
                    { icon: Activity, label: 'Tiempo Real' },
                    { icon: Shield,   label: 'RAMS / EN 50126' },
                    { icon: Cpu,      label: 'IA Predictiva' },
                ].map(({ icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 text-[9px] font-mono text-[#2a5070] bg-[#08111c] border border-[#122030] rounded-full px-3 py-1"
                    >
                        <Icon size={9} className="text-[#1d6fa5]" />
                        {label}
                    </div>
                ))}
            </div>

            {/* Login card — solid background, no blur */}
            <form onSubmit={handleLogin} className="w-full max-w-xs">
                <div className="occ-card p-5 space-y-3">
                    <p className="text-[9px] font-mono text-[#1d4a6a] tracking-widest uppercase text-center">
                        Acceso al Sistema
                    </p>

                    {isMockAuth && (
                        <div className="bg-[#08111c] border border-[#122e50] rounded-lg p-2.5 text-[9px] font-mono text-[#38a8e0] text-center">
                            SIMULACIÓN · demo@cognitex.com / cognitex2024
                        </div>
                    )}

                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Usuario / correo electrónico"
                        required
                        className="w-full bg-[#08111c] border border-[#162e47] rounded-lg px-3 py-2.5 text-[12px] font-mono text-slate-200 placeholder-[#1a3550] outline-none focus:border-[#1d6fa5] transition-colors"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        required
                        className="w-full bg-[#08111c] border border-[#162e47] rounded-lg px-3 py-2.5 text-[12px] font-mono text-slate-200 placeholder-[#1a3550] outline-none focus:border-[#1d6fa5] transition-colors"
                    />

                    {error && (
                        <p className="text-[9px] font-mono text-red-400 bg-[#1c0808] border border-red-500/25 rounded-lg px-3 py-2 text-center">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-[#1d6fa5] hover:bg-[#2185c5] text-white text-[11px] font-bold font-mono tracking-widest uppercase disabled:opacity-50 transition-colors duration-150"
                    >
                        {loading ? '⏳ AUTENTICANDO…' : 'INICIAR SESIÓN CCO'}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-[8px] font-mono text-[#0e2030] tracking-widest">
                COGNITEX INDUSTRIAL · TRANSPORT-SENTINEL v1.0 · UIC/RAMS EN 50126
            </p>
        </div>
    );
}
