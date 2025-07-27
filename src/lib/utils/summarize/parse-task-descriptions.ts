import { parseTaskDescription } from './preprocess/parse-task-description';

/**
 * @param tasks Array of parsed tasks
 * @returns Array of tasks with parsed description items
 */
export async function parseTaskDescriptions(tasks: IParsedTask[]): Promise<ITaskWithParsedDescription[]> {
	const tasksWithParsedDescriptions: ITaskWithParsedDescription[] = [];

	for (const task of tasks) {
		const descriptionItems = await parseTaskDescription(task.description);
		tasksWithParsedDescriptions.push({
			...task,
			descriptionItems,
		});
	}

	return tasksWithParsedDescriptions;
}

/**
 * top level desc parser
 * @param groupedTasks Map of group names to arrays of tasks
 * @returns Map of group names to arrays of parsed description items
 */
export async function parseGroupedTaskDescriptions(groupedTasks: Map<string, IParsedTask[]>): Promise<Map<string, string[]>> {
	const result = new Map<string, string[]>();

	for (const [groupName, tasks] of groupedTasks) {
		const allDescriptionItems: string[] = [];

		for (const task of tasks) {
			const descriptionItems = await parseTaskDescription(task.description);
			allDescriptionItems.push(...descriptionItems);
		}

		if (allDescriptionItems.length > 0) {
			result.set(groupName, allDescriptionItems);
		}
	}

	return result;
}
