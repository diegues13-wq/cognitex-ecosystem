import { useMemo } from 'react';
import { DataSourceBadge } from '@cognitex/ui';
import type { DataSource } from '@cognitex/data';

import type { AdjustmentStatus, DraftEntry, FailureEntry } from '../domain';
import { AdjustVerification } from '../components/AdjustVerification';
import { DailyEntryForm } from '../components/DailyEntryForm';
import { EntryTable } from '../components/EntryTable';

/**
 * Where the loop is actually run: log a failure, verify yesterday's ajuste.
 *
 * The verification banner appears only for a commitment whose verification has
 * come due — one written before today and still `pendiente`. The old panel
 * showed it for whatever entry sorted first, including one written five
 * minutes earlier, and asked "¿Lo implementaste ayer?" about it.
 */

export interface RegistroViewProps {
    entries: readonly FailureEntry[];
    orgId: string;
    source: DataSource;
    updatedAt: number | null;
    now: number;
    onCreate: (draft: DraftEntry) => Promise<void>;
    onVerify: (entry: FailureEntry, status: AdjustmentStatus) => Promise<void>;
}

export function RegistroView({
    entries,
    orgId,
    source,
    updatedAt,
    now,
    onCreate,
    onVerify,
}: RegistroViewProps) {
    const pending = useMemo(() => {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        return (
            [...entries]
                .filter(
                    (entry) => entry.adjustmentStatus === 'pendiente' && entry.at < today.getTime()
                )
                .sort((a, b) => b.at - a.at)
                .at(0) ?? null
        );
    }, [entries, now]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-sm font-semibold text-ice">Registro diario</h2>
                <DataSourceBadge source={source} updatedAt={updatedAt} />
            </div>

            {pending && <AdjustVerification entry={pending} onVerify={onVerify} />}

            <DailyEntryForm orgId={orgId} now={now} onSubmit={onCreate} />

            <EntryTable entries={entries} max={25} />
        </div>
    );
}
