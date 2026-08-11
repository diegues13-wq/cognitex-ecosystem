import { animate, inView, scroll, stagger } from 'motion';

/**
 * The site's animation vocabulary.
 *
 * Components declare intent with a `data-anim` attribute and this decides how
 * it moves, so the whole page shares one set of easings and durations. That
 * consistency is most of what makes motion read as expensive rather than
 * busy — a page where every section eases differently feels assembled from
 * parts.
 *
 *   data-anim="headline"  masked rise, for the one line that matters
 *   data-anim="rise"      the default entrance
 *   data-anim="stagger"   children enter in sequence
 *   data-anim="parallax"  scroll-linked drift, decoration only
 *
 * Everything here is skipped entirely under prefers-reduced-motion: the
 * content is already in the HTML, so opting out costs the visitor nothing.
 */

/** Slow out, no overshoot — confident rather than bouncy. */
const EASE = [0.16, 1, 0.3, 1] as const;

const SETTINGS = {
    headline: { duration: 1.1, delay: 0 },
    rise: { duration: 0.8, delay: 0 },
    stagger: { duration: 0.7, each: 0.08 },
} as const;

type Cleanup = () => void;

function revealHeadline(el: Element): Cleanup {
    // Clip from below rather than fading: the type arrives already sharp,
    // which reads as deliberate. A fade on large display text looks like a
    // slow image load.
    return inView(
        el,
        (entry) => {
            animate(
                entry,
                {
                    opacity: [0, 1],
                    clipPath: ['inset(110% 0% 0% 0%)', 'inset(-20% 0% 0% 0%)'],
                    transform: ['translateY(28px)', 'translateY(0px)'],
                },
                { duration: SETTINGS.headline.duration, ease: EASE }
            );
        },
        { amount: 0.25 }
    );
}

function revealRise(el: Element): Cleanup {
    const data = (el as HTMLElement).dataset;
    const delay = Number(data.animDelay ?? data.revealDelay ?? 0) / 1000;

    return inView(
        el,
        (entry) => {
            animate(
                entry,
                { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0px)'] },
                { duration: SETTINGS.rise.duration, delay, ease: EASE }
            );
        },
        { amount: 0.2 }
    );
}

function revealStagger(el: Element): Cleanup {
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return () => {};

    return inView(
        el,
        () => {
            animate(
                children,
                { opacity: [0, 1], transform: ['translateY(26px)', 'translateY(0px)'] },
                {
                    duration: SETTINGS.stagger.duration,
                    delay: stagger(SETTINGS.stagger.each),
                    ease: EASE,
                }
            );
        },
        { amount: 0.15 }
    );
}

function applyParallax(el: Element): Cleanup {
    // Small numbers on purpose. Parallax reads as depth up to roughly 60px of
    // travel; past that it reads as a bug.
    const distance = Number((el as HTMLElement).dataset.animDistance ?? 60);

    return scroll(
        animate(el, { transform: [`translateY(${-distance}px)`, `translateY(${distance}px)`] }),
        { target: el as HTMLElement, offset: ['start end', 'end start'] }
    );
}

/** Hides targets before their reveal so nothing flashes at full opacity. */
function prime(elements: HTMLElement[]) {
    for (const el of elements) {
        if (el.dataset.anim === 'parallax') continue;

        if (el.dataset.anim === 'stagger') {
            for (const child of Array.from(el.children) as HTMLElement[]) {
                child.style.opacity = '0';
            }
            continue;
        }

        el.style.opacity = '0';
    }
}

export function initMotion(): Cleanup {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    // `data-reveal` is the older attribute from the first build; it maps to
    // the default rise so existing sections keep working unchanged.
    const targets = Array.from(
        document.querySelectorAll<HTMLElement>('[data-anim], [data-reveal]')
    );

    if (reduced.matches || targets.length === 0) return () => {};

    prime(targets);

    const cleanups: Cleanup[] = [];

    for (const el of targets) {
        switch (el.dataset.anim) {
            case 'headline':
                cleanups.push(revealHeadline(el));
                break;
            case 'stagger':
                cleanups.push(revealStagger(el));
                break;
            case 'parallax':
                cleanups.push(applyParallax(el));
                break;
            default:
                cleanups.push(revealRise(el));
        }
    }

    return () => cleanups.forEach((stop) => stop());
}
