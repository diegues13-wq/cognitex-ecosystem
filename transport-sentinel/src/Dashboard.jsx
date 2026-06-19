import { useState, useEffect, useCallback, lazy, Suspense, Component } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import AlertTicker from './components/AlertTicker.jsx';
import ProjectView from './views/ProjectView.jsx';
import * as API from './services/api.js';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(err) { console.error('[Dashboard] View error:', err); }
    render() {
        if (this.state.error) {
            return (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <span className="text-red-400 text-sm font-bold">!</span>
                    </div>
                    <p className="text-[11px] font-mono text-red-400">Error al cargar la vista</p>
                    <p className="text-[9px] font-mono text-slate-600 max-w-xs text-center">{this.state.error.message}</p>
                    <button
                        onClick={() => this.setState({ error: null })}
                        className="text-[9px] font-mono px-3 py-1.5 rounded-lg bg-occ-800 border border-occ-700 text-slate-400 hover:text-[#38a8e0] hover:border-[#1d4a6a] transition-colors">
                        Reintentar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

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
  const [selectedTrain, setSelectedTrain] = useState(null);

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
    // Aliases for views that use different prop names
    orders: workOrders,
    rams:   ramsMetrics,
    selectedTrain,
    onSelectTrain: setSelectedTrain,
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
            <ErrorBoundary key={activeView}>
              <div className="h-full view-enter">
                {activeView === 'proyecto' && activeProject ? (
                  <ProjectView project={activeProject} onBack={() => handleNavigate('cco')} />
                ) : ActiveView ? (
                  <Suspense fallback={LOADING}><ActiveView {...viewProps} /></Suspense>
                ) : (
                  <Suspense fallback={LOADING}><CCOView {...viewProps} /></Suspense>
                )}
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = { user: PropTypes.object.isRequired, onLogout: PropTypes.func.isRequired };
