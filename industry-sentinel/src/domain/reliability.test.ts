import { describe, expect, it } from 'vitest';

import { downtimeEpisodes, reliability, worstEpisodes } from './reliability';
import { PRODUCTION_SHIFT } from './machines';
import { HOUR_MS } from './shift';
import { at, hourly } from './fixtures';

const RUNNING = { speed: 1800, oee: 90 };
const STOPPED = { speed: 0, oee: 0 };

describe('downtimeEpisodes', () => {
    it('closes a stop at the reading that resumed production, not the last stopped one', () => {
        // 08:00-17:00; stopped at 10:00 and 11:00, turning again at 12:00.
        const readings = hourly(at(2026, 4, 6, 8), 10, (index) =>
            index === 2 || index === 3 ? STOPPED : RUNNING
        );

        const [episode, ...rest] = downtimeEpisodes(readings, PRODUCTION_SHIFT);

        expect(rest).toHaveLength(0);
        expect(episode?.from).toBe(at(2026, 4, 6, 10));
        expect(episode?.to).toBe(at(2026, 4, 6, 12));
        // Two hours, not the one hour between the two stopped samples.
        expect(episode?.durationMs).toBe(2 * HOUR_MS);
        expect(episode?.resolved).toBe(true);
    });

    it('finds every stop, not just the first', () => {
        const readings = hourly(at(2026, 4, 6, 8), 8, (index) =>
            index === 1 || index === 5 ? STOPPED : RUNNING
        );

        expect(downtimeEpisodes(readings, PRODUCTION_SHIFT)).toHaveLength(2);
    });

    it('does not count a machine that is off outside the shift', () => {
        // 23:00 through 02:00, all outside 06:00-22:00.
        const readings = hourly(at(2026, 4, 5, 23), 4, () => STOPPED);

        expect(downtimeEpisodes(readings, PRODUCTION_SHIFT)).toHaveLength(0);
    });

    it('does not join two stops across the overnight break', () => {
        const readings = [
            ...hourly(at(2026, 4, 6, 20), 2, () => STOPPED), // 20:00, 21:00
            ...hourly(at(2026, 4, 6, 22), 3, () => STOPPED), // 22:00-00:00, off shift
            ...hourly(at(2026, 4, 7, 6), 2, () => STOPPED), // 06:00, 07:00 next day
        ];

        const episodes = downtimeEpisodes(readings, PRODUCTION_SHIFT);

        expect(episodes).toHaveLength(2);
        expect(episodes[0]?.from).toBe(at(2026, 4, 6, 20));
        expect(episodes[1]?.from).toBe(at(2026, 4, 7, 6));
    });

    it('marks a stop still open at the end of the window as unresolved', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, (index) => (index < 2 ? RUNNING : STOPPED));

        const [episode] = downtimeEpisodes(readings, PRODUCTION_SHIFT);

        expect(episode?.resolved).toBe(false);
        expect(episode?.durationMs).toBe(HOUR_MS);
    });

    it('sorts unordered readings before scanning them', () => {
        const ordered = hourly(at(2026, 4, 6, 8), 6, (index) => (index === 2 ? STOPPED : RUNNING));
        const shuffled = [ordered[4]!, ordered[0]!, ordered[3]!, ordered[2]!, ordered[5]!, ordered[1]!];

        expect(downtimeEpisodes(shuffled, PRODUCTION_SHIFT)).toEqual(
            downtimeEpisodes(ordered, PRODUCTION_SHIFT)
        );
    });
});

describe('reliability', () => {
    const options = { shift: PRODUCTION_SHIFT, sampleMs: HOUR_MS };

    it('derives MTBF from operating time and MTTR from repair time', () => {
        // Ten scheduled hours, eight running, one stop of two hours.
        const readings = hourly(at(2026, 4, 6, 8), 10, (index) =>
            index === 2 || index === 3 ? STOPPED : RUNNING
        );

        const result = reliability(readings, options);

        expect(result.episodes).toBe(1);
        expect(result.uptimeMs).toBe(8 * HOUR_MS);
        expect(result.downtimeMs).toBe(2 * HOUR_MS);
        expect(result.mtbfMs).toBe(8 * HOUR_MS);
        expect(result.mttrMs).toBe(2 * HOUR_MS);
        expect(result.availability).toBe(80);
    });

    it('has no MTBF when nothing failed, rather than an MTBF of zero', () => {
        const readings = hourly(at(2026, 4, 6, 8), 6, () => RUNNING);

        const result = reliability(readings, options);

        expect(result.episodes).toBe(0);
        expect(result.mtbfMs).toBeNull();
        expect(result.mttrMs).toBeNull();
        expect(result.availability).toBe(100);
    });

    it('reports a plant that never ran as zero available, not as missing', () => {
        const readings = hourly(at(2026, 4, 6, 8), 4, () => STOPPED);

        const result = reliability(readings, options);

        expect(result.availability).toBe(0);
        expect(result.uptimeMs).toBe(0);
        expect(result.mtbfMs).toBe(0);
    });

    it('returns nothing measurable when no reading falls inside the shift', () => {
        const readings = hourly(at(2026, 4, 6, 1), 3, () => RUNNING);

        const result = reliability(readings, options);

        expect(result.episodes).toBe(0);
        expect(result.availability).toBe(0);
        expect(result.mtbfMs).toBeNull();
    });
});

describe('worstEpisodes', () => {
    it('puts the longest stop first', () => {
        const readings = hourly(at(2026, 4, 6, 8), 12, (index) =>
            index === 1 || index === 5 || index === 6 || index === 7 ? STOPPED : RUNNING
        );

        const worst = worstEpisodes(downtimeEpisodes(readings, PRODUCTION_SHIFT));

        expect(worst[0]?.durationMs).toBe(3 * HOUR_MS);
        expect(worst[1]?.durationMs).toBe(HOUR_MS);
    });

    it('caps the list', () => {
        const readings = hourly(at(2026, 4, 6, 6), 16, (index) =>
            index % 2 === 0 ? STOPPED : RUNNING
        );

        expect(worstEpisodes(downtimeEpisodes(readings, PRODUCTION_SHIFT), 3)).toHaveLength(3);
    });
});
