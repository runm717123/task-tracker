import { describe, it, expect, beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { TaskStore } from "../taskStore";
import { mockTasks } from "../../../mocks/tasks";
import { settingsStore } from "../settingsStore";
import dayjs from "dayjs";

// Mock the settingsStore
vi.mock("../settingsStore", () => ({
  settingsStore: {
    getSettings: vi.fn().mockResolvedValue({
      startTime: "2025-07-07T08:00:00.000Z",
      autoFocusDescription: false,
      defaultToRecentDay: false,
      taskCreateDefaultValue: {
        title: "No title",
        description: "",
      },
    }),
    getDefaultSettings: vi.fn().mockReturnValue({
      startTime: "2025-07-07T08:00:00.000Z",
      autoFocusDescription: false,
      defaultToRecentDay: false,
      taskCreateDefaultValue: {
        title: "No title",
        description: "",
      },
    }),
  },
}));

// Don't mock dayjs - use the actual implementation

describe("TaskStore", () => {
  let taskStore: TaskStore;

  beforeEach(() => {
    fakeBrowser.reset();
    // @ts-ignore - Reset static instance for testing
    TaskStore.instance = undefined;
    taskStore = TaskStore.getInstance();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = TaskStore.getInstance();
      const instance2 = TaskStore.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("initializeStorage", () => {
    it("should initialize with mock data when no tasks exist", async () => {
      await taskStore.initializeStorage();
      const tasks = await taskStore.getTasks();
      expect(tasks).toEqual(mockTasks);
    });

    it("should not initialize when tasks already exist", async () => {
      const existingTask: ITrackedTask = {
        id: "existing-1",
        title: "Existing Task",
        description: "Already exists",
        status: "pending",
        createdAt: "2025-07-07T09:00:00.000Z",
        start: "2025-07-07T09:00:00.000Z",
        end: null,
      };

      await taskStore.saveTasks([existingTask]);
      await taskStore.initializeStorage();

      const tasks = await taskStore.getTasks();
      expect(tasks).toEqual([existingTask]);
    });
  });

  describe("getTasks and saveTasks", () => {
    it("should return empty array when no tasks exist", async () => {
      const tasks = await taskStore.getTasks();
      expect(tasks).toEqual([]);
    });

    it("should save and retrieve tasks", async () => {
      const testTask: ITrackedTask = {
        id: "test-1",
        title: "Test Task",
        description: "Test Description",
        status: "pending",
        createdAt: "2025-07-07T09:00:00.000Z",
        start: "2025-07-07T09:00:00.000Z",
        end: null,
      };

      await taskStore.saveTasks([testTask]);
      const tasks = await taskStore.getTasks();
      expect(tasks).toEqual([testTask]);
    });
  });

  describe("resetTasks", () => {
    it("should clear all tasks", async () => {
      const testTask: ITrackedTask = {
        id: "test-1",
        title: "Test Task",
        description: "Test Description",
        status: "pending",
        createdAt: "2025-07-07T09:00:00.000Z",
        start: "2025-07-07T09:00:00.000Z",
        end: null,
      };

      await taskStore.saveTasks([testTask]);
      await taskStore.resetTasks();

      const tasks = await taskStore.getTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe("addTask", () => {
    it("should add a new task with correct timing", async () => {
      const newTask: ICreateTask = {
        title: "New Task",
        description: "New Description",
        status: "pending",
      };

      await taskStore.addTask(newTask);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(1);

      const addedTask = tasks[0];
      expect(addedTask.title).toBe("New Task");
      expect(addedTask.description).toBe("New Description");
      expect(addedTask.status).toBe("pending");
      expect(addedTask.id).toBeDefined();
      expect(addedTask.createdAt).toBeDefined();
      expect(addedTask.start).toBeDefined();
      expect(addedTask.end).toBeDefined();
    });

    it("should use settings start time when no tasks exist for today", async () => {
      const newTask: ICreateTask = {
        title: "New Task",
        description: "New Description",
        status: "pending",
      };

      // Get settings start time to compare
      const settings = await settingsStore.getSettings();
      const expectedStartTime = dayjs(settings.startTime);

      await taskStore.addTask(newTask);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(1);

      const addedTask = tasks[0];
      // Should use settings start time since no previous tasks exist
      const startTime = dayjs(addedTask.start);
      const endTime = dayjs(addedTask.end);

      expect(startTime.isSame(dayjs(), "date")).toBe(true);
      expect(startTime.hour()).toBe(expectedStartTime.hour());
      expect(startTime.minute()).toBe(expectedStartTime.minute());
      expect(endTime.isSame(startTime, "day")).toBe(true);
      expect(endTime.isAfter(startTime)).toBe(true);
    });

    it("should use latest ended task from today as start time", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      const firstTaskEndTime = `${today}T09:30:00.000Z`;

      // Add first task
      await taskStore.addTask({
        title: "First Task",
        description: "First Description",
        status: "pending",
        start: `${today}T09:00:00.000Z`,
        end: firstTaskEndTime,
      });

      // Add second task without explicit start time
      await taskStore.addTask({
        title: "Second Task",
        description: "Second Description",
        status: "pending",
      });

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(2);

      const firstTask = tasks[0];
      const secondTask = tasks[1];
      // Should use the end time of the first task as start time
      expect(secondTask.start).toBe(firstTask.end);
      expect(secondTask.start).toBe(firstTaskEndTime);
    });

    it("should use provided start and end times", async () => {
      const start = "2025-07-07T09:00:00.000Z";
      const end = "2025-07-07T11:00:00.000Z";

      const newTask: ICreateTask = {
        title: "Task with Times",
        description: "Task Description",
        status: "pending",
        start,
        end,
      };

      await taskStore.addTask(newTask);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(1);

      const addedTask = tasks[0];
      expect(addedTask.start).toBe(start);
      expect(addedTask.end).toBe(end);
    });

    it("should auto-set end to 30 minutes after start when only start is provided", async () => {
      const start = "2025-07-07T09:00:00.000Z";

      const newTask: ICreateTask = {
        title: "Task with Start Time Only",
        description: "Task Description",
        status: "pending",
        start,
      };

      await taskStore.addTask(newTask);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(1);

      const addedTask = tasks[0];
      expect(addedTask.start).toBe(start);
      expect(addedTask.end).toBe("2025-07-07T09:30:00.000Z"); // 30 minutes later
    });

    it("should use latest ended task from the same day as task.end when start is not provided", async () => {
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

      // Add a task from yesterday
      await taskStore.addTask({
        title: "Yesterday Task",
        description: "Task from yesterday",
        status: "pending",
        start: `${yesterday}T14:00:00.000Z`,
        end: `${yesterday}T15:00:00.000Z`,
      });

      // Add a new task with only end time set to yesterday (no start time)
      await taskStore.addTask({
        title: "New Task",
        description: "New task ending yesterday",
        status: "pending",
        end: `${yesterday}T16:00:00.000Z`,
      });

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(2);

      const newTask = tasks[1];
      // Should use the end time of yesterday's task as start time (15:00)
      expect(newTask.start).toBe(`${yesterday}T15:00:00.000Z`);
      expect(newTask.end).toBe(`${yesterday}T16:00:00.000Z`);
    });
  });

  describe("updateTask", () => {
    it("should update existing task", async () => {
      const originalTask: ITrackedTask = {
        id: "test-1",
        title: "Original Task",
        description: "Original Description",
        status: "pending",
        createdAt: "2025-07-07T09:00:00.000Z",
        start: "2025-07-07T09:00:00.000Z",
        end: null,
      };

      await taskStore.saveTasks([originalTask]);

      const updatedTask: ITrackedTask = {
        ...originalTask,
        title: "Updated Task",
        description: "Updated Description",
        status: "done",
      };

      await taskStore.updateTask(updatedTask);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Updated Task");
      expect(tasks[0].description).toBe("Updated Description");
      expect(tasks[0].status).toBe("done");
    });

    it("should adjust adjacent tasks when updating task times", async () => {
      const today = dayjs().format("YYYY-MM-DD");

      const task1: ITrackedTask = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "done",
        createdAt: `${today}T09:00:00.000Z`,
        start: `${today}T09:00:00.000Z`,
        end: `${today}T10:00:00.000Z`,
      };

      const task2: ITrackedTask = {
        id: "task-2",
        title: "Task 2",
        description: "Second task",
        status: "done",
        createdAt: `${today}T10:00:00.000Z`,
        start: `${today}T10:00:00.000Z`,
        end: `${today}T11:00:00.000Z`,
      };

      const task3: ITrackedTask = {
        id: "task-3",
        title: "Task 3",
        description: "Third task",
        status: "pending",
        createdAt: `${today}T11:00:00.000Z`,
        start: `${today}T11:00:00.000Z`,
        end: `${today}T12:00:00.000Z`,
      };

      await taskStore.saveTasks([task1, task2, task3]);

      // Update task2's both start and end times
      const updatedTask2: ITrackedTask = {
        ...task2,
        start: `${today}T10:15:00.000Z`,
        end: `${today}T10:45:00.000Z`,
      };

      await taskStore.updateTask(updatedTask2);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(3);

      const updatedTask1 = tasks.find((t) => t.id === "task-1");
      const updatedTask2Result = tasks.find((t) => t.id === "task-2");
      const updatedTask3 = tasks.find((t) => t.id === "task-3");

      // Task 1's end time should match task 2's new start time
      expect(updatedTask1?.end).toBe(updatedTask2.start);
      // Task 2 should have new times
      expect(updatedTask2Result?.start).toBe(updatedTask2.start);
      expect(updatedTask2Result?.end).toBe(updatedTask2.end);
      // Task 3's start time should match task 2's new end time
      expect(updatedTask3?.start).toBe(updatedTask2.end);
    });

    it("should not adjust previous task when updating start time of first task", async () => {
      const today = dayjs().format("YYYY-MM-DD");

      const task1: ITrackedTask = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "done",
        createdAt: `${today}T09:00:00.000Z`,
        start: `${today}T09:00:00.000Z`,
        end: `${today}T10:00:00.000Z`,
      };

      const task2: ITrackedTask = {
        id: "task-2",
        title: "Task 2",
        description: "Second task",
        status: "pending",
        createdAt: `${today}T10:00:00.000Z`,
        start: `${today}T10:00:00.000Z`,
        end: `${today}T11:00:00.000Z`,
      };

      await taskStore.saveTasks([task1, task2]);

      // Update task1's start time (first task of the day)
      const updatedTask1: ITrackedTask = {
        ...task1,
        start: `${today}T08:30:00.000Z`,
      };

      await taskStore.updateTask(updatedTask1);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(2);

      const updatedTask1Result = tasks.find((t) => t.id === "task-1");
      const updatedTask2 = tasks.find((t) => t.id === "task-2");

      // Task 1's start time should be updated
      expect(updatedTask1Result?.start).toBe(updatedTask1.start);
      // Task 2 should remain unchanged
      expect(updatedTask2?.start).toBe(task2.start);
    });

    it("should not adjust next task when updating end time of last task", async () => {
      const today = dayjs().format("YYYY-MM-DD");

      const task1: ITrackedTask = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "done",
        createdAt: `${today}T09:00:00.000Z`,
        start: `${today}T09:00:00.000Z`,
        end: `${today}T10:00:00.000Z`,
      };

      const task2: ITrackedTask = {
        id: "task-2",
        title: "Task 2",
        description: "Second task",
        status: "pending",
        createdAt: `${today}T10:00:00.000Z`,
        start: `${today}T10:00:00.000Z`,
        end: `${today}T11:00:00.000Z`,
      };

      await taskStore.saveTasks([task1, task2]);

      // Update task2's end time (last task of the day)
      const updatedTask2: ITrackedTask = {
        ...task2,
        end: `${today}T11:30:00.000Z`,
      };

      await taskStore.updateTask(updatedTask2);

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(2);

      const updatedTask1 = tasks.find((t) => t.id === "task-1");
      const updatedTask2Result = tasks.find((t) => t.id === "task-2");

      // Task 1 should remain unchanged
      expect(updatedTask1?.end).toBe(task1.end);
      // Task 2's end time should be updated
      expect(updatedTask2Result?.end).toBe(updatedTask2.end);
    });

    it("should normalize an updated task when end time becomes earlier than start time", async () => {
      const today = dayjs().format("YYYY-MM-DD");

      const originalTask: ITrackedTask = {
        id: "task-1",
        title: "Task 1",
        description: "Single task",
        status: "done",
        createdAt: `${today}T09:00:00.000Z`,
        start: `${today}T09:00:00.000Z`,
        end: `${today}T10:00:00.000Z`,
      };

      await taskStore.saveTasks([originalTask]);

      await taskStore.updateTask({
        ...originalTask,
        end: `${today}T08:30:00.000Z`,
      });

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].start).toBe(originalTask.start);
      expect(tasks[0].end).toBe(`${today}T09:01:00.000Z`);
    });

    it("should normalize following tasks after an end-time update makes the next task invalid", async () => {
      const today = dayjs().format("YYYY-MM-DD");

      const task1: ITrackedTask = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "done",
        createdAt: `${today}T09:00:00.000Z`,
        start: `${today}T09:00:00.000Z`,
        end: `${today}T10:00:00.000Z`,
      };

      const task2: ITrackedTask = {
        id: "task-2",
        title: "Task 2",
        description: "Second task",
        status: "done",
        createdAt: `${today}T10:00:00.000Z`,
        start: `${today}T10:00:00.000Z`,
        end: `${today}T11:00:00.000Z`,
      };

      const task3: ITrackedTask = {
        id: "task-3",
        title: "Task 3",
        description: "Third task",
        status: "done",
        createdAt: `${today}T11:00:00.000Z`,
        start: `${today}T11:00:00.000Z`,
        end: `${today}T11:15:00.000Z`,
      };

      const task4: ITrackedTask = {
        id: "task-4",
        title: "Task 4",
        description: "Fourth task",
        status: "pending",
        createdAt: `${today}T11:15:00.000Z`,
        start: `${today}T11:15:00.000Z`,
        end: `${today}T11:20:00.000Z`,
      };

      await taskStore.saveTasks([task1, task2, task3, task4]);

      await taskStore.updateTask({
        ...task2,
        end: `${today}T11:30:00.000Z`,
      });

      const tasks = await taskStore.getTasks();
      const updatedTask2 = tasks.find((task) => task.id === "task-2");
      const updatedTask3 = tasks.find((task) => task.id === "task-3");
      const updatedTask4 = tasks.find((task) => task.id === "task-4");

      expect(updatedTask2?.end).toBe(`${today}T11:30:00.000Z`);
      expect(updatedTask3?.start).toBe(`${today}T11:30:00.000Z`);
      expect(updatedTask3?.end).toBe(`${today}T11:31:00.000Z`);
      expect(updatedTask4?.start).toBe(`${today}T11:31:00.000Z`);
      expect(updatedTask4?.end).toBe(`${today}T11:32:00.000Z`);
    });
  });

  describe("deleteTask", () => {
    it("should delete task from storage", async () => {
      const today = dayjs().format("YYYY-MM-DD");

      await taskStore.addTask({
        title: "Task 1",
        description: "Description 1",
        status: "pending",
        start: `${today}T09:00:00.000Z`,
        end: `${today}T09:30:00.000Z`,
      });

      await taskStore.addTask({
        title: "Task 2",
        description: "Description 2",
        status: "done",
        start: `${today}T09:30:00.000Z`,
        end: `${today}T10:00:00.000Z`,
      });

      const tasks = await taskStore.getTasks();
      expect(tasks).toHaveLength(2);

      // Delete the second task
      await taskStore.deleteTask(tasks[1].id);

      const remainingTasks = await taskStore.getTasks();
      expect(remainingTasks).toHaveLength(1);
      expect(remainingTasks[0].title).toBe("Task 1");
    });
  });

  describe("watchTasks", () => {
    it("should call callback when tasks change", async () => {
      const callback = vi.fn();
      const unwatch = taskStore.watchTasks(callback);

      const testTask: ITrackedTask = {
        id: "test-1",
        title: "Test Task",
        description: "Test Description",
        status: "pending",
        createdAt: "2025-07-07T09:00:00.000Z",
        start: "2025-07-07T09:00:00.000Z",
        end: null,
      };

      await taskStore.saveTasks([testTask]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith([testTask]);
      unwatch();
    });
  });

  describe("findMostRecentDateWithTasks", () => {
    it("should return null when no tasks exist in recent 30 days", async () => {
      // Create a task more than 30 days ago
      const oldTask: ITrackedTask = {
        id: "old-task",
        title: "Old Task",
        description: "Task from 35 days ago",
        status: "done",
        createdAt: dayjs().subtract(35, "days").toISOString(),
        start: dayjs().subtract(35, "days").set("hour", 9).toISOString(),
        end: dayjs().subtract(35, "days").set("hour", 10).toISOString(),
      };

      await taskStore.saveTasks([oldTask]);

      const result = await taskStore.findMostRecentDateWithTasks();
      expect(result).toBeNull();
    });

    it("should return the most recent date with tasks within 30 days", async () => {
      const today = dayjs();
      
      // Create tasks on different dates
      const task1: ITrackedTask = {
        id: "task-1",
        title: "Task 1",
        description: "Task from 10 days ago",
        status: "done",
        createdAt: today.subtract(10, "days").toISOString(),
        start: today.subtract(10, "days").set("hour", 9).toISOString(),
        end: today.subtract(10, "days").set("hour", 10).toISOString(),
      };

      const task2: ITrackedTask = {
        id: "task-2",
        title: "Task 2",
        description: "Task from 5 days ago",
        status: "done",
        createdAt: today.subtract(5, "days").toISOString(),
        start: today.subtract(5, "days").set("hour", 9).toISOString(),
        end: today.subtract(5, "days").set("hour", 10).toISOString(),
      };

      const task3: ITrackedTask = {
        id: "task-3",
        title: "Task 3",
        description: "Task from 3 days ago",
        status: "done",
        createdAt: today.subtract(3, "days").toISOString(),
        start: today.subtract(3, "days").set("hour", 9).toISOString(),
        end: today.subtract(3, "days").set("hour", 10).toISOString(),
      };

      await taskStore.saveTasks([task1, task2, task3]);

      const result = await taskStore.findMostRecentDateWithTasks();
      
      expect(result).not.toBeNull();
      
      // The most recent date should be 3 days ago
      const expectedDate = today.subtract(3, "days").startOf("day");
      const resultDate = dayjs(result).startOf("day");
      
      expect(resultDate.isSame(expectedDate, "day")).toBe(true);
    });
  });
});
