import { useEffect, useMemo, useState } from 'react';
import { Activity, Factory, LayoutDashboard, Wrench } from 'lucide-react';
import { AppShell, type NavSection } from '@cognitex/ui';
import { BRANDS } from '@cognitex/theme';
import type { Alert, DataSource, IndustryReading } from '@cognitex/data';
import type { SessionUser } from '@cognitex/auth';

import { DAY_MS, activeAlerts } from './domain';
import { loadSnapshot } from './data';
import { AlertTicker } from './components/AlertTicker';
import { DisponibilidadView } from './views/DisponibilidadView';
import { MantenimientoView } from './views/MantenimientoView';
import { MaquinasView } from './views/MaquinasView';
import { ResumenView } from './views/ResumenView';

/**
 * The console.
 *
 * Sections are real routes through `AppShell` rather than a `selectedVariable`
 * string switching a block inside a 448-line Dashboard, and the sidebar, top
 * bar and mobile drawer come from `@cognitex/ui` — the sidebar this app
 * shipped was still branded for agro-sentinel and imported by nothing.
 *
 * Icons are imported one by one so the `vendor-icons` chunk stays small; the
 * shell takes them as nodes precisely so it does not have to bundle the set.
 */

const WINDOW_DAYS = 30;
const ALERT_WINDOW_MS = 24 * 60 * 60 * 1000;

const SECTIONS: NavSection[] = [
    { id: 'resumen', label: 'Resumen de planta', icon: <LayoutDashboard size={16} /> },
    { id: 'maquinas', label: 'Máquinas', icon: <Factory size={16} /> },
    { id: 'disponibilidad', label: 'Disponibilidad', icon: <Activity size={16} /> },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: <Wrench size={16} /> },
];

export interface ConsoleProps {
    user: SessionUser;
    onSignOut: () => void;
}

export function Console({ user, onSignOut }: ConsoleProps) {
    const [section, setSection] = useState('resumen');
    const [readings, setReadings] = useState<IndustryReading[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [source, setSource] = useState<DataSource>('generated');
    const [updatedAt, setUpdatedAt] = useState<number | null>(null);
    const [sampleMs, setSampleMs] = useState(DAY_MS / 12);
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

                setReadings(snapshot.readings);
                setAlerts(snapshot.alerts);
                setSource(snapshot.source);
                setUpdatedAt(snapshot.updatedAt);
                setSampleMs(snapshot.sampleMs);
                setNow(Date.now());
            } catch {
                if (!cancelled) setLoadError('No se pudieron cargar las lecturas de planta.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user.orgId]);

    const banner = useMemo(
        () => activeAlerts(alerts, { now, windowMs: ALERT_WINDOW_MS }),
        [alerts, now]
    );

    return (
        <AppShell
            brand={BRANDS.industry}
            sections={SECTIONS}
            activeSection={section}
            onSectionChange={setSection}
            userLabel={user.displayName || user.email}
            onSignOut={onSignOut}
            banner={<AlertTicker alerts={banner} />}
        >
            {loading ? (
                <p role="status" className="label-mono">
                    Cargando lecturas…
                </p>
            ) : loadError ? (
                <p role="alert" className="text-sm text-alert">
                    {loadError}
                </p>
            ) : (
                <>
                    {section === 'resumen' && (
                        <ResumenView
                            readings={readings}
                            source={source}
                            updatedAt={updatedAt}
                            sampleMs={sampleMs}
                            days={WINDOW_DAYS}
                        />
                    )}

                    {section === 'maquinas' && (
                        <MaquinasView
                            readings={readings}
                            source={source}
                            updatedAt={updatedAt}
                        />
                    )}

                    {section === 'disponibilidad' && (
                        <DisponibilidadView
                            readings={readings}
                            source={source}
                            updatedAt={updatedAt}
                            sampleMs={sampleMs}
                            days={WINDOW_DAYS}
                        />
                    )}

                    {section === 'mantenimiento' && (
                        <MantenimientoView
                            readings={readings}
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
