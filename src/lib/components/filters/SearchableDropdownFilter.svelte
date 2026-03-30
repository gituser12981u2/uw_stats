<script lang="ts">
	import { tick } from 'svelte';

	type SearchDropdownKeydownConfig = {
		options: string[];
		isOpen: boolean;
		highlightedIndex: number;
		setOpen: (value: boolean) => void;
		setHighlightedIndex: (value: number) => void;
		onSelect: (value: string) => void;
	};

	let {
		id,
		label,
		placeholder,
		options = [],
		selectedValue = $bindable(''),
		searchValue = $bindable(''),
		isLoading = false
	}: {
		id: string;
		label: string;
		placeholder: string;
		options?: string[];
		selectedValue?: string;
		searchValue?: string;
		isLoading?: boolean;
	} = $props();

	let showDropdown = $state(false);
	let highlightedIndex = $state(-1);
	let root: HTMLDivElement | undefined;

	let dropdownList = $state<HTMLDivElement | undefined>(undefined);
	let optionElements: Array<HTMLButtonElement | undefined> = [];

	const DROPDOWN_LIMIT = 20;

	const filteredOptions = $derived(
		options
			.filter((option) => {
				const q = searchValue.trim().toLowerCase();
				if (!q) return true;
				return option.toLowerCase().includes(q);
			})
			.slice(0, DROPDOWN_LIMIT)
	);

	function selectOption(value: string) {
		selectedValue = value;
		searchValue = value;
		showDropdown = false;
		highlightedIndex = -1;
	}

	function clearValue() {
		selectedValue = '';
		searchValue = '';
		showDropdown = false;
		highlightedIndex = -1;
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchValue = target.value;
		showDropdown = true;
		highlightedIndex = filteredOptions.length > 0 ? 0 : -1;

		if (!target.value.trim()) {
			selectedValue = '';
		}
	}

	function handleOptionKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}

	function handleSearchKeydown(
		event: KeyboardEvent,
		{
			options,
			isOpen,
			highlightedIndex,
			setOpen,
			setHighlightedIndex,
			onSelect
		}: SearchDropdownKeydownConfig
	) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setOpen(true);

			if (options.length === 0) return;

			if (highlightedIndex < 0) {
				setHighlightedIndex(0);
			} else {
				setHighlightedIndex(Math.min(highlightedIndex + 1, options.length - 1));
			}

			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			setOpen(true);

			if (options.length === 0) return;

			if (highlightedIndex < 0) {
				setHighlightedIndex(options.length - 1);
			} else {
				setHighlightedIndex(Math.max(highlightedIndex - 1, 0));
			}

			return;
		}

		if (event.key === 'Enter') {
			if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
				event.preventDefault();
				onSelect(options[highlightedIndex]);
			}

			return;
		}

		if (event.key === 'Escape') {
			setOpen(false);
			setHighlightedIndex(-1);
		}
	}

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as Node;
		if (root && !root.contains(target)) {
			showDropdown = false;
			highlightedIndex = -1;
		}
	}

	$effect(() => {
		const index = highlightedIndex;

		void (async () => {
			if (!showDropdown || index < 0) return;

			await tick();
			optionElements[index]?.scrollIntoView({
				block: 'nearest'
			});
		})();
	});
</script>

<svelte:window onclick={handleWindowClick} />

<div class="relative" bind:this={root}>
	<label for={id} class="mb-2 block text-sm font-semibold tracking-wide text-gray-700 uppercase">
		{label}
	</label>

	<div class="relative">
		<input
			{id}
			type="text"
			class="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
			{placeholder}
			disabled={isLoading}
			value={searchValue}
			oninput={handleInput}
			onfocus={() => {
				showDropdown = true;
				highlightedIndex = filteredOptions.length > 0 ? 0 : -1;
			}}
			onkeydown={(event) =>
				handleSearchKeydown(event, {
					options: filteredOptions,
					isOpen: showDropdown,
					highlightedIndex,
					setOpen: (value) => (showDropdown = value),
					setHighlightedIndex: (value) => (highlightedIndex = value),
					onSelect: selectOption
				})}
			autocomplete="off"
		/>

		{#if selectedValue}
			<button
				type="button"
				class="absolute top-1/2 right-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
				disabled={isLoading}
				onclick={clearValue}
				onkeydown={(e) => handleOptionKeydown(e, clearValue)}
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

		<div class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" aria-hidden="true">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</div>

	{#if showDropdown && filteredOptions.length > 0 && !isLoading}
		<div
			bind:this={dropdownList}
			class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
			role="listbox"
			aria-label="Department options"
		>
			{#each filteredOptions as option, i (option)}
				<button
					bind:this={optionElements[i]}
					type="button"
					class={`w-full px-4 py-2 text-left transition-colors focus:outline-none ${
						highlightedIndex === i
							? 'bg-blue-50'
							: option === selectedValue
								? 'bg-blue-100 text-blue-800'
								: 'hover:bg-blue-50 focus:bg-blue-50'
					}`}
					onclick={() => selectOption(option)}
					onkeydown={(e) => handleOptionKeydown(e, () => selectOption(option))}
					role="option"
					aria-selected={option === selectedValue}
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}
</div>
