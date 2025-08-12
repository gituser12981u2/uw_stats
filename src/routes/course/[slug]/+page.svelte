<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import StatCard from '$lib/components/StatCard.svelte';
	import GradeChart from '$lib/components/GradeChart.svelte';

	import type { CombinedCourseData } from '$lib/types';

	// Get slug from page parameters
	export let data: { slug: string };

	let courseData: CombinedCourseData[] = [];
	let loading = true;
	let courseInfo: {
		title: string;
		department: string;
		number: string;
		totalOfferings: number;
		totalStudents: number;
		averageGPA: number;
		averageRating: number | null;
	} | null = null;

	// Extract course info from URL slug (format: DEPT-NUMBER like CSE-142)
	$: slug = data.slug;
	$: [department, courseNumber] = slug ? slug.split('-') : ['', ''];

	onMount(async () => {
		try {
			const combinedResponse = await fetch('/data/processed/combined-data.json');

			if (!combinedResponse.ok) {
				const combinedData: CombinedCourseData[] = await combinedResponse.json();

				// Filter for this specific course
				courseData = combinedData.filter(
					(item) => item.department === department && item.courseNumber === courseNumber
				);
			} else {
				const { loadDataFromFiles } = await import('$lib/data/loadData');
				const { combineData } = await import('$lib/utils/dataProcessor');

				const loadedData = await loadDataFromFiles();
				if (loadedData) {
					let combinedData: CombinedCourseData[];

					// Check if we got pre-processed data or need to combine CSV data
					if (loadedData.combinedData) {
						combinedData = loadedData.combinedData;
					} else if (
						loadedData.gradesData &&
						loadedData.evalParamsData &&
						loadedData.evalMediansData
					) {
						const { gradesData, evalParamsData, evalMediansData } = loadedData;
						combinedData = combineData(gradesData, evalParamsData, evalMediansData);
					} else {
						throw new Error('No valid data loaded');
					}

					// Filter for this specific course
					courseData = combinedData.filter(
						(item) => item.department === department && item.courseNumber === courseNumber
					);
				}
			}

			console.log(`Found ${courseData.length} offerings for ${department} ${courseNumber}`);

			if (courseData.length === 0) {
				console.log('No data found for course:', department, courseNumber);
			} else {
				// Get course info from the first entry
				const ratingsData = courseData.filter(
					(d) => d.evalMedian?.MedianGlobal && d.evalMedian.MedianGlobal > 0
				);

				courseInfo = {
					title: courseData[0].Course_Title,
					department: department,
					number: courseNumber,
					totalOfferings: courseData.length,
					totalStudents: courseData.reduce((sum, d) => sum + (d.Student_Count || 0), 0),
					averageGPA: courseData.reduce((sum, d) => sum + d.Average_GPA, 0) / courseData.length,
					averageRating:
						ratingsData.length > 0
							? ratingsData.reduce((sum, d) => sum + (d.evalMedian?.MedianGlobal || 0), 0) /
								ratingsData.length
							: null
				};

				console.log('Course info calculated:', courseInfo);
			}
		} catch (error) {
			console.error('Error loading course data:', error);
		} finally {
			loading = false;
		}
	});

	function goBack() {
		goto('/');
	}

	function getGradeDistribution() {
		if (!courseData.length) return [];

		const totalGrades = courseData.reduce(
			(acc, course) => {
				acc.A += course.A || 0;
				acc['A-'] += course['A-'] || 0;
				acc['B+'] += course['B+'] || 0;
				acc.B += course.B || 0;
				acc['B-'] += course['B-'] || 0;
				acc['C+'] += course['C+'] || 0;
				acc.C += course.C || 0;
				acc['C-'] += course['C-'] || 0;
				acc['D+'] += course['D+'] || 0;
				acc.D += course.D || 0;
				acc['D-'] += course['D-'] || 0;
				acc.F += course.F || 0;
				return acc;
			},
			{
				A: 0,
				'A-': 0,
				'B+': 0,
				B: 0,
				'B-': 0,
				'C+': 0,
				C: 0,
				'C-': 0,
				'D+': 0,
				D: 0,
				'D-': 0,
				F: 0
			}
		);

		const total = Object.values(totalGrades).reduce((a, b) => a + b, 0);

		return Object.entries(totalGrades).map(([grade, count]) => ({
			grade,
			count,
			percentage: total > 0 ? (count / total) * 100 : 0
		}));
	}

	function getInstructorStats() {
		if (!courseData.length) return [];

		const instructorMap = new Map();

		courseData.forEach((course) => {
			const instructor = course.Primary_Instructor;
			if (!instructorMap.has(instructor)) {
				instructorMap.set(instructor, {
					name: instructor,
					offerings: 0,
					totalStudents: 0,
					totalGPA: 0,
					ratings: []
				});
			}

			const stats = instructorMap.get(instructor);
			stats.offerings++;
			stats.totalStudents += course.Student_Count || 0;
			stats.totalGPA += course.Average_GPA;
			if (course.evalMedian?.MedianGlobal && course.evalMedian.MedianGlobal > 0) {
				stats.ratings.push(course.evalMedian.MedianGlobal);
			}
		});

		return Array.from(instructorMap.values())
			.map((instructor) => ({
				...instructor,
				averageGPA: instructor.totalGPA / instructor.offerings,
				averageRating:
					instructor.ratings.length > 0
						? instructor.ratings.reduce((a: number, b: number) => a + b, 0) /
							instructor.ratings.length
						: null
			}))
			.sort((a, b) => b.offerings - a.offerings);
	}
