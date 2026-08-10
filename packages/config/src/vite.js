import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The single Vite configuration every Sentinel app builds on.
 *
 * Before this, six apps carried a byte-identical 7-line vite.config.js and a
 * byte-identical postcss.config.js. Tailwind now runs through its own Vite
 * plugin rather than PostCSS, which is faster and removes postcss.config.js
 * from every app.
 *
 * @param {object} [options]
 * @param {number} [options.port]        dev server port
 * @param {string} [options.proxyTarget] backend to proxy /api to in dev
 * @param {import('vite').UserConfig} [options.extend] per-app overrides
 */
export function createViteConfig({ port = 5173, proxyTarget, extend = {} } = {}) {
    return defineConfig({
        plugins: [react(), tailwindcss()],

        server: {
            port,
            // Only transport-sentinel runs a local API today, but any app that
            // grows one gets the same wiring for free.
            ...(proxyTarget
                ? { proxy: { '/api': { target: proxyTarget, changeOrigin: true } } }
                : {}),
        },

        build: {
            // es2020 avoids the newer instruction sequences that triggered
            // SIGILL on pre-AVX2 hardware — see docs/ARCHITECTURE.md.
            target: 'es2020',
            chunkSizeWarningLimit: 600,
            rollupOptions: {
                output: {
                    // Split the heavy, rarely-changing vendors so an app
                    // deploy does not invalidate them.
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom'],
                        'vendor-icons': ['lucide-react'],
                    },
                },
            },
        },

        ...extend,
    });
}
