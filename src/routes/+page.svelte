<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import GradeChart from '$lib/components/GradeChart.svelte';
	import Filters from '$lib/components/Filters.svelte';
	import TopCoursesTable from '$lib/components/TopCoursesTable.svelte';
	import { loadDataFromFiles } from '$lib/data/loadData';
	import type { CombinedCourseData, CourseStats } from '$lib/types';
	import {
		calculateStats,
		combineData,
		filterData,
		getUniqueValues
	} from '$lib/utils/dataProcessor';

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
				console.error('Error in onMount:', error);
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
			<!-- Loading State -->
			<div class="flex h-64 flex-col items-center justify-center">
				<div class="mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600"></div>
				<p class="text-lg text-gray-600">Loading course data...</p>
			</div>
		{:else if !dataLoaded}
			<!-- Error State -->
			<div class="py-16 text-center">
				<h2 class="mb-4 text-2xl font-bold text-red-600">Error Loading Data</h2>
				<p class="text-gray-600">Please refresh the page to try again.</p>
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
