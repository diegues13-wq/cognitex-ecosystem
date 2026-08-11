import { getAuth } from 'firebase/auth';
import { getApp, isConfigured } from '@cognitex/data';

/**
 * The current Firebase ID token, or null when there is nothing to prove.
 *
 * `POST /api/ai/chat` spends money on Vertex AI, so the server requires this.
 * The frontend already holds the credential — `@cognitex/auth` signed the
 * operator in — it simply never sent it, which is how a billed endpoint ended
 * up open on an `--allow-unauthenticated` service.
 *
 * `getIdToken()` refreshes on its own when the cached token is close to
 * expiry, so a console left open across a shift keeps working.
 */
export async function idToken(): Promise<string | null> {
    if (!isConfigured()) return null;

    const user = getAuth(getApp()).currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch {
        // A refresh can fail offline. The caller renders "sin conexión"
        // rather than a broken chat.
        return null;
    }
}
