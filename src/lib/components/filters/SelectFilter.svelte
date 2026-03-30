<script lang="ts">
	let {
		id,
		label,
		options = [],
		allLabel,
		selectedValue = $bindable(''),
		isLoading = false,
		onClear
	}: {
		id: string;
		label: string;
		options?: string[];
		allLabel: string;
		selectedValue?: string;
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

<div>
	<label for={id} class="mb-2 block text-sm font-semibold tracking-wide text-gray-700 uppercase">
		{label}
	</label>

	<div class="relative">
		<select
			{id}
			class="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 pr-10 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
			disabled={isLoading}
			bind:value={selectedValue}
		>
			<option value="">{allLabel}</option>
			{#each options as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>

		{#if selectedValue}
			<button
				type="button"
				class="absolute top-1/2 right-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
				disabled={isLoading}
				onclick={onClear}
				onkeydown={(e) => handleKeydown(e, onClear)}
				aria-label={`Clear ${label.toLowerCase()} filter`}
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}

		<div
			class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
			aria-hidden="true"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</div>
</div>
