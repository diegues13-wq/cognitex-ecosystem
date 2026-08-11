import { useMemo } from 'react';
import { TimeSeriesChart } from '@cognitex/ui';

import { comfortBand, downsample, toSeries } from '../domain';
import type { Channel, GreenhouseSample } from '../domain';

/**
 * One channel over time.
 *
 * `TimeSeriesChart` from `@cognitex/ui` draws it — plain SVG, no charting
 * dependency. This replaces a 70-line recharts `AreaChart` that carried an
 * `feGaussianBlur` filter behind every line: recharts was removed from
 * transport-sentinel to stop a SIGILL crash on pre-AVX2 hardware, and a
 * Gaussian convolution in SVG reaches the same code path.
 *
 * (Note the spelling above. Tailwind v4 scans comments as plain text, so
 * writing the four-letter name of that filter as a bare word — even inside a
 * comment explaining why not to use it — emits the corresponding utility
 * class into the stylesheet.)
 *
 * The acceptable band is the channel's WARNING limits, so the chart shows
 * where the number should be rather than only where it is. The old chart drew
 * two dashed `ReferenceLine`s for the same purpose and left them out of the
 * accessible name, so a screen-reader user got a line with no context at all.
 */

export interface ChannelChartProps {
    samples: readonly GreenhouseSample[];
    channel: Channel;
    height?: number;
    /** Points to draw. More than a few hundred is wasted ink on a 640-wide SVG. */
    maxPoints?: number;
}

export function ChannelChart({
    samples,
    channel,
    height = 200,
    maxPoints = 240,
}: ChannelChartProps) {
    const points = useMemo(
        () => downsample(toSeries(samples, channel.id), maxPoints),
        [samples, channel.id, maxPoints]
    );

    const band = comfortBand(channel.id);

    return (
        <TimeSeriesChart
            points={points}
            label={channel.label}
            unit={channel.unit}
            height={height}
            {...(band ? { band } : {})}
        />
    );
}
