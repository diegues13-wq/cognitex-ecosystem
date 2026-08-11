import { Fuel, MapPin, Train, Zap } from 'lucide-react';

import type { TrainSnapshot } from '../domain/types';
import { TRACTION_LABEL, TRAIN_STATUS, TRAIN_STATUS_LABEL, delayStatus } from '../domain/status';
import { StatusPill } from './Panel';

export interface AssetCardProps {
    train: TrainSnapshot;
    selected: boolean;
    onSelect: (id: string) => void;
}

export function AssetCard({ train, selected, onSelect }: AssetCardProps) {
    const TractionIcon = train.traction === 'electrico' ? Zap : Fuel;

    return (
        <button
            type="button"
            onClick={() => onSelect(train.id)}
            aria-pressed={selected}
            className={`occ-panel occ-selectable w-full p-3 text-left ${selected ? 'occ-selected' : ''}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                    <Train
                        size={15}
                        aria-hidden="true"
                        style={{ color: 'var(--color-brand)' }}
                        className="shrink-0"
                    />
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ice">
                            {train.name}
                        </span>
                        <span className="block font-mono text-xs text-steel">{train.callsign}</span>
                    </span>
                </span>
                <StatusPill status={TRAIN_STATUS[train.status]}>
                    {TRAIN_STATUS_LABEL[train.status]}
                </StatusPill>
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-steel">
                <div className="flex items-center gap-1.5">
                    <TractionIcon size={11} aria-hidden="true" />
                    <dt className="sr-only">Tracción</dt>
                    <dd>{TRACTION_LABEL[train.traction]}</dd>
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                    <MapPin size={11} aria-hidden="true" className="shrink-0" />
                    <dt className="sr-only">Ruta</dt>
                    <dd className="truncate">{train.routeName || train.route}</dd>
                </div>
                <div>
                    <dt className="sr-only">Odómetro</dt>
                    <dd className="tabular">{train.odometer.toLocaleString('es-EC')} km</dd>
                </div>
                <div>
                    {train.occupancy !== null && (
                        <>
                            <dt className="sr-only">Ocupación</dt>
                            <dd className="tabular">{train.occupancy}% ocupación</dd>
                        </>
                    )}
                    {train.tonsLoaded !== null && (
                        <>
                            <dt className="sr-only">Carga</dt>
                            <dd className="tabular">
                                {train.tonsLoaded.toLocaleString('es-EC')} t
                            </dd>
                        </>
                    )}
                </div>
            </dl>

            {train.status === 'EN_SERVICIO' && train.delayMin > 0 && (
                <p className="mt-2">
                    <StatusPill status={delayStatus(train.delayMin)}>
                        +{train.delayMin} min de retraso
                    </StatusPill>
                </p>
            )}
        </button>
    );
}
