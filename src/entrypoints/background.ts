// this file is service worker

export default defineBackground(async () => {
	console.log('Hello background!', { id: browser.runtime.id });

	const width = 400;
	const height = 300;
	const screen = await browser.windows.getCurrent({ populate: false });
	const left = screen.width! / 2 - width / 2;
	const top = screen.height! / 2 - height / 2;

	// Listen for keyboard commands
	browser.commands.onCommand.addListener(async (command) => {
		if (command === 'open-popup') {
			await browser.windows.create({
				url: browser.runtime.getURL('/task-popup.html'),
				type: 'panel',
				width,
				height,
				focused: true,
				left,
				top,
			});
		}
	});
});
