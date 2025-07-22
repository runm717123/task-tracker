/**
 * Converts ITrackedTask array to ParsedTask array
 */
export function normalizeTasks(tasks: ITrackedTask[]): Pick<ITrackedTask, 'title' | 'description'>[] {
	return tasks.map((task) => {
		const title = task.title.trim() || 'General Task';

		return {
			title,
			description: task.description?.trim() || title,
		};
	});
}
