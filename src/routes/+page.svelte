<script lang="ts">
	import StatCard from '$lib/components/StatCard.svelte';
	import ScatterChart from '$lib/components/ScatterChart.svelte';
	import GradeChart from '$lib/components/GradeChart.svelte';
	import TopCoursesTable from '$lib/components/TopCoursesTable.svelte';
	import Filters from '$lib/components/Filters.svelte';
	import type {
		CourseIndexEntry,
		CourseStats,
		FilterOptions,
		GradeDistributionItem
	} from '$lib/types';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	type PageData = {
		filterOptions: FilterOptions;
		courses: CourseIndexEntry[];
		gradeDistribution: GradeDistributionItem[];
		filters: {
			search: string;
			department: string;
			year: string;
			instructor: string;
		};
	};

	let { data }: { data: PageData } = $props();

	let selectedDepartment = $state('');
	let selectedYear = $state('');
	let selectedInstructor = $state('');
	let searchQuery = $state('');

	let hasInitializedSearch = $state(false);

	$effect(() => {
		if (hasInitializedSearch) return;

		searchQuery = data.filters.search;
		hasInitializedSearch = true;
	});

	let isSyncingFromData = $state(false);

	$effect(() => {
		const nextDepartment = data.filters.department;
		const nextYear = data.filters.year;
		const nextInstructor = data.filters.instructor;

		isSyncingFromData = true;
		selectedDepartment = nextDepartment;
		selectedYear = nextYear;
		selectedInstructor = nextInstructor;

		queueMicrotask(() => {
			isSyncingFromData = false;
		});
	});

	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	const filterOptions = $derived(data.filterOptions);
	const gradeDistribution = $derived(data.gradeDistribution);
	const departments = $derived(filterOptions.departments);
	const years = $derived(filterOptions.years);
	const instructors = $derived(filterOptions.instructors);
	const courses = $derived(data.courses);

	const hasActiveFilters = $derived(
		!!selectedDepartment || !!selectedYear || !!selectedInstructor || !!searchQuery.trim()
	);

	const stats = $derived(calculateCourseIndexStats(courses));

	function calculateCourseIndexStats(data: CourseIndexEntry[]): CourseStats {
		let totalStudents = 0;
		let gpaSum = 0;
		let gpaCount = 0;
		let ratingSum = 0;
		let ratingCount = 0;

		for (const course of data) {
			totalStudents += course.totalStudents || 0;

			if (course.averageGPA > 0) {
				gpaSum += course.averageGPA;
				gpaCount++;
			}

			if (typeof course.averageRating === 'number' && course.averageRating > 0) {
				ratingSum += course.averageRating;
				ratingCount++;
			}
		}

		return {
			totalCourses: data.length,
			avgGPA: gpaCount > 0 ? gpaSum / gpaCount : 0,
			avgRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
			totalStudents
		};
	}

	function buildQueryString(filters?: {
		search: string;
		department: string;
		year: string;
		instructor: string;
	}) {
		const current = filters ?? {
			search: searchQuery,
			department: selectedDepartment,
			year: selectedYear,
			instructor: selectedInstructor
		};

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams();

		if (current.search.trim()) {
			params.set('search', current.search.trim());
		}

		if (current.department) {
			params.set('department', current.department);
		}

		if (current.year) {
			params.set('year', current.year);
		}

		if (current.instructor) {
			params.set('instructor', current.instructor);
		}

		const query = params.toString();
		return query ? `${resolve('/')}?${query}` : resolve('/');
	}

	async function navigateToFilters() {
		const nextUrl = buildQueryString();
		const currentUrl = buildQueryString(data.filters);

		if (nextUrl === currentUrl) {
			return;
		}

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(nextUrl, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	function scheduleNavigate() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(() => {
			void navigateToFilters();
		}, 250);
	}

	$effect(() => {
		if (isSyncingFromData) return;

		const changed =
			selectedDepartment !== data.filters.department ||
			selectedYear !== data.filters.year ||
			selectedInstructor !== data.filters.instructor;

		if (changed) {
			void navigateToFilters();
		}
	});

	$effect(() => {
		if (isSyncingFromData) return;

		if (searchQuery !== data.filters.search) {
			scheduleNavigate();
		}
	});

	$effect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	});
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

		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<StatCard
				value={stats.totalCourses}
				label={hasActiveFilters ? 'Matching Courses' : 'Total Courses'}
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
				label={hasActiveFilters ? 'Students in Results' : 'Total Students'}
				gradient="from-purple-500 to-purple-600"
			/>
		</div>

		<Filters
			bind:selectedDepartment
			bind:selectedYear
			bind:selectedInstructor
			bind:searchQuery
			{departments}
			{years}
			{instructors}
			isLoading={false}
		/>

		<div class="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
			<ScatterChart data={courses} />
			<GradeChart data={gradeDistribution} />
		</div>

		<TopCoursesTable data={courses} {hasActiveFilters} />
	</div>
</div>
