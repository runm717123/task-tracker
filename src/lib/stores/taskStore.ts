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
	 * Get all tasks from storage
	 */
	async getTasks(): Promise<ITrackedTask[]> {
		const tasks = await storage.getItem<ITrackedTask[]>(this.storageKey);
		return tasks || [];
	}

	/**
	 * Get today's tasks from storage
	 */
	async getTodayTasks(): Promise<ITrackedTask[]> {
		const tasks = await this.getTasks();
		const today = dayjs().startOf('day');

		return tasks.filter((task) => {
			const taskDate = dayjs(task.createdAt).startOf('day');
			return taskDate.isSame(today, 'day');
		});
	}

	async resetTasks(): Promise<void> {
		const defaultStartTime = await settingsStore.getSettings();
		await this.saveTasks([]);
		await this.saveLastTimeEndedTask(defaultStartTime.startTime);
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
	 * Watch for changes in task storage
	 */
	watchTasks(callback: (tasks: ITrackedTask[]) => void): () => void {
		return storage.watch<ITrackedTask[]>(this.storageKey, (newTasks) => {
			callback(newTasks || []);
		});
	}
}

export const taskStore = TaskStore.getInstance();
