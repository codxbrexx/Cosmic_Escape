import { defineConfig } from 'vite';

export default defineConfig({
    root: './',
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
                    gsap: ['gsap'],
                },
            },
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
