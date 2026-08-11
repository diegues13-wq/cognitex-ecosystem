import { useEffect, useMemo, useState } from 'react';
import { HardHat, LayoutDashboard, Thermometer, Users } from 'lucide-react';
import { AppShell, type NavSection } from '@cognitex/ui';
import { BRANDS } from '@cognitex/theme';
import type { Alert, DataSource, PersonalReading } from '@cognitex/data';
import type { SessionUser } from '@cognitex/auth';

import { activeAlerts } from './domain';
import { loadSnapshot } from './data';
import { AlertTicker } from './components/AlertTicker';
import { EppView } from './views/EppView';
import { ExposicionView } from './views/ExposicionView';
import { ResumenView } from './views/ResumenView';
import { TrabajadoresView } from './views/TrabajadoresView';

/**
 * The console.
 *
 * Sections are real routes through `AppShell` rather than a `selectedVariable`
 * string switching a block inside a 440-line Dashboard, and the sidebar, top
 * bar and mobile drawer come from `@cognitex/ui` — the sidebar this app
 * shipped was still branded for agro-sentinel and imported by nothing.
 *
 * Icons are imported one by one so the `vendor-icons` chunk stays small; the
 * shell takes them as nodes precisely so it does not have to bundle the set.
 */

const WINDOW_DAYS = 14;
const ALERT_WINDOW_MS = 24 * 60 * 60 * 1000;

const SECTIONS: NavSection[] = [
    { id: 'resumen', label: 'Resumen de cuadrilla', icon: <LayoutDashboard size={16} /> },
    { id: 'trabajadores', label: 'Trabajadores', icon: <Users size={16} /> },
    { id: 'exposicion', label: 'Exposición', icon: <Thermometer size={16} /> },
    { id: 'epp', label: 'EPP y wearables', icon: <HardHat size={16} /> },
];

export interface ConsoleProps {
    user: SessionUser;
    onSignOut: () => void;
}

export function Console({ user, onSignOut }: ConsoleProps) {
    const [section, setSection] = useState('resumen');
    const [readings, setReadings] = useState<PersonalReading[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
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

                setReadings(snapshot.readings);
                setAlerts(snapshot.alerts);
                setSource(snapshot.source);
                setUpdatedAt(snapshot.updatedAt);
                setNow(Date.now());
            } catch {
                if (!cancelled) setLoadError('No se pudieron cargar las lecturas de la cuadrilla.');
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
            brand={BRANDS.personal}
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
                            now={now}
                            days={WINDOW_DAYS}
                        />
                    )}

                    {section === 'trabajadores' && (
                        <TrabajadoresView
                            readings={readings}
                            source={source}
                            updatedAt={updatedAt}
                            now={now}
                        />
                    )}

                    {section === 'exposicion' && (
                        <ExposicionView
                            readings={readings}
                            source={source}
                            updatedAt={updatedAt}
                            now={now}
                        />
                    )}

                    {section === 'epp' && (
                        <EppView
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
