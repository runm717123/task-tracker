<script lang="ts">
	import '@bios-ui/core/css';
	import { Button } from '@bios-ui/svelte';
	import { KeyboardIcon, SidebarIcon, SettingsIcon, PlusIcon, BarChart3Icon, DownloadIcon } from '@lucide/svelte';
	import FormHeader from '../../../lib/components/popup/FormHeader.svelte';

	interface Props {
		onCancel: () => void;
	}

	let { onCancel }: Props = $props();
</script>

<main class="w-80 !p-3 bg-bg-dark max-h-[480px] flex flex-col">
	<FormHeader title="HELP" onBack={onCancel} />

	<div class="flex-1 overflow-y-auto min-h-0">
		<div class="flex flex-col gap-4 pb-4">
			<!-- Create New Task -->
			<div class="bg-bg-light rounded-md p-3 border border-border">
				<div class="flex items-center gap-2 mb-2">
					<PlusIcon size={16} class="text-accent-primary" />
					<h3 class="text-sm font-semibold text-fg-dark">Create New Task</h3>
				</div>
				<div class="text-xs text-fg-muted space-y-1">
					<p>• Use keyboard shortcut: <kbd class="bg-bg-dark px-1.5 py-0.5 rounded text-xs font-mono">Alt+Up</kbd></p>
					<p>• Click the "+" button in sidepanel</p>
					<p class="text-accent-muted italic">💡 Shortcut can be customized in Chrome Extensions settings</p>
				</div>
			</div>

			<!-- Sidepanel Features -->
			<div class="bg-bg-light rounded-md p-3 border border-border">
				<div class="flex items-center gap-2 mb-2">
					<SidebarIcon size={16} class="text-accent-primary" />
					<h3 class="text-sm font-semibold text-fg-dark">Sidepanel Features</h3>
				</div>
				<div class="text-xs text-fg-muted space-y-1">
					<div class="flex items-center gap-1">
						<BarChart3Icon size={12} />
						<span>Generate AI-powered task summaries</span>
					</div>
					<div class="flex items-center gap-1">
						<DownloadIcon size={12} />
						<span>Import/export task data</span>
					</div>
					<p>• View tasks by day, week, or month</p>
					<p>• Access detailed task management</p>
				</div>
			</div>

			<!-- Settings -->
			<div class="bg-bg-light rounded-md p-3 border border-border">
				<div class="flex items-center gap-2 mb-2">
					<SettingsIcon size={16} class="text-accent-primary" />
					<h3 class="text-sm font-semibold text-fg-dark">Settings Panel</h3>
				</div>
				<div class="text-xs text-fg-muted space-y-1">
					<p>• Set your work start time</p>
					<p>• Configure auto-focus behavior</p>
					<p>• Set default task values</p>
					<p class="text-accent-muted italic">💡 Customize the app to boost your workflow</p>
				</div>
			</div>

			<!-- Keyboard Shortcuts -->
			<div class="bg-bg-light rounded-md p-3 border border-border">
				<div class="flex items-center gap-2 mb-2">
					<KeyboardIcon size={16} class="text-accent-primary" />
					<h3 class="text-sm font-semibold text-fg-dark">Keyboard Shortcuts</h3>
				</div>
				<div class="text-xs text-fg-muted space-y-1">
					<p><kbd class="bg-bg-dark px-1.5 py-0.5 rounded font-mono">Esc</kbd> - Close popup/cancel actions</p>
					<p><kbd class="bg-bg-dark px-1.5 py-0.5 rounded font-mono">Enter</kbd> - Save forms (when valid)</p>
					<p><kbd class="bg-bg-dark px-1.5 py-0.5 rounded font-mono">Alt+Up</kbd> - Create new task</p>
				</div>
			</div>
		</div>
	</div>

	<div class="flex gap-2 pt-4 border-t border-border flex-shrink-0">
		<Button onclick={onCancel} size="md" className="flex-1">
			Got it!
		</Button>
	</div>
</main>
