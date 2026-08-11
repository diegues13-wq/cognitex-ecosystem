import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Gauge, History, MapPin, MessageSquareText, ShieldAlert } from 'lucide-react';
import { AppShell, type NavSection } from '@cognitex/ui';
import { BRANDS } from '@cognitex/theme';
import type { Alert, DataSource } from '@cognitex/data';
import type { SessionUser } from '@cognitex/auth';

import { DEFAULT_FARM, findFarm, latestSample, tallyAlarms } from './domain';
import type { Alarm, GreenhouseSample, ThermalScan } from './domain';
import { acknowledge, loadSnapshot } from './data';
import { Toolbar } from './components/Toolbar';
import { AlarmasView } from './views/AlarmasView';
import { ClimaView } from './views/ClimaView';
import { ConsultasView } from './views/ConsultasView';
import { FincasView } from './views/FincasView';
import { HistorialView } from './views/HistorialView';
import { TermicoView } from './views/TermicoView';

/**
 * The console.
 *
 * Sections are real, and they come from `AppShell`. The 678-line
 * `Dashboard.jsx` this replaces "navigated" by setting a `selectedVariable`
 * string that swapped one chart for another inside the same screen, while the
 * sidebar, top bar and mobile drawer were inlined in the same file — the
 * drawer stayed mounted when closed with `pointer-events` toggled, so every
 * link in it was still reachable by keyboard from behind the overlay.
 *
 * Icons are imported one by one so the `vendor-icons` chunk stays small; the
 * shell takes them as nodes precisely so it does not have to bundle the set.
 */

const SECTIONS: NavSection[] = [
    { id: 'clima', label: 'Clima', icon: <Gauge size={16} /> },
    { id: 'historial', label: 'Historial', icon: <History size={16} /> },
    { id: 'alarmas', label: 'Alarmas', icon: <ShieldAlert size={16} /> },
    { id: 'termico', label: 'Análisis térmico', icon: <Flame size={16} /> },
    { id: 'consultas', label: 'Consultas', icon: <MessageSquareText size={16} /> },
    { id: 'fincas', label: 'Fincas', icon: <MapPin size={16} /> },
];

/** How often a configured console re-reads the store, in milliseconds. */
const REFRESH_MS = 60_000;

export interface ConsoleProps {
    user: SessionUser;
    onSignOut: () => void;
}

export function Console({ user, onSignOut }: ConsoleProps) {
    const [section, setSection] = useState('clima');
    const [farmId, setFarmId] = useState(DEFAULT_FARM.id);
    const [hours, setHours] = useState(24);

    const [samples, setSamples] = useState<readonly GreenhouseSample[]>([]);
    const [alarms, setAlarms] = useState<readonly Alarm[]>([]);
    const [alerts, setAlerts] = useState<readonly Alert[]>([]);
    const [scans, setScans] = useState<readonly ThermalScan[]>([]);
    const [source, setSource] = useState<DataSource>('generated');
    const [updatedAt, setUpdatedAt] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // One clock for the whole console, advanced when data arrives. Every
    // calculation takes it as an argument rather than calling Date.now()
    // internally, so a render is reproducible and the tests can pin it.
    const [now, setNow] = useState(() => Date.now());
    const [reloadToken, setReloadToken] = useState(0);

    const farm = findFarm(farmId) ?? DEFAULT_FARM;

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const snapshot = await loadSnapshot({
                    orgId: user.orgId,
                    farm,
                    hours,
                    now: Date.now(),
                });
                if (cancelled) return;

                setSamples(snapshot.samples);
                setAlarms(snapshot.alarms);
                setAlerts(snapshot.alerts);
                setScans(snapshot.scans);
                setSource(snapshot.source);
                setUpdatedAt(snapshot.updatedAt);
                setNow(Date.now());
            } catch {
                if (!cancelled) setLoadError('No se pudieron cargar las lecturas.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user.orgId, farm, hours, reloadToken]);

    // A control room leaves this open all shift. Refreshing on a timer is the
    // difference between a console and a screenshot.
    useEffect(() => {
        const timer = setInterval(() => setReloadToken((token) => token + 1), REFRESH_MS);
        return () => clearInterval(timer);
    }, []);

    const handleAcknowledge = useCallback(async (alert: Alert) => {
        const { value } = await acknowledge(alert, Date.now());
        setAlerts((current) => current.map((item) => (item.id === value.id ? value : item)));
    }, []);

    const newest = useMemo(() => latestSample(samples), [samples]);
    const standing = useMemo(() => tallyAlarms(alarms).unacknowledged, [alarms]);

    const banner =
        standing > 0 ? (
            <p
                role="status"
                className="border-b border-steel/15 px-4 py-2 text-sm"
                style={{ backgroundColor: 'var(--color-navy-800)', color: 'var(--color-warn)' }}
            >
                {standing} alarma{standing === 1 ? '' : 's'} sin reconocer en {farm.name}.
            </p>
        ) : null;

    return (
        <AppShell
            brand={BRANDS.agro}
            sections={SECTIONS}
            activeSection={section}
            onSectionChange={setSection}
            userLabel={user.displayName || user.email}
            onSignOut={onSignOut}
            {...(banner ? { banner } : {})}
            toolbar={
                <Toolbar
                    farmId={farmId}
                    onFarmChange={setFarmId}
                    hours={hours}
                    onHoursChange={setHours}
                    onRefresh={() => setReloadToken((token) => token + 1)}
                    loading={loading}
                />
            }
        >
            {loading && samples.length === 0 ? (
                <p role="status" className="label-mono">
                    Cargando lecturas…
                </p>
            ) : loadError ? (
                <p role="alert" className="text-sm text-alert">
                    {loadError}
                </p>
            ) : (
                <>
                    {section === 'clima' && (
                        <ClimaView
                            farm={farm}
                            samples={samples}
                            source={source}
                            updatedAt={updatedAt}
                            now={now}
                        />
                    )}

                    {section === 'historial' && (
                        <HistorialView samples={samples} source={source} updatedAt={updatedAt} />
                    )}

                    {section === 'alarmas' && (
                        <AlarmasView
                            samples={samples}
                            alarms={alarms}
                            alerts={alerts}
                            source={source}
                            updatedAt={updatedAt}
                            onAcknowledge={(alert) => void handleAcknowledge(alert)}
                        />
                    )}

                    {section === 'termico' && (
                        <TermicoView
                            farm={farm}
                            scans={scans}
                            source={source}
                            updatedAt={updatedAt}
                        />
                    )}

                    {section === 'consultas' && (
                        <ConsultasView
                            samples={samples}
                            alarms={alarms}
                            source={source}
                            updatedAt={updatedAt}
                        />
                    )}

                    {section === 'fincas' && (
                        <FincasView
                            selectedId={farmId}
                            onSelect={setFarmId}
                            latest={newest}
                            source={source}
                            updatedAt={updatedAt}
                        />
                    )}
                </>
            )}
        </AppShell>
    );
}
