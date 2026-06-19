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

