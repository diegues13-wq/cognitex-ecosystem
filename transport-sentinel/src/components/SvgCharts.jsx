/**
 * Pure SVG chart library — zero external dependencies, zero JIT-heavy math.
 * All charts are responsive via SVG viewBox and CSS width:100%.
 */
import { useState, memo, useCallback } from 'react';

// ── Shared constants ──────────────────────────────────────────────────────────
const FONT = 'monospace';
const GRID_COLOR = '#0d2040';
const AXIS_COLOR = '#334155';
const TEXT_COLOR = '#475569';

// ── Helpers ───────────────────────────────────────────────────────────────────
function numFmt(n) {
    if (n == null || isNaN(n)) return '—';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

function catmullRom(pts) {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
}

// ── SvgAreaChart ─────────────────────────────────────────────────────────────
export const SvgAreaChart = memo(function SvgAreaChart({
    data = [], xKey = 'date', yKey = 'value',
    color = '#1d6fa5', label = '', height = 140,
    yMin: yMinProp, yMax: yMaxProp,
    formatY = numFmt, formatX = null,
    refLine = null, refLabel = '',
}) {
    const [tip, setTip] = useState(null);

    const W = 460, H = height;
    const PAD = { t: 14, r: 12, b: 28, l: 42 };
    const UW = W - PAD.l - PAD.r;
    const UH = H - PAD.t - PAD.b;

    const vals = data.map(d => +d[yKey]).filter(v => !isNaN(v));
    if (!vals.length) return <ChartEmpty height={height} />;

    const rawMin = yMinProp ?? Math.min(...vals);
    const rawMax = yMaxProp ?? Math.max(...vals);
    const vMin = rawMin === rawMax ? rawMin - 1 : rawMin;
    const vMax = rawMin === rawMax ? rawMax + 1 : rawMax;
    const range = vMax - vMin;

    const px = i => PAD.l + (i / Math.max(data.length - 1, 1)) * UW;
    const py = v => PAD.t + (1 - (v - vMin) / range) * UH;

    const pts = data.map((d, i) => ({ x: px(i), y: py(+d[yKey]) }));
    const linePath = catmullRom(pts);
    const areaPath = `${linePath} L${pts[pts.length - 1].x},${PAD.t + UH} L${pts[0].x},${PAD.t + UH} Z`;

    const gridYs = [0, 0.25, 0.5, 0.75, 1].map(f => ({ f, y: PAD.t + f * UH, v: vMax - f * range }));
    const refY = refLine != null ? py(refLine) : null;

    // X labels: show up to 6 evenly spaced
    const step = Math.max(1, Math.floor(data.length / 6));
    const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

    const uid = Math.random().toString(36).slice(2, 6);
    const gradId = `ag-${uid}`;

    return (
        <div style={{ position: 'relative' }}>
            {label && <div style={{ fontSize: 9, fontFamily: FONT, color: '#475569', marginBottom: 2 }}>{label}</div>}
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}
                onMouseLeave={() => setTip(null)}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
                    </linearGradient>
                </defs>

                {/* Grid */}
                {gridYs.map(({ f, y, v }) => (
                    <g key={f}>
                        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={GRID_COLOR} strokeWidth={0.5}/>
                        <text x={PAD.l - 5} y={y + 3} textAnchor="end" fontSize={7} fontFamily={FONT} fill={TEXT_COLOR}>{formatY(v)}</text>
                    </g>
                ))}

                {/* Reference line */}
                {refY != null && (
                    <>
                        <line x1={PAD.l} y1={refY} x2={W - PAD.r} y2={refY} stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 3"/>
                        <text x={W - PAD.r + 2} y={refY + 3} fontSize={7} fontFamily={FONT} fill="#f59e0b">{refLabel}</text>
                    </>
                )}

                {/* Area + line */}
                <path d={areaPath} fill={`url(#${gradId})`}/>
                <path d={linePath} stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round"/>

                {/* Dots */}
                {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.8}
                        onMouseEnter={e => setTip({ i, x: p.x, y: p.y, v: data[i][yKey], label: (formatX ?? (v => v[xKey]))(data[i]) })}
                        style={{ cursor: 'crosshair' }}
                    />
                ))}

                {/* X labels */}
                {xLabels.map((d, i) => {
                    const idx = data.indexOf(d);
                    const x = px(idx);
                    const lbl = (formatX ?? (v => v[xKey]))(d);
                    return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize={7} fontFamily={FONT} fill={TEXT_COLOR}>{typeof lbl === 'string' ? lbl.slice(-5) : lbl}</text>;
                })}

                {/* Hover tooltip */}
                {tip && (() => {
                    const tx = Math.min(tip.x + 6, W - 80);
                    const ty = Math.max(tip.y - 24, 4);
                    return (
                        <>
                            <line x1={tip.x} y1={PAD.t} x2={tip.x} y2={PAD.t + UH} stroke={color} strokeWidth={0.5} opacity={0.4}/>
                            <rect x={tx} y={ty} width={72} height={20} rx={3} fill="#081526" stroke="#1d6fa5" strokeWidth={0.6} opacity={0.96}/>
                            <text x={tx + 5} y={ty + 8}  fontSize={7} fontFamily={FONT} fill="#64748b">{tip.label}</text>
                            <text x={tx + 5} y={ty + 16} fontSize={8} fontFamily={FONT} fill="white" fontWeight="bold">{formatY(tip.v)}</text>
                        </>
                    );
                })()}
            </svg>
        </div>
    );
});

