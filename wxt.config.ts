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
		name: 'NDEV: Task Tracker',
		description: 'A task tracker extension, designed for quick task tracking',
		version: '0.1.0-beta1',
		permissions: ['commands', 'sidePanel', 'storage'],
		commands: {
			'open-new-task-popup': {
				suggested_key: {
					default: 'Alt+Up',
					mac: 'Command+Up',
				},
				description: 'Open add new Task popup',
			},
			// _execute_action: {
			// 	suggested_key: {
			// 		default: 'Ctrl+Shift+X',
			// 		mac: 'Command+Shift+Y',
			// 	},
			// },
		},
	},
});