</script>

<svelte:head>
	<title
		>{courseInfo
			? `${courseInfo.department} ${courseInfo.number} - ${courseInfo.title}`
			: 'Course Details'} | UW Course Analytics</title
	>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
	<div class="container mx-auto px-4 py-8">
		{#if loading}
			<div class="flex h-64 items-center justify-center">
				<div class="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
			</div>
		{:else if !courseInfo}
			<div class="py-16 text-center">
				<h1 class="mb-4 text-3xl font-bold text-gray-800">Course Not Found</h1>
				<p class="mb-8 text-gray-600">
					The course {department}
					{courseNumber} was not found in our database.
				</p>
				<button
					on:click={goBack}
					class="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
				>
					← Back to Search
				</button>
			</div>
		{:else}
			<!-- Header -->
			<div class="mb-8">
				<button
					on:click={goBack}
					class="mb-4 flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-800"
				>
					← Back to Search
				</button>

				<h1 class="mb-2 text-4xl font-bold text-gray-800">
					{courseInfo.department}
					{courseInfo.number}
				</h1>
				<h2 class="mb-4 text-2xl text-gray-600">{courseInfo.title}</h2>
			</div>

			<!-- Course Stats -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					value={courseInfo.totalOfferings}
					label="Total Offerings"
					gradient="from-blue-500 to-blue-600"
				/>
				<StatCard
					value={courseInfo.averageGPA.toFixed(2)}
					label="Average GPA"
					gradient="from-green-500 to-green-600"
				/>
				<StatCard
					value={courseInfo.averageRating ? courseInfo.averageRating.toFixed(2) : 'N/A'}
					label="Average Rating"
					gradient="from-yellow-500 to-orange-500"
				/>
				<StatCard
					value={courseInfo.totalStudents.toLocaleString()}
					label="Total Students"
					gradient="from-purple-500 to-purple-600"
				/>
			</div>

			<!-- Grade Distribution Chart -->
			<div class="mb-8">
				<GradeChart data={courseData} />
			</div>

			<!-- Grade Distribution Table -->
			<div class="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
				<h3 class="mb-6 text-xl font-semibold text-gray-800">Grade Distribution</h3>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
					{#each getGradeDistribution() as { grade, count, percentage } (grade)}
						<div class="rounded-lg bg-gray-50 p-4 text-center">
							<div class="text-lg font-bold text-gray-800">{grade}</div>
							<div class="text-sm text-gray-600">{count} students</div>
							<div class="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Instructor Statistics -->
			<div class="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
				<h3 class="mb-6 text-xl font-semibold text-gray-800">Instructor Statistics</h3>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Instructor</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Offerings</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Students</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Avg GPA</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Avg Rating</th>
							</tr>
						</thead>
						<tbody>
							{#each getInstructorStats() as instructor (instructor.name)}
								<tr class="border-b border-gray-100 hover:bg-gray-50">
									<td class="px-4 py-3 font-medium text-gray-800">{instructor.name}</td>
									<td class="px-4 py-3 text-gray-600">{instructor.offerings}</td>
									<td class="px-4 py-3 text-gray-600">{instructor.totalStudents}</td>
									<td class="px-4 py-3 text-gray-600">{instructor.averageGPA.toFixed(2)}</td>
									<td class="px-4 py-3 text-gray-600">
										{instructor.averageRating ? instructor.averageRating.toFixed(2) : 'N/A'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Course History -->
			<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
				<h3 class="mb-6 text-xl font-semibold text-gray-800">Course History</h3>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Term</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Instructor</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Students</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">GPA</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">Rating</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">EvalID</th>
							</tr>
						</thead>
						<tbody>
							{#each courseData.sort( (a, b) => `${a.Academic_Year}-${a.Term}`.localeCompare(`${b.Academic_Year}-${b.Term}`) ) as course (course.Academic_Year + course.Term + course.section + course.Primary_Instructor)}
								<tr class="border-b border-gray-100 hover:bg-gray-50">
									<td class="px-4 py-3 text-gray-600">{course.Academic_Year} {course.Term}</td>
									<td class="px-4 py-3 text-gray-600">{course.Primary_Instructor}</td>
									<td class="px-4 py-3 text-gray-600">{course.Student_Count}</td>
									<td class="px-4 py-3 text-gray-600">{course.Average_GPA.toFixed(2)}</td>
									<td class="px-4 py-3 text-gray-600">
										{course.evalMedian?.MedianGlobal
											? course.evalMedian.MedianGlobal.toFixed(2)
											: 'N/A'}
									</td>
									<td class="px-4 py-3 text-xs text-gray-600">
										{course.evalParam?.EvalID
											? `${course.evalParam.EvalID} (${course.evalParam.Form})`
											: 'N/A'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
