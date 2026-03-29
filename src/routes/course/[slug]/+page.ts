import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { CourseDetailPayload } from '$lib/types';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/course/${params.slug}`);

	if (res.status === 404) {
		throw error(404, 'Course not found');
	}

	if (!res.ok) {
		throw error(res.status, 'Failed to load course');
	}

	const course = (await res.json()) as CourseDetailPayload;

	return {
		course
	};
};
