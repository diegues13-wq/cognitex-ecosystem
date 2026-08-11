import { useMemo } from 'react';
import { DataSourceBadge } from '@cognitex/ui';
import type { DataSource } from '@cognitex/data';

import { summariseScans } from '../domain';
import type { Farm, ThermalScan } from '../domain';
import { Section } from '../components/Section';
import { ThermalTable } from '../components/ThermalTable';

/**
 * Thermal scans.
 *
 * The banner at the top is the most important thing on this screen. The
 * function that produces these scans — `cloud/thermal.py` — constructs a
 * Gemini vision model and then never calls it: `process_thermal_image` writes
 * a hardcoded 42.5 °C maximum with `anomaly_detected: True` for every image,
 * and raises `thermal_alert` on the greenhouse document each time. A console
 * that rendered that as a measurement would be manufacturing evidence of a
 * heater fault that nobody has looked for.
 */

export interface TermicoViewProps {
    farm: Farm;
    scans: readonly ThermalScan[];
    source: DataSource;
    updatedAt: number | null;
}

export function TermicoView({ farm, scans, source, updatedAt }: TermicoViewProps) {
    const summary = useMemo(() => summariseScans(scans), [scans]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Análisis térmico · {farm.name}
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            {(summary.stubbed > 0 || summary.identicalReadings) && (
                <p
                    role="status"
                    className="panel p-4 text-sm"
                    style={{ color: 'var(--color-warn)' }}
                >
                    {summary.identicalReadings
                        ? 'Todas las capturas informan la misma temperatura máxima. '
                        : ''}
                    {summary.stubbed > 0
                        ? `${summary.stubbed} de ${summary.total} capturas no registran qué modelo las analizó. `
                        : ''}
                    La función de análisis térmico desplegada devuelve un valor fijo para cualquier
                    imagen; estos números no son una medición. Ver PIPELINE_STATUS.md.
                </p>
            )}

            <Section
                title="Capturas"
                hint="ΔT medida sobre la temperatura del aire en el mismo instante. Sin lectura de ambiente no hay ΔT, y la captura queda sin calificar."
            >
                <ThermalTable scans={scans} />
            </Section>

            {summary.worst && summary.worst.scan.description && (
                <Section title="Última observación registrada">
                    <p className="text-sm text-steel">{summary.worst.scan.description}</p>
                </Section>
            )}
        </div>
    );
}
