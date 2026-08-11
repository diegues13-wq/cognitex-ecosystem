import { createViteConfig } from '@cognitex/config/vite';

/**
 * Nothing app-specific left. The port is the only thing this console does not
 * share with the other five; the React plugin, Tailwind v4, the es2020 build
 * target and the vendor chunk split all come from @cognitex/config.
 *
 * This replaces a byte-identical vite.config.js plus a postcss.config.js that
 * five other apps also carried, and a tailwind.config.js whose `cognitex`
 * accent disagreed with the colours the UI actually used.
 */
export default createViteConfig({ port: 5175 });
