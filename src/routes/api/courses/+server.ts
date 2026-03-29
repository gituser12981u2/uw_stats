import { searchCourses } from '$lib/server/data.js';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const department = url.searchParams.get('department')?.trim() ?? '';
	const year = url.searchParams.get('year')?.trim() ?? '';
	const instructor = url.searchParams.get('instructor')?.trim() ?? '';

	const limitParam = url.searchParams.get('limit');
	const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN;
	const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;

	const courses = await searchCourses({
		search,
		department,
		year,
		instructor,
		limit
	});

	return json(courses, {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
