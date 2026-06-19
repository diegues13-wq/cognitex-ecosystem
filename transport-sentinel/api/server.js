/**
 * Transport Sentinel — API server (Node.js / Express)
 *
 * Architecture:
 *   - Persistent data (fleet registry, routes, maintenance, incidents, history)
 *     is stored in Firestore and seeded on first startup.
 *   - Real-time simulated data (fleet snapshot, KPIs, alerts) is generated
 *     in-memory per request (fast, stateless — will be replaced by live
 *     telemetry in production).
 *   - If Firestore is not available (no credentials), all routes fall back
 *     to in-memory generators transparently.
 *
 * Serving:
 *   - /api/*           REST API
 *   - /*               React SPA from ./public/
 *
 * IAM requirement:
 *   Cloud Run service account → roles/datastore.user
 *   (or set FIREBASE_SERVICE_ACCOUNT / GOOGLE_APPLICATION_CREDENTIALS)
 */

import express from 'express';
import cors    from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

import { initFirestore, isAvailable, getDB } from './db/firestore.js';
import { seedDatabase }                       from './db/seed.js';
import {
    TRAINS, ROUTES,
    generateFleetSnapshot, generateFleetKPIs, generateAlerts,
    generateHistoricalData, generateMaintenanceOrders, generateIncidents,
    generateEnergyData, generateCommercialData, generateRAMSMetrics,
    generateTrainSchedule, generateHourlyData,
} from './generators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ─── Helper: read Firestore collection as array ──────────────────────────────
async function fromCollection(name) {
    const snap = await getDB().collection(name).orderBy('__name__').get();
    return snap.docs.map(d => d.data());
}

// ─── REAL-TIME routes (always in-memory — simulated telemetry) ───────────────

app.get('/api/fleet',  (req, res) => res.json(generateFleetSnapshot(req.query.type  || 'todos')));
app.get('/api/kpis',   (req, res) => res.json(generateFleetKPIs(req.query.type      || 'todos')));
app.get('/api/alerts', (req, res) => res.json(generateAlerts(req.query.type         || 'todos')));
app.get('/api/hourly', (req, res) => res.json(generateHourlyData(req.query.train)));

// ─── PERSISTENT routes (Firestore if available, else generators) ─────────────

app.get('/api/trains', async (req, res) => {
    try {
        if (isAvailable()) return res.json(await fromCollection('fleet_registry'));
    } catch (e) { console.error('/api/trains db error:', e.message); }
    res.json(TRAINS);
});

app.get('/api/routes', async (req, res) => {
    try {
        if (isAvailable()) return res.json(await fromCollection('routes'));
    } catch (e) { console.error('/api/routes db error:', e.message); }
    res.json(ROUTES);
});

app.get('/api/maintenance', async (req, res) => {
    try {
        if (isAvailable()) return res.json(await fromCollection('maintenance_orders'));
    } catch (e) { console.error('/api/maintenance db error:', e.message); }
    res.json(generateMaintenanceOrders());
});

app.get('/api/incidents', async (req, res) => {
    try {
        if (isAvailable()) return res.json(await fromCollection('incidents'));
    } catch (e) { console.error('/api/incidents db error:', e.message); }
    res.json(generateIncidents());
});

app.get('/api/history', async (req, res) => {
    const trainId = req.query.train || 'USA-001';
    const days    = Math.min(Number(req.query.days) || 30, 90);
    try {
        if (isAvailable()) {
            const snap = await getDB()
                .collection('history')
                .where('trainId', '==', trainId)
                .orderBy('date', 'desc')
                .limit(days)
                .get();
            if (!snap.empty) return res.json(snap.docs.map(d => d.data()).reverse());
        }
    } catch (e) { console.error('/api/history db error:', e.message); }
    res.json(generateHistoricalData(days, trainId));
});

app.get('/api/energy', async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 90);
    try {
        if (isAvailable()) {
            const snap = await getDB()
                .collection('energy_daily')
                .orderBy('date', 'desc')
                .limit(days)
                .get();
            if (!snap.empty) return res.json(snap.docs.map(d => d.data()).reverse());
        }
    } catch (e) { console.error('/api/energy db error:', e.message); }
    res.json(generateEnergyData(days));
});

