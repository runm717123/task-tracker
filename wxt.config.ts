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
		permissions: ['scripting', 'activeTab', 'tabs', 'commands', 'sidePanel', 'contextMenus', 'storage'],

		commands: {
			'open-popup': {
				suggested_key: {
					default: 'Ctrl+Shift+Y',
					mac: 'Command+Shift+X',
				},
				description: 'Open task tracker popup',
			},
			_execute_action: {
				suggested_key: {
					default: 'Ctrl+Shift+X',
					mac: 'Command+Shift+Y',
				},
			},
		},
	},
});
