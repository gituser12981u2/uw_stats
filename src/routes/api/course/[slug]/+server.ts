import { getCourseBySlug } from '$lib/server/data.js';
import { error, json } from '@sveltejs/kit';

export async function GET({ params }) {
	const slug = params.slug?.trim();

	if (!slug) {
		throw error(400, 'Missing course slug');
	}

	const course = await getCourseBySlug(slug);

	if (!course) {
		throw error(404, `Course not found: ${slug}`);
	}

	return json(course, {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
