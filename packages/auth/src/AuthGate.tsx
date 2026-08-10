import type { ReactNode } from 'react';
import type { Brand } from '@cognitex/theme';

import { useAuth, type SessionUser } from './useAuth';
import { LoginScreen } from './LoginScreen';

/**
 * Wraps an app so it only renders once someone is signed in.
 *
 * Every platform used to inline this: `if (user) return <Dashboard/>` plus a
 * ~130-line login screen, repeated six times. It also renders a loading state,
 * which none of them did — with real Firebase auth there is a moment before
 * `onAuthStateChanged` fires where the originals would flash the login form at
 * an already-signed-in user.
 */

export interface AuthGateProps {
    brand: Brand;
    children: (session: { user: SessionUser; signOut: () => void; demoMode: boolean }) => ReactNode;
}

export function AuthGate({ brand, children }: AuthGateProps) {
    const { user, loading, demoMode, error, signIn, signOutUser } = useAuth();

    if (loading && !user) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-navy-900">
                <p className="label-mono" role="status">
                    Verificando sesión…
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <LoginScreen
                brand={brand}
                demoMode={demoMode}
                loading={loading}
                error={error}
                onSubmit={signIn}
            />
        );
    }

    return <>{children({ user, signOut: () => void signOutUser(), demoMode })}</>;
}
