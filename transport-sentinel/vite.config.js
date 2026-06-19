import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        // Target modern browsers — no legacy polyfills that inflate bundle
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor chunks so they cache independently
                    'vendor-react':    ['react', 'react-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth'],
                    'vendor-lucide':   ['lucide-react'],
                    // @google/generative-ai is dynamic-imported in AIView → auto-chunked by Rollup
                },
            },
        },
    },
})
