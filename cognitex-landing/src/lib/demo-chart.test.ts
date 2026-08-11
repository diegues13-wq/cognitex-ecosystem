import { describe, expect, it } from 'vitest';
import { seriesToPaths } from './demo-chart';

const W = 600;
const H = 180;

const numbersIn = (path: string) => path.match(/-?\d+(\.\d+)?/g)!.map(Number);

describe('seriesToPaths', () => {
    const series = [
        { at: 1, kw: 2 },
        { at: 2, kw: 6 },
        { at: 3, kw: 4 },
    ];

    it('spans the full width from first point to last', () => {
        const { line } = seriesToPaths(series, W, H);

        expect(line.startsWith('M0.0 ')).toBe(true);
        expect(line).toContain(`L${W.toFixed(1)} `);
    });

    it('puts the highest reading above the lowest on screen', () => {
        const { line } = seriesToPaths(series, W, H);
        const ys = line.split(/[ML]/).filter(Boolean).map((seg) => Number(seg.trim().split(' ')[1]));

        // SVG y grows downward, so the peak (kw 6) must have the smallest y.
        expect(ys[1]).toBeLessThan(ys[0]);
        expect(ys[1]).toBeLessThan(ys[2]);
    });

    it('keeps every point inside the box, padded off both edges', () => {
        const { line } = seriesToPaths(series, W, H);
        const coords = numbersIn(line);
        const ys = coords.filter((_, i) => i % 2 === 1);

        for (const y of ys) {
            expect(y).toBeGreaterThanOrEqual(8);
            expect(y).toBeLessThanOrEqual(H - 8);
        }
    });

    it('closes the area path back along the baseline', () => {
        const { area } = seriesToPaths(series, W, H);

        expect(area.endsWith(`L${W} ${H} L0 ${H} Z`)).toBe(true);
    });

    it('renders a flat series as a straight line instead of NaN', () => {
        const flat = [
            { at: 1, kw: 5 },
            { at: 2, kw: 5 },
        ];
        const { line } = seriesToPaths(flat, W, H);

        expect(line).not.toContain('NaN');
        const ys = numbersIn(line).filter((_, i) => i % 2 === 1);
        expect(new Set(ys).size).toBe(1);
    });

    it('handles a single point without dividing by zero', () => {
        const { line } = seriesToPaths([{ at: 1, kw: 3 }], W, H);

        expect(line).not.toContain('NaN');
        expect(line.startsWith('M0.0')).toBe(true);
    });

    it('returns empty paths for an empty series rather than throwing', () => {
        expect(seriesToPaths([], W, H)).toEqual({ line: '', area: '' });
    });
});
