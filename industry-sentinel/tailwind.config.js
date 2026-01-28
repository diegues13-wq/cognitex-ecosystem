/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                industrial: {
                    950: '#020617',  // Deepest background
                    900: '#0f172a',  // Standard background
                    800: '#1e293b',  // Card background
                    700: '#334155',  // Borders/Separators
                },
                cognitex: {
                    DEFAULT: '#06b6d4', // Cyan 500 (Primary Brand Color)
                    glow: '#22d3ee',    // Cyan 400 (Glow effects)
                    dim: '#0e7490',     // Cyan 700 (Muted)
                },
                accent: '#3b82f6',   // Blue 500 (Secondary)
                primary: '#06b6d4',  // Mapping primary to Cognitex Cyan
                alert: '#ef4444',    // Red 500
            }
        },
    },
    plugins: [],
}
