<script lang="ts">
	// Props
	export let departments: string[] = [];
	export let years: string[] = [];
	export let instructors: string[] = [];
	export let selectedDepartment = '';
	export let selectedYear = '';
	export let selectedInstructor = '';
	export let searchQuery = '';
	export let isLoading = false;

	// Internal state for autocomplete
	let departmentSearch = selectedDepartment;
	let instructorSearch = selectedInstructor;
	let showDeptDropdown = false;
	let showInstructorDropdown = false;

	// Debounce handlers
	let departmentTimeout: number;
	let instructorTimeout: number;

	// Element references
	let deptDropdown: HTMLDivElement;
	let instructorDropdown: HTMLDivElement;

	// Configuration
	const DROPDOWN_LIMIT = 20;
	const SEARCH_DEBOUNCE_MS = 150;

	// Computed values
	$: filteredDepartments = departments
		.filter((dept) => {
			if (!departmentSearch || departmentSearch.length < 1) {
				return true;
			}
			return dept.toLowerCase().includes(departmentSearch.toLowerCase());
		})
		.slice(0, DROPDOWN_LIMIT);

	$: filteredInstructors = instructors
		.filter((instructor) => {
			if (!instructorSearch || instructorSearch.length < 1) {
				return true;
			}
			return instructor.toLowerCase().includes(instructorSearch.toLowerCase());
		})
		.slice(0, DROPDOWN_LIMIT);

	// Sync internal search with selected values
	$: departmentSearch = selectedDepartment;
	$: instructorSearch = selectedInstructor;

	// Debounced search
	let searchTimeout: number;

	function selectDepartment(dept: string) {
		selectedDepartment = dept;
		departmentSearch = dept;
		showDeptDropdown = false;
	}

	function selectInstructor(instructor: string) {
		selectedInstructor = instructor;
		instructorSearch = instructor;
		showInstructorDropdown = false;
	}

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

	function clearAllFilters() {
		selectedDepartment = '';
		selectedYear = '';
		selectedInstructor = '';
		searchQuery = '';
		departmentSearch = '';
		instructorSearch = '';
	}

	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as Node;

		if (deptDropdown && !deptDropdown.contains(target)) {
			showDeptDropdown = false;
		}
		if (instructorDropdown && !instructorDropdown.contains(target)) {
			showInstructorDropdown = false;
		}
	}

	function debouncedSearch(event: Event) {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const target = event.target as HTMLInputElement;
			searchQuery = target.value;
		}, SEARCH_DEBOUNCE_MS);
	}

	function debouncedDepartmentSearch(event: Event) {
		clearTimeout(departmentTimeout);
		departmentTimeout = setTimeout(() => {
			const target = event.target as HTMLInputElement;
			departmentSearch = target.value;
			showDeptDropdown = true;
		}, SEARCH_DEBOUNCE_MS);
	}

	function debouncedInstructorSearch(event: Event) {
		clearTimeout(instructorTimeout);
		instructorTimeout = setTimeout(() => {
			const target = event.target as HTMLInputElement;
			instructorSearch = target.value;
			showInstructorDropdown = true;
		}, SEARCH_DEBOUNCE_MS);
	}

	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}

	// Computed filter count
	$: activeFilterCount = [selectedDepartment, selectedYear, selectedInstructor].filter(
		Boolean
	).length;
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="text-xl font-semibold text-gray-800">Filter Options</h3>
		{#if activeFilterCount > 0}
			<button
				on:click={clearAllFilters}
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
				on:input={debouncedSearch}
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
		</div>
	</div>

	<!-- Filter Pills -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<!-- Department Filter -->
		<div class="relative" bind:this={deptDropdown}>
			<label
				for="department-search"
				class="mb-2 block text-sm font-semibold tracking-wide text-gray-700 uppercase"
			>
				Department
			</label>
			<div class="relative">
				<input
					id="department-search"
					type="text"
					class="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
					placeholder="Search departments..."
					disabled={isLoading}
					bind:value={departmentSearch}
					on:input={() => debouncedDepartmentSearch}
					on:focus={() => (showDeptDropdown = true)}
				/>

				{#if selectedDepartment}
					<button
						class="absolute top-1/2 right-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
						disabled={isLoading}
						on:click={clearDepartment}
						on:keydown={(e) => handleKeydown(e, clearDepartment)}
						aria-label="Clear department filter"
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
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>

			{#if showDeptDropdown && filteredDepartments.length > 0 && !isLoading}
				<div
					class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
					role="listbox"
					aria-label="Department options"
				>
					{#each filteredDepartments as dept (dept)}
						<button
							class="w-full px-4 py-2 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none {dept ===
							selectedDepartment
								? 'bg-blue-100 text-blue-800'
								: ''}"
							on:click={() => selectDepartment(dept)}
							on:keydown={(e) => handleKeydown(e, () => selectDepartment(dept))}
							role="option"
							aria-selected={dept === selectedDepartment}
						>
							{dept}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Academic Year Filter -->
		<div>
			<label
				for="year-select"
				class="mb-2 block text-sm font-semibold tracking-wide text-gray-700 uppercase"
			>
				Academic Year
			</label>
			<div class="relative">
				<select
					id="year-select"
					class="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 pr-10 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
					disabled={isLoading}
					bind:value={selectedYear}
				>
					<option value="">All Years</option>
					{#each years as year (year)}
						<option value={year}>{year}</option>
					{/each}
				</select>

				{#if selectedYear}
					<button
						class="absolute top-1/2 right-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
						disabled={isLoading}
						on:click={clearYear}
						on:keydown={(e) => handleKeydown(e, clearYear)}
						aria-label="Clear year filter"
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
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>
		</div>

		<!-- Instructor Filter -->
		<div class="relative" bind:this={instructorDropdown}>
			<label
				for="instructor-search"
				class="mb-2 block text-sm font-semibold tracking-wide text-gray-700 uppercase"
			>
				Instructor
			</label>
			<div class="relative">
				<input
					id="instructor-search"
					type="text"
					class="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-10 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
					placeholder="Search instructors..."
					disabled={isLoading}
					bind:value={instructorSearch}
					on:input={() => debouncedInstructorSearch}
					on:focus={() => (showInstructorDropdown = true)}
				/>

				{#if selectedInstructor}
					<button
						class="absolute top-1/2 right-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
						disabled={isLoading}
						on:click={clearInstructor}
						on:keydown={(e) => handleKeydown(e, clearInstructor)}
						aria-label="Clear instructor filter"
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
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>

			{#if showInstructorDropdown && filteredInstructors.length > 0 && !isLoading}
				<div
					class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
					role="listbox"
					aria-label="Instructor options"
				>
					{#each filteredInstructors as instructor (instructor)}
						<button
							class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none {instructor ===
							selectedInstructor
								? 'bg-blue-100 text-blue-800'
								: ''}"
							on:click={() => selectInstructor(instructor)}
							on:keydown={(e) => handleKeydown(e, () => selectInstructor(instructor))}
							role="option"
							aria-selected={instructor === selectedInstructor}
						>
							{instructor}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Active Filters Display -->
	{#if activeFilterCount > 0}
		<div class="mt-6 border-t border-gray-200 pt-4">
			<div class="flex flex-wrap gap-2">
				<span class="mr-2 text-sm font-medium text-gray-600">Active filters:</span>

				{#if selectedDepartment}
					<span
						class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
					>
						Department: {selectedDepartment}
						<button
							class="ml-2 transition-colors hover:text-blue-600 disabled:cursor-not-allowed"
							disabled={isLoading}
							on:click={clearDepartment}
							on:keydown={(e) => handleKeydown(e, clearDepartment)}
							aria-label="Remove department filter"
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
				{/if}

				{#if selectedYear}
					<span
						class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
					>
						Year: {selectedYear}
						<button
							class="ml-2 transition-colors hover:text-green-600 disabled:cursor-not-allowed"
							disabled={isLoading}
							on:click={clearYear}
							on:keydown={(e) => handleKeydown(e, clearYear)}
							aria-label="Remove year filter"
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
				{/if}

				{#if selectedInstructor}
					<span
						class="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
					>
						Instructor: {selectedInstructor.length > 20
							? `${selectedInstructor.substring(0, 20)}...`
							: selectedInstructor}
						<button
							class="ml-2 transition-colors hover:text-purple-600 disabled:cursor-not-allowed"
							disabled={isLoading}
							on:click={clearInstructor}
							on:keydown={(e) => handleKeydown(e, clearInstructor)}
							aria-label="Remove instructor filter"
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
				{/if}
			</div>
		</div>
	{/if}
</div>
