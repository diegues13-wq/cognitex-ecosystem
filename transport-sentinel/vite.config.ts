import { createViteConfig } from '@cognitex/config/vite';

/**
 * This is the one console with a backend, so it is the one that uses the
 * shared config's dev proxy: `/api` goes to the Express server on :3001
 * (`npm run dev` inside `api/`), and in production the same Express process
 * serves both `/api/*` and the built SPA, so the path never changes.
 */
export default createViteConfig({
    port: 5177,
    proxyTarget: 'http://localhost:3001',
});
