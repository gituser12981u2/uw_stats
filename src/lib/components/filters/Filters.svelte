<script lang="ts">
	import ActiveFilterChip from './ActiveFilterChip.svelte';
	import SearchableDropdownFilter from './SearchableDropdownFilter.svelte';
	import SelectFilter from './SelectFilter.svelte';

	let {
		departments = [],
		years = [],
		instructors = [],
		selectedDepartment = $bindable(''),
		selectedYear = $bindable(''),
		selectedInstructor = $bindable(''),
		searchQuery = $bindable(''),
		isLoading = false
	}: {
		departments?: string[];
		years?: string[];
		instructors?: string[];
		selectedDepartment?: string;
		selectedYear?: string;
		selectedInstructor?: string;
		searchQuery?: string;
		isLoading?: boolean;
	} = $props();

	// eslint-disable-next-line svelte/prefer-writable-derived
	let departmentSearch = $state('');
	// eslint-disable-next-line svelte/prefer-writable-derived
	let instructorSearch = $state('');

	const activeFilterCount = $derived(
		[selectedDepartment, selectedYear, selectedInstructor, searchQuery.trim()].filter(Boolean)
			.length
	);

	$effect(() => {
		departmentSearch = selectedDepartment;
	});

	$effect(() => {
		instructorSearch = selectedInstructor;
	});

	function clearDepartment() {
		selectedDepartment = '';
		departmentSearch = '';
	}

	function clearInstructor() {
		selectedInstructor = '';
		instructorSearch = '';
	}

	function clearYear() {
		selectedYear = '';
	}

	function clearSearch() {
		searchQuery = '';
	}

	function clearAllFilters() {
		selectedDepartment = '';
		selectedYear = '';
		selectedInstructor = '';
		searchQuery = '';
		departmentSearch = '';
		instructorSearch = '';
	}

	function truncateInstructor(name: string): string {
		return name.length > 20 ? `${name.slice(0, 20)}...` : name;
	}
</script>

<div class="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="text-xl font-semibold text-gray-800">Filter Options</h3>

		{#if activeFilterCount > 0}
			<button
				onclick={clearAllFilters}
				class="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-200"
				disabled={isLoading}
			>
				Clear All ({activeFilterCount})
			</button>
		{/if}
	</div>

	<!-- Main Search -->
	<div class="mb-6">
		<div class="relative">
			<label for="main-search" class="sr-only">Search courses by title or number</label>

			<input
				id="main-search"
				type="text"
				class="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pl-12 text-lg transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
				placeholder="Search courses by title or number..."
				disabled={isLoading}
				bind:value={searchQuery}
			/>

			<div class="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" aria-hidden="true">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>

			{#if searchQuery}
				<button
					type="button"
					class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
					disabled={isLoading}
					onclick={clearSearch}
					aria-label="Clear search"
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
		</div>
	</div>

	<!-- Filter Pills -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<SearchableDropdownFilter
			id="department-search"
			label="Department"
			placeholder="Search departments..."
			options={departments}
			bind:selectedValue={selectedDepartment}
			bind:searchValue={departmentSearch}
			{isLoading}
		/>

		<SelectFilter
			id="year-select"
			label="Academic Year"
			allLabel="All Years"
			options={years}
			bind:selectedValue={selectedYear}
			onClear={clearYear}
			{isLoading}
		/>

		<SearchableDropdownFilter
			id="instructor-search"
			label="Instructor"
			placeholder="Search instructors..."
			options={instructors}
			bind:selectedValue={selectedInstructor}
			bind:searchValue={instructorSearch}
		/>
	</div>

	<!-- Active Filters Display -->
	{#if activeFilterCount > 0}
		<div class="mt-6 border-t border-gray-200 pt-4">
			<div class="flex flex-wrap gap-2">
				<span class="mr-2 text-sm font-medium text-gray-600">Active filters:</span>

				{#if searchQuery.trim()}
					<ActiveFilterChip
						label="Search"
						value={searchQuery}
						color="bg-blue-100 text-blue-800"
						onClear={clearSearch}
						{isLoading}
					/>
				{/if}

				{#if selectedDepartment}
					<ActiveFilterChip
						label="Department"
						value={selectedDepartment}
						color="bg-blue-100 text-blue-800"
						onClear={clearDepartment}
						{isLoading}
					/>
				{/if}

				{#if selectedYear}
					<ActiveFilterChip
						label="Year"
						value={selectedYear}
						color="bg-green-100 text-green-800"
						onClear={clearYear}
						{isLoading}
					/>
				{/if}

				{#if selectedInstructor}
					<ActiveFilterChip
						label="Instructor"
						value={truncateInstructor(selectedInstructor)}
						color="bg-purple-100 text-purple-800"
						onClear={clearInstructor}
						{isLoading}
					/>
				{/if}
			</div>
		</div>
	{/if}
</div>
