/**
 * Converts ITrackedTask array to ParsedTask array
 */
export function normalizeTasks(tasks: ITrackedTask[]): Pick<ITrackedTask, 'title' | 'description'>[] {
	return tasks.map((task) => {
		const title = normalizeSentence(task.title) || 'General Task';

		return {
			title,
			description: normalizeSentence(task.description || title),
		};
	});
}

export function normalizeSentence(sentence: string): string {
	// any text in the key replaced by the value
	const map = {
		' pr ': ' pull request ',
		'self-explore': 'self explore',
	};
	Object.entries(map).forEach(([key, value]) => {
		sentence = sentence.replace(new RegExp(key, 'gi'), value);
	});

	return sentence.trim();
}
