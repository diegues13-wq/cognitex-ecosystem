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
 *   temp     → body temperature (°C)
 *   humidity → fatigue level (%)
 *   vpd      → heart rate (BPM)
 *   co2      → on-shift status (1=working / 0=off-shift)
 *   battery  → wearable battery (%)
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
export async function fetchLiveData(workerId) {
    if (isMockMode()) return generateLast24hData(workerId);
    const res = await fetch(`${SENSOR_API}/live?location=${encodeURIComponent(workerId)}`);
    if (!res.ok) throw new Error(`Sensor API error: ${res.status}`);
    return res.json();
}

// ── Historical data ───────────────────────────────────────────────────────────
export async function fetchHistoricalData(workerId, days = 200) {
    if (isMockMode()) return generateHistoricalData(days, 12, workerId);
    const res = await fetch(
        `${SENSOR_API}/history?location=${encodeURIComponent(workerId)}&days=${encodeURIComponent(days)}`
    );
    if (!res.ok) throw new Error(`History API error: ${res.status}`);
    return res.json();
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export async function askAI(query, workerId, localData = []) {
    if (!isMockMode() && AI_API) {
        const token   = await getAuthToken();
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(AI_API, {
            method:  'POST',
            headers,
            body: JSON.stringify({ query, location_id: workerId }),
        });
        if (!res.ok) throw new Error(`AI API error: ${res.status}`);
        return res.json();   // { answer, sql }
    }
    return analyzeLocally(query, workerId, localData);
}

// ── Local mock analysis ───────────────────────────────────────────────────────
function analyzeLocally(query, workerId, dataset) {
    return new Promise(resolve => {
        setTimeout(() => {
            const q = query.toLowerCase();

            // Intent detection
            const isAlarm    = /alarm|alert|incidente|incident|critica|warning|activa|peligro/.test(q);
            const isMax      = /máx|max|alta|mayor|pico|peak/.test(q);
            const isMin      = /mín|min|baja|menor|lowest/.test(q);
            const isAvg      = /promedio|media|average|avg/.test(q);
            const isFatigue  = /fatiga|fatigue|cansancio|agota/.test(q);
            const isHR       = /cardíac|cardiaco|corazón|heart|pulso|bpm|frecuencia/.test(q);
            const isTemp     = /temp|corporal|fiebre|térmico|termico|calor/.test(q);
            const isBattery  = /batería|battery|carga|wearable/.test(q);
            const isManDown  = /man.?down|caída|caida|desmay|inconscient/.test(q);
            const isStatus   = /estado|status|resumen|summary|equipo|personal|turno|general/.test(q);

            // Worker name resolution
            let targetWorkerId = workerId;
            const workerKeywords = {
                'perez':      'WRK-001',
                'pérez':      'WRK-001',
                'soldador':   'WRK-001',
                'rodriguez':  'WRK-002',
                'rodríguez':  'WRK-002',
                'capataz':    'WRK-002',
                'foreman':    'WRK-002',
                'smith':      'WRK-003',
                'conductor':  'WRK-003',
                'driver':     'WRK-003',
                'chen':       'WRK-004',
                'quimico':    'WRK-004',
                'químico':    'WRK-004',
                'chemist':    'WRK-004',
                'ivanov':     'WRK-005',
                'electricista': 'WRK-005',
                'electrician':  'WRK-005',
            };
            for (const [key, id] of Object.entries(workerKeywords)) {
                if (q.includes(key)) { targetWorkerId = id; break; }
            }

            const worker = LOCATIONS.find(l => l.id === targetWorkerId) || LOCATIONS[0];
            const data   = dataset.length > 0 ? dataset : generateHistoricalData(30, 12, targetWorkerId);

            // Note: dataGenerator maps heartRate → vpd, fatigue → humidity, bodyTemp → temp, battery → battery
            const heartRates = data.map(d => d.vpd).filter(v => v !== undefined);
            const fatigues   = data.map(d => d.humidity).filter(v => v !== undefined);
            const bodyTemps  = data.map(d => d.temp).filter(v => v !== undefined);
            const batteries  = data.map(d => d.battery).filter(v => v !== undefined);

            if (!heartRates.length) {
                return resolve({ answer: 'No hay datos disponibles para este trabajador.', sql: '' });
            }

            const last = data[data.length - 1];

            const maxHR    = Math.max(...heartRates);
            const avgHR    = (heartRates.reduce((a, b) => a + b, 0) / heartRates.length).toFixed(0);
            const maxFat   = Math.max(...fatigues);
            const avgFat   = (fatigues.reduce((a, b) => a + b, 0) / fatigues.length).toFixed(1);
            const maxTemp  = Math.max(...bodyTemps);
            const avgTemp  = (bodyTemps.reduce((a, b) => a + b, 0) / bodyTemps.length).toFixed(1);
            const minBat   = Math.min(...batteries.filter(b => b > 0));
            const avgBat   = (batteries.filter(b => b > 0).reduce((a, b) => a + b, 0) / (batteries.filter(b => b > 0).length || 1)).toFixed(0);

            const maxHRRec   = data.find(d => d.vpd  === maxHR);
            const maxTempRec = data.find(d => d.temp === maxTemp);

            let answer = '', sql = '';

            if (isAlarm || isManDown) {
                // Anomaly: HR > baseHR + 40 OR bodyTemp > 37.8
                const incidents = data.filter(d =>
                    d.vpd > (worker.baseHR + 40) || d.temp > 37.8
                );
                if (incidents.length > 0) {
                    const list = incidents.slice(-5).reverse().map(a =>
                        `• ${a.displayDate}: FC ${a.vpd} BPM | Temp ${a.temp}°C | Fatiga ${a.humidity}%`
                    ).join('\n');
                    answer = `🚨 **Incidentes detectados: ${incidents.length}**\n\nTrabajador: **${worker.name}** (${worker.role} — ${worker.area})\n\nMás recientes:\n${list}\n\nSe requiere intervención inmediata y evaluación médica.`;
                    sql    = `SELECT * FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND (heart_rate > ${worker.baseHR + 40} OR body_temp > 37.8) ORDER BY timestamp DESC LIMIT 10`;
                } else {
                    answer = `✅ **Sin incidentes activos** — ${worker.name} opera dentro de parámetros seguros.\n\nÚltima lectura: FC ${last.vpd} BPM | Temp ${last.temp}°C | Fatiga ${last.humidity}%`;
                    sql    = `SELECT COUNT(*) as total_incidents FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND (heart_rate > ${worker.baseHR + 40} OR body_temp > 37.8)`;
                }
            } else if (isHR && isMax) {
                answer = `💓 **Frecuencia cardíaca máxima — ${worker.name}**\n\n📅 Fecha: ${maxHRRec?.displayDate}\n❤️ Valor: **${maxHR} BPM**\n📊 Promedio del periodo: ${avgHR} BPM\n\nFC base nominal: ${worker.baseHR} BPM. ${maxHR > worker.baseHR + 40 ? '⚠️ Se detectó estrés cardíaco elevado.' : '✅ Pico dentro del rango aceptable.'}`;
                sql    = `SELECT MAX(heart_rate) as max_hr, TIMESTAMP_TRUNC(timestamp, DAY) as day FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' GROUP BY day ORDER BY max_hr DESC LIMIT 1`;
            } else if (isHR && isAvg) {
                answer = `📊 **Frecuencia cardíaca promedio — ${worker.name}**\n\n❤️ Promedio del periodo: **${avgHR} BPM**\n📈 Pico máximo: ${maxHR} BPM\n\nFC base nominal: ${worker.baseHR} BPM.`;
                sql    = `SELECT AVG(heart_rate) as avg_hr FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`;
            } else if (isHR) {
                answer = `💓 **Frecuencia cardíaca — ${worker.name}**\n\n❤️ Actual: **${last.vpd} BPM**\n📊 Promedio: ${avgHR} BPM\n📈 Máximo: ${maxHR} BPM`;
                sql    = `SELECT heart_rate, timestamp FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' ORDER BY timestamp DESC LIMIT 1`;
            } else if (isFatigue && isMax) {
                answer = `😴 **Fatiga máxima registrada — ${worker.name}**\n\n📈 Pico: **${maxFat}%**\n📊 Promedio del periodo: ${avgFat}%\n\n${maxFat > 70 ? '⚠️ Nivel de fatiga crítico detectado. Considerar rotación de turno.' : '✅ Niveles de fatiga aceptables.'}`;
                sql    = `SELECT MAX(fatigue_level) as max_fatigue FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}'`;
            } else if (isFatigue) {
                answer = `😴 **Nivel de fatiga — ${worker.name}**\n\n😓 Actual: **${last.humidity}%**\n📊 Promedio: ${avgFat}%\n📈 Máximo: ${maxFat}%\n\n${last.humidity > 60 ? '⚠️ Fatiga elevada. Recomendar pausa.' : '✅ Fatiga dentro del rango aceptable.'}`;
                sql    = `SELECT AVG(fatigue_level) as avg_fatigue FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)`;
            } else if (isTemp) {
                const heatStress = data.filter(d => d.temp > 37.8);
                answer = `🌡 **Temperatura corporal — ${worker.name}**\n\n🌡 Actual: **${last.temp}°C**\n📊 Promedio: ${avgTemp}°C\n📈 Máximo registrado: ${maxTemp}°C en ${maxTempRec?.displayDate}\n\n${heatStress.length > 0 ? `⚠️ **${heatStress.length} casos de estrés térmico detectados** (temp > 37.8°C).` : '✅ Sin casos de estrés térmico en el periodo.'}`;
                sql    = `SELECT COUNT(*) as heat_stress_events FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND body_temp > 37.8`;
            } else if (isBattery) {
                const lowBat = data.filter(d => d.battery > 0 && d.battery < 20);
                answer = `🔋 **Batería de wearable — ${worker.name}**\n\n🔋 Actual: **${last.battery}%**\n📊 Promedio: ${avgBat}%\n📉 Mínimo registrado: ${minBat}%\n\n${lowBat.length > 0 ? `⚠️ **${lowBat.length} registros con batería crítica** (< 20%).` : '✅ Sin eventos de batería crítica en el periodo.'}`;
                sql    = `SELECT COUNT(*) as low_battery_events FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND battery_pct < 20 AND battery_pct > 0`;
            } else if (isMax) {
                answer = `📈 **Frecuencia cardíaca máxima — ${worker.name}**\n\n📅 Fecha: ${maxHRRec?.displayDate}\n❤️ Valor: **${maxHR} BPM**\n📊 Promedio del periodo: ${avgHR} BPM`;
                sql    = `SELECT MAX(heart_rate) as max_hr FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}'`;
            } else if (isAvg) {
                answer = `📊 **Promedios biométricos — ${worker.name}**\n\n❤️ Frecuencia cardíaca: **${avgHR} BPM**\n😓 Fatiga: **${avgFat}%**\n🌡 Temperatura corporal: **${avgTemp}°C**\n🔋 Batería wearable: **${avgBat}%**`;
                sql    = `SELECT AVG(heart_rate) as avg_hr, AVG(fatigue_level) as avg_fatigue, AVG(body_temp) as avg_temp FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`;
            } else if (isStatus) {
                const hrOk   = last.vpd  < (worker.baseHR + 30);
                const tempOk = last.temp < 37.5;
                const fatOk  = last.humidity < 60;
                const batOk  = last.battery > 20;
                const allOk  = hrOk && tempOk && fatOk && batOk;
                const status = allOk ? '✅ NOMINAL' : '⚠️ REQUIERE ATENCIÓN';
                answer = `👷 **Estado del personal de turno**\n\n${status}\n\n**${worker.name}** (${worker.role} — ${worker.area})\n❤️ FC: ${last.vpd} BPM ${hrOk ? '✓' : '⚠'}\n🌡 Temp corporal: ${last.temp}°C ${tempOk ? '✓' : '⚠'}\n😓 Fatiga: ${last.humidity}% ${fatOk ? '✓' : '⚠'}\n🔋 Batería: ${last.battery}% ${batOk ? '✓' : '⚠'}`;
                sql    = `SELECT * FROM \`personal_sentinel.ehs_logs\` WHERE worker_id = '${targetWorkerId}' ORDER BY timestamp DESC LIMIT 1`;
            } else {
                answer = `Puedo analizar los datos de salud y seguridad del personal. Prueba preguntando:\n\n• "¿Cuál fue la frecuencia cardíaca máxima hoy?"\n• "¿Cuál es el promedio de fatiga del turno?"\n• "¿Hay casos de estrés térmico?"\n• "¿Hay wearables con batería baja?"\n• "¿Cómo está el estado del personal de turno?"`;
            }

            resolve({ answer, sql });
        }, 900);
    });
}
