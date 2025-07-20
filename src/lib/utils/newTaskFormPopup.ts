export const openTaskPopup = async () => {
	const width = 700;
	const height = 370;
	const screen = await browser.windows.getCurrent({ populate: false });
	const left = Math.round(screen.width! / 2 - width / 2);
	const top = Math.round(screen.height! / 2 - height / 2);

	await browser.windows.create({
		url: browser.runtime.getURL('/new-task-form-popup.html'),
		type: 'panel',
		width,
		height,
		focused: true,
		left,
		top,
	});
};
