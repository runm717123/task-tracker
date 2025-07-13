import { storage } from '#imports';
import { mockTasks } from '../../mocks/tasks';
import { settingsStore } from './settingsStore';
import dayjs from 'dayjs';

export class TaskStore {
	private static instance: TaskStore;
	private readonly storageKey = 'local:tasks';
	private readonly lastTimeEndedTaskKey = 'local:lastTimeEndedTask';

	static getInstance(): TaskStore {
		if (!TaskStore.instance) {
			TaskStore.instance = new TaskStore();
		}
		return TaskStore.instance;
	}

	/**
	 * Initialize storage with mock data if no tasks exist
	 */
	async initializeStorage(): Promise<void> {
		const existingTasks = await this.getTasks();
		if (existingTasks.length === 0) {
			await storage.setItem(this.storageKey, mockTasks);
			// Initialize lastTimeEndedTask with the latest end time from mock data
			const latestEndTime = mockTasks
				.filter((task) => task.end)
				.map((task) => task.end!)
				.sort((a, b) => dayjs(b).diff(dayjs(a)))[0];

			if (latestEndTime) {
				await this.saveLastTimeEndedTask(latestEndTime);
			}
		}
	}

	/**
	 * Get tasks from storage with optional time range filtering
	 */
	async getTasks(timeRange: 'all' | 'daily' | 'weekly' | 'monthly' = 'all', date: string | Date = new Date()): Promise<ITrackedTask[]> {
		const tasks = await storage.getItem<ITrackedTask[]>(this.storageKey);
		const allTasks = tasks || [];

		const referenceDate = dayjs(date);

		switch (timeRange) {
			case 'daily':
				const targetDay = referenceDate.startOf('day');
				return allTasks.filter((task) => {
					const taskDate = dayjs(task.createdAt).startOf('day');
					return taskDate.isSame(targetDay, 'day');
				});
			case 'weekly':
				const startOfWeek = referenceDate.startOf('week');
				const endOfWeek = referenceDate.endOf('week');
				return allTasks.filter((task) => {
					const taskDate = dayjs(task.createdAt);
					return taskDate.isBetween(startOfWeek, endOfWeek, null, '[]');
				});
			case 'monthly':
				const startOfMonth = referenceDate.startOf('month');
				const endOfMonth = referenceDate.endOf('month');
				return allTasks.filter((task) => {
					const taskDate = dayjs(task.createdAt);
					return taskDate.isBetween(startOfMonth, endOfMonth, null, '[]');
				});
			default:
				return allTasks;
		}
	}

	/**
	 * Reset tasks based on time range
	 */
	async resetTasks(timeRange: 'all' | 'daily' | 'weekly' | 'monthly' = 'all'): Promise<void> {
		const settings = await settingsStore.getSettings();

		if (timeRange === 'all') {
			await this.saveTasks([]);
			await this.saveLastTimeEndedTask(settings.startTime);
			return;
		}

		const tasks = await this.getTasks();
		const now = dayjs();

		let tasksToKeep: ITrackedTask[] = [];

		switch (timeRange) {
			case 'daily':
				const today = now.startOf('day');
				tasksToKeep = tasks.filter((task) => {
					const taskDate = dayjs(task.createdAt).startOf('day');
					return !taskDate.isSame(today, 'day');
				});
				break;
			case 'weekly':
				const startOfWeek = now.startOf('week');
				const endOfWeek = now.endOf('week');
				tasksToKeep = tasks.filter((task) => {
					const taskDate = dayjs(task.createdAt);
					return !taskDate.isBetween(startOfWeek, endOfWeek, null, '[]');
				});
				break;
			case 'monthly':
				const startOfMonth = now.startOf('month');
				const endOfMonth = now.endOf('month');
				tasksToKeep = tasks.filter((task) => {
					const taskDate = dayjs(task.createdAt);
					return !taskDate.isBetween(startOfMonth, endOfMonth, null, '[]');
				});
				break;
			default:
				await this.saveTasks([]);
				await this.saveLastTimeEndedTask(settings.startTime);
		}

		await this.saveTasks(tasksToKeep);

		// Adjust lastTimeEndedTask based on remaining tasks
		if (tasksToKeep.length > 0) {
			const todayTasks = tasksToKeep.filter((task) => dayjs(task.createdAt).isSame(now, 'day'));
			const latestTodayTask = todayTasks[todayTasks.length - 1];

			await this.saveLastTimeEndedTask(latestTodayTask.end!);
		} else {
			await this.saveLastTimeEndedTask(settings.startTime);
		}
	}

	/**
	 * Reset only today's tasks while keeping tasks from other days
	 * @deprecated Use resetTasks('daily') instead
	 */
	async resetTodayTasks(): Promise<void> {
		return this.resetTasks('daily');
	}

	/**
	 * Save tasks to storage
	 */
	async saveTasks(tasks: ITrackedTask[]): Promise<void> {
		await storage.setItem(this.storageKey, tasks);
	}

	/**
	 * Get the last time a task was ended
	 */
	async getLastTimeEndedTask(): Promise<string> {
		const lastTime = await storage.getItem<string>(this.lastTimeEndedTaskKey);

		if (lastTime) {
			return lastTime;
		}

		// Fallback to settings store's start time
		const settings = await settingsStore.getSettings();
		return settings.startTime;
	}

