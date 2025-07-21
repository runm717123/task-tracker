import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json';


// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/module-svelte'],
	vite: () => ({
		plugins: [tailwindcss()],
	}),
	// seems there is a bug where the mode is "home"
	publicDir: import.meta.env.WXT_ENV === 'prod' ? 'public' : 'public-dev',
	manifest: {
		name: 'NDEV: Task Tracker',
		description: pkg.description,
		version: pkg.version.replace(/-.*$/, ''), // Remove pre-release suffix
		version_name: pkg.version,
		permissions: ['commands', 'sidePanel', 'storage'],
		web_accessible_resources: [
			{
				resources: ['models/universal-sentence-encoder/*'],
				matches: ['<all_urls>'],
			},
		],
		commands: {
			'open-new-task-popup': {
				suggested_key: {
					default: 'Alt+Up',
					mac: 'Command+Up',
				},
				description: 'Open add new Task popup',
			},
		},
	},
});
