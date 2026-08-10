import { createViteConfig } from '@cognitex/config/vite';

/**
 * Nothing app-specific left. The port is the only thing this console does not
 * share with the other five; everything else — the React plugin, Tailwind v4,
 * the es2020 build target and the vendor chunk split — comes from
 * @cognitex/config.
 */
export default createViteConfig({ port: 5178 });
