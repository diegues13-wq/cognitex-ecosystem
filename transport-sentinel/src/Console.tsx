import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import type { SessionUser } from '@cognitex/auth';
import { BRANDS } from '@cognitex/theme';
import { AppShell, DataSourceBadge, type NavSection } from '@cognitex/ui';
import {
    Activity,
    Brain,
    Globe,
    LayoutDashboard,
    ShieldAlert,
    Train,
    TrendingUp,
    Wrench,
    Zap,
} from 'lucide-react';

import * as api from './services/api';
import type {
    CargoDay,
    EnergyDay,
    FleetFilter,
    FleetKpis,
    HistoryDay,
    Incident,
    PassengerDay,
    RailAlert,
    RailRoute,
    RamsMetric,
    TrainSnapshot,
    WorkOrder,
} from './domain/types';
import { formatClock } from './domain/status';
import { AlertTicker } from './components/AlertTicker';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * The console.
 *
 * What used to be `Dashboard.jsx` plus a 225-line hand-rolled `Sidebar.jsx`
 * and a 93-line `TopBar.jsx` is now `AppShell` from @cognitex/ui plus this
 * file's data loading. Navigation is a section id the shell owns rather than
 * a `VIEW_COMPONENTS` map keyed on local state, so the sections are real,
 * the mobile drawer leaves the accessibility tree when it closes, and the
 * sidebar is not a fourth copy of the same markup.
 */

const REFRESH_MS = 8_000;
const HISTORY_DAYS = 30;

const CCOView = lazy(() => import('./views/CCOView'));
const FleetView = lazy(() => import('./views/FleetView'));
const MaintenanceView = lazy(() => import('./views/MaintenanceView'));
const OperationsView = lazy(() => import('./views/OperationsView'));
const CommercialView = lazy(() => import('./views/CommercialView'));
const EnergyView = lazy(() => import('./views/EnergyView'));
const SafetyView = lazy(() => import('./views/SafetyView'));
const AIView = lazy(() => import('./views/AIView'));
const ProjectsView = lazy(() => import('./views/ProjectsView'));

const SECTIONS: NavSection[] = [
    { id: 'cco', label: 'Centro de control', icon: <LayoutDashboard size={16} /> },
    { id: 'operations', label: 'Operaciones y OTP', icon: <Activity size={16} /> },
    { id: 'commercial', label: 'Comercial', icon: <TrendingUp size={16} /> },
    { id: 'fleet', label: 'Flota', icon: <Train size={16} /> },
    { id: 'maintenance', label: 'Mantenimiento', icon: <Wrench size={16} /> },
    { id: 'energy', label: 'Energía', icon: <Zap size={16} /> },
    { id: 'safety', label: 'Seguridad y RAMS', icon: <ShieldAlert size={16} /> },
    { id: 'ai', label: 'Asistente IA', icon: <Brain size={16} /> },
    { id: 'projects', label: 'Proyectos', icon: <Globe size={16} /> },
];

interface CoreData {
    snapshot: TrainSnapshot[];
    kpis: FleetKpis;
    alerts: RailAlert[];
    /**
     * When this snapshot was taken.
     *
     * Carried with the data rather than read from the clock during render, so
     * every view that needs "now" — the alert ages, the safety histogram's
     * ten-week window, the train graph's AHORA line — agrees on one instant
     * and re-renders when it moves.
     */
    at: number;
}

interface ReferenceData {
    history: HistoryDay[];
    workOrders: WorkOrder[];
    incidents: Incident[];
    energy: EnergyDay[];
    passengers: PassengerDay[];
    cargo: CargoDay[];
    rams: RamsMetric[];
    routes: RailRoute[];
}

const EMPTY_REFERENCE: ReferenceData = {
    history: [],
    workOrders: [],
    incidents: [],
    energy: [],
    passengers: [],
    cargo: [],
    rams: [],
    routes: [],
};

function isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

export interface ConsoleProps {
    user: SessionUser;
    onSignOut: () => void;
    demoMode: boolean;
}

