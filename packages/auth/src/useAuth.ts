import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    browserLocalPersistence,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    type Auth,
} from 'firebase/auth';

import { getApp, isConfigured } from '@cognitex/data';

/**
 * The one authentication hook.
 *
 * Replaces a `firebase.js` that was byte-identical in four apps plus a
 * `useMockAuth`/`useFirebaseAuth` pair copy-pasted into every App.jsx, where
 * both hooks always ran and the result was picked with a ternary.
 *
 * Two behaviours are deliberately different from what the apps did before:
 *
 *  · Session survives a refresh. transport-sentinel held the user in
 *    `useState` only, so reloading the page logged the operator out — in a
 *    control room, mid-shift.
 *  · `orgId` comes from a custom claim, so every query can be tenant-scoped
 *    (spec §7.1). In demo mode it is the string 'demo'.
 */

export interface SessionUser {
    uid: string;
    email: string;
    displayName: string;
    /** Tenant. Drives every Firestore query. */
    orgId: string;
}

export interface AuthState {
    user: SessionUser | null;
    loading: boolean;
    /** True when no Firebase config was built in — an open demo. */
    demoMode: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signOutUser: () => Promise<void>;
}

const DEMO_USER: SessionUser = {
    uid: 'demo',
    email: 'demo@local',
    displayName: 'Usuario demo',
    orgId: 'demo',
};

/** Firebase error codes rendered as something an operator can act on. */
function describeError(code: string): string {
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Correo o contraseña incorrectos.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Espere unos minutos.';
        case 'auth/network-request-failed':
            return 'Sin conexión con el servidor de autenticación.';
        case 'auth/user-disabled':
            return 'Esta cuenta está deshabilitada.';
        default:
            return 'No se pudo iniciar sesión. Intente de nuevo.';
    }
}

export function useAuth(): AuthState {
    const demoMode = !isConfigured();

    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(!demoMode);
    const [error, setError] = useState<string | null>(null);

    const auth = useMemo<Auth | null>(() => (demoMode ? null : getAuth(getApp())), [demoMode]);

    useEffect(() => {
        if (!auth) return;

        // Keep the operator signed in across reloads.
        void setPersistence(auth, browserLocalPersistence);

        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // orgId lives in a custom claim set server-side at provisioning.
            const token = await firebaseUser.getIdTokenResult();
            const orgId = typeof token.claims.orgId === 'string' ? token.claims.orgId : 'default';

            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email ?? '',
                displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'Usuario',
                orgId,
            });
            setLoading(false);
        });
    }, [auth]);

    const signIn = useCallback(
        async (email: string, password: string) => {
            setError(null);

            if (!auth) {
                // Demo mode has nothing to verify. It says so on screen rather
                // than checking a password that ships in the bundle.
                setUser(DEMO_USER);
                return;
            }

            setLoading(true);
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                const code = (err as { code?: string }).code ?? '';
                setError(describeError(code));
                setLoading(false);
            }
        },
        [auth]
    );

    const signOutUser = useCallback(async () => {
        if (!auth) {
            setUser(null);
            return;
        }
        await signOut(auth);
    }, [auth]);

    return { user, loading, demoMode, error, signIn, signOutUser };
}
