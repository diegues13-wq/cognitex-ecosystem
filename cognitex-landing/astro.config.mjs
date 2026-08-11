// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://www.cognitexindustrial.com';

export default defineConfig({
    site: SITE,

    // Spanish at the root, English under /en. prefixDefaultLocale:false keeps
    // the canonical Spanish URLs clean (/energia, not /es/energia).
    i18n: {
        defaultLocale: 'es',
        locales: ['es', 'en'],
        routing: { prefixDefaultLocale: false },
    },

    // No UI framework is registered on purpose. Every interactive piece built
    // so far (nav, count-ups, calculators, accordion) is a few lines of
    // vanilla TS that Astro inlines. Pulling in React would add ~187KB of
    // runtime to power four number inputs, and spec §4.8 caps initial JS at
    // 150KB. Re-add @astrojs/react when the chat island lands with the backend.
    integrations: [
        mdx(),
        sitemap({
            i18n: {
                defaultLocale: 'es',
                locales: { es: 'es-EC', en: 'en' },
            },
        }),
    ],

    vite: {
        plugins: [tailwindcss()],
    },

    build: {
        // One stylesheet instead of per-page <style> blocks — fewer round trips
        // on a site this small.
        inlineStylesheets: 'auto',
    },

    image: {
        // Astro generates AVIF/WebP with srcset at build time.
        responsiveStyles: true,
    },
});
