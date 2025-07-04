// this file is service worker

import { openTaskPopup } from '../lib/utils/taskPopup';

export default defineBackground(async () => {
	console.log('Hello background!', { id: browser.runtime.id });

	// Listen for keyboard commands
	browser.commands.onCommand.addListener(async (command) => {
		if (command === 'open-popup') {
			await openTaskPopup();
		}
	});
});
