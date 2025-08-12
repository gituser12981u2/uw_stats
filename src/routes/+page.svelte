<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import GradeChart from '$lib/components/GradeChart.svelte';
	import Filters from '$lib/components/Filters.svelte';
	import TopCoursesTable from '$lib/components/TopCoursesTable.svelte';
	import type { CombinedCourseData, CourseStats } from '$lib/types';
	import { calculateStats, filterData } from '$lib/utils/dataProcessor';

	let combinedData: CombinedCourseData[] = [];
	let filteredData: CombinedCourseData[] = [];
	let stats: CourseStats = { totalCourses: 0, avgGPA: 0, avgRating: 0, totalStudents: 0 };

	let departments: string[] = [];
	let years: string[] = [];
	let instructors: string[] = [];

	// Filter state - these will be bound to the Filters component
	let selectedDepartment = '';
	let selectedYear = '';
	let selectedInstructor = '';
	let searchQuery = '';

	// Loading states
	let isLoading = true;
	let dataLoaded = false;

	onMount(async () => {
		try {
			// Load from static JSON files
			const [combinedResponse, filtersResponse] = await Promise.all([
				fetch('/data/processed/combined-data.json'),
				fetch('/data/processed/filter-options.json')
			]);

			if (combinedResponse.ok && filtersResponse.ok) {
				const [data, filters] = await Promise.all([
					combinedResponse.json(),
					filtersResponse.json()
				]);

				combinedData = data;
				departments = filters.departments;
				years = filters.years;
				instructors = filters.instructors;

				dataLoaded = true;
				updateFilteredData();
			} else {
				throw new Error('Failed to load static data files');
			}
		} catch (error) {
			console.error('Error loading static data, falling back to CSV parsing:', error);

			try {
				const { loadDataFromFiles } = await import('$lib/data/loadData');
				const { combineData, getUniqueValues } = await import('$lib/utils/dataProcessor');

				const data = await loadDataFromFiles();
				if (data) {
					const { gradesData, evalParamsData, evalMediansData } = data;
					combinedData = combineData(gradesData, evalParamsData, evalMediansData);

					departments = getUniqueValues(combinedData, 'department');
					years = getUniqueValues(combinedData, 'Academic_Year');
					instructors = getUniqueValues(combinedData, 'Primary_Instructor');

					dataLoaded = true;
					updateFilteredData();
				}
			} catch (fallbackError) {
				console.error('Error in onMount:', fallbackError);
			}
		} finally {
			isLoading = false;
		}
	});

	function updateFilteredData() {
		if (!dataLoaded || !combinedData.length) return;

		filteredData = filterData(combinedData, {
			department: selectedDepartment,
			year: selectedYear,
			instructor: selectedInstructor,
			search: searchQuery
		});

		stats = calculateStats(filteredData);
	}

	// Reactive statements that trigger when filter values change
	$: if (dataLoaded && combinedData.length > 0) {
		filteredData = filterData(combinedData, {
			department: selectedDepartment,
			year: selectedYear,
			instructor: selectedInstructor,
			search: searchQuery
		});
		stats = calculateStats(filteredData);
	}
</script>

