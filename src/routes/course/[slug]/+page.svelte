<script lang="ts">
	import { goto } from '$app/navigation';
	import StatCard from '$lib/components/StatCard.svelte';
	import GradeChart from '$lib/components/GradeChart.svelte';
	import type { CourseDetailPayload } from '$lib/types';
	import { resolve } from '$app/paths';

	type PageData = {
		course: CourseDetailPayload;
	};

	let { data }: { data: PageData } = $props();

	const course = $derived(data.course);

	const courseInfo = $derived({
		title: course.title,
		department: course.department,
		number: course.courseNumber,
		totalOfferings: course.summary.totalOfferings,
		totalStudents: course.summary.totalStudents,
		averageGPA: course.summary.averageGPA,
		averageRating: course.summary.averageRating
	});

	const gradeDistribution = $derived(course.gradeDistribution);
	const instructorStats = $derived(course.instructorStats);

	const sortedOfferings = $derived(
		[...course.offerings].sort((a, b) =>
			`${a.Academic_Year}-${a.Term}`.localeCompare(`${b.Academic_Year}-${b.Term}`)
		)
	);

	function goBack() {
		void goto(resolve('/'));
	}
</script>

<svelte:head>
	<title
		>{courseInfo
			? `${courseInfo.department} ${courseInfo.number} - ${courseInfo.title}`
			: 'Course Details'} | UW Course Analytics
	</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8">
			<button
				onclick={goBack}
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

		<div class="mb-8">
			<GradeChart data={gradeDistribution} />
		</div>

		<!-- Grade Distribution Table -->
		<div class="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
			<h3 class="mb-6 text-xl font-semibold text-gray-800">Grade Distribution</h3>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
				{#each gradeDistribution as { grade, count, percentage } (grade)}
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
						{#each instructorStats as instructor (instructor.name)}
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
						{#each sortedOfferings as offering (offering.Academic_Year + offering.Term + offering.section + offering.Primary_Instructor)}
							<tr class="border-b border-gray-100 hover:bg-gray-50">
								<td class="px-4 py-3 text-gray-600">{offering.Academic_Year} {offering.Term}</td>
								<td class="px-4 py-3 text-gray-600">{offering.Primary_Instructor}</td>
								<td class="px-4 py-3 text-gray-600">{offering.Student_Count}</td>
								<td class="px-4 py-3 text-gray-600">{offering.Average_GPA.toFixed(2)}</td>
								<td class="px-4 py-3 text-gray-600">
									{offering.evalMedian?.MedianGlobal
										? offering.evalMedian.MedianGlobal.toFixed(2)
										: 'N/A'}
								</td>
								<td class="px-4 py-3 text-xs text-gray-600">
									{offering.evalParam?.EvalID
										? `${offering.evalParam.EvalID} (${offering.evalParam.Form})`
										: 'N/A'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
