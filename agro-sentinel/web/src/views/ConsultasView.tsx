import { DataSourceBadge } from '@cognitex/ui';
import type { DataSource } from '@cognitex/data';

import type { Alarm, GreenhouseSample } from '../domain';
import { Section } from '../components/Section';
import { QueryPanel } from '../components/QueryPanel';

/**
 * Questions about the loaded window.
 *
 * Named "Consultas", not "AI". The hint under the title is the honest version
 * of what the old chat window claimed: it searched the same readings that are
 * already on screen, and the BigQuery statements it displayed underneath each
 * answer were generated for show and never executed.
 */

export interface ConsultasViewProps {
    samples: readonly GreenhouseSample[];
    alarms: readonly Alarm[];
    source: DataSource;
    updatedAt: number | null;
}

export function ConsultasView({ samples, alarms, source, updatedAt }: ConsultasViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">
                    Consultas sobre las lecturas
                </h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            <Section
                title="Preguntar"
                hint={`Búsqueda por palabras clave sobre las ${samples.length} lecturas del periodo seleccionado. No interviene ningún modelo de lenguaje y no se envía nada a un servidor.`}
            >
                <QueryPanel samples={samples} alarms={alarms} />
            </Section>
        </div>
    );
}
