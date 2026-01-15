/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'press-start': ['"Press Start 2P"', 'monospace'],
            },
            colors: {
                'cosmic-bg': '#000000',
                'cosmic-panel': '#000000',
                'cosmic-text': '#FFFFFF',
                'cosmic-muted': '#888888',
                'cosmic-accent': '#FFFFFF',
                'cosmic-accent-strong': '#FFFFFF',
                'cosmic-danger': '#FF0000',
                'cosmic-gold': '#FFD700',
                // Legacy support just in case
                'cosmic-blue': '#00FFCC',
                'cosmic-purple': '#FF00FF',
                'cosmic-red': '#FF4444',
            },
            backgroundImage: {
                'cosmic-gradient': 'none',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },
            animation: {
                float: 'float 3s ease-in-out infinite',
            }
        },
    },
    plugins: [],
}
