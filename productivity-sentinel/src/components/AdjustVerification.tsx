import { useState } from 'react';

import type { AdjustmentStatus, FailureEntry } from '../domain';

/**
 * Yesterday's commitment, verified.
 *
 * This is the step that closes the loop, and it is the only writer of the
 * number PPC is computed from. The original wrote the verification into React
 * state and hid the banner locally with `useState(verified)`, so refreshing
 * the page brought the same question back with the answer gone.
 */

export interface AdjustVerificationProps {
    entry: FailureEntry;
    onVerify: (entry: FailureEntry, status: AdjustmentStatus) => Promise<void>;
}

const CHOICES: { status: AdjustmentStatus; label: string; token: string }[] = [
    { status: 'si', label: 'Sí', token: 'var(--color-ok)' },
    { status: 'parcial', label: 'Parcial', token: 'var(--color-warn)' },
    { status: 'no', label: 'No', token: 'var(--color-alert)' },
];

export function AdjustVerification({ entry, onVerify }: AdjustVerificationProps) {
    const [busy, setBusy] = useState<AdjustmentStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    const verify = async (status: AdjustmentStatus) => {
        setBusy(status);
        setError(null);
        try {
            await onVerify(entry, status);
        } catch {
            setError('No se pudo guardar la verificación. Reintente.');
        } finally {
            setBusy(null);
        }
    };

    return (
        <section
            className="panel p-4 sm:p-5"
            style={{ borderColor: 'color-mix(in srgb, var(--color-warn) 40%, transparent)' }}
            aria-labelledby="verify-heading"
        >
            <h2 id="verify-heading" className="label-mono" style={{ color: 'var(--color-warn)' }}>
                Verificación pendiente
            </h2>

            <p className="mt-2 text-sm text-ice">
                Ajuste comprometido el {entry.date}:{' '}
                <span className="font-medium">«{entry.adjustment}»</span>
            </p>
            <p className="mt-1 text-xs text-steel">
                ¿Se implementó? La respuesta entra en el PPC de la semana.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                {CHOICES.map((choice) => (
                    <button
                        key={choice.status}
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void verify(choice.status)}
                        className="min-h-11 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:opacity-50"
                        style={{
                            borderColor: `color-mix(in srgb, ${choice.token} 45%, transparent)`,
                            color: choice.token,
                        }}
                    >
                        {busy === choice.status ? 'Guardando…' : choice.label}
                    </button>
                ))}
            </div>

            {error && (
                <p role="alert" className="mt-3 text-sm text-alert">
                    {error}
                </p>
            )}
        </section>
    );
}
