<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CourseIndexEntry } from '$lib/types';

	let {
		data = [],
		hasActiveFilters = false
	}: {
		data?: CourseIndexEntry[];
		hasActiveFilters?: boolean;
	} = $props();

	const tableTitle = $derived(hasActiveFilters ? 'Matching Courses' : 'Top Courses');

	const tableDescription = $derived(
		hasActiveFilters
			? 'Showing courses matching current search and filters, ranked by average GPA'
			: 'Showing top 20 courses with 2+ offerings, sorted by average GPA'
	);

	const topCourses = $derived(
		[...data]
			.sort((a, b) => {
				const aGpa2 = Number(a.averageGPA.toFixed(2));
				const bGpa2 = Number(b.averageGPA.toFixed(2));

				if (bGpa2 !== aGpa2) {
					return bGpa2 - aGpa2;
				}

				if (b.totalOfferings !== a.totalOfferings) {
					return b.totalOfferings - a.totalOfferings;
				}

				return a.slug.localeCompare(b.slug);
			})
			.slice(0, 20)
	);
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<h3 class="mb-6 text-xl font-semibold text-gray-800">{tableTitle}</h3>

	{#if data.length === 0}
		<p class="py-8 text-center text-gray-500">No course data available.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b-2 border-gray-200">
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Course</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Title</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Offerings</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Students</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Avg GPA</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Avg Rating</th>
					</tr>
				</thead>
				<tbody>
					{#each topCourses as course (course.slug)}
						<tr class="border-b border-gray-100 transition-colors hover:bg-gray-50">
							<td class="px-4 py-4">
								<a
									href={resolve('/course/[slug]', { slug: course.slug })}
									class="font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline"
								>
									{course.courseCode}
								</a>
							</td>
							<td class="max-w-xs truncate px-4 py-4 text-gray-700" title={course.title}>
								{course.title}
							</td>
							<td class="px-4 py-4 text-gray-600">{course.totalOfferings}</td>
							<td class="px-4 py-4 text-gray-600">{course.totalStudents.toLocaleString()}</td>
							<td class="px-4 py-4">
								<span class="font-semibold text-green-600">{course.averageGPA.toFixed(2)}</span>
							</td>
							<td class="px-4 py-4">
								{#if course.averageRating !== null}
									<span class="font-semibold text-yellow-600"
										>{course.averageRating.toFixed(2)}</span
									>
								{:else}
									<span class="text-gray-400">N/A</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-4 text-center text-sm text-gray-500">
			{tableDescription}
		</div>
	{/if}
</div>