<svelte:head>
	<title>UW Course Analytics</title>
	<meta
		name="description"
		content="Comprehensive analysis of UW course grades and student evaluations"
	/>
	<meta property="og:title" content="UW Course Analytics" />
	<meta
		property="og:description"
		content="Comprehensive analysis of UW course grades and student evaluations"
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1
				class="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent"
			>
				UW Course Analytics
			</h1>
			<p class="text-xl font-light text-gray-600">
				Analysis of course grades and student evaluations
			</p>
		</div>

		{#if isLoading}
			<!-- Loading State with Complete Skeleton -->
			<div class="space-y-8">
				<!-- Stats Grid Skeleton -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{#each Array(4) as _, index (index)}
						<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
							<div
								class="mb-4 h-1 animate-pulse rounded-full bg-gradient-to-r from-gray-200 to-gray-300"
							></div>
							<div class="space-y-2 text-center">
								<div class="h-10 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Filters Skeleton -->
				<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
					<div class="mb-6 flex items-center justify-between">
						<div class="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
					</div>

					<!-- Main Search Skeleton -->
					<div class="mb-6">
						<div class="h-12 animate-pulse rounded-xl bg-gray-200"></div>
					</div>

					<!-- Filter Pills Skeleton -->
					<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
						{#each Array(3) as _, index (index)}
							<div>
								<div class="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
								<div class="h-12 animate-pulse rounded-xl bg-gray-200"></div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Charts Skeleton -->
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<!-- Scatter Chart Skeleton -->
					<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
						<div class="mb-6 flex items-center justify-between">
							<div class="h-6 w-64 animate-pulse rounded bg-gray-200"></div>
							<div class="flex gap-2">
								<div class="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
								<div class="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
							</div>
						</div>
						<div class="h-96 animate-pulse rounded bg-gray-200"></div>
						<div class="mt-4 text-center">
							<div class="mx-auto h-4 w-80 animate-pulse rounded bg-gray-200"></div>
						</div>
					</div>

					<!-- Grade Chart Skeleton -->
					<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
						<div class="mx-auto mb-6 h-6 w-40 animate-pulse rounded bg-gray-200"></div>
						<div class="h-96 animate-pulse rounded bg-gray-200"></div>
					</div>
				</div>

				<!-- Top Courses Table Skeleton -->
				<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
					<div class="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200"></div>

					<div class="overflow-x-auto">
						<!-- Table Header Skeleton -->
						<div class="mb-4 grid grid-cols-6 gap-4 border-b-2 border-gray-200 pb-4">
							{#each ['Course', 'Title', 'Offerings', 'Students', 'Avg GPA', 'Avg Rating'] as header (header)}
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
							{/each}
						</div>

						<!-- Table Rows Skeleton -->
						{#each Array(10) as _, index (index)}
							<div class="grid grid-cols-6 gap-4 border-b border-gray-100 py-4">
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 animate-pulse rounded bg-gray-200"></div>
							</div>
						{/each}
					</div>

					<div class="mt-4 text-center">
						<div class="mx-auto h-4 w-64 animate-pulse rounded bg-gray-200"></div>
					</div>
				</div>
			</div>
		{:else if !dataLoaded}
			<!-- Error State -->
			<div class="py-16 text-center">
				<h2 class="mb-4 text-2xl font-bold text-red-600">Error Loading Data</h2>
				<p class="text-gray-600">Please refresh the page to try again.</p>
				<button
					on:click={() => window.location.reload()}
					class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Refresh Page
				</button>
			</div>
		{:else}
			<!-- Main Content -->

			<!-- Stats Grid -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					value={stats.totalCourses}
					label="Total Courses"
					gradient="from-blue-500 to-blue-600"
				/>
				<StatCard
					value={stats.avgGPA.toFixed(2)}
					label="Average GPA"
					gradient="from-green-500 to-green-600"
				/>
				<StatCard
					value={stats.avgRating.toFixed(2)}
					label="Average Rating"
					gradient="from-yellow-500 to-orange-500"
				/>
				<StatCard
					value={stats.totalStudents.toLocaleString()}
					label="Total Students"
					gradient="from-purple-500 to-purple-600"
				/>
			</div>

			<!-- Filters with Two-Way Binding -->
			<Filters
				{departments}
				{years}
				{instructors}
				bind:selectedDepartment
				bind:selectedYear
				bind:selectedInstructor
				bind:searchQuery
			/>

			<!-- Charts -->
			<div class="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
				<ScatterChart data={filteredData} />
				<GradeChart data={filteredData} />
			</div>

			<!-- Top Courses Table -->
			<TopCoursesTable data={filteredData} />
		{/if}
	</div>
</div>
