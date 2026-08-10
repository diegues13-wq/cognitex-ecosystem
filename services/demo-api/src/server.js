/**
 * svc-demo — the public feed behind the landing page's live demo (spec §4.3.3).
 *
 *   GET  /api/public/demo   public, cached 30s, CORS-restricted to the site
 *   POST /api/ingest/office   device → { kw }
 *   POST /api/ingest/vehicle  device → { kmToday, litersPer100km, stops }
 *   POST /api/maintenance/prune  scheduled cleanup
 *   GET  /healthz
 *
 * Honesty rule: the payload always carries `source`. It is "live" only when a
 * device actually reported inside the freshness window. Otherwise it is
 * "simulated" and the site says so. The demo exists to prove we measure things
 * — presenting synthetic numbers as measured would defeat its entire purpose.
 */

import express from 'express';
import cors from 'cors';

import {
    initStore,
    isAvailable,
    pruneOfficeReadings,
    readOfficeSeries,
    readVehicleDay,
    saveOfficeReading,
    saveVehicleDay,
} from './store.js';
import { buildPayload, dayKey } from './feed.js';

const app = express();
const PORT = process.env.PORT || 8080;

/** Comma-separated list; defaults to the production site. */
const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGINS ??
    'https://www.cognitexindustrial.com,https://cognitexindustrial.com'
)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

/** Shared secret devices present to POST readings. */
const INGEST_TOKEN = process.env.INGEST_TOKEN ?? '';

app.use(express.json({ limit: '16kb' }));
app.disable('x-powered-by');

app.use(
    cors({
        origin(origin, callback) {
            // No Origin header: curl, server-to-server, uptime checks.
            if (!origin) return callback(null, true);
            callback(null, ALLOWED_ORIGINS.includes(origin));
        },
    })
);

// ─── Auth for ingestion ──────────────────────────────────────────────────────

function requireIngestToken(req, res, next) {
    if (!INGEST_TOKEN) {
        // Fail closed. An unset token must not mean "anyone may write".
        return res.status(503).json({ error: 'ingestion not configured' });
    }

    const header = req.get('authorization') ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (presented !== INGEST_TOKEN) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    next();
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** Rejects anything that is not a finite number inside [min, max]. */
function number(value, { min, max }) {
    const n = typeof value === 'number' ? value : Number.parseFloat(value);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
}

// ─── Public feed ─────────────────────────────────────────────────────────────

let cache = { at: 0, payload: null };
const CACHE_MS = 30_000;

app.get('/api/public/demo', async (_req, res) => {
    const now = Date.now();

    if (cache.payload && now - cache.at < CACHE_MS) {
        res.set('Cache-Control', 'public, max-age=30');
        return res.json(cache.payload);
    }

    try {
        const payload = await buildPayload({
            storeAvailable: isAvailable(),
            readOfficeSeries: () => readOfficeSeries(24),
            readVehicleDay: () => readVehicleDay(dayKey()),
            now,
        });

        cache = { at: now, payload };
        res.set('Cache-Control', 'public, max-age=30');
        res.json(payload);
    } catch (err) {
        console.error('[demo] failed to build payload:', err);
        res.status(500).json({ error: 'unavailable' });
    }
});

// ─── Ingestion ───────────────────────────────────────────────────────────────

app.post('/api/ingest/office', requireIngestToken, async (req, res) => {
    // 60 kW ceiling: an office reading above that is a wiring or unit error,
    // and letting it through would wreck the chart's scale.
    const kw = number(req.body?.kw, { min: 0, max: 60 });
    if (kw === null) return res.status(400).json({ error: 'kw must be a number between 0 and 60' });

    if (!isAvailable()) return res.status(503).json({ error: 'store unavailable' });

    try {
        await saveOfficeReading(kw);
        cache = { at: 0, payload: null };
        res.status(202).json({ ok: true });
    } catch (err) {
        console.error('[ingest] office write failed:', err.message);
        res.status(500).json({ error: 'write failed' });
    }
});

app.post('/api/ingest/vehicle', requireIngestToken, async (req, res) => {
    const kmToday = number(req.body?.kmToday, { min: 0, max: 2000 });
    const litersPer100km = number(req.body?.litersPer100km, { min: 0, max: 60 });
    const stops = number(req.body?.stops, { min: 0, max: 500 });

    if (kmToday === null || litersPer100km === null || stops === null) {
        return res.status(400).json({ error: 'kmToday, litersPer100km and stops are required' });
    }

    if (!isAvailable()) return res.status(503).json({ error: 'store unavailable' });

    try {
        await saveVehicleDay(dayKey(), { kmToday, litersPer100km, stops: Math.round(stops) });
        cache = { at: 0, payload: null };
        res.status(202).json({ ok: true });
    } catch (err) {
        console.error('[ingest] vehicle write failed:', err.message);
        res.status(500).json({ error: 'write failed' });
    }
});

// ─── Maintenance ─────────────────────────────────────────────────────────────

app.post('/api/maintenance/prune', requireIngestToken, async (_req, res) => {
    try {
        const deleted = await pruneOfficeReadings(7);
        res.json({ deleted });
    } catch (err) {
        console.error('[maintenance] prune failed:', err.message);
        res.status(500).json({ error: 'prune failed' });
    }
});

app.get('/healthz', (_req, res) =>
    res.json({ ok: true, firestore: isAvailable(), ingestConfigured: Boolean(INGEST_TOKEN) })
);

// ─── Start ───────────────────────────────────────────────────────────────────

await initStore();

app.listen(PORT, () => {
    console.log(`[demo-api] listening on ${PORT}`);
    console.log(`[demo-api] firestore=${isAvailable()} ingest=${Boolean(INGEST_TOKEN)}`);
});

export { app, buildPayload };
