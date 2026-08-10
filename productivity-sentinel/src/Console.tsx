import { useCallback, useEffect, useState } from 'react';
import {
    BarChart3,
    ClipboardList,
    LayoutDashboard,
    ListChecks,
    NotebookPen,
} from 'lucide-react';
import { AppShell, type NavSection } from '@cognitex/ui';
import { BRANDS } from '@cognitex/theme';
import type { DataSource } from '@cognitex/data';
import type { SessionUser } from '@cognitex/auth';

import {
    pareto,
    type AdjustmentStatus,
    type Constraint,
    type ConstraintStatus,
    type DraftEntry,
    type FailureEntry,
} from './domain';
import { createEntry, loadSnapshot, moveConstraint, publishRollup, verifyEntry } from './data';
import { AnalisisView } from './views/AnalisisView';
import { RegistroView } from './views/RegistroView';
import { ResumenView } from './views/ResumenView';
import { RestriccionesView } from './views/RestriccionesView';
import { SintesisView } from './views/SintesisView';

/**
 * The console.
 *
 * Sections are real routes through `AppShell` rather than a `selectedVariable`
 * string switching a block inside a 228-line Dashboard, and the sidebar, top
 * bar and mobile drawer all come from `@cognitex/ui` — the version here was
 * still branded for another product in three of the six apps.
 *
 * Icons are imported one by one so the `vendor-icons` chunk stays small; the
 * shell takes them as nodes precisely so it does not have to bundle the set.
 */

const WINDOW_DAYS = 30;

const SECTIONS: NavSection[] = [
    { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={16} /> },
    { id: 'registro', label: 'Registro diario', icon: <NotebookPen size={16} /> },
    { id: 'restricciones', label: 'Restricciones', icon: <ListChecks size={16} /> },
    { id: 'analisis', label: 'Análisis', icon: <BarChart3 size={16} /> },
    { id: 'sintesis', label: 'Síntesis semanal', icon: <ClipboardList size={16} /> },
];

export interface ConsoleProps {
    user: SessionUser;
    onSignOut: () => void;
}

export function Console({ user, onSignOut }: ConsoleProps) {
    const [section, setSection] = useState('resumen');
    const [entries, setEntries] = useState<FailureEntry[]>([]);
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [source, setSource] = useState<DataSource>('generated');
    const [updatedAt, setUpdatedAt] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // One clock for the whole console. Every calculation takes `now` as an
    // argument instead of calling `new Date()` internally, so a render is
    // reproducible and the tests can pin it.
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const snapshot = await loadSnapshot({
                    orgId: user.orgId,
                    days: WINDOW_DAYS,
                    now: Date.now(),
                });
                if (cancelled) return;

                setEntries(snapshot.entries);
                setConstraints(snapshot.constraints);
                setSource(snapshot.source);
                setUpdatedAt(snapshot.updatedAt);
                setNow(Date.now());
            } catch {
                if (!cancelled) setLoadError('No se pudieron cargar los registros.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user.orgId]);

    const handleCreate = useCallback(
        async (draft: DraftEntry) => {
            const { value, source: writeSource } = await createEntry(draft);
            const next = [value, ...entries];

            setEntries(next);
            setUpdatedAt(writeSource === 'store' ? Date.now() : null);

            // Best-effort rollup into the shared `readings` collection, so the
            // platform contributes the ProductivityReading it is typed for.
            void publishRollup({
                orgId: draft.orgId,
                entries: next,
                constraints,
                dominantCause: pareto(next).at(0)?.cause ?? draft.rootCause,
                now: draft.at,
            });
        },
        [entries, constraints]
    );

    const handleVerify = useCallback(async (entry: FailureEntry, status: AdjustmentStatus) => {
        const { value } = await verifyEntry(entry, status);
        setEntries((current) => current.map((item) => (item.id === value.id ? value : item)));
    }, []);

    const handleMove = useCallback(
        async (constraint: Constraint, to: ConstraintStatus) => {
            const { value } = await moveConstraint(constraint, to, Date.now());
            setConstraints((current) =>
                current.map((item) => (item.id === value.id ? value : item))
            );
        },
        []
    );

    return (
        <AppShell
            brand={BRANDS.productivity}
            sections={SECTIONS}
            activeSection={section}
            onSectionChange={setSection}
            userLabel={user.displayName || user.email}
            onSignOut={onSignOut}
        >
            {loading ? (
                <p role="status" className="label-mono">
                    Cargando registros…
                </p>
            ) : loadError ? (
                <p role="alert" className="text-sm text-alert">
                    {loadError}
                </p>
            ) : (
                <>
                    {section === 'resumen' && (
                        <ResumenView
                            entries={entries}
                            constraints={constraints}
                            source={source}
                            updatedAt={updatedAt}
                            days={WINDOW_DAYS}
                            now={now}
                        />
                    )}

                    {section === 'registro' && (
                        <RegistroView
                            entries={entries}
                            orgId={user.orgId}
                            source={source}
                            updatedAt={updatedAt}
                            now={now}
                            onCreate={handleCreate}
                            onVerify={handleVerify}
                        />
                    )}

                    {section === 'restricciones' && (
                        <RestriccionesView
                            constraints={constraints}
                            source={source}
                            updatedAt={updatedAt}
                            now={now}
                            onMove={handleMove}
                        />
                    )}

                    {section === 'analisis' && (
                        <AnalisisView
                            entries={entries}
                            source={source}
                            updatedAt={updatedAt}
                            days={WINDOW_DAYS}
                            now={now}
                        />
                    )}

                    {section === 'sintesis' && (
                        <SintesisView
                            entries={entries}
                            constraints={constraints}
                            source={source}
                            updatedAt={updatedAt}
                            now={now}
                        />
                    )}
                </>
            )}
        </AppShell>
    );
}
