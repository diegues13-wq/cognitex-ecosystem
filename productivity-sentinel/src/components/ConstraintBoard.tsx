import { useState } from 'react';
import { StatusDot } from '@cognitex/ui';

import {
    CONSTRAINT_STATUS,
    CONSTRAINT_STATUS_LABEL,
    GOALS,
    ROOT_CAUSES,
    allowedTransitions,
    daysInStatus,
    type Constraint,
    type ConstraintStatus,
} from '../domain';

/**
 * The constraint board.
 *
 * The previous version was three columns of read-only cards: nothing on the
 * page could move a constraint, so the state machine existed only in the seed
 * file. Each card now offers exactly the transitions the machine allows, which
 * is why an active constraint cannot be marked solved without an experiment
 * first — the rule is in the domain and the buttons follow it.
 */

export interface ConstraintBoardProps {
    constraints: readonly Constraint[];
    now: number;
    onMove: (constraint: Constraint, to: ConstraintStatus) => Promise<void>;
}

const COLUMNS: ConstraintStatus[] = ['activa', 'en_experimento', 'neutralizada'];

export function ConstraintBoard({ constraints, now, onMove }: ConstraintBoardProps) {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const move = async (constraint: Constraint, to: ConstraintStatus) => {
        setBusyId(constraint.id);
        setError(null);
        try {
            await onMove(constraint, to);
        } catch {
            setError('No se pudo mover la restricción. Reintente.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            {error && (
                <p role="alert" className="mb-3 text-sm text-alert">
                    {error}
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {COLUMNS.map((column) => {
                    const cards = constraints.filter((item) => item.status === column);

                    return (
                        <section key={column} aria-labelledby={`column-${column}`}>
                            <header className="mb-3 flex items-center gap-2 border-b border-steel/15 pb-2">
                                <StatusDot status={CONSTRAINT_STATUS[column]} />
                                <h3 id={`column-${column}`} className="label-mono">
                                    {CONSTRAINT_STATUS_LABEL[column]}
                                </h3>
                                <span className="ml-auto text-sm tabular text-steel">
                                    {cards.length}
                                </span>
                            </header>

                            {cards.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-steel/20 p-4 text-center text-xs text-steel">
                                    Sin restricciones
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {cards.map((constraint) => (
                                        <li key={constraint.id} className="panel-raised p-3">
                                            <p className="text-sm text-ice">
                                                {constraint.description}
                                            </p>
                                            <p className="mt-1.5 text-xs text-steel">
                                                {ROOT_CAUSES[constraint.rootCause].label} ·{' '}
                                                {daysInStatus(constraint, now)} días en este estado
                                            </p>

                                            {constraint.goalIds.length > 0 && (
                                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                                    {constraint.goalIds.map((goalId) => (
                                                        <li
                                                            key={goalId}
                                                            className="rounded-full border border-steel/20 px-2 py-0.5 text-xs text-steel"
                                                        >
                                                            {GOALS.find(
                                                                (goal) => goal.id === goalId
                                                            )?.name ?? goalId}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {allowedTransitions(constraint.status).map((to) => (
                                                    <button
                                                        key={to}
                                                        type="button"
                                                        disabled={busyId === constraint.id}
                                                        onClick={() => void move(constraint, to)}
                                                        className="min-h-11 rounded-lg border border-steel/25 px-3 text-xs text-steel transition-colors hover:border-steel/50 hover:text-ice disabled:opacity-50"
                                                    >
                                                        Mover a {CONSTRAINT_STATUS_LABEL[to]}
                                                    </button>
                                                ))}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