export function Console({ user, onSignOut, demoMode }: ConsoleProps) {
    const [section, setSection] = useState('cco');
    const [fleetFilter, setFleetFilter] = useState<FleetFilter>('todos');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);

    const [core, setCore] = useState<CoreData | null>(null);
    const [reference, setReference] = useState<ReferenceData>(EMPTY_REFERENCE);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches; does not touch state.
     *
     * A response that arrives after the operator changed the filter is
     * discarded by the effect's `AbortController`, so there is no need for a
     * request-sequence guard — and keeping every `setState` inside a promise
     * callback means the effect body itself never renders twice in a row.
     */
    const fetchCore = useCallback(
        async (signal: AbortSignal): Promise<CoreData> => {
            const [snapshot, kpis, alerts] = await Promise.all([
                api.fetchFleetSnapshot(fleetFilter, signal),
                api.fetchFleetKpis(fleetFilter, signal),
                api.fetchAlerts(fleetFilter, signal),
            ]);
            return { snapshot, kpis, alerts, at: Date.now() };
        },
        [fleetFilter]
    );

    const onCoreFailure = useCallback((cause: unknown) => {
        if (isAbort(cause)) return;
        setError(
            cause instanceof Error
                ? cause.message
                : 'No se pudo contactar con el servidor del CCO.'
        );
    }, []);

    const onCoreSuccess = useCallback((next: CoreData) => {
        setCore(next);
        setError(null);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchCore(controller.signal).then(onCoreSuccess).catch(onCoreFailure);
        return () => controller.abort();
    }, [fetchCore, onCoreFailure, onCoreSuccess]);

    useEffect(() => {
        if (!autoRefresh) return;
        const controller = new AbortController();
        const id = setInterval(() => {
            fetchCore(controller.signal).then(onCoreSuccess).catch(onCoreFailure);
        }, REFRESH_MS);
        return () => {
            clearInterval(id);
            controller.abort();
        };
    }, [autoRefresh, fetchCore, onCoreFailure, onCoreSuccess]);

    // Reference data does not tick, so it loads once and is never polled.
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        Promise.all([
            api.fetchHistory(HISTORY_DAYS, null, signal),
            api.fetchWorkOrders(signal),
            api.fetchIncidents(signal),
            api.fetchEnergy(HISTORY_DAYS, signal),
            api.fetchPassengerData(HISTORY_DAYS, signal),
            api.fetchCargoData(HISTORY_DAYS, signal),
            api.fetchRams(signal),
            api.fetchRoutes(signal),
        ])
            .then(([history, workOrders, incidents, energy, passengers, cargo, rams, routes]) => {
                setReference({
                    history,
                    workOrders,
                    incidents,
                    energy,
                    passengers,
                    cargo,
                    rams,
                    routes,
                });
            })
            .catch((cause: unknown) => {
                if (!isAbort(cause)) console.error('[Console] Datos de referencia:', cause);
            });

        return () => controller.abort();
    }, []);

    const toolbar = (
        <ConsoleToolbar
            fleetFilter={fleetFilter}
            onFleetFilterChange={setFleetFilter}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            updatedAt={core?.at ?? null}
        />
    );

    return (
        <AppShell
            brand={BRANDS.transport}
            sections={SECTIONS}
            activeSection={section}
            onSectionChange={setSection}
            userLabel={demoMode ? `${user.displayName} · demo` : user.displayName}
            onSignOut={onSignOut}
            toolbar={toolbar}
            banner={core ? <AlertTicker alerts={core.alerts} /> : null}
        >
            <ErrorBoundary key={section}>
                <Suspense fallback={<LoadingPanel label="Cargando módulo…" />}>
                    <SectionContent
                        section={section}
                        core={core}
                        reference={reference}
                        error={error}
                        fleetFilter={fleetFilter}
                        selectedTrainId={selectedTrainId}
                        onSelectTrain={setSelectedTrainId}
                        demoMode={demoMode}
                    />
                </Suspense>
            </ErrorBoundary>
        </AppShell>
    );
}

interface SectionContentProps {
    section: string;
    core: CoreData | null;
    reference: ReferenceData;
    error: string | null;
    fleetFilter: FleetFilter;
    selectedTrainId: string | null;
    onSelectTrain: (id: string) => void;
    demoMode: boolean;
}

