import { AuthGate } from '@cognitex/auth';
import { BRANDS } from '@cognitex/theme';

import { Console } from './Console';

/**
 * The whole app.
 *
 * What used to be 208 lines — two auth hooks that both ran on every render
 * with the result chosen by a ternary, plus a hand-rolled login screen — is
 * now the gate and the console. `AuthGate` also renders the loading state none
 * of the six apps had, which is what made an already-signed-in user see the
 * login form flash before `onAuthStateChanged` resolved.
 */
export default function App() {
    return (
        <AuthGate brand={BRANDS.productivity}>
            {({ user, signOut }) => <Console user={user} onSignOut={signOut} />}
        </AuthGate>
    );
}
