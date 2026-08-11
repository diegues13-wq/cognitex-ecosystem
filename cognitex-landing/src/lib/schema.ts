import { SITE } from '~/config';

/** FAQPage — makes the six objections eligible for rich results (spec §4.3.8). */
export function faqSchema(items: readonly { readonly q: string; readonly a: string }[]) {
    return {
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
    };
}

/** Service — one per engine landing (spec §4.7). */
export function serviceSchema(options: {
    name: string;
    description: string;
    url: string;
    /** Omitted when the engine is quoted per project rather than listed. */
    price?: number;
}) {
    const schema: Record<string, unknown> = {
        '@type': 'Service',
        name: options.name,
        description: options.description,
        url: options.url,
        serviceType: options.name,
        provider: { '@id': `${SITE.url}/#organization` },
        areaServed: { '@type': 'Country', name: 'Ecuador' },
    };

    if (options.price !== undefined) {
        schema.offers = {
            '@type': 'Offer',
            price: options.price,
            priceCurrency: 'USD',
            url: options.url,
        };
    }

    return schema;
}

/** BreadcrumbList for any page below the root. */
export function breadcrumbSchema(trail: { name: string; url: string }[]) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((step, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: step.name,
            item: new URL(step.url, SITE.url).href,
        })),
    };
}
