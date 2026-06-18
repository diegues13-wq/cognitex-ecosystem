import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isMockAuth } from './firebase.js';
import Dashboard from './Dashboard.jsx';
import { Train, Shield, Cpu, Activity } from 'lucide-react';

const MOCK_CREDENTIALS = { email: 'demo@cognitex.com', password: 'cognitex2024' };

export default function App() {
    const [user, setUser]       = useState(null);
    const [email, setEmail]     = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(#1d6fa5 1px, transparent 1px), linear-gradient(90deg, #1d6fa5 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Status pills top */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    SISTEMA EN LÍNEA
                </div>
                <div className="text-[10px] font-mono text-slate-500">CCO v1.0</div>
            </div>

            {/* Logo mark */}
            <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shadow-[0_0_60px_rgba(29,111,165,0.5)] mb-4 mx-auto">
                    <Train size={40} className="text-white" />
                </div>
            </div>

            {/* Brand */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-3xl font-black text-white tracking-tight">TRANSPORT</span>
                    <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent tracking-tight">|</span>
                    <span className="text-3xl font-black text-white tracking-tight">SENTINEL</span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 tracking-[0.25em] uppercase mb-1">Railway Fleet Management Platform</p>
                <p className="text-[10px] font-mono text-slate-600 tracking-widest">Centro de Control de Operaciones</p>
            </div>

            {/* Feature pills */}
            <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
                {[
                    { icon: Activity, label: 'Tiempo Real' },
                    { icon: Shield, label: 'RAMS / EN 50126' },
                    { icon: Cpu, label: 'IA Predictiva' },
                ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-occ-800/60 border border-occ-700/40 rounded-full px-3 py-1">
                        <Icon size={10} className="text-slate-600" />
                        {label}
                    </div>
                ))}
            </div>

            {/* Login card */}
            <form onSubmit={handleLogin} className="w-full max-w-sm">
                <div className="occ-card p-6 rounded-2xl space-y-4">
                    <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase text-center mb-2">Acceso al Sistema</p>

                    {isMockAuth && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[10px] font-mono text-blue-400 text-center">
                            MODO SIMULACIÓN — demo@cognitex.com / cognitex2024
                        </div>
                    )}

                    <div className="space-y-3">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Usuario / correo electrónico"
                            required
                            className="w-full bg-occ-900/80 border border-occ-700/50 rounded-xl px-4 py-3 text-[12px] font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-rail/50 focus:bg-occ-900 transition-all"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            required
                            className="w-full bg-occ-900/80 border border-occ-700/50 rounded-xl px-4 py-3 text-[12px] font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-rail/50 focus:bg-occ-900 transition-all"
                        />
                    </div>

                    {error && (
                        <p className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 to-violet-700 text-white text-[12px] font-bold font-mono tracking-widest uppercase hover:from-blue-600 hover:to-violet-600 hover:shadow-[0_0_30px_rgba(29,111,165,0.5)] disabled:opacity-50 transition-all duration-200"
                    >
                        {loading ? '⏳ AUTENTICANDO…' : 'INICIAR SESIÓN CCO'}
                    </button>
                </div>
            </form>

            {/* Footer */}
            <p className="mt-8 text-[9px] font-mono text-slate-700 tracking-widest">
                COGNITEX INDUSTRIAL · TRANSPORT-SENTINEL v1.0 · UIC/RAMS EN 50126
            </p>
        </div>
    );
}
