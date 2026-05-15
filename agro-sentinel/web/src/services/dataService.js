/**
 * dataService.js — Abstraction layer between mock simulation and real GCP APIs.
 *
 * MOCK mode (default): all data comes from dataGenerator.js (no network calls).
 * API  mode:           reads from Firestore (live) and Cloud Functions (history + AI).
 *
 * To switch to API mode set in .env:
 *   VITE_USE_MOCK=false
 *   VITE_SENSOR_API_URL=https://<region>-<project>.cloudfunctions.net
 *   VITE_AI_FUNCTION_URL=https://<region>-<project>.cloudfunctions.net/ask-ai
 *
 * NOTE: All VITE_ variables are bundled into the public JS bundle (by Vite design).
 * These URLs are NOT secrets — the API itself enforces authentication via Firebase
 * ID tokens passed in the Authorization header.
 */

import { generateLast24hData, generateHistoricalData } from '../utils/dataGenerator';
import { auth } from '../firebase';

const USE_MOCK   = import.meta.env.VITE_USE_MOCK !== 'false';
const SENSOR_API = import.meta.env.VITE_SENSOR_API_URL || '';
const AI_API     = import.meta.env.VITE_AI_FUNCTION_URL || '';

export const isMockMode = () => USE_MOCK || !SENSOR_API;

/** Returns the current Firebase ID token, or null in mock/unauthenticated mode. */
async function getAuthToken() {
    const user = auth.currentUser;
    if (!user) return null;
    try {
        return await user.getIdToken();
    } catch {
        return null;
    }
}

// ── Live sensor data (last 24h) ───────────────────────────────────────────────
export async function fetchLiveData(locationId) {
    if (isMockMode()) return generateLast24hData(locationId);
    const res = await fetch(`${SENSOR_API}/live?location=${encodeURIComponent(locationId)}`);
    if (!res.ok) throw new Error(`Sensor API error: ${res.status}`);
    return res.json();
}

