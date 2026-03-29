import { read } from '$app/server';
import type {
	CourseDetailPayload,
	CourseIndexEntry,
	CoursesDepartmentManifest,
	DepartmentCoursesFile,
	GradeDistributionItem
} from '$lib/types';

const GRADE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] as const;

let coursesIndexCache: CourseIndexEntry[] | null = null;
let manifestCache: CoursesDepartmentManifest | null = null;
const departmentCache = new Map<string, DepartmentCoursesFile>();

async function readJson<T>(assetPath: string): Promise<T> {
	const response = read(assetPath);

	if (!response) {
		throw new Error(`Asset not found: ${assetPath}`);
	}

	return (await response.json()) as T;
}

/**
 * Load full courses index, cached
 * @returns cached courses index
 */
export async function getCoursesIndex(): Promise<CourseIndexEntry[]> {
	if (!coursesIndexCache) {
		coursesIndexCache = await readJson<CourseIndexEntry[]>(
			'/data/processed/courses-index.json'
		);
	}

	return coursesIndexCache;
}

/**
 * Load slug -> department map, cached
 * @returns the cached manifest
 */
async function getManifest(): Promise<CoursesDepartmentManifest> {
	if (!manifestCache) {
		manifestCache = await readJson<CoursesDepartmentManifest>(
			'/data/processed/course-department-manifest.json'
		);
	}

	return manifestCache;
}

/**
 * Load a department chunk, cached per department
 *
 * @param departmentKey the key affiliated with a department
 * @returns the cached department
 */
async function getDepartmentChunk(departmentKey: string): Promise<DepartmentCoursesFile> {
	if (!departmentCache.has(departmentKey)) {
		const data = await readJson<DepartmentCoursesFile>(
			`/data/processed/courses-by-department/${departmentKey}.json`
		);
		departmentCache.set(departmentKey, data);
	}

	return departmentCache.get(departmentKey)!;
}

function getSearchRelevanceScore(course: CourseIndexEntry, query: string): number {
	const slug = course.slug.toLowerCase();
	const courseCode = course.courseCode.toLowerCase();
	const title = course.title.toLowerCase();
	const searchText = course.searchText.toLocaleLowerCase();
	const instructors = course.instructors.map((i) => i.toLowerCase());

	let score = 0;

	if (slug === query) score += 1000;
	if (courseCode === query) score += 950;
	if (`${course.department.toLowerCase()} ${course.courseNumber.toLowerCase()}` === query)
		score += 950;

	if (slug.startsWith(query)) score += 700;
	if (courseCode.startsWith(query)) score += 675;

	if (title === query) score += 600;
	if (title.startsWith(query)) score += 450;
	if (title.includes(query)) score += 300;

	for (const instructor of instructors) {
		if (instructor === query) score += 400;
		else if (instructor.startsWith(query)) score += 250;
		else if (instructor.includes(query)) score += 150;
	}

	if (searchText.includes(query)) score += 100;

	const tokens = query.split(/\s+/).filter(Boolean);
	if (tokens.length > 1) {
		let matchedTokens = 0;
		for (const token of tokens) {
			if (searchText.includes(token)) {
				matchedTokens++;
			}
		}
		score += matchedTokens * 25;
	}

	return score;
}

/**
 * Get full course detail by slug
 * @param slug
 * @returns full course detail
 */
export async function getCourseBySlug(slug: string): Promise<CourseDetailPayload | null> {
	const manifest = await getManifest();
	const departmentKey = manifest[slug];

	if (!departmentKey) return null;

	const departmentData = await getDepartmentChunk(departmentKey);
	return departmentData[slug] || null;
}

function aggregateGradeDistribution(courses: CourseIndexEntry[]): GradeDistributionItem[] {
	const counts = new Map<string, number>();

	for (const grade of GRADE_ORDER) {
		counts.set(grade, 0);
	}

	for (const course of courses) {
		for (const item of course.gradeDistribution) {
			counts.set(item.grade, (counts.get(item.grade) ?? 0) + item.count);
		}
	}

	const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

	return GRADE_ORDER.map((grade) => {
		const count = counts.get(grade) ?? 0;
		return {
			grade,
			count,
			percentage: total > 0 ? (count / total) * 100 : 0
		};
	});
}

export async function searchCourses(params: {
	search?: string;
	department?: string;
	year?: string;
	instructor?: string;
	limit?: number;
}): Promise<{
	courses: CourseIndexEntry[];
	gradeDistribution: GradeDistributionItem[];
}> {
	const { search, department, year, instructor, limit } = params;

	const index = await getCoursesIndex();
	let results = index;

	const normalizedSearch = search?.trim().toLowerCase() ?? '';

	if (department) {
		results = results.filter((c) => c.department === department);
	}

	if (year) {
		results = results.filter((c) => c.years.includes(year));
	}

	if (instructor) {
		results = results.filter((c) => c.instructors.some((i) => i === instructor));
	}

	if (normalizedSearch) {
		results = results.filter((c) => c.searchText.includes(normalizedSearch));

		results = [...results].sort((a, b) => {
			const scoreA = getSearchRelevanceScore(a, normalizedSearch);
			const scoreB = getSearchRelevanceScore(b, normalizedSearch);

			if (scoreB !== scoreA) {
				return scoreB - scoreA;
			}

			const gpaA = Math.round(a.averageGPA * 100);
			const gpaB = Math.round(b.averageGPA * 100);

			if (gpaB !== gpaA) {
				return gpaB - gpaA;
			}

			if (b.totalOfferings !== a.totalOfferings) {
				return b.totalOfferings - a.totalOfferings;
			}

			return a.slug.localeCompare(b.slug);
		});
	} else {
		results = [...results].sort((a, b) => {
			const gpaA = Math.round(a.averageGPA * 100);
			const gpaB = Math.round(b.averageGPA * 100);

			if (gpaB !== gpaA) {
				return gpaB - gpaA;
			}

			if (b.totalOfferings !== a.totalOfferings) {
				return b.totalOfferings - a.totalOfferings;
			}

			return a.slug.localeCompare(b.slug);
		});
	}

	const fullResults = results;
	const limitedResults =
		typeof limit === 'number' && limit > 0 ? fullResults.slice(0, limit) : fullResults;

	return {
		courses: limitedResults,
		gradeDistribution: aggregateGradeDistribution(fullResults)
	};
}
