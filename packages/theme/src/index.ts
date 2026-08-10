export { BRANDS, brandVars, type Brand, type PlatformId } from './brands';

/**
 * Status vocabulary shared by every platform.
 *
 * The audit found the same concept spelled three ways across apps — work
 * orders emitted `EN_CURSO` in one module and `EN_PROGRESO` in another, so the
 * status icon silently fell through to the wrong branch. Statuses are a
 * closed set now, and the type makes a typo a build error.
 */
export const STATUS = {
    ok: 'ok',
    warning: 'warning',
    alert: 'alert',
    offline: 'offline',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

/** Token name carrying each status colour. */
export const STATUS_COLOR: Record<Status, string> = {
    ok: 'var(--color-ok)',
    warning: 'var(--color-warn)',
    alert: 'var(--color-alert)',
    offline: 'var(--color-steel)',
};

/**
 * Severity ordering, so lists sort the same way everywhere and a filter for
 * "at least warning" means the same thing in every console.
 */
export const STATUS_RANK: Record<Status, number> = {
    alert: 3,
    warning: 2,
    ok: 1,
    offline: 0,
};
