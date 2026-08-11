import { useMemo } from 'react';
import type { Metric } from '@cognitex/data';
import { MetricCard } from '@cognitex/ui';

import type { FleetKpis, Incident } from '../domain/types';
import { INCIDENT_SEVERITY } from '../domain/status';
import { BarChart, RankedBars, type Bucket } from '../components/Charts';
import { Panel, StatusPill } from '../components/Panel';

/**
 * Safety and RAMS.
 *
 * Every figure here comes from the incident register. The previous version
 * also reported "SPAD (30 d): 0" and "Infracciones de velocidad: 2" as
 * literals, and a four-row MTBF/MTTR table of constants — on a safety screen,
 * a number that cannot change is the most dangerous kind of number, because
 * "zero signals passed at danger" is exactly the claim someone will rely on.
 * They are gone rather than made up more convincingly.
 */

const WEEK_MS = 7 * 86_400_000;
const WEEKS = 10;

const SEVERITY_LABEL = {
    CRITICO: 'Crítico',
    MAYOR: 'Mayor',
    MENOR: 'Menor',
} as const;

const TYPE_LABEL: Record<string, string> = {
    RETRASO_MAYOR: 'Retraso mayor',
    RETRASO_MENOR: 'Retraso menor',
    AVERIA: 'Avería',
    NEAR_MISS: 'Cuasi accidente',
    ACCIDENTE: 'Accidente',
    SPAD: 'Rebase de señal',
};

/** `yyyy-MM-dd HH:mm` is not an ISO string until the space becomes a T. */
function parseIncidentDate(value: string): number {
    return Date.parse(value.replace(' ', 'T'));
}

export interface SafetyViewProps {
    incidents: Incident[];
    kpis: FleetKpis;
    /**
     * The instant every window on this screen is measured back from.
     *
     * It arrives as a prop rather than being read from the clock mid-render:
     * a component that calls `Date.now()` while rendering produces a different
     * answer on every re-render, so the same histogram could shift buckets
     * because an unrelated piece of state changed.
     */
    now: number;
}

