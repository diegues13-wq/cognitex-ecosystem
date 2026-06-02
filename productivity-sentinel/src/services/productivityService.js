/**
 * productivityService.js — Abstraction layer for Productivity Sentinel.
 *
 * MOCK mode (default): all data from dataGenerator.js (no network calls).
 * API mode: Firestore + Cloud Functions.
 *
 * To switch to API mode set in .env:
 *   VITE_USE_MOCK=false
 *   VITE_AI_FUNCTION_URL=https://<region>-<project>.cloudfunctions.net/ask-productivity-ai
 */

import { generateEntries, CAUSAS_RAIZ, METAS, getWeeklySynthesis } from '../utils/dataGenerator';
import { auth } from '../firebase';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const AI_API   = import.meta.env.VITE_AI_FUNCTION_URL || '';

export const isMockMode = () => USE_MOCK || !AI_API;

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

// ── Entry CRUD ────────────────────────────────────────────────────────────────

/** Save a new entry. In mock mode, returns the entry as-is with a success flag. */
export async function saveEntry(entry) {
    if (isMockMode()) {
        return { success: true, id: `entry-${Date.now()}`, ...entry };
    }

    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${AI_API.replace('/ask-productivity-ai', '')}/entries`, {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Save entry error: ${res.status}`);
    return res.json();
}

