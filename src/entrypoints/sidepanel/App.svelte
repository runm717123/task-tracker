<script lang="ts">
	import '@bios-ui/core/css';
	import { Button, Select } from '@bios-ui/svelte';
	import { ClockAlert, Download, EditIcon, ListIcon, ListOrderedIcon, Plus, Trash2, Upload, XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import isBetween from 'dayjs/plugin/isBetween';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.css';
	import { onDestroy, onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import pkg from '../../../package.json';
	import SummaryView from '../../lib/components/SummaryView.svelte';
	import { taskStore } from '../../lib/stores/taskStore';
	import { summarizeTasks } from '../../lib/utils/summarize/summarizeTasks';
	import { openTaskPopup } from '../../lib/utils/newTaskFormPopup';
	import EditPage from '../popup/ui/EditPage.svelte';

	dayjs.extend(relativeTime);
	dayjs.extend(isBetween);

	let trackedTasks: ITrackedTask[] = $state([]);
	let copiedItems: Set<string> = new SvelteSet();
	let timeRangeFilter: 'daily' | 'weekly' | 'monthly' | 'all' = $state('daily');
	let selectedDate = $state(new Date());
	let editingTask: ITrackedTask | null = $state(null);
	let isEditing = $state(false);
	let viewMode: 'list' | 'summary' = $state('list');
	let summaryData: Array<{ title: string; tasks: string[] }> = $state([]);
	let isGeneratingSummary = $state(false);
	let summaryProgressStatus: string = $state('idle');
	let fileInput: HTMLInputElement;
	let dateInput: HTMLInputElement | undefined = $state();
	let flatpickrInstance: flatpickr.Instance;

	let unwatch: () => void;

	onMount(() => {
		const initializeStorage = async () => {
			// Initialize storage with mock data if needed
			// await taskStore.initializeStorage();

			// Load initial tasks based on filter
			await loadTasksForTimeRange();

			// Watch for changes in storage
			unwatch = taskStore.watchTasks(async () => {
				await loadTasksForTimeRange();
			});
		};

		initializeStorage();

		// close window on ESC key
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				window.close();
			}
		};
		document.addEventListener('keydown', handleKeydown);

		// Initialize flatpickr
		initializeFlatpickr();
	});

	const loadTasksForTimeRange = async () => {
		trackedTasks = await taskStore.getTasks(timeRangeFilter, selectedDate);

		// Generate summary data when tasks are loaded
		if (viewMode === 'summary') {
			await generateSummaryData();
		}
	};

	const generateSummaryData = async () => {
		try {
			isGeneratingSummary = true;

			await tick();

			summaryData = await summarizeTasks(trackedTasks, 0.75, (status) => {
				summaryProgressStatus = status;
			});
		} catch (error) {
			console.error('Error generating summary:', error);
			summaryProgressStatus = 'Error generating summary';
			summaryData = [];
		} finally {
			// Add a small delay before clearing the status
			setTimeout(() => {
				isGeneratingSummary = false;
				summaryProgressStatus = 'idle';
			}, 500);
		}
	};

	const toggleViewMode = async () => {
		if (viewMode === 'list') {
			// Check if there are no tasks to summarize
			if (trackedTasks.length === 0) {
				alert('No tasks available to summarize! Please create some tasks first or try adjusting the date range or time period to find existing tasks.');
				return;
			}
			viewMode = 'summary';
			await generateSummaryData();
		} else {
			viewMode = 'list';
		}
	};

	const handleTimeRangeChange = async () => {
		// Reset to current date when changing time range
		selectedDate = new Date();
		// Reset view mode to list when changing periods
		viewMode = 'list';
		await loadTasksForTimeRange();
		// Reinitialize flatpickr with new settings
		initializeFlatpickr();
	};

	const initializeFlatpickr = () => {
		if (flatpickrInstance) {
			flatpickrInstance.destroy();
		}

		if (!dateInput || timeRangeFilter === 'all') return;

		let mode: 'single' = 'single';
		let dateFormat = 'Y-m-d';
		let defaultDate = selectedDate;

		const baseOptions: flatpickr.Options.Options = {
			mode,
			dateFormat,
			defaultDate,
			maxDate: new Date(),
			onChange: (selectedDates) => {
				if (selectedDates.length > 0) {
					handleFlatpickrChange(selectedDates[0]);
				}
			},
		};

		switch (timeRangeFilter) {
			case 'daily':
				flatpickrInstance = flatpickr(dateInput, baseOptions);
				break;
			case 'weekly':
				flatpickrInstance = flatpickr(dateInput, {
					...baseOptions,
					onDayCreate: (dObj, dStr, fp, dayElem) => {
						const date = dayjs(dayElem.dateObj);
						const weekStart = dayjs(selectedDate).startOf('week');
						const weekEnd = dayjs(selectedDate).endOf('week');

						if (date.isBetween(weekStart, weekEnd, 'day', '[]')) {
							dayElem.classList.add('selected-week');
						}
					},
				});
				break;
			case 'monthly':
				flatpickrInstance = flatpickr(dateInput, {
					...baseOptions,
					dateFormat: 'Y-m',
					altInput: true,
					altFormat: 'F Y',
				});
				break;
		}
	};

	const handleFlatpickrChange = async (date: Date) => {
		let newDate: Date;

		switch (timeRangeFilter) {
			case 'daily':
				newDate = date;
				break;
			case 'weekly':
				newDate = dayjs(date).startOf('week').toDate();
				break;
			case 'monthly':
				newDate = dayjs(date).startOf('month').toDate();
				break;
			default:
				newDate = new Date();
		}

		selectedDate = newDate;
		await loadTasksForTimeRange();
	};

	// Reactive effect to reinitialize flatpickr when dateInput is available
	$effect(() => {
		if (dateInput && timeRangeFilter !== 'all') {
			initializeFlatpickr();
		}
	});

	onDestroy(() => {
		if (unwatch) unwatch();
		if (flatpickrInstance) flatpickrInstance.destroy();
	});

	const deleteTask = async (taskId: string) => {
		await taskStore.deleteTask(taskId);
	};

	const editTask = (task: ITrackedTask) => {
		editingTask = task;
		isEditing = true;
	};

	const handleEditSave = async (updatedTask: ITrackedTask) => {
		await taskStore.updateTask(updatedTask);
		isEditing = false;
		editingTask = null;
	};

	const handleEditCancel = () => {
		isEditing = false;
		editingTask = null;
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
		const dataStr = JSON.stringify(trackedTasks, null, 2);
		const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

		const exportFileDefaultName = `${timeRangeFilter}-tasks-${dayjs(selectedDate).format('YYYY-MM-DD-HH-mm-ss')}.json`;

		const linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	};

	const clearTasks = async () => {
		const filterText = timeRangeFilter === 'all' ? 'all' : timeRangeFilter;
		if (confirm(`Are you sure you want to clear ${filterText} tasks? This action cannot be undone.`)) {
			await taskStore.resetTasks(timeRangeFilter);
		}
	};

	const importTasks = () => {
		fileInput.click();
	};

	const handleFileImport = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		try {
			const text = await file.text();
			const jsonData = JSON.parse(text);

			const result = await taskStore.importTasks(jsonData);

			if (result.success) {
				alert(result.message);
			} else {
				alert(`Import failed: ${result.message}`);
			}
		} catch (error) {
			alert("Error reading file: Please ensure it's a valid JSON file");
			alert("Error reading file: Please ensure it's a valid JSON file");
		} finally {
			// Reset file input
			target.value = '';
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

	const getHeaderText = () => {
		const referenceDate = dayjs(selectedDate);
		switch (timeRangeFilter) {
			case 'daily':
				const isToday = referenceDate.isSame(dayjs(), 'day');
				const dayLabel = isToday ? 'Today' : referenceDate.format('MMM DD, YYYY');
				return `${dayLabel}'s Tasks: ${trackedTasks.length}`;
			case 'weekly':
				const isThisWeek = referenceDate.isSame(dayjs(), 'week');
				const weekLabel = isThisWeek ? 'This Week' : `Week of ${referenceDate.startOf('week').format('MMM DD, YYYY')}`;
				return `${weekLabel}'s Tasks: ${trackedTasks.length}`;
			case 'monthly':
				const isThisMonth = referenceDate.isSame(dayjs(), 'month');
				const monthLabel = isThisMonth ? 'This Month' : referenceDate.format('MMMM YYYY');
				return `${monthLabel}'s Tasks: ${trackedTasks.length}`;
			case 'all':
				return `All Tasks: ${trackedTasks.length}`;
		}
	};
</script>

<main class="min-h-screen overflow-y-auto bg-bg-dark flex flex-col justify-between h-full">
	{#if isEditing && editingTask}
		<EditPage task={editingTask} onSave={handleEditSave} onCancel={handleEditCancel} />
	{:else}
		<div class="p-4 flex flex-col flex-1">
			<div class="flex justify-between items-start mb-4 mt-1">
				<div class="font-family-heading">
					<h1 class="text-2xl font-bold text-fg-dark">Tracked Tasks Summary</h1>
					<span class="text-fg-muted text-xs">{getHeaderText()}</span>
				</div>
				<Button size="sm" onclick={toggleViewMode} className="flex items-center gap-2 px-3 py-2" title={`Switch to ${viewMode === 'list' ? 'summary' : 'list'} view`} disabled={isGeneratingSummary}>
					{#if isGeneratingSummary}
						<div class="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
					{:else if viewMode === 'list'}
						<ListOrderedIcon size={16} />
					{:else}
						<ListIcon size={16} />
					{/if}
				</Button>
			</div>

			<div class="mb-3 flex justify-between items-center flex-wrap gap-4 md:gap-2">
				<div class="flex items-center gap-2">
					<Select
						className="max-w-40"
						bind:value={timeRangeFilter}
						onchange={handleTimeRangeChange}
						options={[
							{ value: 'daily', label: 'Daily' },
							{ value: 'weekly', label: 'Weekly' },
							{ value: 'monthly', label: 'Monthly' },
							{ value: 'all', label: 'All' },
						]}
					/>
					{#if timeRangeFilter !== 'all'}
						<div class="relative h-full">
							<input bind:this={dateInput as any} class="p-2 pr-6 py-[0.55rem] text-xs bg-bg-darker border-2 text-fg-dark focus:outline-none cursor-pointer" placeholder="Select date" readonly />
							<svg class="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-fg-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</div>
					{/if}
				</div>
				<div class="flex gap-2">
					<Button size="sm" onclick={openTaskPopup} className="flex items-center gap-2 px-3 py-2" title="Add new task">
						<Plus size={14} />
					</Button>
					<Button size="sm" onclick={importTasks} className="flex items-center gap-2 px-3 py-2" title="Import tasks from JSON file">
						<Upload size={14} />
					</Button>
					<Button size="sm" onclick={downloadTasks} className="flex items-center gap-2 px-3 py-2" title={`Download ${timeRangeFilter} tasks as JSON`}>
						<Download size={14} />
					</Button>
					<Button size="sm" onclick={clearTasks} className="flex items-center gap-2 px-3 py-2" variant="destructive" title={`Clear ${timeRangeFilter} tasks`}>
						<Trash2 size={14} />
					</Button>
				</div>
			</div>

			{#if trackedTasks.length}
				{#if viewMode === 'list'}
					<div class="space-y-2 flex flex-col flex-1">
						{#each trackedTasks as task (task.id)}
							<div class="bg-bg-darker border border-border rounded-lg p-3 hover:bg-bg-light transition-colors">
								<div class="flex flex-col items-start justify-between">
									<div class="flex items-center justify-between w-full mb-1">
										<div class="flex items-center">
											<!-- <div
									role="button"
									tabindex="0"
									class="text-accent-primary font-medium bg-accent-primary/10 pr-2 py-0.5 rounded text-xs whitespace-nowrap"
									onclick={() => handleCardClick(task, 'status')}
									onkeydown={(e) => e.key === 'Enter' && handleCardClick(task, 'status')}
									title="Click to copy status"
								>
									{getDisplayText(task, 'status', task.status ? getStatusLabel(task.status) : '')}
								</div> -->
											{#if getTimeRange(task.start, task.end)}
												<!-- svelte-ignore a11y_click_events_have_key_events -->
												<div
													role="button"
													tabindex="0"
													class="text-accent-primary text-sm font-medium bg-accent-primary/10 px-2 py-0.5 rounded whitespace-nowrap"
													onclick={() => copyToClipboard(getTimeRange(task.start, task.end) || '', task.id, 'start')}
													title="Click to copy time range"
												>
													{getDisplayText(task, 'start', getTimeRange(task.start, task.end) || '')}
												</div>
											{:else}
												<ClockAlert class="text-fg-dark mr-4" size={16} />
											{/if}
										</div>
										<div class="flex items-center gap-1 flex-shrink-0">
											<button class="p-1 text-fg-muted hover:text-fg-dark hover:bg-blue-50 rounded-md transition-colors" onclick={() => editTask(task)} title="Edit task">
												<EditIcon size={16} />
											</button>
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
										class="text-fg-muted text-xs mb-1 leading-relaxed line-clamp-3 text-left w-full whitespace-pre-wrap"
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
				{:else if isGeneratingSummary}
					<div class="flex flex-1 flex-col items-center justify-center py-16 space-y-4">
						<!-- Robotic/Techy Loading Animation -->
						<div class="relative">
							<!-- Main scanning circle -->
							<div class="w-16 h-16 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
							<!-- Inner pulse -->
							<div class="absolute inset-2 w-12 h-12 bg-blue-500/20 rounded-full animate-pulse"></div>
							<!-- Center dot -->
							<div class="absolute inset-6 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
						</div>

						<!-- Loading text with typewriter effect -->
						<div class="text-center space-y-2">
							<div class="text-lg font-mono text-blue-400">
								{summaryProgressStatus || 'ANALYZING TASKS...'}
							</div>
							<div class="text-xs font-mono text-gray-600 opacity-75">🔄 ANALYZING TASK SEMANTICS 🔄</div>
						</div>
					</div>
				{:else if summaryData.length > 0}
					<div class="mt-8">
						{#each summaryData as group}
							<SummaryView items={group.tasks} title={group.title} emptyMessage="No tasks in this group" className="mb-6" />
						{/each}
					</div>
				{:else}
					<SummaryView items={[]} title="Task Summary" emptyMessage="No tasks to summarize" className="mt-4" />
				{/if}
			{:else}
				<div class="flex flex-col justify-center items-center text-center flex-1">
					<p class="text-fg-dark text-lg mb-2">No tasks recorded for {timeRangeFilter === 'daily' ? 'today' : timeRangeFilter === 'all' ? 'any period' : `this ${timeRangeFilter.replace('ly', '')}`}</p>
					<p class="text-fg-muted text-sm mb-6">Start tracking your tasks to see them here!</p>
					<div class="text-sm text-fg-muted space-y-2">
						<p>✨ Click the <Plus size={12} class="inline" /> button above to create your first task</p>
						<p>⌨️ Or use the keyboard shortcut: <kbd class="bg-bg-light px-2 py-1 rounded text-xs">Alt+Up</kbd></p>
						<p>📋 Once you have tasks, click any content to copy it to your clipboard</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Version and Copyright footer -->
	<div class="mt-8 pt-4 border-t border-border text-center text-xs text-fg-muted">
		<p>NDEV: Task Tracker v{pkg.version}</p>
		<p>&copy; {dayjs().year()} NDEV. All rights reserved.</p>
	</div>

	<!-- Hidden file input for importing tasks -->
	<input bind:this={fileInput} type="file" accept=".json" onchange={handleFileImport} style="display: none;" />
	<input bind:this={fileInput} type="file" accept=".json" onchange={handleFileImport} style="display: none;" />
</main>
