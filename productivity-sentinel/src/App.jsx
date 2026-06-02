import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, isMockAuth } from './firebase';
import Dashboard from './Dashboard';
import { TrendingUp } from 'lucide-react';

function useMockAuth() {
    const [user, setUser]   = useState(null);
    const [loading]         = useState(false);
    const login  = ()       => setUser({ displayName: 'Dev User', email: 'dev@local', uid: 'mock' });
    const logout = ()       => setUser(null);
    return { user, loading, login, logout };
}

function useFirebaseAuth() {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (fbUser) => {
            setUser(fbUser);
            setLoading(false);
        });
        return unsub;
    }, []);

    const login  = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = ()                => signOut(auth);
    return { user, loading, login, logout };
}

export default function App() {
    const mock     = useMockAuth();
    const firebase = useFirebaseAuth();
    const { user, loading, login, logout } = isMockAuth ? mock : firebase;

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [busy,     setBusy]     = useState(false);

    const handleLogin = async (e) => {
        e?.preventDefault();
        setError('');

        if (isMockAuth) {
            login();
            return;
        }

        if (!email.trim() || !password) {
            setError('Completa todos los campos.');
            return;
        }

        setBusy(true);
        try {
            await login(email, password);
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' ||
                code === 'auth/invalid-credential') {
                setError('Credenciales inválidas');
            } else if (code === 'auth/too-many-requests') {
                setError('Demasiados intentos. Intenta más tarde.');
            } else if (code === 'auth/network-request-failed') {
                setError('Sin conexión. Verifica tu red.');
            } else {
                setError('Error al iniciar sesión. Intenta de nuevo.');
            }
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-industrial-950">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (user) return <Dashboard user={user} onLogout={logout} />;

    return (
        <div className="flex h-screen items-center justify-center bg-[#0a0a10] text-white relative overflow-hidden font-sans" style={{ userSelect: 'none' }}>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#7c3aed20_0%,_#020617_60%)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl p-4">
                <div className="bg-industrial-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_150px_-30px_rgba(124,58,237,0.15)] flex flex-col md:flex-row overflow-hidden min-h-[600px]">

                    {/* LEFT PANEL — branding */}
                    <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-900/40 via-industrial-950/60 to-black/40 relative flex-col justify-center items-center p-12 overflow-hidden border-r border-white/5">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(124,58,237,0.15)_0%,_transparent_60%)]" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-violet-500/20 blur-[60px] rounded-full -z-10 animate-pulse" />
                                <div className="w-32 h-32 rounded-3xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.3)]">
                                    <TrendingUp size={64} className="text-violet-400 drop-shadow-[0_0_20px_rgba(124,58,237,0.8)]" />
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-xl">
                                PRODUCTIVITY<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">SENTINEL</span>
                            </h1>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500/50" />
                                <p className="text-xs font-mono text-violet-100/70 tracking-[0.3em] uppercase whitespace-nowrap">Sistema de Control de Mejora Personal</p>
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500/50" />
                            </div>
                        </div>
                        <div className="absolute bottom-10 py-2 px-6 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                                    {isMockAuth ? 'Mock Mode · No auth required' : 'System Online'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL — login form */}
                    <form onSubmit={handleLogin} className="w-full md:w-1/2 bg-black/20 p-8 md:p-14 flex flex-col justify-center relative">
                        <div className="md:hidden flex flex-col items-center mb-10">
                            <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-4">
                                <TrendingUp size={40} className="text-violet-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">PRODUCTIVITY<span className="text-violet-400">SENTINEL</span></h2>
                            <p className="text-[10px] font-mono text-violet-500/80 tracking-widest uppercase mt-2">Mejora Personal</p>
                        </div>

                        <div className="hidden md:block absolute top-0 right-0 p-8">
                            <div className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">v1.0.0</div>
                        </div>

                        <div className="mb-8 md:mb-12 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
                            <p className="text-sm text-gray-400">
                                {isMockAuth
                                    ? 'Modo simulación activo. Haz clic en Acceder para continuar.'
                                    : 'Accede a tu panel de mejora personal.'}
                            </p>
                        </div>

                        <div className="w-full space-y-6">
                            {!isMockAuth && (
                                <>
                                    <div className="relative transition-all duration-300 focus-within:scale-[1.02]">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <span className="text-violet-500 text-[10px] font-black tracking-widest">EMAIL</span>
                                            <div className="h-4 w-px bg-white/10 ml-4" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            className="w-full bg-industrial-900/80 border border-white/10 rounded-xl pl-28 pr-4 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium tracking-wide shadow-inner"
                                            placeholder="usuario@empresa.com"
                                        />
                                    </div>
                                    <div className="relative transition-all duration-300 focus-within:scale-[1.02]">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <span className="text-violet-500 text-[10px] font-black tracking-widest">CONTRASEÑA</span>
                                            <div className="h-4 w-px bg-white/10 ml-4" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            className="w-full bg-industrial-900/80 border border-white/10 rounded-xl pl-36 pr-4 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium tracking-wide shadow-inner"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-950/30 p-3 rounded-lg border border-red-500/20 justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black py-5 rounded-xl transform transition-all active:scale-[0.98] disabled:opacity-50 hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.4)] mt-4 border-t border-white/20"
                            >
                                <span className="uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                                    {busy
                                        ? <><span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> Verificando...</>
                                        : <>Acceder a la Plataforma <span className="text-lg leading-none">&rarr;</span></>
                                    }
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
