import type { DataSource } from '@cognitex/data';

/**
 * Says where the numbers came from.
 *
 * Every console renders this. All six platforms currently generate their data
 * in the browser and present it as if it were measured — a customer opening
 * Industry Sentinel has no way to tell a simulation from their plant.
 *
 * The landing page makes the same promise about its own live demo. Keeping it
 * in both places is the product: we sell measurement, so we say when we are
 * not measuring.
 */

export interface DataSourceBadgeProps {
    source: DataSource;
    /** When the store last answered. Omitted in generated mode. */
    updatedAt?: number | null;
}

export function DataSourceBadge({ source, updatedAt }: DataSourceBadgeProps) {
    const live = source === 'store';

    return (
        <p
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{
                borderColor: live
                    ? 'color-mix(in srgb, var(--color-ok) 35%, transparent)'
                    : 'color-mix(in srgb, var(--color-warn) 35%, transparent)',
                color: live ? 'var(--color-ok)' : 'var(--color-warn)',
            }}
            role="status"
        >
            <span
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: live ? 'var(--color-ok)' : 'var(--color-warn)' }}
                aria-hidden="true"
            />
            {live ? 'Datos medidos' : 'Datos simulados'}
            {live && updatedAt ? (
                <span className="text-steel">
                    ·{' '}
                    {new Date(updatedAt).toLocaleTimeString('es-EC', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ) : null}
        </p>
    );
}
