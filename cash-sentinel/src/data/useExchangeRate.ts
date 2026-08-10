import { useEffect, useState } from 'react';

import { INITIAL_RATE, RATE_REFRESH_MS, fetchUsdRubRate, type RateResult } from './rates';

/**
 * Keeps the rate fresh, and keeps the *provenance* of the rate fresh with it.
 *
 * One rule beyond polling: a failed refresh does not throw away a rate we
 * genuinely fetched. Replacing a real 92.50 from two minutes ago with the
 * invented fallback would be a downgrade, and the timestamp already tells the
 * reader how old the real one is. Only a live answer replaces a live answer.
 */
export function useExchangeRate(): RateResult {
    const [result, setResult] = useState<RateResult>(INITIAL_RATE);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        const load = async () => {
            const next = await fetchUsdRubRate(controller.signal);
            if (cancelled) return;

            setResult((previous) =>
                next.source === 'live' || previous.source !== 'live' ? next : previous,
            );
        };

        void load();
        const timer = window.setInterval(() => void load(), RATE_REFRESH_MS);

        return () => {
            cancelled = true;
            controller.abort();
            window.clearInterval(timer);
        };
    }, []);

    return result;
}
