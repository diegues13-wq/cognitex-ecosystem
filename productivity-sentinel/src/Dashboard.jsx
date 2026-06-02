import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Menu, X } from 'lucide-react';

import Sidebar from './components/Sidebar';
import DailyEntry from './components/DailyEntry';
import AdjustVerification from './components/AdjustVerification';
import ControlLoopPanel from './components/ControlLoopPanel';
import ParetoPanel from './components/ParetoPanel';
import RecurrencePanel from './components/RecurrencePanel';
import RestrictionKanban from './components/RestrictionKanban';
import KPICards from './components/KPICards';
import EntryLog from './components/EntryLog';
import WeeklySynthesis from './components/WeeklySynthesis';
import ChatAssistant from './components/ChatAssistant';

import { generateEntries, RESTRICTIONS } from './utils/dataGenerator';

export default function Dashboard({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState('overview');
    const [chatOpen, setChatOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Static mock data (generated once)
    const baseEntries = useMemo(() => generateEntries(30), []);
    const [entries, setEntries] = useState(baseEntries);
    const [restrictions] = useState(RESTRICTIONS);

    // Pending adjust: last entry's ajuste (not yet verified)
    const pendingAdjust = useMemo(() => {
        const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted[0]?.ajuste || null;
    }, [entries]);

    const handleNewEntry = (entry) => {
        setEntries(prev => [entry, ...prev]);
    };

    const handleVerify = (status) => {
        if (entries.length === 0) return;
        setEntries(prev => {
            const sorted = [...prev].sort((a, b) => new Date(b.date) - new Date(a.date));
            const latest = sorted[0];
            return prev.map(e => e.id === latest.id ? { ...e, implementado: status } : e);
        });
    };

    const sectionTitle = {
        overview:  'Overview',
        registro:  'Registro Diario',
        analisis:  'Análisis',
        sintesis:  'Síntesis Semanal',
        bitacora:  'Bitácora',
    };

    return (
        <div className="flex h-screen bg-[#0a0a10] text-white overflow-hidden">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <Sidebar
                    activeSection={activeSection}
                    onSectionChange={(s) => { setActiveSection(s); setSidebarOpen(false); }}
                    onChatOpen={() => setChatOpen(true)}
                    user={user}
                    onLogout={onLogout}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 lg:ml-64 overflow-y-auto relative">
                {/* Ambient gradient */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-[radial-gradient(circle_at_50%_0%,_#7c3aed15_0%,_transparent_70%)] pointer-events-none" />

                {/* Top bar */}
                <div className="sticky top-0 z-20 bg-[#0a0a10]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <Menu size={18} />
                        </button>
                        <div>
                            <h1 className="text-sm font-bold text-white uppercase tracking-widest">{sectionTitle[activeSection]}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-gray-500">Sistema activo · {entries.length} registros</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating chat button (top bar) */}
                    <button
                        onClick={() => setChatOpen(c => !c)}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/15 border border-violet-500/25 text-xs font-bold text-violet-300 hover:bg-violet-600/25 transition-all"
                    >
                        <Sparkles size={14} className="text-violet-400" />
                        Chat AI
                    </button>
                </div>

                {/* Section content */}
                <div className="p-6 space-y-6 relative z-10">

                    {/* ── OVERVIEW ── */}
                    {activeSection === 'overview' && (
                        <>
                            {pendingAdjust && (
                                <AdjustVerification pendingAdjust={pendingAdjust} onVerify={handleVerify} />
                            )}
                            <KPICards entries={entries} restrictions={restrictions} />
                            <ControlLoopPanel />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ParetoPanel entries={entries} />
                                <RecurrencePanel entries={entries} />
                            </div>
                        </>
                    )}

                    {/* ── REGISTRO DIARIO ── */}
                    {activeSection === 'registro' && (
                        <>
                            {pendingAdjust && (
                                <AdjustVerification pendingAdjust={pendingAdjust} onVerify={handleVerify} />
                            )}
                            <DailyEntry onSubmit={handleNewEntry} />

                            {/* Last 3 entries preview */}
                            {entries.slice(0, 3).length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Últimas entradas</p>
                                    <div className="space-y-3">
                                        {entries
                                            .slice()
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 3)
                                            .map(entry => (
                                                <div
                                                    key={entry.id}
                                                    className="bg-[#0d0d14] border border-white/5 rounded-xl px-4 py-3 flex items-start gap-3"
                                                >
                                                    <div className="shrink-0 mt-0.5">
                                                        <span className="text-sm">
                                                            {/* causa raiz emoji via import */}
                                                            {entry.causa_raiz === 'sobrecompromiso' ? '📋' :
                                                             entry.causa_raiz === 'evitacion_conflicto' ? '🫤' :
                                                             entry.causa_raiz === 'falta_descomposicion' ? '🧩' :
                                                             entry.causa_raiz === 'gestion_energia' ? '⚡' :
                                                             entry.causa_raiz === 'distraccion_entorno' ? '📱' :
                                                             entry.causa_raiz === 'perfeccionismo' ? '🔄' : '😟'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-200 leading-snug line-clamp-2">{entry.fallo}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="text-[10px] text-gray-600 font-mono">{entry.date}</span>
                                                            {entry.es_recurrente && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">Recurrente</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-[10px] text-gray-600 line-clamp-2 max-w-[120px]">{entry.ajuste}</p>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── ANÁLISIS ── */}
                    {activeSection === 'analisis' && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ParetoPanel entries={entries} />
                                <RecurrencePanel entries={entries} />
                            </div>
                            <RestrictionKanban restrictions={restrictions} />
                        </>
                    )}

                    {/* ── SÍNTESIS ── */}
                    {activeSection === 'sintesis' && (
                        <WeeklySynthesis entries={entries} />
                    )}

                    {/* ── BITÁCORA ── */}
                    {activeSection === 'bitacora' && (
                        <EntryLog entries={entries} />
                    )}
                </div>
            </main>

            {/* Chat assistant */}
            <ChatAssistant
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                entries={entries}
            />

            {/* Floating chat button (mobile, bottom-right) */}
            {!chatOpen && (
                <button
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-2xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(124,58,237,0.5)] z-30 transition-all"
                >
                    <Sparkles size={22} />
                </button>
            )}
        </div>
    );
}

Dashboard.propTypes = {
    user: PropTypes.object,
    onLogout: PropTypes.func,
};
