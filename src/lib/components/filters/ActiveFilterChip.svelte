<script lang="ts">
	let {
		label,
		value,
		color,
		isLoading = false,
		onClear
	}: {
		label: string;
		value: string;
		color: string;
		isLoading?: boolean;
		onClear: () => void;
	} = $props();

	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}
</script>

<span class={`inline-flex items-center rounded-full px-3 py-1 text-sm ${color}`}>
	{label}: {value}
	<button
		type="button"
		class="ml-2 transition-colors disabled:cursor-not-allowed"
		disabled={isLoading}
		onclick={onClear}
		onkeydown={(e) => handleKeydown(e, onClear)}
		aria-label={`Remove ${label.toLowerCase()} filter`}
	>
		<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
</span>
