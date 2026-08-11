import { useId } from 'react';

import { ROLE_LABEL, WORKERS } from '../domain';

/**
 * The worker picker.
 *
 * The old one was a bare `<select>` with a `<span>` above it acting as a
 * label — no `<label>`, no `htmlFor`, nothing a screen reader could associate.
 * The whole console had zero labels and zero aria attributes.
 */

export interface WorkerSelectProps {
    value: string;
    onChange: (id: string) => void;
    showLabel?: boolean;
}

export function WorkerSelect({ value, onChange, showLabel = false }: WorkerSelectProps) {
    const id = useId();

    return (
        <div className="flex items-center gap-2">
            <label htmlFor={id} className={showLabel ? 'label-mono' : 'sr-only'}>
                Trabajador
            </label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-11 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]"
            >
                {WORKERS.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                        {worker.name} · {ROLE_LABEL[worker.role]}
                    </option>
                ))}
            </select>
        </div>
    );
}