/** Get entries for the last N days. Returns mock data in mock mode. */
export async function getEntries(days = 30) {
    if (isMockMode()) {
        return generateEntries(days);
    }

    const token = await getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${AI_API.replace('/ask-productivity-ai', '')}/entries?days=${days}`, { headers });
    if (!res.ok) throw new Error(`Get entries error: ${res.status}`);
    return res.json();
}

/** Get weekly synthesis (mock only for now). */
export async function getWeeklySynthesisData(entries) {
    return getWeeklySynthesis(entries);
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export async function askAI(query, entries = []) {
    if (!isMockMode() && AI_API) {
        const token = await getAuthToken();
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(AI_API, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, entries }),
        });
        if (!res.ok) throw new Error(`AI API error: ${res.status}`);
        return res.json(); // { answer, sql? }
    }
    return analyzeLocally(query, entries);
}

// ── Local Mock Analysis ───────────────────────────────────────────────────────
function analyzeLocally(query, entries) {
    return new Promise(resolve => {
        setTimeout(() => {
            if (!entries || entries.length === 0) {
                entries = generateEntries(30);
            }

            const q = query.toLowerCase();

            // Intent detection
            const isPareto     = /pareto|causa|raíz|restricción dominante|mayor restricción|80%/.test(q);
            const isRecurrence = /recurrencia|recurrente|repitiendo|repetición/.test(q);
            const isAdjust     = /ajuste|implementa|cuántos ajuste/.test(q);
            const isProgress   = /progreso|avance|meta|goal|going/.test(q);
            const isSynthesis  = /síntesis|resumen semanal|semana/.test(q);
            const isAdherence  = /racha|adherencia|registro|cuántos días|días/.test(q);

            // Compute stats
            const totalEntries = entries.length;

            // Causa counts
            const causaCounts = {};
            entries.forEach(e => {
                causaCounts[e.causa_raiz] = (causaCounts[e.causa_raiz] || 0) + 1;
            });
            const sortedCausas = Object.entries(causaCounts)
                .sort((a, b) => b[1] - a[1]);
            const topCausa = sortedCausas[0];
            const secondCausa = sortedCausas[1];

            // Recurrence
            const recurringCount = entries.filter(e => e.es_recurrente).length;
            const recurrenceRate = totalEntries > 0 ? Math.round((recurringCount / totalEntries) * 100) : 0;

            // Implementation
            const withAdjust = entries.filter(e => e.ajuste);
            const implemented = withAdjust.filter(e => e.implementado === 'si' || e.implementado === 'parcial');
            const implRate = withAdjust.length > 0 ? Math.round((implemented.length / withAdjust.length) * 100) : 0;

            // Adherence (days with at least 1 entry in last 30 days)
            const uniqueDays = new Set(entries.map(e => e.date)).size;

            // This week
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            const weekEntries = entries.filter(e => new Date(e.fecha) >= weekAgo);
            const weekDays = new Set(weekEntries.map(e => e.date)).size;

            let answer = '';

            if (isPareto) {
                const top1Label = CAUSAS_RAIZ[topCausa?.[0]]?.label || topCausa?.[0] || 'N/A';
                const top1Pct = topCausa ? Math.round((topCausa[1] / totalEntries) * 100) : 0;
                const top2Label = CAUSAS_RAIZ[secondCausa?.[0]]?.label || secondCausa?.[0] || 'N/A';
                const top2Pct = secondCausa ? Math.round((secondCausa[1] / totalEntries) * 100) : 0;
                const combined = top1Pct + top2Pct;

                answer = `📊 **Pareto de Causas Raíz**\n\nTus 2 causas dominantes explican el **${combined}%** de tus fallos:\n\n1. **${top1Label}** — ${top1Pct}% (${topCausa?.[1] || 0} fallos)\n2. **${top2Label}** — ${top2Pct}% (${secondCausa?.[1] || 0} fallos)\n\nEsto confirma el principio de Pareto: atacar estas 2 causas tiene el mayor apalancamiento. Tu restricción prioritaria activa es **Sobrecompromiso crónico**.`;
            } else if (isRecurrence) {
                const trendMsg = recurrenceRate > 60
                    ? '⚠️ La tasa sigue alta. Los mismos patrones se repiten sin corrección efectiva.'
                    : recurrenceRate > 30
                        ? '🟡 La tasa está mejorando, pero aún hay patrones que necesitan trabajo.'
                        : '✅ La tasa de recurrencia es baja. El sistema de ajustes está funcionando.';

                answer = `🔁 **Tasa de Recurrencia**\n\nActual: **${recurrenceRate}%** de tus fallos son recurrentes.\n\n${trendMsg}\n\nFallos recurrentes este periodo: ${recurringCount} de ${totalEntries} registrados.\n\nLas causas más repetidas son:\n1. ${CAUSAS_RAIZ[topCausa?.[0]]?.emoji} **${CAUSAS_RAIZ[topCausa?.[0]]?.label}**\n2. ${CAUSAS_RAIZ[secondCausa?.[0]]?.emoji} **${CAUSAS_RAIZ[secondCausa?.[0]]?.label}**`;
            } else if (isAdjust) {
                const siCount = entries.filter(e => e.implementado === 'si').length;
                const parcialCount = entries.filter(e => e.implementado === 'parcial').length;
                const noCount = entries.filter(e => e.implementado === 'no').length;

                answer = `✅ **Implementación de Ajustes**\n\nTasa general: **${implRate}%**\n\nDetalle:\n• Implementados completamente: **${siCount}**\n• Implementados parcialmente: **${parcialCount}**\n• No implementados: **${noCount}**\n\n${implRate >= 70 ? '🟢 Excelente implementación. El lazo de control está cerrado.' : implRate >= 50 ? '🟡 Implementación aceptable. Hay margen de mejora.' : '🔴 La tasa es baja. Los ajustes no se están ejecutando — revisa si son demasiado ambiciosos.'}`;
            } else if (isProgress) {
                const meta1Entries = entries.filter(e => e.meta_id === 'meta-1');
                const meta2Entries = entries.filter(e => e.meta_id === 'meta-2');
                const meta3Entries = entries.filter(e => e.meta_id === 'meta-3');

                answer = `📈 **Progreso de Metas**\n\nAnálisis basado en ${totalEntries} registros:\n\n🎯 **Trabajo profundo** (meta: 3h/día)\n   Fallos registrados: ${meta1Entries.length} eventos\n   La restricción "sobrecompromiso" impacta directamente esta meta.\n\n🤝 **Compromisos cumplidos** (meta: 90%)\n   Fallos registrados: ${meta2Entries.length} eventos\n   Tendencia: mejorando gradualmente.\n\n💬 **Conversaciones difíciles** (meta: 2/sem)\n   Fallos registrados: ${meta3Entries.length} eventos\n   En experimento activo para mejorar.`;
            } else if (isSynthesis) {
                const synthesis = getWeeklySynthesis(entries);
                const top = synthesis.causasDominantes;

                answer = `🧠 **Síntesis Semanal — Semana ${synthesis.weekNum}**\n\n**Causas dominantes:**\n1. ${top[0]?.emoji} **${top[0]?.label}** — ${top[0]?.pct}%\n2. ${top[1]?.emoji} **${top[1]?.label}** — ${top[1]?.pct}%\n\n**Restricción prioritaria:**\n"${synthesis.restriccionPrioritaria.descripcion}" — activa hace ${synthesis.restriccionPrioritaria.dias_activa} días.\n\n**Experimento de la semana:**\n${synthesis.experimento.hipotesis}\n\n**Acción:** ${synthesis.experimento.accion}\n**Métrica:** ${synthesis.experimento.metrica}`;
            } else if (isAdherence) {
                const adherenceRate = Math.round((uniqueDays / 30) * 100);
                const status = adherenceRate >= 80 ? '🟢 Excelente' : adherenceRate >= 60 ? '🟡 Regular' : '🔴 Baja';

                answer = `⚡ **Adherencia al Registro**\n\nEsta semana: **${weekDays}/7 días** con registro.\nÚltimos 30 días: **${uniqueDays}/30 días** (${adherenceRate}%)\n\nEstado: **${status}**\n\nTotal de entradas registradas: ${totalEntries}\nPromedio por día: ${(totalEntries / Math.max(uniqueDays, 1)).toFixed(1)} fallos/día\n\n${adherenceRate >= 80 ? 'La consistencia del registro es la base del lazo de mejora. ¡Sigue así!' : 'El registro diario es el primer paso. Sin datos, no hay mejora. Intenta registrar aunque sea 1 minuto al final del día.'}`;
            } else {
                answer = `Puedo analizar tu lazo de mejora personal. Prueba preguntando:\n\n• "¿Cuál es mi causa raíz más frecuente?"\n• "¿Qué fallos estoy repitiendo más?"\n• "¿Cuántos ajustes he implementado?"\n• "¿Cómo voy con mis metas?"\n• "Dame la síntesis de la semana"\n• "¿Cuántos días he registrado esta semana?"`;
            }

            resolve({ answer });
        }, 800);
    });
}
