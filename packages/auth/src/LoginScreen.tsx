import { useState, type FormEvent } from 'react';
import type { Brand } from '@cognitex/theme';
import { brandVars } from '@cognitex/theme';

/**
 * The login screen, once.
 *
 * Six apps each carried their own copy that differed only in the colour
 * family, the product name and a version string. The accent now arrives as a
 * brand token, so a new platform gets a correct login screen for free.
 *
 * Accessibility was the weakest part of the originals — zero `<label>`
 * elements and zero aria attributes across all six. Every field here has a
 * real label, errors are announced, and the whole form is operable by
 * keyboard.
 */

export interface LoginScreenProps {
    brand: Brand;
    demoMode: boolean;
    loading: boolean;
    error: string | null;
    onSubmit: (email: string, password: string) => void | Promise<void>;
}

export function LoginScreen({ brand, demoMode, loading, error, onSubmit }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        void onSubmit(email, password);
    };

    return (
        <div
            className="flex min-h-dvh items-center justify-center bg-navy-900 px-4 py-10"
            style={brandVars(brand)}
        >
            <main className="w-full max-w-sm">
                <header className="mb-8 text-center">
                    <p
                        className="font-display text-xl font-semibold tracking-tight"
                        style={{ color: 'var(--color-brand)' }}
                    >
                        {brand.name}
                    </p>
                    <p className="mt-2 text-sm text-steel">{brand.tagline}</p>
                </header>

                <form onSubmit={handleSubmit} className="panel space-y-5 p-6" noValidate>
                    {demoMode && (
                        <p
                            className="rounded-lg border px-3 py-2 text-center text-xs"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--color-warn) 35%, transparent)',
                                color: 'var(--color-warn)',
                            }}
                            role="status"
                        >
                            Modo demo · datos simulados · sin autenticación real
                        </p>
                    )}

                    <div>
                        <label
                            htmlFor="login-email"
                            className="mb-1.5 block text-sm font-medium text-ice"
                        >
                            Correo
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required={!demoMode}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'login-error' : undefined}
                            className="min-h-12 w-full rounded-lg border border-steel/25 bg-navy-900 px-3 text-ice outline-none focus:border-[var(--color-brand)]"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="login-password"
                            className="mb-1.5 block text-sm font-medium text-ice"
                        >
                            Contraseña
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required={!demoMode}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'login-error' : undefined}
                            className="min-h-12 w-full rounded-lg border border-steel/25 bg-navy-900 px-3 text-ice outline-none focus:border-[var(--color-brand)]"
                        />
                    </div>

                    {error && (
                        <p id="login-error" role="alert" className="text-sm text-alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="min-h-12 w-full rounded-lg font-semibold text-navy-900 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                        {loading ? 'Verificando…' : demoMode ? 'Entrar al demo' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-steel/70">
                    Cognitex Industrial · Quito, Ecuador
                </p>
            </main>
        </div>
    );
}
