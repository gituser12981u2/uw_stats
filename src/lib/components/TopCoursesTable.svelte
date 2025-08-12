<script lang="ts">
	import type { CombinedCourseData } from '$lib/types';

	export let data: CombinedCourseData[] = [];

	// Group courses by course number and calculate averages
	function getTopCourses() {
		const courseMap = new Map<
			string,
			{
				department: string;
				courseNumber: string;
				title: string;
				totalOfferings: number;
				totalStudents: number;
				averageGPA: number;
				averageRating: number | null;
				gpaSum: number;
				ratingSum: number;
				ratingCount: number;
			}
		>();

		data.forEach((course) => {
			const key = `${course.department}-${course.courseNumber}`;

			if (!courseMap.has(key)) {
				courseMap.set(key, {
					department: course.department,
					courseNumber: course.courseNumber,
					title: course.Course_Title,
					totalOfferings: 0,
					totalStudents: 0,
					averageGPA: 0,
					averageRating: null,
					gpaSum: 0,
					ratingSum: 0,
					ratingCount: 0
				});
			}

			const courseStats = courseMap.get(key)!;
			courseStats.totalOfferings++;
			courseStats.totalStudents += course.Student_Count || 0;
			courseStats.gpaSum += course.Average_GPA;

			if (course.evalMedian?.MedianGlobal) {
				courseStats.ratingSum += course.evalMedian.MedianGlobal;
				courseStats.ratingCount++;
			}
		});

		// Calculate averages and convert to array
		const courses = Array.from(courseMap.values()).map((course) => ({
			...course,
			averageGPA: course.gpaSum / course.totalOfferings,
			averageRating: course.ratingCount > 0 ? course.ratingSum / course.ratingCount : null
		}));

		// Sort by GPA descending, then by number of offerings
		return courses
			.filter((course) => course.totalOfferings >= 2) // Only show courses with multiple offerings
			.sort((a, b) => {
				if (Math.abs(a.averageGPA - b.averageGPA) < 0.1) {
					return b.totalOfferings - a.totalOfferings;
				}
				return b.averageGPA - a.averageGPA;
			})
			.slice(0, 20);
	}

	function getCourseSlug(department: string, courseNumber: string) {
		return `${department}-${courseNumber}`;
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<h3 class="mb-6 text-xl font-semibold text-gray-800">Top Courses by GPA</h3>

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
					{#each getTopCourses() as course (course.department + course.courseNumber)}
						<tr class="border-b border-gray-100 transition-colors hover:bg-gray-50">
							<td class="px-4 py-4">
								<a
									href="/course/{getCourseSlug(course.department, course.courseNumber)}"
									class="font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline"
								>
									{course.department}
									{course.courseNumber}
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
			Showing top 20 courses with 2+ offerings, sorted by average GPA
		</div>
	{/if}
</div>