function SectionContent({
    section,
    core,
    reference,
    error,
    fleetFilter,
    selectedTrainId,
    onSelectTrain,
    demoMode,
}: SectionContentProps) {
    // The project browser is reference material and does not need telemetry,
    // so it renders while the CCO connection is still coming up.
    if (section === 'projects') return <ProjectsView />;

    if (error && !core) {
        return (
            <div className="occ-panel p-8 text-center" role="alert">
                <p className="label-mono" style={{ color: 'var(--color-alert)' }}>
                    Sin conexión con el CCO
                </p>
                <p className="mt-2 text-sm text-steel">{error}</p>
            </div>
        );
    }

    if (!core) return <LoadingPanel label="Conectando con el CCO…" />;

    switch (section) {
        case 'fleet':
            return (
                <FleetView
                    snapshot={core.snapshot}
                    selectedTrainId={selectedTrainId}
                    onSelectTrain={onSelectTrain}
                />
            );
        case 'maintenance':
            return (
                <MaintenanceView
                    orders={reference.workOrders}
                    rams={reference.rams}
                    kpis={core.kpis}
                />
            );
        case 'operations':
            return (
                <OperationsView
                    history={reference.history}
                    kpis={core.kpis}
                    routes={reference.routes}
                    snapshot={core.snapshot}
                />
            );
        case 'commercial':
            return (
                <CommercialView
                    passengers={reference.passengers}
                    cargo={reference.cargo}
                    kpis={core.kpis}
                    fleetFilter={fleetFilter}
                />
            );
        case 'energy':
            return <EnergyView energy={reference.energy} />;
        case 'safety':
            return <SafetyView incidents={reference.incidents} kpis={core.kpis} now={core.at} />;
        case 'ai':
            return (
                <AIView
                    kpis={core.kpis}
                    snapshot={core.snapshot}
                    orders={reference.workOrders}
                    rams={reference.rams}
                    demoMode={demoMode}
                />
            );
        default:
            return (
                <CCOView
                    snapshot={core.snapshot}
                    alerts={core.alerts}
                    kpis={core.kpis}
                    incidents={reference.incidents}
                    routes={reference.routes}
                    now={core.at}
                />
            );
    }
}

function LoadingPanel({ label }: { label: string }) {
    return (
        <p className="flex min-h-64 items-center justify-center" role="status">
            <span className="label-mono">{label}</span>
        </p>
    );
}

// ── Toolbar ─────────────────────────────────────────────────────────────────

const FLEET_FILTERS: { id: FleetFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pasajeros', label: 'Pasajeros' },
    { id: 'carga', label: 'Carga' },
];

interface ConsoleToolbarProps {
    fleetFilter: FleetFilter;
    onFleetFilterChange: (value: FleetFilter) => void;
    autoRefresh: boolean;
    onAutoRefreshChange: (value: boolean) => void;
    updatedAt: number | null;
}

function ConsoleToolbar({
    fleetFilter,
    onFleetFilterChange,
    autoRefresh,
    onAutoRefreshChange,
    updatedAt,
}: ConsoleToolbarProps) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {/*
             * The telemetry endpoints generate every reading per request —
             * they are simulated in every deployment today — so the badge
             * says so on every screen rather than letting a demonstration
             * pass for a plant.
             */}
            <DataSourceBadge source="generated" />

            <div
                role="group"
                aria-label="Filtrar por tipo de servicio"
                className="flex rounded-lg border border-steel/25 p-0.5"
            >
                {FLEET_FILTERS.map((filter) => {
                    const active = filter.id === fleetFilter;
                    return (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => onFleetFilterChange(filter.id)}
                            aria-pressed={active}
                            className={`min-h-9 rounded-md px-3 text-xs ${
                                active ? 'text-navy-900' : 'text-steel hover:text-ice'
                            }`}
                            style={active ? { backgroundColor: 'var(--color-brand)' } : undefined}
                        >
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {/*
             * The old toggle was labelled "EN VIVO / HISTÓRICO" but only ever
             * started and stopped the 8-second poll — nothing historical was
             * ever loaded. It says what it does now.
             */}
            <button
                type="button"
                onClick={() => onAutoRefreshChange(!autoRefresh)}
                aria-pressed={autoRefresh}
                className="flex min-h-9 items-center gap-2 rounded-lg border border-steel/25 px-3 text-xs text-steel hover:text-ice"
            >
                <span
                    className="occ-dot"
                    style={{
                        backgroundColor: autoRefresh ? 'var(--color-ok)' : 'var(--color-steel)',
                    }}
                    aria-hidden="true"
                />
                {autoRefresh ? 'Actualización automática' : 'Actualización pausada'}
            </button>

            {updatedAt && (
                <p className="tabular text-xs text-steel">
                    <span className="sr-only">Última actualización</span>
                    {formatClock(updatedAt, true)}
                </p>
            )}
        </div>
    );
}
