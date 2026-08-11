import { createViteConfig } from '@cognitex/config/vite';

/**
 * Nothing app-specific left. The port is the only thing this console does not
 * share with the other five; the React plugin, Tailwind v4, the es2020 build
 * target and the vendor chunk split all come from @cognitex/config.
 *
 * The tailwind.config.js this replaces shipped industry-sentinel's cyan while
 * the UI was orange, so `selection:bg-cognitex` rendered cyan in an orange app.
 */
export default createViteConfig({ port: 5176 });
