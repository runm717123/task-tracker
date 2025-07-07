<script lang="ts">
	import { ArrowLeftIcon } from '@lucide/svelte';

	interface Props {
		title: string;
		onBack?: () => void;
	}

	let { title, onBack }: Props = $props();
</script>

<div class="flex flex-col items-start mb-4">
	{#if onBack}
		<button class="flex items-center gap-2 text-fg-muted hover:text-fg-dark transition-colors flex-1" onclick={onBack}>
			<ArrowLeftIcon size={16} />
			<span class="text-sm">Back</span>
		</button>
	{/if}
	<h1 class="text-xl font-semibold self-center text-fg-dark text-center font-family-heading">{title}</h1>
</div>
