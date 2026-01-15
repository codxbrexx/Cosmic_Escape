/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'press-start': ['"Press Start 2P"', 'cursive'],
            },
            colors: {
                'cosmic-blue': '#00FFCC',
                'cosmic-purple': '#FF00FF',
                'cosmic-red': '#FF4444',
            }
        },
    },
    plugins: [],
}
