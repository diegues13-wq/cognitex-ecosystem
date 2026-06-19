import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import AlertTicker from './components/AlertTicker.jsx';

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
    const [activeView,   setActiveView]   = useState('cco');
    const [fleetType,    setFleetType]    = useState('todos');
    const [timeMode,     setTimeMode]     = useState('live');
    const [sidebarOpen,  setSidebarOpen]  = useState(true);

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

    // Defer initial load to after first paint to avoid blocking Chrome renderer
    useEffect(() => {
        const t = setTimeout(loadData, 80);
        return () => clearTimeout(t);
    }, [loadData]);

    // Live refresh every 5s
    useEffect(() => {
        if (timeMode !== 'live') return;
        const id = setInterval(() => {
            setSnapshot(generateFleetSnapshot(fleetType));
            setKpis(generateFleetKPIs(fleetType));
            setAlerts(generateAlerts());
        }, 5000);
        return () => clearInterval(id);
    }, [timeMode, fleetType]);

    const ActiveView = VIEW_COMPONENTS[activeView] || CCOView;

    const viewProps = {
        snapshot, kpis, history, workOrders, incidents,
        alerts, energyData, paxData, cargoData, ramsMetrics,
        fleetType, timeMode,
    };

    return (
        <div className="h-screen bg-occ-950 flex flex-col overflow-hidden">
            {/* Alert ticker */}
            <AlertTicker alerts={alerts} />

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar */}
                <Sidebar
                    activeView={activeView}
                    onNavigate={setActiveView}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(o => !o)}
                    kpis={kpis}
                    user={user}
                    onLogout={onLogout}
                />

                {/* Content area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Top bar */}
                    <TopBar
                        fleetType={fleetType}
                        onFleetTypeChange={setFleetType}
                        timeMode={timeMode}
                        onTimeModeChange={setTimeMode}
                        kpis={kpis}
                        alerts={alerts}
                        onSidebarToggle={() => setSidebarOpen(o => !o)}
                    />

                    {/* View content */}
                    <div className="flex-1 overflow-hidden min-h-0 p-3">
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
