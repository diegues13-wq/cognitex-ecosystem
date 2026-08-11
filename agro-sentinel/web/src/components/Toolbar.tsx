import { RefreshCw } from 'lucide-react';

import { FARMS } from '../domain';

/**
 * The farm and window selectors, rendered into the shell's top bar.
 *
 * Both are real `<select>`s with real `<label>`s. The old console changed
 * farm through a column of `<button>`s in the sidebar and changed the time
 * window through two bare `<input type="date">`s with no labels at all — 15
 * interactive controls in the app and not one `<label>`, `aria-label` or
 * `role` between them.
 */

export interface ToolbarProps {
    farmId: string;
    onFarmChange: (id: string) => void;
    hours: number;
    onHoursChange: (hours: number) => void;
    onRefresh: () => void;
    loading: boolean;
}

const WINDOWS: readonly { hours: number; label: string }[] = [
    { hours: 24, label: 'Últimas 24 h' },
    { hours: 24 * 7, label: 'Últimos 7 días' },
    { hours: 24 * 30, label: 'Últimos 30 días' },
];

const SELECT_CLASS =
    'min-h-11 rounded-lg border border-steel/25 bg-navy-800 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]';

export function Toolbar({
    farmId,
    onFarmChange,
    hours,
    onHoursChange,
    onRefresh,
    loading,
}: ToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="toolbar-farm" className="sr-only">
                Finca
            </label>
            <select
                id="toolbar-farm"
                value={farmId}
                onChange={(event) => onFarmChange(event.target.value)}
                className={SELECT_CLASS}
            >
                {FARMS.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                        {farm.name} · {farm.crop}
                    </option>
                ))}
            </select>

            <label htmlFor="toolbar-window" className="sr-only">
                Periodo
            </label>
            <select
                id="toolbar-window"
                value={hours}
                onChange={(event) => onHoursChange(Number(event.target.value))}
                className={SELECT_CLASS}
            >
                {WINDOWS.map((window) => (
                    <option key={window.hours} value={window.hours}>
                        {window.label}
                    </option>
                ))}
            </select>

            <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Actualizar lecturas"
                className="flex size-11 items-center justify-center rounded-lg border border-steel/25 text-steel transition-colors hover:text-ice disabled:opacity-50"
            >
                <RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
    );
}
