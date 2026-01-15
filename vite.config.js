import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
    root: './',      // Ensure root is current directory
    base: './',      // Relative paths for assets (good for simple deployments)
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        open: true,    // Auto-open browser
    },
    plugins: [
        tailwindcss(),
    ],
});