	/**
	 * Save the last time a task was ended
	 */
	async saveLastTimeEndedTask(endTime: string): Promise<void> {
		await storage.setItem(this.lastTimeEndedTaskKey, endTime);
	}

	/**
	 * Add a new task with proper timing logic
	 */
	async addTask(task: ICreateTask): Promise<void> {
		const tasks = await this.getTasks();
		let lastTimeEndedTask = await this.getLastTimeEndedTask();

		const currentTime = dayjs().toISOString();
		const today = dayjs().startOf('day');

		// Check if lastTimeEndedTask is from today, if not reset to settings start time
		if (!dayjs(lastTimeEndedTask).isSame(today, 'day')) {
			const settings = await settingsStore.getSettings();
			lastTimeEndedTask = settings.startTime;
		}

		// Create new task with proper timing
		const newTask: ITrackedTask = {
			...task,
			id: crypto.randomUUID(),
			start: lastTimeEndedTask, // Use lastTimeEndedTask as start time, or settings start time as fallback
			end: currentTime, // Set end time to current time
			createdAt: currentTime, // Set createdAt to current time
		};

		tasks.push(newTask);
		await this.saveTasks(tasks);

		// Update lastTimeEndedTask to current time
		await this.saveLastTimeEndedTask(currentTime);
	}

	/**
	 * Update an existing task
	 */
	async updateTask(updatedTask: ITrackedTask): Promise<void> {
		const tasks = await this.getTasks();
		const originalTask = tasks.find((task) => task.id === updatedTask.id);

		const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
		await this.saveTasks(updatedTasks);

		// If the task's end time was updated and it's the most recent end time, update lastTimeEndedTask
		if (originalTask?.end !== updatedTask.end && updatedTask.end) {
			const currentLastTimeEndedTask = await this.getLastTimeEndedTask();

			// Update lastTimeEndedTask if this is the most recent end time
			if (dayjs(updatedTask.end).isAfter(dayjs(currentLastTimeEndedTask))) {
				await this.saveLastTimeEndedTask(updatedTask.end);
			}
		}
	}

	/**
	 * Delete a task
	 */
	async deleteTask(taskId: string): Promise<void> {
		const tasks = await this.getTasks();
		const filteredTasks = tasks.filter((task) => task.id !== taskId);
		await this.saveTasks(filteredTasks);

		// Update lastTimeEndedTask to the previous item's end time
		if (filteredTasks.length > 0) {
			const lastTask = filteredTasks[filteredTasks.length - 1];
			if (lastTask.end) {
				await this.saveLastTimeEndedTask(lastTask.end);
			}
		} else {
			// If no tasks remain, fall back to settings start time
			const settings = await settingsStore.getSettings();
			await this.saveLastTimeEndedTask(settings.startTime);
		}
	}

	/**
	 * Import tasks from JSON data
	 */
	async importTasks(jsonData: ITrackedTask[]): Promise<{ success: boolean; message: string; imported: number }> {
		try {
			// Validate the JSON data structure
			if (!Array.isArray(jsonData)) {
				return { success: false, message: 'Invalid JSON format: Expected an array of tasks', imported: 0 };
			}

			// Validate each task has required fields
			const validTasks = jsonData.filter((task) => {
				return (
					task &&
					typeof task === 'object' &&
					typeof task.id === 'string' &&
					typeof task.title === 'string' &&
					typeof task.description === 'string' &&
					typeof task.status === 'string' &&
					typeof task.createdAt === 'string' &&
					typeof task.start === 'string' &&
					(task.end === null || typeof task.end === 'string')
				);
			});

			if (validTasks.length === 0) {
				return { success: false, message: 'No valid tasks found in the uploaded file', imported: 0 };
			}

			// Get existing tasks
			const existingTasks = await this.getTasks();
			const existingIds = new Set(existingTasks.map((task) => task.id));

			// Filter out tasks that already exist (by ID)
			const newTasks = validTasks.filter((task) => !existingIds.has(task.id));

			if (newTasks.length === 0) {
				return { success: false, message: 'All tasks in the file already exist', imported: 0 };
			}

			// Merge with existing tasks and sort by createdAt
			const allTasks = [...existingTasks, ...newTasks].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

			await this.saveTasks(allTasks);

			// Update lastTimeEndedTask if necessary
			const latestEndTime = allTasks
				.filter((task) => task.end)
				.map((task) => task.end!)
				.sort((a, b) => dayjs(b).diff(dayjs(a)))[0];

			if (latestEndTime) {
				const currentLastTime = await this.getLastTimeEndedTask();
				if (dayjs(latestEndTime).isAfter(dayjs(currentLastTime))) {
					await this.saveLastTimeEndedTask(latestEndTime);
				}
			}

			return {
				success: true,
				message: `Successfully imported ${newTasks.length} task${newTasks.length === 1 ? '' : 's'}`,
				imported: newTasks.length,
			};
		} catch (error) {
			return { success: false, message: 'Failed to parse JSON file', imported: 0 };
		}
	}

	/**
	 * Watch for changes in task storage
	 */
	watchTasks(callback: (tasks: ITrackedTask[]) => void): () => void {
		return storage.watch<ITrackedTask[]>(this.storageKey, (newTasks) => {
			callback(newTasks || []);
		});
	}
}

export const taskStore = TaskStore.getInstance();