// ── Historical data ───────────────────────────────────────────────────────────
export async function fetchHistoricalData(locationId, days = 200) {
    if (isMockMode()) return generateHistoricalData(days, 12, locationId);
    const res = await fetch(
        `${SENSOR_API}/history?location=${encodeURIComponent(locationId)}&days=${encodeURIComponent(days)}`
    );
    if (!res.ok) throw new Error(`History API error: ${res.status}`);
    return res.json();
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export async function askAI(query, locationId, localData = []) {
    if (!isMockMode() && AI_API) {
        const token   = await getAuthToken();
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (token) {
            // Pass Firebase ID token so the Cloud Function can verify the caller (VULN-04/08)
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(AI_API, {
            method:  'POST',
            headers,
            body: JSON.stringify({ query, location_id: locationId }),
        });
        if (!res.ok) throw new Error(`AI API error: ${res.status}`);
        return res.json();   // { answer, sql }
    }
    return analyzeLocally(query, locationId, localData);
}

// ── Local mock analysis ───────────────────────────────────────────────────────
function analyzeLocally(query, locationId, dataset) {
    return new Promise(resolve => {
        setTimeout(() => {
            const q = query.toLowerCase();

            const isMax   = /máx|max|alta|mayor|pico|peak/.test(q);
            const isMin   = /mín|min|baja|menor|lowest/.test(q);
            const isAvg   = /promedio|media|average|avg/.test(q);
            const isAlarm = /alarm|alert|falla|critica|warning|activa/.test(q);
            const isStatus = /estado|status|resumen|summary|how is/.test(q);

            let variable = 'temp', unit = '°C', varName = 'Temperatura';
            if (/humedad|humidity/.test(q))            { variable = 'humidity';      unit = '%';         varName = 'Humedad'; }
            if (/co2|dióxido/.test(q))                 { variable = 'co2';           unit = 'ppm';       varName = 'CO2'; }
            if (/vpd|déficit/.test(q))                 { variable = 'vpd';           unit = 'kPa';       varName = 'VPD'; }
            if (/suelo|soil|humedad de suelo/.test(q)) { variable = 'soil_moisture'; unit = '%';         varName = 'Humedad de Suelo'; }
            if (/luz|par|rad|light/.test(q))           { variable = 'par';           unit = 'µmol/m²s';  varName = 'Radiación PAR'; }
            if (/batería|battery/.test(q))             { variable = 'battery';       unit = '%';         varName = 'Batería'; }

            const data   = dataset.length > 0 ? dataset : generateHistoricalData(30, 12, locationId);
            const values = data.map(d => d[variable]).filter(v => v !== undefined);
            if (!values.length) return resolve({ answer: 'No hay datos disponibles para esa variable.', sql: '' });

            const maxVal = Math.max(...values);
            const minVal = Math.min(...values);
            const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
            const maxRec = data.find(d => d[variable] === maxVal);
            const minRec = data.find(d => d[variable] === minVal);
            const last   = data[data.length - 1];

            let answer = '', sql = '';

            if (isAlarm) {
                const alarms = data.filter(d => d.temp > 38 || d.humidity < 25 || d.co2 > 1800 || d.soil_moisture < 25 || d.battery < 15);
                if (alarms.length > 0) {
                    const list = alarms.slice(-5).reverse().map(a =>
                        `• ${a.displayDate}: Temp ${a.temp}°C | Hum ${a.humidity}% | CO2 ${a.co2}ppm`
                    ).join('\n');
                    answer = `⚠️ **Alertas detectadas: ${alarms.length}**\n\nMás recientes:\n${list}\n\nSe recomienda revisión técnica inmediata.`;
                    sql    = `SELECT * FROM \`agro_sentinel_data.sensor_logs\` WHERE temperature > 38 OR humidity < 25 ORDER BY timestamp DESC LIMIT 10`;
                } else {
                    answer = `✅ **Sin alertas activas** — Todos los sensores operan dentro de rangos nominales.\n\nÚltima lectura: Temp ${last.temp}°C | Hum ${last.humidity}% | CO2 ${last.co2}ppm`;
                    sql    = `SELECT COUNT(*) as total_alarms FROM \`agro_sentinel_data.sensor_logs\` WHERE temperature > 38 OR humidity < 25`;
                }
            } else if (isMax) {
                answer = `📈 **Máximo de ${varName}**\n\n📅 Fecha: ${maxRec?.displayDate}\n🔢 Valor: **${maxVal} ${unit}**\n📊 Promedio del periodo: ${avgVal} ${unit}\n\nEste pico representa un **${(((maxVal - parseFloat(avgVal)) / parseFloat(avgVal)) * 100).toFixed(1)}%** sobre el promedio.`;
                sql    = `SELECT MAX(${variable}) as max_val, TIMESTAMP_TRUNC(timestamp, DAY) as day FROM \`agro_sentinel_data.sensor_logs\` WHERE sensor_id = '${locationId}' GROUP BY day ORDER BY max_val DESC LIMIT 1`;
            } else if (isMin) {
                answer = `📉 **Mínimo de ${varName}**\n\n📅 Fecha: ${minRec?.displayDate}\n🔢 Valor: **${minVal} ${unit}**\n📊 Promedio del periodo: ${avgVal} ${unit}`;
                sql    = `SELECT MIN(${variable}) as min_val FROM \`agro_sentinel_data.sensor_logs\` WHERE sensor_id = '${locationId}'`;
            } else if (isAvg) {
                answer = `📊 **Promedio de ${varName}**\n\nValor promedio en el periodo analizado: **${avgVal} ${unit}**\n\nRango observado: ${minVal} – ${maxVal} ${unit}`;
                sql    = `SELECT AVG(${variable}) as avg_val FROM \`agro_sentinel_data.sensor_logs\` WHERE sensor_id = '${locationId}' AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`;
            } else if (isStatus) {
                const tempOk = last.temp >= 15 && last.temp <= 30;
                const humOk  = last.humidity >= 50 && last.humidity <= 85;
                const co2Ok  = last.co2 < 1500;
                const soilOk = last.soil_moisture >= 40;
                const status = [tempOk, humOk, co2Ok, soilOk].every(Boolean) ? '✅ NOMINAL' : '⚠️ REQUIERE ATENCIÓN';
                answer = `📋 **Estado actual del sensor**\n\n${status}\n\n🌡 Temperatura: ${last.temp}°C ${tempOk ? '✓' : '⚠'}\n💧 Humedad: ${last.humidity}% ${humOk ? '✓' : '⚠'}\n🌿 CO2: ${last.co2} ppm ${co2Ok ? '✓' : '⚠'}\n🪱 Humedad suelo: ${last.soil_moisture}% ${soilOk ? '✓' : '⚠'}\n☀️ PAR: ${last.par} µmol/m²s\n🔋 Batería: ${last.battery}%`;
                sql    = `SELECT * FROM \`agro_sentinel_data.sensor_logs\` WHERE sensor_id = '${locationId}' ORDER BY timestamp DESC LIMIT 1`;
            } else {
                answer = `Puedo analizar los datos de tus sensores. Prueba preguntando:\n\n• "¿Cuál fue la temperatura máxima este mes?"\n• "Muéstrame las alarmas activas"\n• "¿Cuál es el promedio de humedad?"\n• "¿Cómo está el estado del invernadero?"\n• "¿Cuál fue el pico de CO2?"`;
            }

            resolve({ answer, sql });
        }, 900);
    });
}
