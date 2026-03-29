import type { CoursesSearchResponse, FilterOptions, HomePageData } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }): Promise<HomePageData> => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const department = url.searchParams.get('department')?.trim() ?? '';
	const year = url.searchParams.get('year')?.trim() ?? '';
	const instructor = url.searchParams.get('instructor')?.trim() ?? '';

	const params = new URLSearchParams();
	if (search) params.set('search', search);
	if (department) params.set('department', department);
	if (year) params.set('year', year);
	if (instructor) params.set('instructor', instructor);

	const [filtersRes, courseRes] = await Promise.all([
		fetch('/data/processed/filter-options.json'),
		fetch(`/api/courses?${params.toString()}`)
	]);

	if (!filtersRes.ok) {
		throw new Error('Failed to load filter options');
	}

	if (!courseRes.ok) {
		throw new Error('Failed to load courses');
	}

	const filterOptions = (await filtersRes.json()) as FilterOptions;
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
