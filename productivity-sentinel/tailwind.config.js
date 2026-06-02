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
                    950: '#020617',
                    900: '#0f172a',
                    800: '#1e293b',
                    700: '#334155',
                },
                cognitex: {
                    DEFAULT: '#7c3aed',
                    glow: '#8b5cf6',
                    dim: '#5b21b6',
                },
                accent: '#6d28d9',
                primary: '#7c3aed',
                alert: '#ef4444',
            }
        },
    },
    plugins: [],
}
