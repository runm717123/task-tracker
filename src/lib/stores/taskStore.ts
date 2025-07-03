import { storage } from '#imports';
import { mockTasks } from '../../mocks/tasks';

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
   * Get all tasks from storage
   */
  async getTasks(): Promise<ITrackedTask[]> {
    const tasks = await storage.getItem<ITrackedTask[]>(this.storageKey);
    return tasks || [];
  }

  /**
   * Save tasks to storage
   */
  async saveTasks(tasks: ITrackedTask[]): Promise<void> {
    await storage.setItem(this.storageKey, tasks);
  }

  /**
   * Add a new task
   */
  async addTask(task: ITrackedTask): Promise<void> {
    const tasks = await this.getTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
  }

  /**
   * Update an existing task
   */
  async updateTask(updatedTask: ITrackedTask): Promise<void> {
    const tasks = await this.getTasks();
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    await this.saveTasks(updatedTasks);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    await this.saveTasks(filteredTasks);
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
