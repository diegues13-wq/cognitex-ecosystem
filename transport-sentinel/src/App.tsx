import { AuthGate } from '@cognitex/auth';
import { BRANDS } from '@cognitex/theme';

import { Console } from './Console';

/**
 * The whole app.
 *
 * The 170-line hand-rolled login screen is gone, and with it the reason an
 * operator got signed out mid-shift: the old `App.jsx` held the user in
 * `useState`, so a reload — or a browser restarting after a panel-PC power
 * blip — dropped the session. `AuthGate` persists it through
 * `browserLocalPersistence` and renders a verifying state while Firebase
 * resolves, instead of flashing the login form at someone already signed in.
 */
export default function App() {
    return (
        <AuthGate brand={BRANDS.transport}>
            {({ user, signOut, demoMode }) => (
                <Console user={user} onSignOut={signOut} demoMode={demoMode} />
            )}
        </AuthGate>
    );
}
