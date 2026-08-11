import { AuthGate } from '@cognitex/auth';
import { BRANDS } from '@cognitex/theme';

import { Console } from './Console';

/**
 * The whole app.
 *
 * What used to be a hand-rolled login screen plus two auth hooks that both ran
 * on every render with the result chosen by a ternary is now the gate and the
 * console. `AuthGate` also renders the loading state this app never had, which
 * is what made an already-signed-in supervisor see the login form flash before
 * `onAuthStateChanged` resolved.
 */
export default function App() {
    return (
        <AuthGate brand={BRANDS.personal}>
            {({ user, signOut }) => <Console user={user} onSignOut={signOut} />}
        </AuthGate>
    );
}
