import type { CoursesSearchResponse, HomePageData } from '$lib/types';
import filterOptions from '$lib/server/generated/filter-options.json';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }): Promise<HomePageData> => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const department = url.searchParams.get('department')?.trim() ?? '';
	const year = url.searchParams.get('year')?.trim() ?? '';
	const instructor = url.searchParams.get('instructor')?.trim() ?? '';

	const params = new URLSearchParams();
	if (search) params.set('search', search);
	if (department) params.set('department', department);
	if (year) params.set('year', year);
	if (instructor) params.set('instructor', instructor);

	const courseRes = await fetch(`/api/courses?${params.toString()}`);

	if (!courseRes.ok) {
		throw new Error('Failed to load courses');
	}

	const coursesPayload = (await courseRes.json()) as CoursesSearchResponse;

	return {
		filterOptions,
		courses: coursesPayload.courses,
		gradeDistribution: coursesPayload.gradeDistribution,
		filters: {
			search,
			department,
			year,
			instructor
		}
	};
};
