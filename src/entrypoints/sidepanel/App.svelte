<script lang="ts">
	import '@bios-ui/core/css';
	import { Button } from '@bios-ui/svelte';
	import { ClockAlert, Download, Plus, Trash2, XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { onDestroy, onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import pkg from '../../../package.json';
	import { taskStore } from '../../lib/stores/taskStore';
	import { openTaskPopup } from '../../lib/utils/taskPopup';

	dayjs.extend(relativeTime);

	let tasks: ITrackedTask[] = $state([]);
	let copiedItems: Set<string> = new SvelteSet();

	let unwatch: () => void;

	onMount(() => {
		const initializeStorage = async () => {
			// Initialize storage with mock data if needed
			// await taskStore.initializeStorage();

			// Load initial tasks
			tasks = await taskStore.getTasks();

			// Watch for changes in storage
			unwatch = taskStore.watchTasks((newTasks) => {
				tasks = newTasks;
			});
		};

		initializeStorage();
	});

	onDestroy(() => {
		if (unwatch) unwatch();
	});

	const deleteTask = async (taskId: string) => {
		await taskStore.deleteTask(taskId);
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'in-progress':
				return 'In Progress';
			case 'done':
				return 'Done';
			case 'pending':
				return 'Pending';
			default:
				return status;
		}
	};

	const getTimeRange = (start: string | null, end: string | null) => {
		if (!start || !end) return null;

		const startDate = dayjs(start);
		const endDate = dayjs(end);

		// Make sure end time is after start time
		if (endDate.isBefore(startDate)) return null;

		return `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`;
	};

	const getRelativeTime = (dateString: string) => {
		return dayjs(dateString).fromNow();
	};

	const downloadTasks = () => {
		const dataStr = JSON.stringify(tasks, null, 2);
		const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

		const exportFileDefaultName = `tracked-tasks-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`;

		const linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	};

	const clearAllTasks = async () => {
		if (confirm('Are you sure you want to clear all task data? This action cannot be undone.')) {
			await taskStore.resetTasks();
		}
	};

	const copyToClipboard = async (text: string, taskId: string, field: keyof ITrackedTask) => {
		try {
			await navigator.clipboard.writeText(text);
			// Add to copied items set
			copiedItems.add(`${taskId}-${field}`);
			// Remove from copied items after 3 seconds
			setTimeout(() => {
				copiedItems.delete(`${taskId}-${field}`);
			}, 3000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	};

	const handleCardClick = (task: ITrackedTask, field: keyof ITrackedTask) => {
		const text = task[field];
		if (text) {
			copyToClipboard(text, task.id, field);
		}
	};

	const getDisplayText = (task: ITrackedTask, field: keyof ITrackedTask, text: string) => {
		if (!text) return '';
		const isCopied = copiedItems.has(`${task.id}-${field}`);
		return isCopied ? `${text} (copied)` : text;
	};
</script>

<main class="min-h-screen overflow-y-auto bg-bg-dark flex flex-col justify-between">
	<div class="p-4">
		<div class="text-center mb-4 mt-1 font-family-heading">
			<h1 class="text-2xl font-bold text-fg-dark">Tracked Task Summary</h1>
			<span class="text-fg-muted text-xs">Total Tasks: {tasks.length}</span>
		</div>

		<div class="mb-3 flex justify-end gap-2">
			<Button size="sm" onclick={openTaskPopup} className="flex items-center gap-2 px-3 py-2" title="Add new task">
				<Plus size={14} />
			</Button>
			<Button size="sm" onclick={downloadTasks} className="flex items-center gap-2 px-3 py-2" title="Download tasks as JSON">
				<Download size={14} />
			</Button>
			<Button size="sm" onclick={clearAllTasks} className="flex items-center gap-2 px-3 py-2" variant="destructive" title="Clear all task data">
				<Trash2 size={14} />
			</Button>
		</div>

		<div class="space-y-2">
			{#each tasks as task (task.id)}
				<div class="bg-bg-darker border border-border rounded-lg p-3 hover:bg-bg-light transition-colors">
					<div class="flex flex-col items-start justify-between">
						<div class="flex items-center justify-between w-full mb-1">
							<div
								role="button"
								tabindex="0"
								class="text-accent-primary font-medium bg-accent-primary/10 pr-2 py-0.5 rounded text-xs whitespace-nowrap"
								onclick={() => handleCardClick(task, 'status')}
								onkeydown={(e) => e.key === 'Enter' && handleCardClick(task, 'status')}
								title="Click to copy status"
							>
								{getDisplayText(task, 'status', task.status ? getStatusLabel(task.status) : '')}
							</div>
							<div class="flex items-center gap-1 flex-shrink-0">
								{#if getTimeRange(task.start, task.end)}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<div
										role="button"
										tabindex="0"
										class="text-accent-primary font-medium bg-accent-primary/10 px-2 py-0.5 rounded text-xs whitespace-nowrap"
										onclick={() => copyToClipboard(getTimeRange(task.start, task.end) || '', task.id, 'start')}
										title="Click to copy time range"
									>
										{getDisplayText(task, 'start', getTimeRange(task.start, task.end) || '')}
									</div>
								{:else}
									<ClockAlert class="text-fg-dark mr-4" size={16} />
								{/if}
								<button class="p-1 text-fg-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onclick={() => deleteTask(task.id)} title="Delete task">
									<XIcon size={16} />
								</button>
							</div>
						</div>

						<div
							role="button"
							tabindex="0"
							class="font-semibold text-base text-fg-dark truncate mr-4 text-left w-full"
							onclick={() => handleCardClick(task, 'title')}
							onkeydown={(e) => e.key === 'Enter' && handleCardClick(task, 'title')}
							title="Click to copy title"
						>
							{getDisplayText(task, 'title', task.title)}
						</div>

						<div
							role="button"
							tabindex="0"
							class="text-fg-muted text-xs mb-1 leading-relaxed line-clamp-2 text-left w-full"
							onclick={() => handleCardClick(task, 'description')}
							onkeydown={(e) => e.key === 'Enter' && handleCardClick(task, 'description')}
							title="Click to copy description"
						>
							{getDisplayText(task, 'description', task.description)}
						</div>

						<div class="text-xs text-fg-muted">
							<div
								role="button"
								tabindex="0"
								class="text-xs text-fg-muted"
								onclick={() => copyToClipboard(getRelativeTime(task.createdAt), task.id, 'createdAt')}
								onkeydown={(e) => e.key === 'Enter' && copyToClipboard(getRelativeTime(task.createdAt), task.id, 'createdAt')}
								title="Click to copy created time"
							>
								Created {getDisplayText(task, 'createdAt', getRelativeTime(task.createdAt))}
							</div>
						</div>
					</div>
				</div>
			{/each}

			<div class="mb-3 text-center">
				<p class="text-xs text-fg-muted opacity-80 bg-bg-darker border border-border rounded-lg px-3 py-2">
					💡 <strong>Tip:</strong> Click on any task content to copy it to your clipboard
				</p>
			</div>
		</div>

		{#if tasks.length === 0}
			<div class="text-center py-12">
				<p class="text-fg-dark text-lg mb-2">No tasks recorded yet</p>
				<p class="text-fg-muted text-sm mb-6">Start tracking your tasks to see them here!</p>
				<div class="text-sm text-fg-muted space-y-2">
					<p>✨ Click the <Plus size={12} class="inline" /> button above to create your first task</p>
					<p>⌨️ Or use the keyboard shortcut: <kbd class="bg-bg-light px-2 py-1 rounded text-xs">Alt+Up</kbd></p>
					<p>📋 Once you have tasks, click any content to copy it to your clipboard</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Version and Copyright footer -->
	<div class="mt-8 pt-4 border-t border-border text-center text-xs text-fg-muted">
		<p>NDEV: Task Tracker v{pkg.version}</p>
		<p>&copy; {dayjs().year()} NDEV. All rights reserved.</p>
	</div>
</main>
