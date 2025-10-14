import { storage } from '#imports';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { mockTasks } from '../../mocks/tasks';
import { settingsStore } from './settingsStore';

dayjs.extend(isBetween);

export class TaskStore {
	private static instance: TaskStore;
	private readonly storageKey = 'local:tasks';

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
		}
	}

	/**
	 * Get tasks from storage with optional time range filtering
	 */
	async getTasks(timeRange: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom' = 'all', date: string | Date = new Date(), customStartDate?: string | Date, customEndDate?: string | Date): Promise<ITrackedTask[]> {
		const tasks = await storage.getItem<ITrackedTask[]>(this.storageKey);
		const allTasks = tasks || [];

		const referenceDate = dayjs(date);

		switch (timeRange) {
			case 'daily':
				const targetDay = referenceDate.startOf('day');
				return allTasks.filter((task) => {
					const taskDate = dayjs(task.start).startOf('day');
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
			case 'custom':
				if (customStartDate && customEndDate) {
					return allTasks.filter((task) => {
						const taskDate = dayjs(task.start);
						return taskDate.isBetween(customStartDate, customEndDate, 'date', '[]');
					});
				}
				return allTasks;
			default:
				return allTasks;
		}
	}

	/**
	 * Reset tasks based on time range
	 */
	async resetTasks(timeRange: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom' = 'all', customStartDate?: string | Date, customEndDate?: string | Date): Promise<void> {
		if (timeRange === 'all') {
			await this.saveTasks([]);
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
			case 'custom':
				if (customStartDate && customEndDate) {
					const startDate = dayjs(customStartDate).startOf('day');
					const endDate = dayjs(customEndDate).endOf('day');
					tasksToKeep = tasks.filter((task) => {
						const taskDate = dayjs(task.createdAt);
						return !taskDate.isBetween(startDate, endDate, null, '[]');
					});
				} else {
					// If no custom dates provided, don't delete anything
					tasksToKeep = tasks;
				}
				break;
			default:
				await this.saveTasks([]);
		}

		await this.saveTasks(tasksToKeep);
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
	 * Add a new task with proper timing logic
	 * @param task - Task data with optional startTime and endTime
	 * If startTime is provided but endTime is not, endTime will be set to startTime + 30 minutes
	 */
	async addTask(task: ICreateTask): Promise<void> {
		const currentTime = dayjs().toISOString();

		// Determine start and end times based on provided parameters
		let startTime: string;
		let endTime: string;

		if (task.start) {
			// Use provided start time
			startTime = dayjs(task.start).toISOString();

			if (task.end) {
				// Use provided end time
				endTime = dayjs(task.end).toISOString();
			} else {
				// Auto-set to 30 minutes after start time
				endTime = dayjs(task.start).add(30, 'minutes').toISOString();
			}
		} else {
			// Determine the date to search for latest ended task based on task.end
			const endDate = task.end ? new Date(task.end) : new Date();
			
			// Find the latest ended task from the same day as endDate
			const tasksFromEndDate = await this.getTasks('daily', endDate);
			const latestEndedTask = tasksFromEndDate
				.filter((task) => task.end)
				.sort((a, b) => dayjs(b.end!).diff(dayjs(a.end!)))[0];

			if (latestEndedTask && latestEndedTask.end) {
				// Use the latest task's end time as start time
				startTime = latestEndedTask.end;
			} else {
				// No tasks on that day, fall back to settings start time
				const settings = await settingsStore.getSettings();
				startTime = settings.startTime;
			}

			endTime = task.end ? dayjs(task.end).toISOString() : currentTime;
		}

		// Create new task with proper timing
		const newTask: ITrackedTask = {
			title: task.title,
			description: task.description,
			status: task.status || 'pending',
			id: crypto.randomUUID(),
			start: startTime,
			end: endTime,
			createdAt: currentTime,
		};

		const tasks = await this.getTasks();
		tasks.push(newTask);
		await this.saveTasks(tasks);
	}

	/**
	 * Update an existing task
	 */
	async updateTask(updatedTask: ITrackedTask): Promise<void> {
		const tasks = await this.getTasks();
		const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
		await this.saveTasks(updatedTasks);
	}

	/**
	 * Delete a task
	 */
	async deleteTask(taskId: string): Promise<void> {
		const tasks = await this.getTasks();
		const filteredTasks = tasks.filter((task) => task.id !== taskId);
		await this.saveTasks(filteredTasks);
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
	 * Get the latest start time for a given date
	 * Returns the latest end time from tasks on that date, or settings start time if no tasks exist
	 */
	async getLatestStartTime(dateString: string | Date): Promise<string> {
		const targetDate = dayjs(dateString);

		// Get tasks for the specified date
		const tasksForDate = await this.getTasks('daily', targetDate.toDate());

		if (tasksForDate.length > 0) {
			// Find the latest end time from completed tasks on the selected date
			const completedTasks = tasksForDate.filter((task) => task.end);
			if (completedTasks.length > 0) {
				const latestEndTime = completedTasks.map((task) => task.end!).sort((a, b) => dayjs(b).diff(dayjs(a)))[0];

				// Use the latest end time but with the target date
				const latestEndMoment = dayjs(latestEndTime);
				return targetDate.set('hour', latestEndMoment.hour()).set('minute', latestEndMoment.minute()).set('second', latestEndMoment.second()).toISOString();
			}
		}

		// No tasks or no completed tasks, fall back to settings start time
		const settings = await settingsStore.getSettings();
		const settingsStartMoment = dayjs(settings.startTime);
		return targetDate.set('hour', settingsStartMoment.hour()).set('minute', settingsStartMoment.minute()).set('second', settingsStartMoment.second()).toISOString();
	}

	/**
	 * Watch for changes in tasks storage
	 */
	watchTasks(callback: (tasks: ITrackedTask[]) => void): () => void {
		return storage.watch<ITrackedTask[]>(this.storageKey, (newTasks) => {
			callback(newTasks || []);
		});
	}
}

export const taskStore = TaskStore.getInstance();
