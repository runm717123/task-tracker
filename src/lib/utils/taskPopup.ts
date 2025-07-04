export const openTaskPopup = async () => {
	const width = 700;
	const height = 350;
	const screen = await browser.windows.getCurrent({ populate: false });
	const left = screen.width! / 2 - width / 2;
	const top = screen.height! / 2 - height / 2;

	await browser.windows.create({
		url: browser.runtime.getURL('/task-popup.html'),
		type: 'panel',
		width,
		height,
		focused: true,
		left,
		top,
	});
};
