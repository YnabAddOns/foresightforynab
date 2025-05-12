import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'happy-dom',
        coverage: {
            exclude: ['vendor/**', 'node_modules/**', 'tests/**', '**.config.**', '**/js/app.ts', '**/js/ssr.ts', '**/js/types/**', '**/useAppearance.ts'],
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
})
