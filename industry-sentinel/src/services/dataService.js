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
 *
 * Field mapping from dataGenerator (legacy slot reuse):
 *   temp     → machine temperature (°C)
 *   vpd      → vibration (mm/s)
 *   co2      → power (W)
 *   battery  → OEE (%)
 *   rssi     → RPM
 */

import { generateLast24hData, generateHistoricalData, LOCATIONS } from '../utils/dataGenerator';
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
export async function fetchLiveData(machineId) {
    if (isMockMode()) return generateLast24hData(machineId);
    const res = await fetch(`${SENSOR_API}/live?location=${encodeURIComponent(machineId)}`);
    if (!res.ok) throw new Error(`Sensor API error: ${res.status}`);
    return res.json();
}

// ── Historical data ───────────────────────────────────────────────────────────
export async function fetchHistoricalData(machineId, days = 200) {
    if (isMockMode()) return generateHistoricalData(days, 12, machineId);
    const res = await fetch(
        `${SENSOR_API}/history?location=${encodeURIComponent(machineId)}&days=${encodeURIComponent(days)}`
    );
    if (!res.ok) throw new Error(`History API error: ${res.status}`);
    return res.json();
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export async function askAI(query, machineId, localData = []) {
    if (!isMockMode() && AI_API) {
        const token   = await getAuthToken();
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(AI_API, {
            method:  'POST',
            headers,
            body: JSON.stringify({ query, location_id: machineId }),
        });
        if (!res.ok) throw new Error(`AI API error: ${res.status}`);
        return res.json();   // { answer, sql }
    }
    return analyzeLocally(query, machineId, localData);
}

// ── Local mock analysis ───────────────────────────────────────────────────────
function analyzeLocally(query, machineId, dataset) {
    return new Promise(resolve => {
        setTimeout(() => {
            const q = query.toLowerCase();

            // Intent detection
            const isAlarm  = /alarm|alert|falla|critica|warning|activa|anomal/.test(q);
            const isMax    = /máx|max|alta|mayor|pico|peak/.test(q);
            const isMin    = /mín|min|baja|menor|lowest/.test(q);
            const isAvg    = /promedio|media|average|avg/.test(q);
            const isOEE    = /oee|eficiencia|overall/.test(q);
            const isStatus = /estado|status|resumen|summary|planta|general/.test(q);
            const isVib    = /vibr|vib|rodamiento|bearing/.test(q);
            const isPower  = /potencia|power|consumo|watt|energía/.test(q);
            const isRPM    = /rpm|velocidad|rotac/.test(q);

            // Machine name resolution — user may refer to machine by name or id
            let targetMachineId = machineId;
            const machineKeywords = {
                'cnc':       'MACH-01',
                'lathe':     'MACH-01',
                'torno':     'MACH-01',
                'hidráulica': 'MACH-02',
                'hidraulica': 'MACH-02',
                'prensa':    'MACH-02',
                'press':     'MACH-02',
                'kuka':      'ROBO-01',
                'robot':     'ROBO-01',
                'brazo':     'ROBO-01',
                'cinta':     'CONV-01',
                'conveyor':  'CONV-01',
                'transportadora': 'CONV-01',
                'inyector':  'INJ-01',
                'inyección': 'INJ-01',
                'molde':     'INJ-01',
                'injection': 'INJ-01',
            };
            for (const [key, id] of Object.entries(machineKeywords)) {
                if (q.includes(key)) { targetMachineId = id; break; }
            }

            const machine = LOCATIONS.find(l => l.id === targetMachineId) || LOCATIONS[0];
            const data    = dataset.length > 0 ? dataset : generateHistoricalData(30, 12, targetMachineId);

            // Note: dataGenerator maps vibration → vpd, power → co2, OEE → battery, RPM → rssi
            const temps  = data.map(d => d.temp).filter(v => v !== undefined);
            const vibs   = data.map(d => d.vpd).filter(v => v !== undefined);
            const powers = data.map(d => d.co2).filter(v => v !== undefined);
            const oees   = data.map(d => d.battery).filter(v => v !== undefined);
            const rpms   = data.map(d => d.rssi).filter(v => v !== undefined);

            if (!temps.length) {
                return resolve({ answer: 'No hay datos disponibles para este equipo.', sql: '' });
            }

            const last = data[data.length - 1];

            const maxTemp  = Math.max(...temps);
            const minTemp  = Math.min(...temps);
            const avgTemp  = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
            const maxVib   = Math.max(...vibs);
            const avgVib   = (vibs.reduce((a, b) => a + b, 0) / vibs.length).toFixed(2);
            const maxPower = Math.max(...powers);
            const avgPower = (powers.reduce((a, b) => a + b, 0) / powers.length).toFixed(0);
            const avgOEE   = (oees.filter(v => v > 0).reduce((a, b) => a + b, 0) / (oees.filter(v => v > 0).length || 1)).toFixed(1);
            const maxRPM   = Math.max(...rpms);

            const maxTempRec = data.find(d => d.temp === maxTemp);
            const maxVibRec  = data.find(d => d.vpd  === maxVib);

            let answer = '', sql = '';

            if (isAlarm) {
                // Anomaly: temp > baseTemp + 35 OR vib > baseVib + 4
                const anomalies = data.filter(d =>
                    d.temp > (machine.baseTemp + 35) || d.vpd > (machine.baseVib + 4)
                );
                if (anomalies.length > 0) {
                    const list = anomalies.slice(-5).reverse().map(a =>
                        `• ${a.displayDate}: Temp ${a.temp}°C | Vib ${a.vpd} mm/s | OEE ${a.battery}%`
                    ).join('\n');
                    answer = `⚠️ **Anomalías detectadas: ${anomalies.length}**\n\nEquipo: **${machine.name}** (${machine.area})\n\nMás recientes:\n${list}\n\nSe recomienda inspección técnica inmediata.`;
                    sql    = `SELECT * FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' AND (temperature > ${machine.baseTemp + 35} OR vibration > ${machine.baseVib + 4}) ORDER BY timestamp DESC LIMIT 10`;
                } else {
                    answer = `✅ **Sin anomalías activas** — ${machine.name} opera dentro de rangos nominales.\n\nÚltima lectura: Temp ${last.temp}°C | Vib ${last.vpd} mm/s | OEE ${last.battery}% | RPM ${last.rssi}`;
                    sql    = `SELECT COUNT(*) as total_anomalies FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' AND (temperature > ${machine.baseTemp + 35} OR vibration > ${machine.baseVib + 4})`;
                }
            } else if (isOEE) {
                answer = `📊 **OEE — ${machine.name}**\n\nEficiencia Global de Equipos:\n\n📅 Promedio del periodo: **${avgOEE}%**\n\nUn OEE superior al 85% se considera clase mundial. ${parseFloat(avgOEE) >= 85 ? '✅ Rendimiento excelente.' : '⚠️ Hay margen de mejora en disponibilidad o calidad.'}`;
                sql    = `SELECT AVG(oee) as avg_oee, MIN(oee) as min_oee, MAX(oee) as max_oee FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' AND oee > 0 AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)`;
            } else if (isVib) {
                answer = `📳 **Vibración — ${machine.name}**\n\n📈 Pico máximo: **${maxVib} mm/s**\n📅 Fecha: ${maxVibRec?.displayDate}\n📊 Promedio: ${avgVib} mm/s\n\nValor base nominal: ${machine.baseVib} mm/s. ${maxVib > machine.baseVib + 4 ? '⚠️ Se detectaron picos de vibración anómalos.' : '✅ Vibración dentro de rangos normales.'}`;
                sql    = `SELECT MAX(vibration) as max_vib, AVG(vibration) as avg_vib FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' ORDER BY timestamp DESC LIMIT 1000`;
            } else if (isPower) {
                answer = `⚡ **Consumo de Potencia — ${machine.name}**\n\n📈 Pico máximo: **${maxPower} W**\n📊 Promedio activo: **${avgPower} W**\n\nConsumo en último registro: ${last.co2} W`;
                sql    = `SELECT AVG(power_watts) as avg_power, MAX(power_watts) as peak_power FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' AND power_watts > 500 ORDER BY timestamp DESC LIMIT 500`;
            } else if (isRPM) {
                answer = `🔄 **RPM de Producción — ${machine.name}**\n\n📈 RPM máximo registrado: **${maxRPM} RPM**\n\nRPM en último registro: ${last.rssi} RPM`;
                sql    = `SELECT MAX(rpm) as max_rpm FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' ORDER BY timestamp DESC LIMIT 500`;
            } else if (isMax) {
                answer = `📈 **Temperatura máxima — ${machine.name}**\n\n📅 Fecha: ${maxTempRec?.displayDate}\n🌡 Valor: **${maxTemp}°C**\n📊 Promedio del periodo: ${avgTemp}°C\n\nBase nominal: ${machine.baseTemp}°C. Pico: **${(maxTemp - machine.baseTemp).toFixed(1)}°C por encima del valor base.**`;
                sql    = `SELECT MAX(temperature) as max_temp, TIMESTAMP_TRUNC(timestamp, DAY) as day FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' GROUP BY day ORDER BY max_temp DESC LIMIT 1`;
            } else if (isMin) {
                const minTempRec = data.find(d => d.temp === minTemp);
                answer = `📉 **Temperatura mínima — ${machine.name}**\n\n📅 Fecha: ${minTempRec?.displayDate}\n🌡 Valor: **${minTemp}°C**\n📊 Promedio del periodo: ${avgTemp}°C`;
                sql    = `SELECT MIN(temperature) as min_temp FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}'`;
            } else if (isAvg) {
                answer = `📊 **Promedios operativos — ${machine.name}**\n\n🌡 Temperatura: **${avgTemp}°C**\n📳 Vibración: **${avgVib} mm/s**\n⚡ Potencia: **${avgPower} W**\n📊 OEE: **${avgOEE}%**`;
                sql    = `SELECT AVG(temperature) as avg_temp, AVG(vibration) as avg_vib, AVG(power_watts) as avg_power, AVG(oee) as avg_oee FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`;
            } else if (isStatus) {
                const tempOk  = last.temp < (machine.baseTemp + 20);
                const vibOk   = last.vpd  < (machine.baseVib + 3);
                const oeeOk   = last.battery > 75;
                const allOk   = tempOk && vibOk && oeeOk;
                const status  = allOk ? '✅ NOMINAL' : '⚠️ REQUIERE ATENCIÓN';
                answer = `🏭 **Estado general de planta**\n\n${status}\n\n**${machine.name}** (${machine.area})\n🌡 Temperatura: ${last.temp}°C ${tempOk ? '✓' : '⚠'}\n📳 Vibración: ${last.vpd} mm/s ${vibOk ? '✓' : '⚠'}\n📊 OEE: ${last.battery}% ${oeeOk ? '✓' : '⚠'}\n⚡ Potencia: ${last.co2} W\n🔄 RPM: ${last.rssi}`;
                sql    = `SELECT * FROM \`industry_sentinel.machine_logs\` WHERE machine_id = '${targetMachineId}' ORDER BY timestamp DESC LIMIT 1`;
            } else {
                answer = `Puedo analizar los datos industriales de tus equipos. Prueba preguntando:\n\n• "¿Cuál fue la temperatura máxima del CNC?"\n• "¿Hay vibración anómala en las máquinas?"\n• "¿Cuál es el OEE promedio de la semana?"\n• "¿Cuál es el consumo de potencia del torno?"\n• "¿Cómo está el estado de la planta?"`;
            }

            resolve({ answer, sql });
        }, 900);
    });
}
