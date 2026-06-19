import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import AlertTicker from './components/AlertTicker.jsx';
import ProjectView from './views/ProjectView.jsx';
import * as API from './services/api.js';
import PropTypes from 'prop-types';

const CCOView         = lazy(() => import('./views/CCOView.jsx'));
const FleetView       = lazy(() => import('./views/FleetView.jsx'));
const MaintenanceView = lazy(() => import('./views/MaintenanceView.jsx'));
const OperationsView  = lazy(() => import('./views/OperationsView.jsx'));
const CommercialView  = lazy(() => import('./views/CommercialView.jsx'));
const EnergyView      = lazy(() => import('./views/EnergyView.jsx'));
const SafetyView      = lazy(() => import('./views/SafetyView.jsx'));
const AIView          = lazy(() => import('./views/AIView.jsx'));

const VIEW_COMPONENTS = {
  cco: CCOView, fleet: FleetView, maintenance: MaintenanceView,
  operations: OperationsView, commercial: CommercialView,
  energy: EnergyView, safety: SafetyView, ai: AIView,
};

const LOADING = (
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

  // Core data (always needed)
  const [snapshot, setSnapshot] = useState([]);
  const [kpis,     setKpis]     = useState({});
  const [alerts,   setAlerts]   = useState([]);

  // Per-view data
  const [history,     setHistory]     = useState([]);
  const [workOrders,  setWorkOrders]  = useState([]);
  const [incidents,   setIncidents]   = useState([]);
  const [energyData,  setEnergyData]  = useState([]);
  const [paxData,     setPaxData]     = useState([]);
  const [cargoData,   setCargoData]   = useState([]);
  const [ramsMetrics, setRamsMetrics] = useState([]);

  const loadCore = useCallback(async () => {
    const [snap, kpi, alrt] = await Promise.all([
      API.fetchFleetSnapshot(fleetType),
      API.fetchFleetKPIs(fleetType),
      API.fetchAlerts(fleetType),
    ]);
    setSnapshot(snap);
    setKpis(kpi);
    setAlerts(alrt);
  }, [fleetType]);

  const loadViewData = useCallback(async () => {
    const [hist, wo, inc, energy, pax, cargo, rams] = await Promise.all([
      API.fetchHistoricalData(30),
      API.fetchMaintenanceOrders(),
      API.fetchIncidents(),
      API.fetchEnergyData(30),
      API.fetchCommercialData('pasajeros', 30),
      API.fetchCommercialData('carga', 30),
      API.fetchRAMSMetrics(),
    ]);
    setHistory(hist);
    setWorkOrders(wo);
    setIncidents(inc);
    setEnergyData(energy);
    setPaxData(pax);
    setCargoData(cargo);
    setRamsMetrics(rams);
  }, []);

  useEffect(() => {
    loadCore();
    const t = setTimeout(loadViewData, 800);
    return () => clearTimeout(t);
  }, [loadCore, loadViewData]);

  // Live refresh every 8 seconds (server handles computation)
  useEffect(() => {
    if (timeMode !== 'live') return;
    const id = setInterval(loadCore, 8000);
    return () => clearInterval(id);
  }, [timeMode, loadCore]);

  const handleProjectSelect = useCallback((p) => { setActiveProject(p); setActiveView('proyecto'); }, []);
  const handleNavigate      = useCallback((v) => { setActiveView(v); if (v !== 'proyecto') setActiveProject(null); }, []);
  const isMock = !user?.uid || user?.uid?.startsWith?.('mock');
  const ActiveView = VIEW_COMPONENTS[activeView];

  const viewProps = {
    snapshot, kpis, history, workOrders, incidents,
    alerts, energyData, paxData, cargoData, ramsMetrics,
    fleetType, timeMode,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#060c17' }}>
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
              <ProjectView project={activeProject} onBack={() => handleNavigate('cco')} />
            ) : ActiveView ? (
              <Suspense fallback={LOADING}><ActiveView {...viewProps} /></Suspense>
            ) : (
              <Suspense fallback={LOADING}><CCOView {...viewProps} /></Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = { user: PropTypes.object.isRequired, onLogout: PropTypes.func.isRequired };
