import { createViteConfig } from '@cognitex/config/vite';

/**
 * Replaces a byte-identical copy of the same seven-line file that five other
 * apps also carried, plus the postcss.config.js and autoprefixer that only
 * this app still needed while it was on Tailwind v3.
 */
export default createViteConfig({ port: 5179 });
