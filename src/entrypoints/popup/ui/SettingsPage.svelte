<script lang="ts">
	import '@bios-ui/core/css';
	import { Button, Input, InputLabel, TextArea } from '@bios-ui/svelte';
	import { ArrowLeftIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { onMount } from 'svelte';
	import { settingsStore } from '../../../lib/stores/settingsStore';

	interface Props {
		onCancel: () => void;
	}

	let { onCancel }: Props = $props();

	// Settings state
	let settings: ISettings = $state(settingsStore.getDefaultSettings());
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Form values
	let startTime = $state('');
	let autoFocusDescription = $state(false);
	let taskTitle = $state('');
	let taskDescription = $state('');
	let clickCardToCopy = $state<string>('');

	// Select options for clickCardToCopy
	const copyOptions = [
		{ value: '', label: 'None' },
		{ value: 'title', label: 'Title' },
		{ value: 'description', label: 'Description' },
	];

	onMount(async () => {
		isLoading = true;
		try {
			settings = await settingsStore.getSettings();
			
			// Initialize form values
			startTime = settings.startTime ? dayjs(settings.startTime).format('HH:mm') : '';
			autoFocusDescription = settings.autoFocusDescription ?? false;
			taskTitle = settings.taskCreateDefaultValue?.title ?? '';
			taskDescription = settings.taskCreateDefaultValue?.description ?? '';
			clickCardToCopy = settings.clickCardToCopy ?? '';
		} catch (error) {
			console.error('Failed to load settings:', error);
		} finally {
			isLoading = false;
		}
	});

	const handleSave = async () => {
		if (isSaving) return;

		isSaving = true;
		try {
			const updatedSettings: ISettings = {
				startTime: startTime ? dayjs().set('hour', parseInt(startTime.split(':')[0])).set('minute', parseInt(startTime.split(':')[1])).toISOString() : settings.startTime,
				autoFocusDescription,
				taskCreateDefaultValue: {
					title: taskTitle,
					description: taskDescription,
				},
				clickCardToCopy: clickCardToCopy === '' ? null : clickCardToCopy as keyof ICreateTask,
			};

			await settingsStore.saveSettings(updatedSettings);
			onCancel();
		} catch (error) {
			console.error('Failed to save settings:', error);
		} finally {
			isSaving = false;
		}
	};

	const handleReset = async () => {
		if (confirm('Are you sure you want to reset all settings to default values?')) {
			const defaultSettings = settingsStore.getDefaultSettings();
			startTime = dayjs(defaultSettings.startTime).format('HH:mm');
			autoFocusDescription = defaultSettings.autoFocusDescription ?? false;
			taskTitle = defaultSettings.taskCreateDefaultValue?.title ?? '';
			taskDescription = defaultSettings.taskCreateDefaultValue?.description ?? '';
			clickCardToCopy = defaultSettings.clickCardToCopy ?? '';
		}
	};
</script>

<main class="w-80 !p-3 bg-bg-dark max-h-[480px] flex flex-col">
	<div class="flex flex-col items-start mb-4 flex-shrink-0">
		<button class="flex items-center gap-2 text-fg-muted hover:text-fg-dark transition-colors flex-1" onclick={onCancel}>
			<ArrowLeftIcon size={16} />
			<span class="text-sm">Back</span>
		</button>
		<h1 class="text-xl font-semibold self-center text-fg-dark text-center font-family-heading">SETTINGS</h1>
	</div>

	<div class="flex-1 overflow-y-auto min-h-0">
		<div class="flex flex-col gap-4 pb-4">
			{#if isLoading}
				<div class="text-center py-8 text-fg-muted">
					<div class="flex items-center justify-center gap-2">
						<div class="w-4 h-4 border-2 border-fg-muted border-t-transparent rounded-full animate-spin"></div>
						<p class="text-sm">Loading settings...</p>
					</div>
				</div>
			{:else}
				<!-- Start Time Setting -->
				<div class="bg-bg-light rounded-md p-3 border border-border">
					<InputLabel size="sm" className="flex flex-col gap-1">
						<span class="text-sm font-medium text-fg-dark">Start Time</span>
						<Input 
							type="time" 
							bind:value={startTime} 
							placeholder="08:00" 
							className="w-full"
						/>
						<p class="text-xs text-fg-muted">Set your usual work start time</p>
					</InputLabel>
				</div>

				<!-- Auto Focus Description Setting -->
				<div class="bg-bg-light rounded-md p-3 border border-border">
					<InputLabel size="sm" className="flex flex-col gap-1">
						<span class="text-sm font-medium text-fg-dark">Auto Focus Description</span>
						<label class="flex items-center gap-2 cursor-pointer">
							<input 
								type="checkbox" 
								bind:checked={autoFocusDescription}
								class="w-4 h-4 text-accent-primary bg-bg-light border-border rounded focus:ring-accent-primary focus:ring-2"
							/>
							<span class="text-sm text-fg-dark">Enable auto focus on description field</span>
						</label>
						<p class="text-xs text-fg-muted">Automatically focus on description field when creating tasks</p>
					</InputLabel>
				</div>

				<!-- Task Default Values -->
				<div class="bg-bg-light rounded-md p-3 border border-border">
					<h3 class="text-sm font-medium text-fg-dark mb-3">Task Default Values</h3>
					
					<div class="space-y-3">
						<InputLabel size="sm" className="flex flex-col gap-1">
							<span class="text-xs font-medium text-fg-dark">Default Title</span>
							<Input 
								bind:value={taskTitle} 
								placeholder="Enter default task title..." 
								className="w-full"
							/>
						</InputLabel>

						<InputLabel size="sm" className="flex flex-col gap-1">
							<span class="text-xs font-medium text-fg-dark">Default Description</span>
							<TextArea 
								bind:value={taskDescription} 
								placeholder="Enter default task description..." 
								rows={2}
								className="w-full resize-none"
							/>
						</InputLabel>
					</div>
				</div>

				<!-- Click Card to Copy Setting -->
				<div class="bg-bg-light rounded-md p-3 border border-border">
					<InputLabel size="sm" className="flex flex-col gap-1">
						<span class="text-sm font-medium text-fg-dark">Click Card to Copy</span>
						<select 
							bind:value={clickCardToCopy}
							class="w-full px-3 py-2 bg-bg-light border border-border rounded-md text-fg-dark focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
						>
							{#each copyOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<p class="text-xs text-fg-muted">Choose which field to copy when clicking on a task card</p>
					</InputLabel>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex gap-2 pt-4 border-t border-border flex-shrink-0">
		<Button onclick={handleReset} variant="secondary" size="md" className="flex-1" disabled={isLoading || isSaving}>
			Reset
		</Button>
		<Button onclick={onCancel} variant="secondary" size="md" className="flex-1" disabled={isSaving}>
			Cancel
		</Button>
		<Button onclick={handleSave} size="md" className="flex-1" disabled={isLoading || isSaving}>
			{#if isSaving}
				<div class="flex items-center justify-center gap-2">
					<div class="w-4 h-4 border-2 border-fg-on-accent border-t-transparent rounded-full animate-spin"></div>
					Saving...
				</div>
			{:else}
				Save
			{/if}
		</Button>
	</div>
</main>