// ── SvgBarChart ───────────────────────────────────────────────────────────────
export const SvgBarChart = memo(function SvgBarChart({
    data = [], color = '#1d6fa5', height = 140, label = '',
    showValues = true, formatValue = numFmt,
}) {
    if (!data.length) return <ChartEmpty height={height} />;

    const W = 460, H = height;
    const PAD = { t: 10, r: 12, b: 32, l: 42 };
    const UW = W - PAD.l - PAD.r;
    const UH = H - PAD.t - PAD.b;
    const barGap = 0.2;

    const maxVal = Math.max(...data.map(d => +d.value || 0), 1);
    const barW = (UW / data.length) * (1 - barGap);
    const barStep = UW / data.length;

    const gridLines = 4;

    return (
        <div>
            {label && <div style={{ fontSize: 9, fontFamily: FONT, color: '#475569', marginBottom: 2 }}>{label}</div>}
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
                {/* Grid */}
                {Array.from({ length: gridLines + 1 }, (_, i) => {
                    const f = i / gridLines;
                    const y = PAD.t + f * UH;
                    const v = maxVal * (1 - f);
                    return (
                        <g key={i}>
                            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={GRID_COLOR} strokeWidth={0.5}/>
                            <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize={7} fontFamily={FONT} fill={TEXT_COLOR}>{formatValue(v)}</text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const barH = ((+d.value || 0) / maxVal) * UH;
                    const x = PAD.l + i * barStep + barStep * (barGap / 2);
                    const y = PAD.t + UH - barH;
                    const c = d.color ?? color;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={barW} height={barH} rx={2} fill={c} opacity={0.85}/>
                            {showValues && barH > 14 && (
                                <text x={x + barW / 2} y={y + 11} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="white" fontWeight="bold">{formatValue(d.value)}</text>
                            )}
                            <text x={x + barW / 2} y={H - PAD.b + 12} textAnchor="middle" fontSize={7} fontFamily={FONT} fill={TEXT_COLOR}>
                                {(d.label ?? '').slice(0, 8)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
});

// ── SvgHBar (horizontal bar) ─────────────────────────────────────────────────
export const SvgHBar = memo(function SvgHBar({
    data = [], height = null, label = '', formatValue = numFmt,
}) {
    if (!data.length) return <ChartEmpty height={height || 80} />;

    const rowH = 22;
    const H = height ?? data.length * rowH + 10;
    const W = 460;
    const PAD = { l: 130, r: 50 };
    const UW = W - PAD.l - PAD.r;
    const maxVal = Math.max(...data.map(d => +d.value || 0), 1);

    return (
        <div>
            {label && <div style={{ fontSize: 9, fontFamily: FONT, color: '#475569', marginBottom: 2 }}>{label}</div>}
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
                {data.map((d, i) => {
                    const barW = ((+d.value || 0) / maxVal) * UW;
                    const y = i * rowH + 4;
                    const c = d.color ?? '#1d6fa5';
                    return (
                        <g key={i}>
                            <text x={PAD.l - 6} y={y + 11} textAnchor="end" fontSize={8} fontFamily={FONT} fill="#94a3b8">{(d.label ?? '').slice(0, 18)}</text>
                            <rect x={PAD.l} y={y + 2} width={Math.max(barW, 2)} height={14} rx={3} fill={c} opacity={0.8}/>
                            <text x={PAD.l + barW + 5} y={y + 12} fontSize={8} fontFamily={FONT} fill="#94a3b8">{formatValue(d.value)}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
});

// ── SvgDonut ──────────────────────────────────────────────────────────────────
export const SvgDonut = memo(function SvgDonut({
    segments = [], size = 120, label = '', centerText = '',
}) {
    if (!segments.length) return <ChartEmpty height={size} />;

    const total = segments.reduce((s, g) => s + (+g.value || 0), 0) || 1;
    const R = size / 2 - 8;
    const r = R * 0.6;
    const CX = size / 2, CY = size / 2;
    const STROKE = R - r;

    let angle = -Math.PI / 2;
    const arcs = segments.map(seg => {
        const frac = (+seg.value || 0) / total;
        const sweep = frac * 2 * Math.PI;
        const x1 = CX + R * Math.cos(angle);
        const y1 = CY + R * Math.sin(angle);
        const x2 = CX + R * Math.cos(angle + sweep);
        const y2 = CY + R * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const path = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2}`;
        angle += sweep;
        return { ...seg, path, frac };
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {label && <div style={{ fontSize: 9, fontFamily: FONT, color: '#475569', marginBottom: 2 }}>{label}</div>}
            <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
                {/* Background circle */}
                <circle cx={CX} cy={CY} r={R} fill="none" stroke={GRID_COLOR} strokeWidth={STROKE}/>
                {/* Segments */}
                {arcs.map((arc, i) => (
                    <path key={i} d={arc.path} fill="none" stroke={arc.color ?? '#1d6fa5'} strokeWidth={STROKE}/>
                ))}
                {/* Center text */}
                {centerText && (
                    <>
                        <text x={CX} y={CY - 3} textAnchor="middle" fontSize={13} fontFamily={FONT} fill="white" fontWeight="bold">{centerText}</text>
                    </>
                )}
            </svg>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {arcs.map((arc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: arc.color ?? '#1d6fa5', flexShrink: 0 }}/>
                        <span style={{ fontSize: 9, fontFamily: FONT, color: '#64748b' }}>{arc.label} ({Math.round(arc.frac * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ── SvgSparkline (tiny inline) ────────────────────────────────────────────────
export const SvgSparkline = memo(function SvgSparkline({ values = [], color = '#1d6fa5', width = 80, height = 28 }) {
    if (values.length < 2) return null;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => ({
        x: 2 + (i / (values.length - 1)) * (width - 4),
        y: 2 + (1 - (v - min) / range) * (height - 4),
    }));
    const line = catmullRom(pts);
    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width, height }}>
            <path d={line} stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={0.8}/>
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2} fill={color}/>
        </svg>
    );
});

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, color = '#1d6fa5', label = '', showPct = true }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {label && <span style={{ fontSize: 10, fontFamily: FONT, color: '#64748b', minWidth: 80, flexShrink: 0 }}>{label}</span>}
            <div style={{ flex: 1, height: 6, background: '#0d2040', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }}/>
            </div>
            {showPct && <span style={{ fontSize: 10, fontFamily: FONT, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>{Math.round(pct)}%</span>}
        </div>
    );
}

// ── ChartEmpty ────────────────────────────────────────────────────────────────
function ChartEmpty({ height = 140 }) {
    return (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: FONT, color: '#334155' }}>Sin datos</span>
        </div>
    );
}
