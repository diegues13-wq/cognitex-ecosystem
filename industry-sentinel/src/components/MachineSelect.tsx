import { useId } from 'react';

import { MACHINES } from '../domain';

/**
 * The machine picker.
 *
 * The old one was a bare `<select>` with a `<span>` above it acting as a
 * label — no `<label>`, no `htmlFor`, nothing a screen reader could associate.
 * The whole console had zero labels and zero aria attributes.
 */

export interface MachineSelectProps {
    value: string;
    onChange: (id: string) => void;
    /** Renders the label above the control instead of only to assistive tech. */
    showLabel?: boolean;
}

export function MachineSelect({ value, onChange, showLabel = false }: MachineSelectProps) {
    const id = useId();

    return (
        <div className="flex items-center gap-2">
            <label htmlFor={id} className={showLabel ? 'label-mono' : 'sr-only'}>
                Máquina
            </label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-11 rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]"
            >
                {MACHINES.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                        {machine.name} · {machine.area}
                    </option>
                ))}
            </select>
        </div>
    );
}
