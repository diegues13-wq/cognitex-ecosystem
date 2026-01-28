import { useState } from 'react';
import Dashboard from './Dashboard';
import logo from './assets/cognitex_icon.png';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        setError('');
        setLoading(true);
        setTimeout(() => {
            if (username === 'admin' && password === 'admin') {
                setUser({ name: "Cognitex Admin", email: "admin@cognitex.com" });
            } else {
                setError('Credenciales inválidas');
            }
            setLoading(false);
        }, 800);
    };

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-industrial-950 text-white relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
                {/* Modern Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#0e749020_0%,_#020617_60%)] pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl p-4">
                    {/* Enterprise Glass Panel - Split Layout */}
                    <div className="bg-industrial-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_150px_-30px_rgba(16,185,129,0.15)] flex flex-col md:flex-row overflow-hidden min-h-[600px] relative group">

                        {/* LEFT PANEL - VISUAL BRANDING (Desktop 50%) */}
                        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-900/40 via-industrial-950/60 to-black/40 relative flex-col justify-center items-center p-12 overflow-hidden border-r border-white/5">
                            {/* Animated Background Effects */}
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.15)_0%,_transparent_60%)]"></div>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

                            {/* Centered Brand Content */}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full -z-10 animate-pulse"></div>
                                    <img src={logo} alt="Agro-Sentinel" className="h-40 w-auto mb-8 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-transform duration-700 hover:scale-105" />
                                </div>

                                <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-xl">
                                    AGRO<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">SENTINEL</span>
                                </h1>

                                <div className="flex items-center gap-4 mt-2">
                                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-500/50"></div>
                                    <p className="text-xs font-mono text-emerald-100/70 tracking-[0.3em] uppercase whitespace-nowrap">
                                        IoT Powered Platform
                                    </p>
                                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-500/50"></div>
                                </div>
                            </div>

                            {/* Float Stats */}
                            <div className="absolute bottom-10 glass-stat py-2 px-6 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">System Online</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL - LOGIN FORM (Mobile 100%, Desktop 50%) */}
                        <div className="w-full md:w-1/2 bg-black/20 p-8 md:p-14 flex flex-col justify-center relative">
                            {/* Mobile Branding (Visible only on small screens) */}
                            <div className="md:hidden flex flex-col items-center mb-10">
                                <img src={logo} alt="Agro-Sentinel" className="h-24 w-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                                <h2 className="text-3xl font-black text-white tracking-tight">
                                    AGRO<span className="text-emerald-400">SENTINEL</span>
                                </h2>
                                <p className="text-[10px] font-mono text-emerald-500/80 tracking-widest uppercase mt-2">IoT Powered Platform</p>
                            </div>

                            <div className="hidden md:block absolute top-0 right-0 p-8">
                                <div className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">v3.0.4</div>
                            </div>

                            <div className="mb-8 md:mb-12 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
                                <p className="text-sm text-gray-400">Acceda al panel de control industrial.</p>
                            </div>

                            <div className="w-full space-y-6">
                                <div className="group/input relative transition-all duration-300 focus-within:scale-[1.02]">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <span className="text-emerald-500 text-[10px] font-black tracking-widest">USUARIO</span>
                                        <div className="h-4 w-px bg-white/10 ml-4"></div>
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-industrial-900/80 border border-white/10 rounded-xl pl-32 pr-4 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-industrial-900 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 text-sm font-medium tracking-wide shadow-inner"
                                        placeholder="ID Operador"
                                    />
                                </div>
                                <div className="group/input relative transition-all duration-300 focus-within:scale-[1.02]">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <span className="text-emerald-500 text-[10px] font-black tracking-widest">CONTRASEÑA</span>
                                        <div className="h-4 w-px bg-white/10 ml-4"></div>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                        className="w-full bg-industrial-900/80 border border-white/10 rounded-xl pl-32 pr-4 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-industrial-900 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 text-sm font-medium tracking-wide shadow-inner"
                                        placeholder="••••••••••••"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-950/30 p-3 rounded-lg border border-red-500/20 justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleLogin}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-5 rounded-xl transform transition-all active:scale-[0.98] disabled:opacity-50 hover:to-emerald-400 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.4)] mt-4 border-t border-white/20 relative overflow-hidden group/btn"
                                >
                                    <span className="relative z-10 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                                        {loading ? 'Verificando...' : 'Acceder a la Plataforma'}
                                        {!loading && <span className="text-lg leading-none">&rarr;</span>}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Dashboard onLogout={() => setUser(null)} />
    );
}

export default App;
