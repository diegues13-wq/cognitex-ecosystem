/**
 * Request authentication.
 *
 * `POST /api/ai/chat` streams Vertex AI, which is billed per token. The
 * service is deployed `--allow-unauthenticated` — that flag is about reaching
 * the SPA, not about who may spend money — so until now the only thing
 * between the open internet and a paid model was a per-instance in-memory
 * counter that resets on every cold start and is per-instance on a service
 * that autoscales.
 *
 * The frontend has held a Firebase ID token since the day it had a login. It
 * simply never sent one. Now it does, and this verifies it.
 */

import { getAuth } from 'firebase-admin/auth';

import { isAvailable } from './db/firestore.js';

/**
 * Verifies `Authorization: Bearer <id-token>` and attaches `req.user`.
 *
 * Fails closed. When the Admin SDK could not initialise there is no way to
 * verify anything, so the endpoint reports itself unavailable rather than
 * waving requests through — which is the same mistake the reseed endpoint
 * made before it was fixed to require a configured ADMIN_KEY.
 */
export async function requireIdToken(req, res, next) {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ code: 'unauthenticated' });
    }

    if (!isAvailable()) {
        console.error('[auth] refusing: the Admin SDK is not initialised');
        return res.status(503).json({ code: 'unavailable' });
    }

    try {
        const claims = await getAuth().verifyIdToken(token);
        req.user = {
            uid: claims.uid,
            email: typeof claims.email === 'string' ? claims.email : null,
            orgId: typeof claims.orgId === 'string' ? claims.orgId : 'default',
        };
        return next();
    } catch (error) {
        // Expired, malformed, or signed for another project. The client is
        // told only that it is unauthenticated; the reason stays in the log.
        console.warn('[auth] token rejected:', error.message);
        return res.status(401).json({ code: 'unauthenticated' });
    }
}
