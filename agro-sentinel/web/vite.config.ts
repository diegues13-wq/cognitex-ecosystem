import { createViteConfig } from '@cognitex/config/vite';

/**
 * Nothing app-specific left. The port is the only thing this console does not
 * share with the other five; the React plugin, Tailwind v4, the es2020 build
 * target and the vendor chunk split all come from @cognitex/config.
 *
 * The `postcss.config.js` and `tailwind.config.js` this replaces were
 * byte-identical to four other apps' copies, and the Tailwind config declared
 * `cognitex.DEFAULT = #06b6d4` — cyan — in a console whose UI was green.
 */
export default createViteConfig({ port: 5174 });
