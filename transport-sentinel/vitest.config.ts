import { defineConfig } from 'vitest/config';

/**
 * Frontend tests only.
 *
 * `api/` is a separate npm package that runs its own suite on `node --test`,
 * the built-in runner, so the API image needs no test dependency at all.
 * Without this, Vitest collects `api/generators.test.js`, fails to find a
 * suite it recognises, and reports a red run for a file that passes.
 */
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
    },
});
