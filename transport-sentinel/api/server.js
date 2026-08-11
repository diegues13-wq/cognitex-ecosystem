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
import { requireIdToken }                     from './auth.js';
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

// ─── Health, before anything that could reject it ────────────────────────────
// Deliberately public and deliberately open to any origin: uptime checks and
// the deploy pipeline call it from outside the site origins, and it discloses
// nothing but liveness and which store is behind the API.
app.get('/api/health', cors(), (_req, res) => res.json({
    status:    'ok',
    firestore: isAvailable() ? 'connected' : 'in-memory',
    ts:        Date.now(),
}));

// ─── CORS, restricted to the site origins ────────────────────────────────────
//
// This was `cors()` with no arguments, which reflects any Origin and lets any
// page on the internet read every route — on a service that is deliberately
// deployed --allow-unauthenticated so the SPA can load.
//
// The SPA is served by this same process, so in production it needs no CORS
// headers at all; the allowlist exists for the marketing site and for the
// Vite dev server on :5177.
const SITE_ORIGINS = [
    'https://transport.cognitexindustrial.com',
    'https://cognitexindustrial.com',
    'https://www.cognitexindustrial.com',
];

const DEV_ORIGINS = ['http://localhost:5177', 'http://127.0.0.1:5177'];

const ALLOWED_ORIGINS = new Set([
    ...SITE_ORIGINS,
    ...(process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS),
    ...(process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean),
]);

app.use(cors({
    // A request with no Origin is same-origin, curl, or a health prober.
    // Returning `false` sends no CORS headers, which is correct for all three
    // — it does not block them, it just does not grant a cross-origin reader.
    origin(origin, callback) {
        callback(null, origin ? ALLOWED_ORIGINS.has(origin) : false);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
    maxAge: 3600,
}));

app.use(express.json({ limit: '32kb' }));

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

// ─── Per-user rate limit for the AI endpoint ─────────────────────────────────
//
// Still in-memory and therefore still per-instance — it is a courtesy limit,
// not the access control. The access control is `requireIdToken`. It is keyed
// on the uid now rather than the IP, because behind Cloud Run a whole
// corporate network arrives as one address, and one user on a shared NAT
// could exhaust the budget for everyone in the building.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const rateBuckets = new Map();

function withinRateLimit(uid) {
    const now = Date.now();
    const bucket = rateBuckets.get(uid);

    if (!bucket || now > bucket.resetAt) {
        rateBuckets.set(uid, { count: 1, resetAt: now + RATE_WINDOW_MS });
        // Opportunistic sweep so a long-lived instance does not accumulate a
        // bucket per user who ever asked one question.
        if (rateBuckets.size > 5000) {
            for (const [key, value] of rateBuckets) {
                if (now > value.resetAt) rateBuckets.delete(key);
            }
        }
        return true;
    }

    bucket.count += 1;
    return bucket.count <= RATE_LIMIT;
}

/**
 * Vertex AI failures, as codes.
 *
 * The client used to receive the provider's raw error message and pattern
 * match on it, which is how a `gcloud projects add-iam-policy-binding`
 * command — complete with the project id and the compute service-account
 * e-mail — ended up rendered in a chat bubble in a control room. The full
 * message stays in the server log where an SRE can read it.
 */
function classifyGeminiError(error) {
    const detail = `${error?.status ?? ''} ${error?.message ?? ''}`;

    if (/PERMISSION_DENIED|\b403\b|not authorized|has not been used/i.test(detail)) {
        return 'permission_denied';
    }
    if (/RESOURCE_EXHAUSTED|\b429\b|quota/i.test(detail)) return 'quota';
    if (/UNAUTHENTICATED|\b401\b/i.test(detail)) return 'permission_denied';
    if (/UNAVAILABLE|\b50[0-4]\b|deadline/i.test(detail)) return 'unavailable';
    return 'model_error';
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

app.post('/api/ai/chat', requireIdToken, async (req, res) => {
    if (!withinRateLimit(req.user.uid)) {
        return res.status(429).json({ code: 'rate_limited' });
    }

    const rawPrompt = req.body?.prompt;
    if (!rawPrompt || typeof rawPrompt !== 'string') {
        return res.status(400).json({ code: 'model_error' });
    }

    const prompt            = rawPrompt.slice(0, 8000);
    const rawSys            = req.body?.systemInstruction;
    const systemInstruction = rawSys ? String(rawSys).slice(0, 4000) : undefined;

    if (!GCP_PROJECT) {
        console.error('[ai/chat] refusing: GOOGLE_CLOUD_PROJECT is not set');
        return res.status(503).json({ code: 'unavailable' });
    }

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
        // Full detail to the log, a code to the operator.
        console.error('[ai/chat] Vertex AI error for uid', req.user.uid, '·', err?.message);
        res.write(`data: ${JSON.stringify({ code: classifyGeminiError(err) })}\n\n`);
    }
    res.end();
});

// ─── Admin: force re-seed (requires X-Admin-Key header) ──────────────────────
app.post('/api/admin/reseed', async (req, res) => {
    const key = process.env.ADMIN_KEY;

    // Fail closed. This used to be `if (key && ...)`, so an unset ADMIN_KEY
    // skipped the check entirely — and the deploy workflow never set one. On
    // an --allow-unauthenticated service that left a destructive endpoint
    // (deletes _meta/seed, rewrites every collection) open to the internet.
    if (!key) {
        console.error('[admin] reseed refused: ADMIN_KEY is not configured');
        return res.status(503).json({ error: 'admin endpoint not configured' });
    }
    if (req.headers['x-admin-key'] !== key) return res.sendStatus(403);

    if (!isAvailable()) return res.status(503).json({ error: 'Firestore not available' });
    try {
        await getDB().doc('_meta/seed').delete();
        await seedDatabase();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Serve React SPA ─────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');

// Hashed bundles are immutable; index.html must never be, or a deploy leaves
// operators on the previous build until they hard-refresh.
app.use(express.static(publicDir, {
    maxAge: '1h',
    setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
        else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    },
}));

// An unknown API path is a client bug, not a deep link. Without this it fell
// through to the SPA fallback and answered a fetch for JSON with an HTML
// document, which surfaces as an unrelated parse error.
app.use('/api', (_req, res) => res.status(404).json({ code: 'not_found' }));

app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

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
