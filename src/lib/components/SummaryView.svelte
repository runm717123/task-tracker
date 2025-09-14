<script lang="ts">
	interface Props {
		items: string[];
		title?: string;
		emptyMessage?: string;
		className?: string;
	}

	let { items, title = 'Summary', emptyMessage = 'No items to display', className = '' }: Props = $props();

	// Local copied state
	let copied = $state(new Set<string>());

	const copyToClipboard = async (text: string, uniqueId: string) => {
		try {
			await navigator.clipboard.writeText(text);
			copied.add(uniqueId);
			// Force reactivity by reassigning
			copied = new Set(copied);
			setTimeout(() => {
				copied.delete(uniqueId);
				// Force reactivity by reassigning
				copied = new Set(copied);
			}, 3000);
		} catch (e) {
			console.error('Copy failed', e);
		}
	};

	const getDisplayText = (item: string, uniqueId: string) => {
		const isCopied = copied.has(uniqueId);
		return isCopied ? `${item} (copied)` : item;
	};

	const handleItemClick = (item: string, index: number) => {
		const uniqueId = `${title}-${item}-${index}`;
		copyToClipboard(item, uniqueId);
	};
</script>

<div class="summary-view {className}">
	{#if title}
		<h3 class="text-lg font-semibold text-fg-dark mb-3 font-family-heading">{title}</h3>
	{/if}

	{#if items.length > 0}
		<ol class="space-y-1 list-decimal list-inside">
			{#each items as item, index}
				<li 
					role="button" 
					tabindex="0" 
					class="text-fg-dark text-sm leading-relaxed cursor-pointer hover:bg-bg-light p-1 rounded transition-colors"
					onclick={() => handleItemClick(item, index)}
					onkeydown={(e) => e.key === 'Enter' && handleItemClick(item, index)}
					title="Click to copy"
				>
					{getDisplayText(item, `${title}-${item}-${index}`)}
				</li>
			{/each}
		</ol>
	{:else}
		<div class="text-center py-8">
			<p class="text-fg-muted text-sm">{emptyMessage}</p>
		</div>
	{/if}
</div>
