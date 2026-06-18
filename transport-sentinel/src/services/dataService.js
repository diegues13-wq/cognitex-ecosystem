/**
 * Data abstraction layer for transport-sentinel.
 *
 * Mock mode (default, no Firebase env vars):
 *   All functions return generated data from dataGenerator.js
 *
 * Real mode (Firebase credentials set):
 *   Functions call the backend Cloud Functions API.
 *
 * BigQuery field mapping (transport_sentinel.fleet_logs):
 *   otp              → On-Time Performance (%)
 *   kmTraveled       → Km traveled per day
 *   fuelLiters       → Liters of diesel consumed
 *   kwhConsumed      → kWh consumed (electric trains)
 *   occupancyPct     → Passenger load factor (%)
 *   tonsTransported  → Freight tons
 *   incidentCount    → Safety incidents per day
 */

import { auth, isMockAuth } from '../firebase.js';
import {
    generateFleetSnapshot,
    generateFleetKPIs,
    generateHistoricalData,
    generateHourlyData,
    generateMaintenanceOrders,
    generateIncidents,
    generateAlerts,
    generateEnergyData,
    generateCommercialData,
    generateTrainSchedule,
    generateRAMSMetrics,
} from '../utils/dataGenerator.js';

const AI_URL = import.meta.env.VITE_AI_FUNCTION_URL;
const API_URL = import.meta.env.VITE_TRANSPORT_API_URL;

async function getAuthHeader() {
    if (isMockAuth || !auth.currentUser) return {};
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
}

// ─── FLEET ────────────────────────────────────────────────────────────────────

export async function fetchFleetSnapshot(fleetType = 'todos') {
    if (isMockAuth) return generateFleetSnapshot(fleetType);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/fleet?type=${fleetType}`, { headers });
    return res.json();
}

export async function fetchFleetKPIs(fleetType = 'todos') {
    if (isMockAuth) return generateFleetKPIs(fleetType);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/kpis?type=${fleetType}`, { headers });
    return res.json();
}

// ─── TRAIN HISTORY ────────────────────────────────────────────────────────────

export async function fetchHistoricalData(trainId = 'PAX-001', days = 30) {
    if (isMockAuth) return generateHistoricalData(days, trainId);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/history?train=${trainId}&days=${days}`, { headers });
    return res.json();
}

export async function fetchHourlyData(trainId = 'PAX-001') {
    if (isMockAuth) return generateHourlyData(trainId);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/hourly?train=${trainId}`, { headers });
    return res.json();
}

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────

export async function fetchMaintenanceOrders() {
    if (isMockAuth) return generateMaintenanceOrders();
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/maintenance`, { headers });
    return res.json();
}

export async function fetchRAMSMetrics() {
    if (isMockAuth) return generateRAMSMetrics();
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/rams`, { headers });
    return res.json();
}

// ─── SAFETY ───────────────────────────────────────────────────────────────────

export async function fetchIncidents() {
    if (isMockAuth) return generateIncidents();
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/incidents`, { headers });
    return res.json();
}

export async function fetchAlerts(fleetType = 'todos') {
    if (isMockAuth) return generateAlerts(fleetType);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/alerts?type=${fleetType}`, { headers });
    return res.json();
}

// ─── ENERGY ───────────────────────────────────────────────────────────────────

export async function fetchEnergyData(days = 30) {
    if (isMockAuth) return generateEnergyData(days);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/energy?days=${days}`, { headers });
    return res.json();
}

// ─── COMMERCIAL ───────────────────────────────────────────────────────────────

export async function fetchCommercialData(type = 'pasajeros', days = 30) {
    if (isMockAuth) return generateCommercialData(type, days);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/commercial?type=${type}&days=${days}`, { headers });
    return res.json();
}

// ─── SCHEDULE / TRAIN GRAPH ───────────────────────────────────────────────────

