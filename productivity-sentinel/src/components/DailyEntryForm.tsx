import { useId, useState, type FormEvent } from 'react';

import {
    GOALS,
    ROOT_CAUSES,
    ROOT_CAUSE_IDS,
    toDateKey,
    type DraftEntry,
    type EnergyLevel,
    type RootCause,
} from '../domain';
import { Section } from './Section';

/**
 * The daily entry.
 *
 * The form this replaces had six `<label>` elements and not one `htmlFor`, no
 * `aria-invalid`, no `role="alert"` on its three validation messages, and a
 * `setTimeout` that reset the fields 2.5 seconds after submit — so a slow
 * network could wipe what you typed while you were still reading the
 * confirmation. Submission now resets on success and nothing is timed.
 *
 * The energy selector is a radio group rather than five buttons, because five
 * buttons with no group semantics are five unrelated controls to a screen
 * reader.
 */

export interface DailyEntryFormProps {
    orgId: string;
    now: number;
    onSubmit: (draft: DraftEntry) => Promise<void>;
}

interface FieldErrors {
    failure?: string;
    rootCause?: string;
    adjustment?: string;
}

const ENERGY_LEVELS: readonly EnergyLevel[] = [1, 2, 3, 4, 5];

export function DailyEntryForm({ orgId, now, onSubmit }: DailyEntryFormProps) {
    const ids = useId();
    const [failure, setFailure] = useState('');
    const [rootCause, setRootCause] = useState<RootCause | ''>('');
    const [adjustment, setAdjustment] = useState('');
    const [win, setWin] = useState('');
    const [energy, setEnergy] = useState<EnergyLevel>(3);
    const [goalId, setGoalId] = useState('');
    const [showOptional, setShowOptional] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const validate = (): FieldErrors => {
        const next: FieldErrors = {};
        if (!failure.trim()) next.failure = 'Describa qué falló hoy.';
        if (!rootCause) next.rootCause = 'Seleccione una causa raíz.';
        if (!adjustment.trim()) next.adjustment = 'El ajuste para mañana es obligatorio.';
        return next;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setSaveError(null);
        setSaved(false);

        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0 || !rootCause) return;

        setSaving(true);
        try {
            await onSubmit({
                orgId,
                date: toDateKey(now),
                at: now,
                failure: failure.trim(),
                rootCause,
                adjustment: adjustment.trim(),
                adjustmentStatus: 'pendiente',
                win: win.trim(),
                energy,
                goalId,
            });

            setFailure('');
            setRootCause('');
            setAdjustment('');
            setWin('');
            setEnergy(3);
            setGoalId('');
            setShowOptional(false);
            setSaved(true);
        } catch {
            setSaveError('No se pudo guardar el registro. Reintente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Section
            title="Registro del día"
            hint="Lenguaje de evento («hoy…»), nunca de identidad («soy…»)."
            aside={
                <p className="label-mono" aria-hidden="true">
                    {toDateKey(now)}
                </p>
            }
        >
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6" noValidate>
                <div>
                    <label
                        htmlFor={`${ids}-failure`}
                        className="mb-1.5 block text-sm font-medium text-ice"
                    >
                        ¿Qué falló hoy?{' '}
                        <span className="text-steel">(obligatorio)</span>
                    </label>
                    <textarea
                        id={`${ids}-failure`}
                        rows={3}
                        value={failure}
                        onChange={(event) => setFailure(event.target.value)}
                        aria-invalid={Boolean(errors.failure)}
                        aria-describedby={errors.failure ? `${ids}-failure-error` : undefined}
                        placeholder="Hoy pospuse por tercera vez la llamada con el cliente…"
                        className="w-full resize-none rounded-lg border border-steel/25 bg-navy-900 px-3 py-2.5 text-sm text-ice outline-none placeholder:text-steel/60 focus:border-[var(--color-brand)]"
                    />
                    {errors.failure && (
                        <p id={`${ids}-failure-error`} role="alert" className="mt-1 text-xs text-alert">
                            {errors.failure}
                        </p>
                    )}
                </div>

                <fieldset>
                    <legend className="mb-2 text-sm font-medium text-ice">
                        Causa raíz <span className="text-steel">(obligatorio)</span>
                    </legend>
                    <div
                        role="radiogroup"
                        aria-label="Causa raíz"
                        aria-invalid={Boolean(errors.rootCause)}
                        aria-describedby={errors.rootCause ? `${ids}-cause-error` : undefined}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {ROOT_CAUSE_IDS.map((cause) => {
                            const selected = rootCause === cause;
                            return (
                                <button
                                    key={cause}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setRootCause(cause)}
                                    title={ROOT_CAUSES[cause].definition}
                                    className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                        selected
                                            ? 'border-transparent text-navy-900'
                                            : 'border-steel/25 text-steel hover:border-steel/50 hover:text-ice'
                                    }`}
                                    style={
                                        selected
                                            ? { backgroundColor: 'var(--color-brand)' }
                                            : undefined
                                    }
                                >
                                    {ROOT_CAUSES[cause].label}
                                </button>
                            );
                        })}
                    </div>
                    {errors.rootCause && (
                        <p id={`${ids}-cause-error`} role="alert" className="mt-1 text-xs text-alert">
                            {errors.rootCause}
                        </p>
                    )}
                </fieldset>

                <div>
                    <label
                        htmlFor={`${ids}-adjustment`}
                        className="mb-1.5 block text-sm font-medium text-ice"
                    >
                        Ajuste para mañana <span className="text-steel">(obligatorio)</span>
                    </label>
                    <input
                        id={`${ids}-adjustment`}
                        type="text"
                        value={adjustment}
                        onChange={(event) => setAdjustment(event.target.value)}
                        aria-invalid={Boolean(errors.adjustment)}
                        aria-describedby={
                            errors.adjustment ? `${ids}-adjustment-error` : `${ids}-adjustment-hint`
                        }
                        placeholder="Una acción concreta que se pueda ejecutar mañana…"
                        className="min-h-11 w-full rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none placeholder:text-steel/60 focus:border-[var(--color-brand)]"
                    />
                    {errors.adjustment ? (
                        <p
                            id={`${ids}-adjustment-error`}
                            role="alert"
                            className="mt-1 text-xs text-alert"
                        >
                            {errors.adjustment}
                        </p>
                    ) : (
                        <p id={`${ids}-adjustment-hint`} className="mt-1 text-xs text-steel">
                            Se verifica mañana y cuenta en el PPC de la semana.
                        </p>
                    )}
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => setShowOptional((open) => !open)}
                        aria-expanded={showOptional}
                        aria-controls={`${ids}-optional`}
                        className="min-h-11 text-sm text-steel transition-colors hover:text-ice"
                    >
                        {showOptional ? '− ' : '+ '}
                        Opcionales: acierto del día, energía y meta
                    </button>

                    {showOptional && (
                        <div
                            id={`${ids}-optional`}
                            className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3"
                        >
                            <div>
                                <label
                                    htmlFor={`${ids}-win`}
                                    className="mb-1.5 block text-sm font-medium text-ice"
                                >
                                    Acierto del día
                                </label>
                                <input
                                    id={`${ids}-win`}
                                    type="text"
                                    value={win}
                                    onChange={(event) => setWin(event.target.value)}
                                    placeholder="¿Qué salió bien?"
                                    className="min-h-11 w-full rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none placeholder:text-steel/60 focus:border-[var(--color-brand)]"
                                />
                            </div>

                            <fieldset>
                                <legend className="mb-1.5 text-sm font-medium text-ice">
                                    Nivel de energía
                                </legend>
                                <div role="radiogroup" aria-label="Nivel de energía" className="flex gap-2">
                                    {ENERGY_LEVELS.map((level) => {
                                        const selected = energy === level;
                                        return (
                                            <button
                                                key={level}
                                                type="button"
                                                role="radio"
                                                aria-checked={selected}
                                                aria-label={`Energía ${level} de 5`}
                                                onClick={() => setEnergy(level)}
                                                className={`size-11 rounded-lg border text-sm font-semibold tabular transition-colors ${
                                                    selected
                                                        ? 'border-transparent text-navy-900'
                                                        : 'border-steel/25 text-steel hover:text-ice'
                                                }`}
                                                style={
                                                    selected
                                                        ? { backgroundColor: 'var(--color-brand)' }
                                                        : undefined
                                                }
                                            >
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            <div>
                                <label
                                    htmlFor={`${ids}-goal`}
                                    className="mb-1.5 block text-sm font-medium text-ice"
                                >
                                    Meta afectada
                                </label>
                                <select
                                    id={`${ids}-goal`}
                                    value={goalId}
                                    onChange={(event) => setGoalId(event.target.value)}
                                    className="min-h-11 w-full rounded-lg border border-steel/25 bg-navy-900 px-3 text-sm text-ice outline-none focus:border-[var(--color-brand)]"
                                >
                                    <option value="">Sin meta asignada</option>
                                    {GOALS.map((goal) => (
                                        <option key={goal.id} value={goal.id}>
                                            {goal.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {saveError && (
                    <p role="alert" className="text-sm text-alert">
                        {saveError}
                    </p>
                )}

                {saved && !saveError && (
                    <p role="status" className="text-sm text-ok">
                        Fallo registrado. El ajuste queda pendiente de verificación mañana.
                    </p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="min-h-12 w-full rounded-lg font-semibold text-navy-900 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                >
                    {saving ? 'Guardando…' : 'Registrar fallo'}
                </button>
            </form>
        </Section>
    );
}