app.get('/api/commercial', async (req, res) => {
    const type = req.query.type || 'pasajeros';
    const days = Math.min(Number(req.query.days) || 30, 90);
    try {
        if (isAvailable()) {
            const col  = type === 'carga' ? 'commercial_cargo' : 'commercial_pax';
            const snap = await getDB()
                .collection(col)
                .orderBy('date', 'desc')
                .limit(days)
                .get();
            if (!snap.empty) return res.json(snap.docs.map(d => d.data()).reverse());
        }
    } catch (e) { console.error('/api/commercial db error:', e.message); }
    res.json(generateCommercialData(type, days));
});

app.get('/api/rams', async (_req, res) => {
    // RAMS metrics are always computed from current fleet state
    res.json(generateRAMSMetrics());
});

app.get('/api/schedule', (req, res) =>
    res.json(generateTrainSchedule(req.query.route || 'RT-001'))
);

// ─── Simple in-memory rate limiter for AI endpoint ───────────────────────────
const _aiRateMap = new Map();
function aiRateOk(ip) {
    const now = Date.now();
    const entry = _aiRateMap.get(ip) || { n: 0, reset: now + 60_000 };
    if (now > entry.reset) { entry.n = 0; entry.reset = now + 60_000; }
    entry.n++;
    _aiRateMap.set(ip, entry);
    return entry.n <= 30; // 30 requests/min per IP
}

// ─── Gemini AI chat (Vertex AI — ADC, no API key required) ──────────────────
const AI_MODEL    = 'gemini-2.5-flash';
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
const GCP_REGION  = process.env.GEMINI_REGION || 'us-central1';

let geminiClient = null;
function getGemini() {
    if (!geminiClient) {
        geminiClient = new GoogleGenAI({
            vertexai: true,
            project:  GCP_PROJECT,
            location: GCP_REGION,
        });
    }
    return geminiClient;
}

app.post('/api/ai/chat', async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!aiRateOk(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un momento.' });

    const rawPrompt = req.body?.prompt;
    const rawSys    = req.body?.systemInstruction;
    if (!rawPrompt || typeof rawPrompt !== 'string') return res.status(400).json({ error: 'prompt required' });

    const prompt            = rawPrompt.slice(0, 8000);
    const systemInstruction = rawSys ? String(rawSys).slice(0, 4000) : undefined;

    if (!GCP_PROJECT) return res.status(503).json({ error: 'GOOGLE_CLOUD_PROJECT not set' });

    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
        const ai     = getGemini();
        const stream = await ai.models.generateContentStream({
            model:    AI_MODEL,
            contents: prompt,
            config:   systemInstruction ? { systemInstruction } : {},
        });
        for await (const chunk of stream) {
            const text = chunk.text;
            if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
    } catch (err) {
        console.error('[ai/chat] Gemini error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }
    res.end();
});

// ─── Admin: force re-seed (requires X-Admin-Key header) ──────────────────────
app.post('/api/admin/reseed', async (req, res) => {
    const key = process.env.ADMIN_KEY;
    if (key && req.headers['x-admin-key'] !== key) return res.sendStatus(403);
    if (!isAvailable()) return res.status(503).json({ error: 'Firestore not available' });
    try {
        await getDB().doc('_meta/seed').delete();
        await seedDatabase();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
    status:    'ok',
    firestore: isAvailable() ? 'connected' : 'in-memory',
    ts:        Date.now(),
}));

// ─── Serve React SPA ─────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { maxAge: '1h' }));
app.get('*', (_, res) => res.sendFile(path.join(publicDir, 'index.html')));

// ─── Startup ─────────────────────────────────────────────────────────────────
(async () => {
    const dbOk = await initFirestore();
    if (dbOk) {
        // Seed runs in background — server starts immediately
        seedDatabase().catch(err => console.error('[db] Seed error:', err));
    }

    app.listen(PORT, () =>
        console.log(`Transport Sentinel on :${PORT}  db=${dbOk ? 'firestore' : 'in-memory'}`)
    );
})();
