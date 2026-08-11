import type { ThermalScan } from './types';

/**
 * Reading a thermal scan.
 *
 * Severity is graded on ΔT over the ambient air temperature, the convention
 * used in infrared survey practice (NETA MTS Table 100.18, "temperature
 * difference over ambient air temperature"): up to 10 °C is a possible
 * deficiency worth watching, 11-20 °C is probably a fault, and above 20 °C
 * the equipment needs attention now. The bands are borrowed from electrical
 * thermography rather than derived for glasshouses, and this comment is here
 * so nobody later mistakes them for an agronomic result.
 *
 * ΔT needs an ambient reading. Where there is none — no climate sample within
 * the scan's window — the grade is `unknown`, not `normal`. `cloud/thermal.py`
 * never records ambient at all.
 */

export type ThermalGrade = 'unknown' | 'normal' | 'watch' | 'probable' | 'act';

export interface ThermalFinding {
    scan: ThermalScan;
    /** °C above the air temperature at that moment. Null without an ambient. */
    delta: number | null;
    grade: ThermalGrade;
    /** One line, already translated. */
    verdict: string;
}

export function gradeDelta(delta: number | null): ThermalGrade {
    if (delta === null || !Number.isFinite(delta)) return 'unknown';
    if (delta <= 10) return delta <= 3 ? 'normal' : 'watch';
    return delta <= 20 ? 'probable' : 'act';
}

const VERDICT: Record<ThermalGrade, string> = {
    unknown: 'Sin temperatura ambiente para comparar',
    normal: 'Dentro del rango esperado',
    watch: 'Diferencia leve: vigilar en la siguiente ronda',
    probable: 'Diferencia significativa: revisar el equipo',
    act: 'Diferencia severa: intervención inmediata',
};

export function interpretScan(scan: ThermalScan): ThermalFinding {
    const delta =
        scan.ambientTemperature === null || !Number.isFinite(scan.ambientTemperature)
            ? null
            : scan.maxTemperature - scan.ambientTemperature;

    const grade = gradeDelta(delta);

    return { scan, delta, grade, verdict: VERDICT[grade] };
}

export interface ThermalSummary {
    total: number;
    /** Scans whose numbers came from the stub rather than from a model. */
    stubbed: number;
    worst: ThermalFinding | null;
    /**
     * True when every scan reports the identical maximum temperature.
     *
     * That is the signature of `cloud/thermal.py:79`, which returns a literal
     * 42.5 °C for every image it is ever given. Surfacing it is the point:
     * a console that renders the same number as a measurement, image after
     * image, is lying by omission.
     */
    identicalReadings: boolean;
}

const GRADE_RANK: Record<ThermalGrade, number> = {
    act: 4,
    probable: 3,
    watch: 2,
    normal: 1,
    unknown: 0,
};

export function summariseScans(scans: readonly ThermalScan[]): ThermalSummary {
    const findings = scans.map(interpretScan);
    const temperatures = new Set(scans.map((scan) => scan.maxTemperature));

    return {
        total: scans.length,
        stubbed: scans.filter((scan) => scan.stub).length,
        worst:
            findings.reduce<ThermalFinding | null>(
                (best, finding) =>
                    best === null || GRADE_RANK[finding.grade] > GRADE_RANK[best.grade]
                        ? finding
                        : best,
                null
            ) ?? null,
        identicalReadings: scans.length > 1 && temperatures.size === 1,
    };
}
