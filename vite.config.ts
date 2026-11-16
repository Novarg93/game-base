import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
// Keep the small simulation/SSR suite bounded on development machines.
export default defineConfig({ plugins: [vue()], test: { include: ['tests/unit/**/*.test.ts'], maxWorkers: 2 }, build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } } });
