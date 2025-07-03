<script lang="ts">
	import { XIcon } from '@lucide/svelte';
	import { mockTasks } from '../../mocks/tasks';
	import '@bios-ui/core/css';
	import dayjs from 'dayjs';

	let tasks: ITrackedTask[] = mockTasks;

	const deleteTask = (taskId: string) => {
		tasks = tasks.filter((task) => task.id !== taskId);
	};

</script>

<main class="w-80 p-4 bg-bg-dark">
	<h1 class="text-xl font-bold mb-4 text-fg-dark">Task Tracker</h1>

	<div class="space-y-1 max-h-96 overflow-y-auto">
		{#each tasks as task (task.id)}
			<div class="border border-border rounded-md p-2 bg-bg-darker hover:bg-bg-light transition-colors">
				<div class="flex items-center justify-between">
					<div class="flex-1 min-w-0 mr-3">
						<h3 class="font-medium text-sm text-left text-fg-dark truncate">{task.title}</h3>
					</div>
					<div class="flex items-center gap-2 flex-shrink-0">
						<span class="text-xs text-fg-muted">
							{dayjs(task.createdAt).format('HH:mm')}
						</span>
						<XIcon 
							size={16} 
							class="text-fg-muted hover:text-fg-dark cursor-pointer" 
							onclick={() => deleteTask(task.id)} 
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if tasks.length === 0}
		<div class="text-center py-8 text-fg-dark">
			<p class="text-sm">No tasks found</p>
		</div>
	{/if}
</main>
