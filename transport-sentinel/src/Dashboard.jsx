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

export default function Dashboard({ user, onLogout }) {
    const [activeView,    setActiveView]    = useState('cco');
    const [activeProject, setActiveProject] = useState(null);
    const [fleetType,     setFleetType]     = useState('todos');
    const [timeMode,      setTimeMode]      = useState('live');

    // Data state
    const [snapshot,    setSnapshot]    = useState([]);
    const [kpis,        setKpis]        = useState({});
    const [history,     setHistory]     = useState([]);
    const [workOrders,  setWorkOrders]  = useState([]);
    const [incidents,   setIncidents]   = useState([]);
    const [alerts,      setAlerts]      = useState([]);
    const [energyData,  setEnergyData]  = useState([]);
    const [paxData,     setPaxData]     = useState([]);
    const [cargoData,   setCargoData]   = useState([]);
    const [ramsMetrics, setRamsMetrics] = useState([]);

    const loadData = useCallback(() => {
        setSnapshot(generateFleetSnapshot(fleetType));
        setKpis(generateFleetKPIs(fleetType));
        setHistory(generateHistoricalData(30));
        setWorkOrders(generateMaintenanceOrders());
        setIncidents(generateIncidents());
        setAlerts(generateAlerts());
        setEnergyData(generateEnergyData(30));
        setPaxData(generateCommercialData('pasajeros', 30));
        setCargoData(generateCommercialData('carga', 30));
        setRamsMetrics(generateRAMSMetrics());
    }, [fleetType]);

    useEffect(() => {
        const t = setTimeout(loadData, 80);
        return () => clearTimeout(t);
    }, [loadData]);

    useEffect(() => {
        if (timeMode !== 'live') return;
        const id = setInterval(() => {
            setSnapshot(generateFleetSnapshot(fleetType));
            setKpis(generateFleetKPIs(fleetType));
            setAlerts(generateAlerts());
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

    const isMockAuth = !user?.uid || user?.uid?.startsWith?.('mock');

    const ActiveView = VIEW_COMPONENTS[activeView];
    const viewProps = {
        snapshot, kpis, history, workOrders, incidents,
        alerts, energyData, paxData, cargoData, ramsMetrics,
        fleetType, timeMode,
    };

    return (
        <div className="h-screen bg-occ-950 flex flex-col overflow-hidden">
            <AlertTicker alerts={alerts} />

            <div className="flex flex-1 overflow-hidden min-h-0">
                <Sidebar
                    activeView={activeView}
                    onNavigate={handleNavigate}
                    kpis={kpis}
                    onLogout={onLogout}
                    isMockAuth={isMockAuth}
                    onProjectSelect={handleProjectSelect}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <TopBar
                        fleetType={fleetType}
                        onFleetTypeChange={setFleetType}
                        timeMode={timeMode}
                        onTimeModeChange={setTimeMode}
                        kpis={kpis}
                        alerts={alerts}
                    />

                    <div className="flex-1 overflow-hidden min-h-0 p-3">
                        {activeView === 'proyecto' && activeProject ? (
                            <ProjectView
                                project={activeProject}
                                onBack={() => handleNavigate('cco')}
                            />
                        ) : ActiveView ? (
                            <Suspense fallback={
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center space-y-3">
                                        <div className="w-8 h-8 border-2 border-rail/40 border-t-rail rounded-full animate-spin mx-auto" />
                                        <p className="text-[11px] font-mono text-slate-500">Cargando módulo…</p>
                                    </div>
                                </div>
                            }>
                                <ActiveView {...viewProps} />
                            </Suspense>
                        ) : (
                            <Suspense fallback={
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-[11px] font-mono text-slate-500">Cargando…</p>
                                </div>
                            }>
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
