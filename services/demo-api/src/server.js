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

/*
 * Firestore is an optional dependency of this service: without it the feed
 * serves simulated data and says so. It must therefore never be able to kill
 * the process — but google-auth-library rejects from a detached promise when
 * Application Default Credentials are missing, which escapes the try/catch
 * around the call and, under Node's default, terminates the process.
 *
 * That is exactly what happened on Cloud Run: the container bound its port,
 * logged "listening", then died on the credential lookup. The service had a
 * URL and a public IAM policy, and every request still returned a 404 from
 * the Google frontend, because no healthy revision was left to serve it.
 *
 * Deliberately narrow in effect: the request handlers all have their own
 * try/catch and answer 500 on failure, so this only catches background work.
 */
process.on('unhandledRejection', (reason) => {
    console.error('[demo-api] unhandled rejection, continuing with simulated data:', reason);
});

/**
 * Allowed origins, separated by semicolons, commas or whitespace.
 *
 * Accepts all three because the Cloud Run deploy action joins env_vars with
 * commas, so a comma inside this value silently becomes a second variable.
 * The workflow passes semicolons; parsing all of them means a future edit
 * cannot reintroduce that failure.
 */
const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGINS ??
    'https://www.cognitexindustrial.com;https://cognitexindustrial.com'
)
    .split(/[;,\s]+/)
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

/*
 * Under /api, not /healthz.
 *
 * A bare /healthz on the *.run.app hostname is answered by the Google
 * frontend with its own 404 and never reaches this process — verified in
 * production, where /api/public/demo returned JSON from here while /healthz
 * on the same host returned Google's error page. transport-sentinel already
 * uses /api/health for the same reason.
 */
app.get('/api/health', (_req, res) =>
    res.json({ ok: true, firestore: isAvailable(), ingestConfigured: Boolean(INGEST_TOKEN) })
);

// ─── Start ───────────────────────────────────────────────────────────────────

/*
 * Listen FIRST, connect to Firestore after.
 *
 * This used to `await initStore()` before listening. initStore performs a
 * real round trip to prove the credentials work — and when Firestore is not
 * provisioned in the project, that call retries with backoff rather than
 * failing fast. The container therefore never bound the port, Cloud Run's
 * startup probe timed out, and the revision was discarded: the service
 * existed, had a URL and a public IAM policy, and every request still got a
 * 404 from the Google frontend because no healthy revision was serving.
 *
 * The store is optional by design — the feed falls back to simulated data
 * and labels it — so it must never gate the process coming up.
 */
app.listen(PORT, () => {
    console.log(`[demo-api] listening on ${PORT}`);

    initStore()
        .then((ready) => {
            console.log(`[demo-api] firestore=${ready} ingest=${Boolean(INGEST_TOKEN)}`);
        })
        .catch((err) => {
            console.error('[demo-api] store init failed, serving simulated data:', err.message);
        });
});

export { app, buildPayload };
