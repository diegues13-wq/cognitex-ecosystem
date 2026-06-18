/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                occ: {
                    950: '#010b18',  // Deepest background — navy almost black
                    900: '#040d1a',  // Standard background
                    800: '#081526',  // Card background
                    700: '#0d2040',  // Borders / raised surfaces
                    600: '#163060',  // Hover states
                },
                rail: {
                    DEFAULT: '#1d6fa5', // Steel blue — primary brand
                    glow:    '#38a8e0', // Bright steel blue for glows
                    dim:     '#0d4a73', // Muted steel blue
                },
                amber: {
                    occ: '#f59e0b',     // Operational amber (warnings, status)
                },
                cognitex: {
                    DEFAULT: '#1d6fa5',
                    glow:    '#38a8e0',
                    dim:     '#0d4a73',
                },
                primary: '#1d6fa5',
                alert:   '#ef4444',
                accent:  '#7c3aed',  // Violet (secondary brand)
            },
            animation: {
                'ticker': 'ticker 30s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'blink': 'blink 1s step-end infinite',
            },
            keyframes: {
                ticker: {
                    '0%':   { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                blink: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0 },
                },
            },
        },
    },
    plugins: [],
}
