<script lang="ts">
	import '@bios-ui/core/css';
	import { Button, Input, InputLabel, TextArea } from '@bios-ui/svelte';
	import dayjs from 'dayjs';
	import { onDestroy, onMount } from 'svelte';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.css';
	import FormHeader from '../../../lib/components/popup/FormHeader.svelte';
	import { settingsStore } from '../../../lib/stores/settingsStore';

	interface Props {
		task: ITrackedTask;
		onSave: (updatedTask: ITrackedTask) => void;
		onCancel: () => void;
		isNewTask?: boolean;
	}

	let { task, onSave, onCancel, isNewTask = false }: Props = $props();

	let title = $state(task.title);
	let description = $state(task.description);
	let startTime = $state(task.start ? dayjs(task.start).format('YYYY-MM-DDTHH:mm') : '');
	let endTime = $state(task.end ? dayjs(task.end).format('YYYY-MM-DDTHH:mm') : '');

	let startTimeInput: HTMLInputElement | undefined = $state();
	let endTimeInput: HTMLInputElement | undefined = $state();
	let startTimePicker: flatpickr.Instance;
	let endTimePicker: flatpickr.Instance;

	onMount(() => {
		initializeFlatpickr();
		handleAutoFocus();
	});

	onDestroy(() => {
		if (startTimePicker) startTimePicker.destroy();
		if (endTimePicker) endTimePicker.destroy();
	});

	const initializeFlatpickr = () => {
		if (startTimeInput) {
			startTimePicker = flatpickr(startTimeInput, {
				enableTime: true,
				dateFormat: 'Y-m-d H:i',
				time_24hr: true,
				position: 'auto center',
				appendTo: startTimeInput.parentElement!,
				defaultDate: task.start ? dayjs(task.start).toDate() : undefined,
				onChange: (selectedDates) => {
					if (selectedDates.length > 0) {
						startTime = dayjs(selectedDates[0]).format('YYYY-MM-DDTHH:mm');
					}
				},
			});
		}

		if (endTimeInput) {
			endTimePicker = flatpickr(endTimeInput, {
				position: 'auto center',
				appendTo: endTimeInput.parentElement!,
				enableTime: true,
				dateFormat: 'Y-m-d H:i',
				time_24hr: true,
				defaultDate: task.end ? dayjs(task.end).toDate() : undefined,
				onChange: (selectedDates) => {
					if (selectedDates.length > 0) {
						endTime = dayjs(selectedDates[0]).format('YYYY-MM-DDTHH:mm');
					}
				},
			});
		}
	};

	// Reactive effect to reinitialize flatpickr when inputs are available
	$effect(() => {
		if (startTimeInput || endTimeInput) {
			initializeFlatpickr();
		}
	});

	const handleAutoFocus = async () => {
		if (!isNewTask) return;

		const titleInput = document.getElementById('title') as HTMLInputElement;
		const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;

		try {
			const settings = await settingsStore.getSettings();
			const shouldFocusDescription = settings.autoFocusDescription;

			// Use setTimeout to ensure DOM is ready
			setTimeout(() => {
				if (shouldFocusDescription && descriptionInput) {
					descriptionInput.focus();
				} else if (titleInput) {
					titleInput.focus();
				}
			}, 100);
		} catch (error) {
			// Fallback to title if settings can't be loaded
			setTimeout(() => {
				if (titleInput) {
					titleInput.focus();
				}
			}, 100);
		}
	};

	const handleSave = () => {
		const updatedTask: ITrackedTask = {
			...task,
			title,
			description,
			start: startTime ? dayjs(startTime).toISOString() : null,
			end: endTime ? dayjs(endTime).toISOString() : null,
		};
		onSave(updatedTask);
	};

	const canSave = $derived(title.trim().length > 0);

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey && canSave) {
			handleSave();
		}
	};

	const handleSubmit = () => {
		if (canSave) {
			handleSave();
		}
	};
</script>

<main class="w-80 !p-3 bg-bg-dark">
	<FormHeader title={isNewTask ? 'NEW TASK' : 'EDIT TASK'} onBack={onCancel} />

	<div class="flex flex-col gap-4">
		<InputLabel size="sm" className="flex flex-col gap-1">
			Title*
			<Input id="title" bind:value={title} placeholder="Enter task title" onkeydown={handleKeyDown} />
		</InputLabel>

		<InputLabel size="sm" className="flex flex-col gap-1">
			Description
			<TextArea id="description" bind:value={description} rows={3} placeholder="Enter task description" onkeydown={handleKeyDown} />
		</InputLabel>

		<InputLabel size="sm" className="date-label flex flex-col gap-1">
			Start Time
			<input
				bind:this={startTimeInput}
				id="startTime"
				bind:value={startTime}
				placeholder="Select start time"
				onkeydown={handleKeyDown}
				class="px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
			/>
		</InputLabel>

		<InputLabel size="sm" className="date-label flex flex-col gap-1">
			End Time
			<input
				bind:this={endTimeInput}
				id="endTime"
				bind:value={endTime}
				placeholder="Select end time"
				onkeydown={handleKeyDown}
				class="px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
			/>
		</InputLabel>

		<div class="flex gap-2 pt-2">
			<Button onclick={onCancel} size="md" className="flex-1">Cancel</Button>
			<Button type="button" onclick={handleSubmit} size="md" disabled={!canSave} className="flex-1">Save</Button>
		</div>
	</div>
</main>

<style>
	:global(.date-label .flatpickr-calendar::before, .date-label .flatpickr-calendar::after) {
		display: none !important;
	}
	:global(.date-label .flatpickr-calendar) {
		top: 0 !important;
	}
</style>
