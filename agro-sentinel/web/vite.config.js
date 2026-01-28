import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'prop-types'],
                    'vendor-charts': ['recharts'],
                    'vendor-maps': ['leaflet', 'react-leaflet'],
                    'vendor-utils': ['date-fns', 'lucide-react']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
})
