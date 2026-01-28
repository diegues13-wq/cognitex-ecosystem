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
                    50: '#f4f6f8',
                    100: '#e1e5ea',
                    200: '#c3cbd4',
                    300: '#9ca9b9',
                    400: '#76879d',
                    500: '#586b85',
                    600: '#46566d',
                    700: '#394658',
                    800: '#2f3947',
                    900: '#28313b',
                    950: '#000000', // Deep black
                },
                neon: {
                    cyan: '#06b6d4',
                    green: '#10b981',
                    orange: '#f97316',
                    purple: '#a855f7',
                    blue: '#3b82f6'
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
            },
            backgroundImage: {
                'grid-pattern': "url('https://grainy-gradients.vercel.app/noise.svg')",
                'glow-radial': 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        },
    },
    plugins: [],
}