export async function fetchTrainSchedule(routeId = 'RT-001') {
    if (isMockAuth) return generateTrainSchedule(routeId);
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/schedule?route=${routeId}`, { headers });
    return res.json();
}

// ─── AI CHAT ──────────────────────────────────────────────────────────────────

export async function askAI(query, trainId = 'PAX-001', localData = {}) {
    if (isMockAuth || !AI_URL) {
        return analyzeLocally(query, trainId, localData);
    }
    const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
    const res = await fetch(AI_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, trainId, context: 'transport-sentinel' }),
    });
    return res.json();
}

// ─── LOCAL AI INTENT ANALYSIS ─────────────────────────────────────────────────

function analyzeLocally(query, trainId, localData) {
    const q = query.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '');

    const isFlota    = /flota|eficiencia|disponib|activos|fleet/.test(q);
    const isOTP      = /otp|puntual|tiempo|retraso|horario|delay/.test(q);
    const isKm       = /km|kilometr|recorrido|distancia/.test(q);
    const isFuel     = /combustible|fuel|diesel|gasoil|consumo de gas/.test(q);
    const isEnergy   = /kwh|energia|electric|kilovati/.test(q);
    const isPax      = /pasajero|ocupaci|factor.carga|load.factor/.test(q);
    const isCargo    = /tonelad|ton|flete|freight|carga/.test(q);
    const isMaint    = /mantenim|taller|reparaci|work.order|mtbf|mttr|rams/.test(q);
    const isSafety   = /incident|accidente|spad|seguridad|peligro/.test(q);
    const isRevenue  = /ingreso|revenue|rentab|costo|costo|roi/.test(q);
    const isEnv      = /co2|emision|carbono|verde|sostenib/.test(q);
    const isRoute    = /ruta|linea|route|servicio|itinerar/.test(q);
    const isStatus   = /estado|resumen|summary|general|como esta/.test(q);

    const kpis = localData.kpis || {};
    const snapshot = localData.snapshot || [];
    const history = localData.history || [];

    let answer = '';
    let sql = '';

    if (isOTP) {
        const otpVal = kpis.otp ?? 87;
        const activeTrains = kpis.trenesActivos ?? 10;
        const totalTrains = kpis.total ?? 12;
        answer = `**Puntualidad OTP de la Flota — ${otpVal}%**\n\nDe los **${activeTrains} trenes en servicio**, el ${otpVal}% está operando dentro de la tolerancia de ±3 minutos (estándar UIC).\n\n${otpVal >= 90 ? '✅ Excelente rendimiento operacional.' : otpVal >= 80 ? '⚠️ Rendimiento aceptable — revisar retrasos en rutas RT-002 y RT-003.' : '🚨 OTP por debajo del umbral — requiere revisión urgente de programación.'}\n\nTrenes en servicio: **${activeTrains}/${totalTrains}**`;
        sql = `SELECT AVG(CASE WHEN delay_min <= 3 THEN 1.0 ELSE 0.0 END) * 100 AS otp_pct\nFROM \`transport_sentinel.fleet_logs\`\nWHERE DATE(timestamp) = CURRENT_DATE()`;
    } else if (isKm) {
        const kmVal = kpis.kmTotales ?? 1820;
        const active = snapshot.filter(t => t.status === 'EN_SERVICIO');
        answer = `**Kilómetros Recorridos Hoy — ${kmVal.toLocaleString()} km**\n\nLa flota activa ha acumulado **${kmVal.toLocaleString()} km** en los viajes de hoy.\n\n${active.slice(0, 3).map(t => `- **${t.name}**: ${t.tripKm} km en ruta ${t.routeName}`).join('\n')}\n\nProyección diaria total (24h): ~**${Math.round(kmVal * 1.4).toLocaleString()} km**`;
        sql = `SELECT train_id, SUM(km_traveled) AS total_km\nFROM \`transport_sentinel.fleet_logs\`\nWHERE DATE(timestamp) = CURRENT_DATE()\nGROUP BY train_id ORDER BY total_km DESC`;
    } else if (isFuel) {
        const fuelVal = kpis.combustibleTotal ?? 485;
        const co2Val = kpis.co2Estimado ?? 1300;
        const freightTrains = snapshot.filter(t => t.traction === 'diesel');
        answer = `**Combustible Consumido Hoy — ${fuelVal} L de Diésel**\n\nLa flota diesel ha consumido **${fuelVal} litros** equivalentes a **${co2Val} kg CO₂** emitidos.\n\nPromedio por tren: **${freightTrains.length > 0 ? Math.round(fuelVal / freightTrains.length) : 0} L/tren**\nRendimiento: **~2.5 L/km** (referencia UIC)\n\n${freightTrains.map(t => `- **${t.name}**: ${t.fuelL} L`).join('\n')}`;
        sql = `SELECT SUM(fuel_liters) AS total_fuel_l, SUM(fuel_liters * 2.68) AS co2_kg\nFROM \`transport_sentinel.fleet_logs\`\nWHERE DATE(timestamp) = CURRENT_DATE() AND traction = 'diesel'`;
    } else if (isEnergy) {
        const kwhVal = kpis.energiaTotal ?? 9800;
        const regenEst = Math.round(kwhVal * 0.12);
        answer = `**Consumo Energético Flota Eléctrica — ${kwhVal.toLocaleString()} kWh**\n\nLos trenes eléctricos han consumido **${kwhVal.toLocaleString()} kWh** hoy.\n\n- Recuperación por frenado regenerativo: ~**${regenEst} kWh** (12%)\n- Consumo neto: **${kwhVal - regenEst} kWh**\n- Intensidad: **~6.5 kWh/tren-km** (referencia: 6.67–8.14 kWh/km estándar UIC)`;
        sql = `SELECT SUM(kwh_consumed) AS total_kwh, SUM(regen_kwh) AS regen_kwh\nFROM \`transport_sentinel.fleet_logs\`\nWHERE DATE(timestamp) = CURRENT_DATE() AND traction = 'electrico'`;
    } else if (isPax) {
        const paxVal = kpis.cargaPasajeros ?? 4200;
        const fcVal = kpis.factorCarga ?? 74;
        answer = `**Carga de Pasajeros — ${paxVal.toLocaleString()} pasajeros**\n\nFactor de carga promedio: **${fcVal}%**\n\n${fcVal >= 85 ? '🔴 Alta demanda — considerar refuerzo de frecuencia en rutas saturadas.' : fcVal >= 65 ? '🟡 Carga normal dentro de parámetros operacionales.' : '🟢 Capacidad disponible. Oportunidad de marketing para incrementar ocupación.'}\n\nLas horas pico (06–09h y 17–20h) concentran el **68%** del tráfico diario.`;
        sql = `SELECT SUM(passenger_count) AS total_passengers, AVG(occupancy_pct) AS avg_load_factor\nFROM \`transport_sentinel.fleet_logs\`\nWHERE DATE(timestamp) = CURRENT_DATE() AND type = 'pasajeros'`;
    } else if (isCargo) {
        const tonsVal = kpis.toneladasHoy ?? 8400;
        const tonKmEst = Math.round(tonsVal * 90);
        answer = `**Carga Transportada — ${tonsVal.toLocaleString()} toneladas**\n\nTon-km generadas hoy: **${tonKmEst.toLocaleString()} ton·km** (métrica UIC de volumen de carga)\n\nLas 4 locomotoras de carga han completado sus viajes con una eficiencia de **${Math.round(tonsVal / 4)} ton/tren** en promedio.\n\nIngreso estimado: **$${Math.round(tonKmEst * 0.04).toLocaleString()} USD** a tarifa de referencia de $0.04/ton·km.`;
        sql = `SELECT SUM(tons_transported) AS total_tons, SUM(tons_transported * route_km) AS ton_km\nFROM \`transport_sentinel.fleet_logs\`\nWHERE DATE(timestamp) = CURRENT_DATE() AND type = 'carga'`;
    } else if (isMaint) {
        const mtbfVal = kpis.mtbf ?? 2950;
        const mttrVal = kpis.mttr ?? 3.8;
        const avail = parseFloat(((mtbfVal / (mtbfVal + mttrVal)) * 100).toFixed(1));
        answer = `**Métricas RAMS (EN 50126)**\n\n- MTBF: **${mtbfVal.toLocaleString()} h** (objetivo: >2,800 h)\n- MTTR: **${mttrVal} h** (objetivo: <4 h)\n- Disponibilidad calculada: **${avail}%** ✅\n- Cumplimiento preventivo: **${kpis.prevMaintCompliance ?? 93}%**\n\nOTs abiertas críticas: **2** (WO-2026-0143, WO-2026-0148)\nComponentes en alerta de vida útil: **3** (Pastillas PAX-003, Rodamiento FRE-004, Motor FRE-001)`;
        sql = `SELECT train_id, COUNT(*) AS failures, AVG(repair_hours) AS avg_mttr\nFROM \`transport_sentinel.maintenance_events\`\nWHERE type = 'CORRECTIVO' AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)\nGROUP BY train_id`;
    } else if (isSafety) {
        const incVal = kpis.incidentesHoy ?? 0;
        const diasVal = kpis.diasSinAccidente ?? 58;
        answer = `**Estado de Seguridad — RAMS**\n\n${incVal === 0 ? `✅ **Sin incidentes activos hoy.** La flota lleva **${diasVal} días** sin accidentes registrados.` : `⚠️ **${incVal} incidente(s) activo(s) hoy.** Revisar panel de Seguridad / RAMS.`}\n\nIncidente abierto más reciente:\n- **INC-2026-0087**: Fallo rodamiento FRE-004 — CRÍTICO — en gestión\n\nSPAD (señales en rojo violadas): **0** últimos 30 días\nInfracciones de velocidad: **2** últimos 30 días (menores)`;
        sql = `SELECT type, severity, COUNT(*) AS count\nFROM \`transport_sentinel.incidents\`\nWHERE DATE(date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)\nGROUP BY type, severity ORDER BY count DESC`;
    } else if (isEnv) {
        const co2Val = kpis.co2Estimado ?? 1300;
        answer = `**Sostenibilidad y Huella de Carbono**\n\nEmisiones CO₂ hoy: **${co2Val} kg** (solo tracción diesel)\n\nLos **8 trenes eléctricos** de la flota tienen emisiones directas = 0 kg CO₂.\nLas **4 locomotoras diesel** generan **${co2Val} kg CO₂** (2.68 kg/litro diésel, factor IPCC).\n\nComparativa: El ferrocarril emite **~6× menos CO₂/pasajero-km** que el automóvil y **~50× menos** que la aviación.`;
        sql = `SELECT SUM(fuel_liters * 2.68) AS co2_kg, SUM(kwh_consumed) AS kwh_elec\nFROM \`transport_sentinel.energy_daily\`\nWHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
    } else if (isFlota || isStatus) {
        const dispVal = kpis.disponibilidad ?? 89;
        const activos = kpis.trenesActivos ?? 10;
        const total = kpis.total ?? 12;
        const otpV = kpis.otp ?? 87;
        answer = `**Resumen General de la Flota — Transport-Sentinel**\n\n| KPI | Valor | Estado |\n|-----|-------|--------|\n| Disponibilidad | **${dispVal}%** | ${dispVal >= 85 ? '✅' : '⚠️'} |\n| Trenes Activos | **${activos}/${total}** | ${activos >= 10 ? '✅' : '⚠️'} |\n| OTP | **${otpV}%** | ${otpV >= 85 ? '✅' : '⚠️'} |\n| Km Hoy | **${kpis.kmTotales ?? 1820} km** | ✅ |\n| Incidentes | **${kpis.incidentesHoy ?? 0}** | ${kpis.incidentesHoy === 0 ? '✅' : '🔴'} |\n\nLa flota opera en condiciones ${dispVal >= 85 && otpV >= 85 ? '**normales**' : '**con alertas activas**'}. ${kpis.incidentesHoy > 0 ? 'Revisar panel de seguridad.' : 'Sin incidentes activos.'}`;
        sql = `SELECT disponibilidad, otp, trenes_activos, km_totales, incidentes\nFROM \`transport_sentinel.fleet_kpis\`\nWHERE DATE(timestamp) = CURRENT_DATE()`;
    } else {
        answer = `No pude identificar con precisión el KPI consultado. Puedes preguntarme sobre:\n\n- **Puntualidad OTP**: "¿Cuál es el OTP actual?"\n- **Kilometraje**: "¿Cuántos km han recorrido los trenes?"\n- **Combustible**: "¿Cuánto combustible se ha consumido?"\n- **Energía**: "¿Cuántos kWh ha consumido la flota?"\n- **Pasajeros**: "¿Cuál es la carga de pasajeros hoy?"\n- **Carga**: "¿Cuántas toneladas se transportaron?"\n- **Mantenimiento**: "¿Cuál es el MTBF de la flota?"\n- **Seguridad**: "¿Hay incidentes activos?"`;
        sql = '';
    }

    return Promise.resolve({ answer, sql, source: 'mock-local' });
}
