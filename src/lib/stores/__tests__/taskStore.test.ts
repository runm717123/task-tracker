import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { TaskStore } from '../taskStore';
import { mockTasks } from '../../../mocks/tasks';
import { settingsStore } from '../settingsStore';
import dayjs from 'dayjs';

// Mock the settingsStore
vi.mock('../settingsStore', () => ({
	settingsStore: {
		getSettings: vi.fn().mockResolvedValue({
			startTime: '2025-07-07T08:00:00.000Z',
			autoFocusDescription: false,
			taskCreateDefaultValue: {
				title: 'No title',
				description: '',
			},
		}),
	},
}));

// Mock dayjs
vi.mock('dayjs', () => ({
	default: vi.fn(() => ({
		toISOString: () => '2025-07-07T10:00:00.000Z',
		isAfter: vi.fn().mockReturnValue(false),
		diff: vi.fn().mockReturnValue(0),
	})),
}));

describe('TaskStore', () => {
	let taskStore: TaskStore;

	beforeEach(() => {
		fakeBrowser.reset();
		// @ts-ignore - Reset static instance for testing
		TaskStore.instance = undefined;
		taskStore = TaskStore.getInstance();
	});

	describe('getInstance', () => {
		it('should return singleton instance', () => {
			const instance1 = TaskStore.getInstance();
			const instance2 = TaskStore.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe('initializeStorage', () => {
		it('should initialize with mock data when no tasks exist', async () => {
			await taskStore.initializeStorage();
			const tasks = await taskStore.getTasks();
			expect(tasks).toEqual(mockTasks);
		});

		it('should not initialize when tasks already exist', async () => {
			const existingTask: ITrackedTask = {
				id: 'existing-1',
				title: 'Existing Task',
				description: 'Already exists',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: null,
			};

			await taskStore.saveTasks([existingTask]);
			await taskStore.initializeStorage();

			const tasks = await taskStore.getTasks();
			expect(tasks).toEqual([existingTask]);
		});
	});

	describe('getTasks and saveTasks', () => {
		it('should return empty array when no tasks exist', async () => {
			const tasks = await taskStore.getTasks();
			expect(tasks).toEqual([]);
		});

		it('should save and retrieve tasks', async () => {
			const testTask: ITrackedTask = {
				id: 'test-1',
				title: 'Test Task',
				description: 'Test Description',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: null,
			};

			await taskStore.saveTasks([testTask]);
			const tasks = await taskStore.getTasks();
			expect(tasks).toEqual([testTask]);
		});
	});

	describe('resetTasks', () => {
		it('should clear all tasks and reset lastTimeEndedTask', async () => {
			const testTask: ITrackedTask = {
				id: 'test-1',
				title: 'Test Task',
				description: 'Test Description',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: null,
			};

			await taskStore.saveTasks([testTask]);
			await taskStore.resetTasks();

			const tasks = await taskStore.getTasks();
			const lastTimeEndedTask = await taskStore.getLastTimeEndedTask();

			expect(tasks).toEqual([]);
			expect(lastTimeEndedTask).toBe('2025-07-07T08:00:00.000Z');
		});
	});

	describe('lastTimeEndedTask', () => {
		it('should return stored lastTimeEndedTask', async () => {
			const testTime = '2025-07-07T09:30:00.000Z';
			await taskStore.saveLastTimeEndedTask(testTime);

			const lastTime = await taskStore.getLastTimeEndedTask();
			expect(lastTime).toBe(testTime);
		});

		it('should fallback to settings start time when no lastTimeEndedTask exists', async () => {
			const lastTime = await taskStore.getLastTimeEndedTask();
			expect(lastTime).toBe('2025-07-07T08:00:00.000Z');
		});
	});

	describe('addTask', () => {
		it('should add a new task with correct timing', async () => {
			const newTask: ICreateTask = {
				title: 'New Task',
				description: 'New Description',
				status: 'pending',
			};

			await taskStore.addTask(newTask);

			const tasks = await taskStore.getTasks();
			expect(tasks).toHaveLength(1);

			const addedTask = tasks[0];
			expect(addedTask.title).toBe('New Task');
			expect(addedTask.description).toBe('New Description');
			expect(addedTask.status).toBe('pending');
			expect(addedTask.id).toBeDefined();
			expect(addedTask.createdAt).toBe('2025-07-07T10:00:00.000Z');
		});

		it('should update lastTimeEndedTask after adding task', async () => {
			const newTask: ICreateTask = {
				title: 'New Task',
				description: 'New Description',
				status: 'pending',
			};

			await taskStore.addTask(newTask);

			const lastTimeEndedTask = await taskStore.getLastTimeEndedTask();
			expect(lastTimeEndedTask).toBe('2025-07-07T10:00:00.000Z');
		});
	});

	describe('updateTask', () => {
		it('should update existing task', async () => {
			const originalTask: ITrackedTask = {
				id: 'test-1',
				title: 'Original Task',
				description: 'Original Description',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: null,
			};

			await taskStore.saveTasks([originalTask]);

			const updatedTask: ITrackedTask = {
				...originalTask,
				title: 'Updated Task',
				description: 'Updated Description',
				status: 'done',
			};

			await taskStore.updateTask(updatedTask);

			const tasks = await taskStore.getTasks();
			expect(tasks).toHaveLength(1);
			expect(tasks[0].title).toBe('Updated Task');
			expect(tasks[0].description).toBe('Updated Description');
			expect(tasks[0].status).toBe('done');
		});

		it('should update lastTimeEndedTask when task end time is more recent', async () => {
			const mockDayjs = dayjs as any;
			mockDayjs.mockReturnValue({
				toISOString: () => '2025-07-07T10:00:00.000Z',
				isAfter: vi.fn().mockReturnValue(true),
				diff: vi.fn().mockReturnValue(0),
			});

			const originalTask: ITrackedTask = {
				id: 'test-1',
				title: 'Original Task',
				description: 'Original Description',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: '2025-07-07T09:30:00.000Z',
			};

			await taskStore.saveTasks([originalTask]);

			const updatedTask: ITrackedTask = {
				...originalTask,
				end: '2025-07-07T10:30:00.000Z',
			};

			await taskStore.updateTask(updatedTask);

			const lastTimeEndedTask = await taskStore.getLastTimeEndedTask();
			expect(lastTimeEndedTask).toBe('2025-07-07T10:30:00.000Z');
		});
	});

	describe('deleteTask', () => {
		it('should delete task from storage', async () => {
			const testTasks: ITrackedTask[] = [
				{
					id: 'test-1',
					title: 'Task 1',
					description: 'Description 1',
					status: 'pending',
					createdAt: '2025-07-07T09:00:00.000Z',
					start: '2025-07-07T09:00:00.000Z',
					end: null,
				},
				{
					id: 'test-2',
					title: 'Task 2',
					description: 'Description 2',
					status: 'done',
					createdAt: '2025-07-07T09:30:00.000Z',
					start: '2025-07-07T09:30:00.000Z',
					end: '2025-07-07T10:00:00.000Z',
				},
			];

			await taskStore.saveTasks(testTasks);
			await taskStore.deleteTask('test-1');

			const tasks = await taskStore.getTasks();
			expect(tasks).toHaveLength(1);
			expect(tasks[0].id).toBe('test-2');
		});

		it('should fallback to settings start time when no tasks remain', async () => {
			const testTask: ITrackedTask = {
				id: 'test-1',
				title: 'Task 1',
				description: 'Description 1',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: '2025-07-07T09:30:00.000Z',
			};

			await taskStore.saveTasks([testTask]);
			await taskStore.deleteTask('test-1');

			const lastTimeEndedTask = await taskStore.getLastTimeEndedTask();
			expect(lastTimeEndedTask).toBe('2025-07-07T08:00:00.000Z');
		});
	});

	describe('watchTasks', () => {
		it('should call callback when tasks change', async () => {
			const callback = vi.fn();
			const unwatch = taskStore.watchTasks(callback);

			const testTask: ITrackedTask = {
				id: 'test-1',
				title: 'Test Task',
				description: 'Test Description',
				status: 'pending',
				createdAt: '2025-07-07T09:00:00.000Z',
				start: '2025-07-07T09:00:00.000Z',
				end: null,
			};

			await taskStore.saveTasks([testTask]);
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(callback).toHaveBeenCalledWith([testTask]);
			unwatch();
		});
	});
});
