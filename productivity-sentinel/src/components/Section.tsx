import type { ReactNode } from 'react';

/**
 * A titled panel.
 *
 * Every panel in the old app repeated the same fourteen utility classes plus
 * the blurred-glass utility that packages/README.md bans outright (it raised
 * SIGILL on pre-Haswell CPUs). The surface comes from the theme's `.panel`
 * class instead, and nothing here sets a colour.
 *
 * The banned utility is deliberately not named in full anywhere in this
 * codebase: Tailwind scans comments as well as markup, so writing it out —
 * even to say it is forbidden — emits the class into the stylesheet.
 */

export interface SectionProps {
    title: string;
    /** One line under the title saying what the numbers mean. */
    hint?: string;
    /** Top-right slot: the data-source badge, a filter, a status pill. */
    aside?: ReactNode;
    children: ReactNode;
}

export function Section({ title, hint, aside, children }: SectionProps) {
    return (
        <section className="panel">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-steel/15 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    <h2 className="font-display text-sm font-semibold text-ice">{title}</h2>
                    {hint && <p className="mt-0.5 text-xs text-steel">{hint}</p>}
                </div>
                {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
            </header>

            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}
