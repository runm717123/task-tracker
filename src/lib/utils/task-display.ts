import dayjs from "dayjs";

export function taskMinutes(task: Pick<ITrackedTask, "start" | "end">): number {
  if (!task.start || !task.end) return 0;
  const minutes = dayjs(task.end).diff(dayjs(task.start), "minute");
  return Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${remainder}m`;
}

export function totalDuration(tasks: ITrackedTask[]): string {
  return formatDuration(tasks.reduce((total, task) => total + taskMinutes(task), 0));
}
