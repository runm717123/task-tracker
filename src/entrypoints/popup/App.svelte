<script lang="ts">
	import '@bios-ui/core/css';
	import { Button } from '@bios-ui/svelte';
	import { ListCheckIcon, XIcon, Settings, HelpCircleIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '../../lib/stores/taskStore';
	import EditPage from './ui/EditPage.svelte';
	import SettingsPage from './ui/SettingsPage.svelte';
	import HelpPage from './ui/HelpPage.svelte';

	let todayTasks: ITrackedTask[] = $state([]);
	let currentView: 'list' | 'edit' | 'settings' | 'help' = $state('list');
	let editingTask: ITrackedTask | null = $state(null);

	let unwatch: () => void;

	onMount(() => {
		const initializeStorage = async () => {
			// Initialize storage with mock data if needed
			// await taskStore.initializeStorage();

			// Load initial today's tasks
			todayTasks = await taskStore.getTasks('daily');

			// Watch for changes in storage
			unwatch = taskStore.watchTasks(async () => {
				todayTasks = await taskStore.getTasks('daily');
			});
		};

		initializeStorage();

		// Add keydown event listener for ESC key
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (currentView === 'edit') {
					cancelEdit();
				} else if (currentView === 'settings') {
					closeSettings();
				} else if (currentView === 'help') {
					closeHelp();
				} else {
					window.close();
				}
			}
		};

		document.addEventListener('keydown', handleKeydown);

		// Cleanup function
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(() => {
		if (unwatch) unwatch();
	});

	const deleteTask = async (taskId: string) => {
		await taskStore.deleteTask(taskId);
	};

	const editTask = (task: ITrackedTask) => {
		editingTask = task;
		currentView = 'edit';
	};

	const saveTask = async (updatedTask: ITrackedTask) => {
		await taskStore.updateTask(updatedTask);
		currentView = 'list';
		editingTask = null;
	};

	const cancelEdit = () => {
		currentView = 'list';
		editingTask = null;
	};

	const openSettings = () => {
		currentView = 'settings';
	};

	const closeSettings = () => {
		currentView = 'list';
	};

	const openHelp = () => {
		currentView = 'help';
	};

	const closeHelp = () => {
		currentView = 'list';
	};

	let sidepanelOpen = $state(false);

	const toggleSidepanel = async () => {
		try {
			const currentWindow = await browser.windows.getCurrent();
			// Try to get current sidepanel state and toggle

			if (!sidepanelOpen && currentWindow.id) {
				await browser.sidePanel.open({ windowId: currentWindow.id });
				sidepanelOpen = true;
			} else {
				// not work yet, follow this issue to track:
				// https://github.com/w3c/webextensions/issues/521
				chrome.runtime.sendMessage('closeSidePanel');
				sidepanelOpen = false;
			}
		} catch (error) {
			console.error('Failed to toggle sidepanel:', error);
		}
	};
</script>

{#if currentView === 'list'}
	<main class="w-80 bg-bg-dark max-h-[480px] flex flex-col">
		<div class="flex items-center justify-between border-b border-[##979797] pb-1 pt-2 px-3 flex-shrink-0">
			<h1 class="text-xl font-bold text-fg-dark flex flex-row gap-1">
				<ListCheckIcon />
				Task Tracker
			</h1>
			<button
				onclick={openHelp}
				class="p-1 rounded-full hover:bg-bg-light transition-colors"
				title="Help & Guide"
			>
				<HelpCircleIcon size={20} class="text-fg-muted hover:text-fg-dark" />
			</button>
		</div>

		<div class="px-3 flex-1 flex flex-col min-h-0 mb-2 mt-4">
			<div class="overflow-y-auto flex-1 min-h-0" role="list">
				{#each todayTasks as task (task.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div role="listitem" class="border-b border-border py-3 px-1 flex items-center justify-between flex-row gap-2" onclick={() => editTask(task)}>
						<div class=" hover:text-white hover:bg-bg-light cursor-pointer flex-1 flex items-center justify-between" title="Click to edit task">
							<span class="text-sm truncate">{task.title}</span>
							<span class="text-xs text-fg-muted">
								{dayjs(task.start).format('HH:mm')} -
								{dayjs(task.end).format('HH:mm')}
							</span>
						</div>

						<XIcon
							role="button"
							size={16}
							class="text-fg-muted hover:text-fg-dark hover:bg-blue-50 cursor-pointer hover:p-0.5 rounded"
							onclick={(e) => {
								e.stopPropagation();
								deleteTask(task.id);
							}}
						/>
					</div>
				{/each}

				{#if todayTasks.length === 0}
					<div class="text-center py-8 text-fg-dark">
						<p class="text-sm mb-2">No tasks recorded for today</p>
						<p class="text-xs text-fg-muted mb-4">Create your first task to get started!</p>
						<div class="text-xs text-fg-muted space-y-1">
							<p>• Open sidepanel below</p>
							<p>• Use keyboard shortcut: <kbd class="bg-bg-light px-1 py-0.5 rounded text-xs">Alt+Up</kbd></p>
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-4 flex flex-row justify-between items-center flex-shrink-0">
				{#if todayTasks.length > 0}
					<p class="text-sm text-fg-muted">
						Today's Tasks: <span class="text-fg-dark">{todayTasks.length}</span>
					</p>
				{:else}
					<div></div>
				{/if}
				<div class="flex gap-2">
					<Button size="sm" onclick={toggleSidepanel}>Open Sidepanel</Button>
					<Button size="sm" onclick={openSettings} className="flex items-center gap-1">
						<Settings size={14} />
					</Button>
				</div>
			</div>
		</div>
	</main>
{:else if currentView === 'edit' && editingTask}
	<EditPage task={editingTask} onSave={saveTask} onCancel={cancelEdit} />
{:else if currentView === 'settings'}
	<SettingsPage onCancel={closeSettings} />
{:else if currentView === 'help'}
	<HelpPage onCancel={closeHelp} />
{/if}
