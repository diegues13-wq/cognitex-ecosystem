import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import AlertTicker from './components/AlertTicker.jsx';
import ProjectView from './views/ProjectView.jsx';

const CCOView         = lazy(() => import('./views/CCOView.jsx'));
const FleetView       = lazy(() => import('./views/FleetView.jsx'));
const MaintenanceView = lazy(() => import('./views/MaintenanceView.jsx'));
const OperationsView  = lazy(() => import('./views/OperationsView.jsx'));
const CommercialView  = lazy(() => import('./views/CommercialView.jsx'));
const EnergyView      = lazy(() => import('./views/EnergyView.jsx'));
const SafetyView      = lazy(() => import('./views/SafetyView.jsx'));
const AIView          = lazy(() => import('./views/AIView.jsx'));

import {
    generateFleetSnapshot,
    generateFleetKPIs,
    generateHistoricalData,
    generateMaintenanceOrders,
    generateIncidents,
    generateAlerts,
    generateEnergyData,
    generateCommercialData,
    generateRAMSMetrics,
} from './utils/dataGenerator.js';
import PropTypes from 'prop-types';

const VIEW_COMPONENTS = {
    cco:         CCOView,
    fleet:       FleetView,
    maintenance: MaintenanceView,
    operations:  OperationsView,
    commercial:  CommercialView,
    energy:      EnergyView,
    safety:      SafetyView,
    ai:          AIView,
};

const LOADING_FALLBACK = (
    <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#1d6fa5]/40 border-t-[#1d6fa5] rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-mono text-[#2a4a6b]">Cargando módulo…</p>
        </div>
    </div>
);

export default function Dashboard({ user, onLogout }) {
    const [activeView,    setActiveView]    = useState('cco');
    const [activeProject, setActiveProject] = useState(null);
    const [fleetType,     setFleetType]     = useState('todos');
    const [timeMode,      setTimeMode]      = useState('live');

    // Core fleet state (always loaded — needed by sidebar KPIs + CCO)
    const [snapshot, setSnapshot] = useState([]);
    const [kpis,     setKpis]     = useState({});
    const [alerts,   setAlerts]   = useState([]);

    // Per-view data (only populated when view is first opened)
    const [history,     setHistory]     = useState([]);
    const [workOrders,  setWorkOrders]  = useState([]);
    const [incidents,   setIncidents]   = useState([]);
    const [energyData,  setEnergyData]  = useState([]);
    const [paxData,     setPaxData]     = useState([]);
    const [cargoData,   setCargoData]   = useState([]);
    const [ramsMetrics, setRamsMetrics] = useState([]);

    // Initial load — core fleet data only (fast path, keeps first render light)
    const loadCoreData = useCallback(() => {
        setSnapshot(generateFleetSnapshot(fleetType));
        setKpis(generateFleetKPIs(fleetType));
        setAlerts(generateAlerts(fleetType));
    }, [fleetType]);

    // Secondary load — per-view data deferred so it doesn't block CCO render
    const loadViewData = useCallback(() => {
        setHistory(generateHistoricalData(30));
        setWorkOrders(generateMaintenanceOrders());
        setIncidents(generateIncidents());
        setEnergyData(generateEnergyData(30));
        setPaxData(generateCommercialData('pasajeros', 30));
        setCargoData(generateCommercialData('carga', 30));
        setRamsMetrics(generateRAMSMetrics());
    }, []);

    useEffect(() => {
        // Core data: 80ms delay (first paint completes before any data computation)
        const t1 = setTimeout(loadCoreData, 80);
        // View data: 500ms delay (CCO is already interactive by this point)
        const t2 = setTimeout(loadViewData, 500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [loadCoreData, loadViewData]);

    // Live mode: refresh core fleet data every 5s
    useEffect(() => {
        if (timeMode !== 'live') return;
        const id = setInterval(() => {
            setSnapshot(generateFleetSnapshot(fleetType));
            setKpis(generateFleetKPIs(fleetType));
            setAlerts(generateAlerts(fleetType));
        }, 5000);
        return () => clearInterval(id);
    }, [timeMode, fleetType]);

    const handleProjectSelect = useCallback((project) => {
        setActiveProject(project);
        setActiveView('proyecto');
    }, []);

    const handleNavigate = useCallback((viewId) => {
        setActiveView(viewId);
        if (viewId !== 'proyecto') setActiveProject(null);
    }, []);

    const isMock = !user?.uid || user?.uid?.startsWith?.('mock');
    const ActiveView = VIEW_COMPONENTS[activeView];

    const viewProps = {
        snapshot, kpis, history, workOrders, incidents,
        alerts, energyData, paxData, cargoData, ramsMetrics,
        fleetType, timeMode,
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#060c17' }}>

            {/* Alert ticker — full width */}
            <AlertTicker alerts={alerts} />

            <div className="flex flex-1 overflow-hidden min-h-0">
                <Sidebar
                    activeView={activeView}
                    onNavigate={handleNavigate}
                    kpis={kpis}
                    onLogout={onLogout}
                    isMockAuth={isMock}
                    onProjectSelect={handleProjectSelect}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <TopBar
                        fleetType={fleetType}
                        onFleetTypeChange={setFleetType}
                        timeMode={timeMode}
                        onTimeModeChange={setTimeMode}
                    />

                    <div className="flex-1 overflow-hidden min-h-0 p-2.5">
                        {activeView === 'proyecto' && activeProject ? (
                            <ProjectView
                                project={activeProject}
                                onBack={() => handleNavigate('cco')}
                            />
                        ) : ActiveView ? (
                            <Suspense fallback={LOADING_FALLBACK}>
                                <ActiveView {...viewProps} />
                            </Suspense>
                        ) : (
                            <Suspense fallback={LOADING_FALLBACK}>
                                <CCOView {...viewProps} />
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

Dashboard.propTypes = {
    user:     PropTypes.object.isRequired,
    onLogout: PropTypes.func.isRequired,
};