export default function SafetyView({ incidents, kpis, now }: SafetyViewProps) {
    const open = incidents.filter((incident) => incident.status === 'ABIERTO');

    const last30 = useMemo(() => {
        const cutoff = now - 30 * 86_400_000;
        return incidents.filter((incident) => parseIncidentDate(incident.date) >= cutoff);
    }, [incidents, now]);

    const metrics: Metric[] = [
        {
            id: 'accident-free',
            label: 'Días sin accidente',
            value: kpis.diasSinAccidente,
            unit: 'días',
            precision: 0,
            status: kpis.diasSinAccidente > 30 ? 'ok' : 'warning',
            trend: null,
        },
        {
            id: 'open',
            label: 'Incidentes abiertos',
            value: open.length,
            unit: '',
            precision: 0,
            status: open.length === 0 ? 'ok' : 'alert',
            trend: null,
        },
        {
            id: 'last30',
            label: 'Registrados · 30 días',
            value: last30.length,
            unit: '',
            precision: 0,
            status: last30.length <= 3 ? 'ok' : 'warning',
            trend: null,
        },
        {
            id: 'today',
            label: 'Incidentes hoy',
            value: kpis.incidentesHoy,
            unit: '',
            precision: 0,
            status: kpis.incidentesHoy === 0 ? 'ok' : 'alert',
            trend: null,
        },
    ];

    const byType: Bucket[] = useMemo(() => {
        const tally = new Map<string, number>();
        for (const incident of incidents) {
            tally.set(incident.type, (tally.get(incident.type) ?? 0) + 1);
        }
        return [...tally.entries()]
            .map(([type, value]) => ({
                label: TYPE_LABEL[type] ?? type.replace(/_/g, ' ').toLowerCase(),
                value,
            }))
            .sort((a, b) => b.value - a.value);
    }, [incidents]);

    const byRootCause: Bucket[] = useMemo(() => {
        const tally = new Map<string, number>();
        for (const incident of incidents) {
            const cause = incident.rootCause || 'Sin clasificar';
            tally.set(cause, (tally.get(cause) ?? 0) + 1);
        }
        return [...tally.entries()]
            .map(([cause, value]) => ({ label: cause, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [incidents]);

    const weekly: Bucket[] = useMemo(() => {
        return Array.from({ length: WEEKS }, (_, index) => {
            const end = now - index * WEEK_MS;
            const start = end - WEEK_MS;
            const count = incidents.filter((incident) => {
                const at = parseIncidentDate(incident.date);
                return at >= start && at < end;
            }).length;
            return {
                label: index === 0 ? 'Esta' : `-${index}`,
                title: `Semana ${index === 0 ? 'en curso' : `hace ${index}`}`,
                value: count,
            };
        }).reverse();
    }, [incidents, now]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="flex flex-col gap-2">
                    <h2 className="label-mono">Registro de incidentes</h2>

                    {incidents.length === 0 && (
                        <Panel>
                            <p className="text-sm text-steel">Sin incidentes registrados.</p>
                        </Panel>
                    )}

                    {incidents.map((incident) => (
                        <article key={incident.id} className="occ-panel p-3">
                            <header className="flex flex-wrap items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <StatusPill
                                        status={INCIDENT_SEVERITY[incident.severity]}
                                        blink={incident.status === 'ABIERTO'}
                                    >
                                        {SEVERITY_LABEL[incident.severity]}
                                    </StatusPill>
                                    <span className="font-mono text-xs text-steel">
                                        {incident.id}
                                    </span>
                                </span>
                                <StatusPill status={incident.status === 'ABIERTO' ? 'alert' : 'ok'}>
                                    {incident.status === 'ABIERTO' ? 'Abierto' : 'Cerrado'}
                                </StatusPill>
                            </header>

                            <p className="mt-2 text-sm text-ice">{incident.description}</p>

                            <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-steel sm:grid-cols-2">
                                <div className="flex gap-2">
                                    <dt>Fecha</dt>
                                    <dd className="tabular text-ice">{incident.date}</dd>
                                </div>
                                <div className="flex gap-2">
                                    <dt>Tren</dt>
                                    <dd className="font-mono text-ice">{incident.trainId}</dd>
                                </div>
                                <div className="flex gap-2">
                                    <dt>Causa raíz</dt>
                                    <dd className="text-ice">{incident.rootCause}</dd>
                                </div>
                                <div className="flex gap-2">
                                    <dt>Tipo</dt>
                                    <dd className="text-ice">
                                        {TYPE_LABEL[incident.type] ?? incident.type}
                                    </dd>
                                </div>
                            </dl>

                            {incident.correctiveAction && (
                                <p className="mt-2 border-t border-steel/10 pt-2 text-xs text-steel">
                                    Acción correctiva:{' '}
                                    <span className="text-ice">{incident.correctiveAction}</span>
                                </p>
                            )}
                        </article>
                    ))}
                </section>

                <div className="flex flex-col gap-4">
                    <Panel title="Incidentes por tipo">
                        <RankedBars data={byType} label="Incidentes registrados por tipo" />
                    </Panel>

                    <Panel title="Causas raíz más frecuentes">
                        <RankedBars
                            data={byRootCause}
                            label="Incidentes agrupados por causa raíz"
                        />
                    </Panel>

                    <Panel title={`Incidentes por semana — ${WEEKS} semanas`}>
                        <BarChart
                            data={weekly}
                            label={`Incidentes registrados en cada una de las últimas ${WEEKS} semanas`}
                            height={140}
                        />
                    </Panel>

                    <Panel title="Marco normativo">
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-xs text-steel">
                            <li>
                                <span className="text-ice">EN 50126</span> — RAMS ferroviario:
                                fiabilidad, disponibilidad, mantenibilidad y seguridad a lo largo
                                del ciclo de vida.
                            </li>
                            <li>
                                <span className="text-ice">SIL-2</span> — riesgo tolerable por
                                debajo de 10⁻⁷ por hora; aplica a servicios de pasajeros.
                            </li>
                            <li>
                                <span className="text-ice">SIL-1</span> — riesgo tolerable por
                                debajo de 10⁻⁶ por hora; aplica a servicios de carga.
                            </li>
                        </ul>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
