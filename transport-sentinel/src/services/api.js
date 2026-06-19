// All data comes from the Node.js API server.
// In dev, Vite proxies /api → localhost:3001.
// In production, /api is served by the same Node.js process.

async function get(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const fetchFleetSnapshot  = (type = 'todos')                => get(`/fleet?type=${type}`);
export const fetchFleetKPIs      = (type = 'todos')                => get(`/kpis?type=${type}`);
export const fetchAlerts         = (type = 'todos')                => get(`/alerts?type=${type}`);
export const fetchHistoricalData = (days = 30, train = 'USA-001')  => get(`/history?days=${days}&train=${train}`);
export const fetchHourlyData     = (train = 'USA-001')             => get(`/hourly?train=${train}`);
export const fetchMaintenanceOrders = ()                           => get('/maintenance');
export const fetchIncidents      = ()                              => get('/incidents');
export const fetchEnergyData     = (days = 30)                     => get(`/energy?days=${days}`);
export const fetchCommercialData = (type = 'pasajeros', days = 30) => get(`/commercial?type=${type}&days=${days}`);
export const fetchRAMSMetrics    = ()                              => get('/rams');
export const fetchTrainSchedule  = (route = 'RT-001')             => get(`/schedule?route=${route}`);
export const fetchRoutes         = ()                              => get('/routes');
