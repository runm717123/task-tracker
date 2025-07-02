import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/module-svelte'],
	vite: () => ({
		// Override config here, same as `defineConfig({ ... })`
		// inside vite.config.ts files
		plugins: [tailwindcss()],
	}),
	manifest: {
		permissions: ['storage'],
	},
});
