import { useEffect, useId, useState, type ReactNode } from 'react';
import type { Brand } from '@cognitex/theme';
import { brandVars } from '@cognitex/theme';

/**
 * The console layout every platform now shares.
 *
 * industry, personal and agro previously inlined a `<aside>` inside a
 * 440-680 line Dashboard and "navigated" by swapping a `selectedVariable`
 * string. Sections are real here, the sidebar is a component, and the mobile
 * drawer leaves the accessibility tree when closed instead of sitting in the
 * DOM with pointer-events toggled.
 */

export interface NavSection {
    id: string;
    label: string;
    /** Rendered by the app so it only bundles the icons it uses. */
    icon: ReactNode;
}

export interface AppShellProps {
    brand: Brand;
    sections: NavSection[];
    activeSection: string;
    onSectionChange: (id: string) => void;
    userLabel: string;
    onSignOut: () => void;
    /** Rendered on the right of the top bar — filters, time-range toggles. */
    toolbar?: ReactNode;
    /** Sits above the content, full width. Used for the alert ticker. */
    banner?: ReactNode;
    children: ReactNode;
}

export function AppShell({
    brand,
    sections,
    activeSection,
    onSectionChange,
    userLabel,
    onSignOut,
    toolbar,
    banner,
    children,
}: AppShellProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerId = useId();

    // Escape closes the drawer, and the body must not scroll behind it.
    useEffect(() => {
        if (!drawerOpen) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setDrawerOpen(false);
        };

        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [drawerOpen]);

    const nav = (
        <nav aria-label="Secciones" className="flex flex-col gap-1 p-3">
            {sections.map((section) => {
                const active = section.id === activeSection;
                return (
                    <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                            onSectionChange(section.id);
                            setDrawerOpen(false);
                        }}
                        aria-current={active ? 'page' : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
                            active ? 'text-navy-900' : 'text-steel hover:bg-navy-800 hover:text-ice'
                        }`}
                        style={active ? { backgroundColor: 'var(--color-brand)' } : undefined}
                    >
                        <span aria-hidden="true" className="shrink-0">
                            {section.icon}
                        </span>
                        {section.label}
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="flex min-h-dvh bg-navy-900" style={brandVars(brand)}>
            {/* Desktop rail */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-steel/15 bg-navy-deep lg:flex">
                <div className="border-b border-steel/15 p-4">
                    <p
                        className="font-display text-sm font-semibold"
                        style={{ color: 'var(--color-brand)' }}
                    >
                        {brand.name}
                    </p>
                    <p className="mt-1 text-xs text-steel">{brand.tagline}</p>
                </div>

                {nav}

                <div className="mt-auto border-t border-steel/15 p-3">
                    <p className="truncate px-3 text-xs text-steel" title={userLabel}>
                        {userLabel}
                    </p>
                    <button
                        type="button"
                        onClick={onSignOut}
                        className="mt-2 min-h-11 w-full rounded-lg px-3 text-left text-sm text-steel transition-colors hover:bg-navy-800 hover:text-ice"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Mobile drawer — unmounted when closed */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-navy-900/80"
                    />
                    <aside
                        id={drawerId}
                        className="relative flex h-full w-72 flex-col border-r border-steel/15 bg-navy-deep"
                    >
                        <div className="border-b border-steel/15 p-4">
                            <p
                                className="font-display text-sm font-semibold"
                                style={{ color: 'var(--color-brand)' }}
                            >
                                {brand.name}
                            </p>
                        </div>
                        {nav}
                        <div className="mt-auto border-t border-steel/15 p-3">
                            <button
                                type="button"
                                onClick={onSignOut}
                                className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-steel"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                {banner}

                <header className="flex min-h-16 items-center gap-3 border-b border-steel/15 bg-navy-deep px-4">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Abrir menú de secciones"
                        aria-expanded={drawerOpen}
                        aria-controls={drawerId}
                        className="flex size-11 items-center justify-center rounded-lg border border-steel/25 lg:hidden"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </button>

                    <h1 className="font-display text-base font-semibold">
                        {sections.find((section) => section.id === activeSection)?.label ??
                            brand.name}
                    </h1>

                    <div className="ml-auto flex items-center gap-2">{toolbar}</div>
                </header>

                <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
