import type {
	CombinedCourseData,
	CourseDetailPayload,
	CourseIndexEntry,
	CoursesDepartmentManifest,
	DepartmentCoursesFile
} from '../src/lib/types';
import {
	collectInstructorNames,
	computeAverageRating,
	computeGradeDistribution,
	computeInstructorStats,
	sanitizeDepartmentKey,
	sortAcademicYears,
	uniqueSorted
} from './courseAggregates';
import { normalizeSearchText } from './courseNormalization';

function groupBySlug(data: CombinedCourseData[]): Map<string, CombinedCourseData[]> {
	const bySlug = new Map<string, CombinedCourseData[]>();

	for (const item of data) {
		const slug = `${item.department}-${item.courseNumber}`;

		if (!bySlug.has(slug)) {
			bySlug.set(slug, []);
		}

		bySlug.get(slug)?.push(item);
	}

	return bySlug;
}

export function buildCourseArtifacts(data: CombinedCourseData[]): {
	coursesIndex: CourseIndexEntry[];
	courseDepartmentManifest: CoursesDepartmentManifest;
	coursesByDepartment: Record<string, DepartmentCoursesFile>;
} {
	const grouped = groupBySlug(data);

	const coursesIndex: CourseIndexEntry[] = [];
	const courseDepartmentManifest: CoursesDepartmentManifest = {};
	const coursesByDepartment: Record<string, DepartmentCoursesFile> = {};

	for (const [slug, offerings] of grouped.entries()) {
		const first = offerings[0];
		const department = first.department;
		const courseNumber = first.courseNumber;
		const courseCode = `${department} ${courseNumber}`;
		const title = first.Course_Title;
		const departmentKey = sanitizeDepartmentKey(department);

		const totalOfferings = offerings.length;
		const totalStudents = offerings.reduce((sum, item) => sum + (item.Student_Count || 0), 0);
		const averageGPA =
			offerings.reduce((sum, item) => sum + (item.Average_GPA || 0), 0) / totalOfferings;
		const averageRating = computeAverageRating(offerings);

		const gradeDistribution = computeGradeDistribution(offerings);

		const years = sortAcademicYears(uniqueSorted(offerings.map((item) => item.Academic_Year)));
		const instructors = collectInstructorNames(offerings);

		const searchText = normalizeSearchText(
			slug,
			courseCode,
			department,
			courseNumber,
			title,
			...instructors
		);

		coursesIndex.push({
			slug,
			department,
			courseNumber,
			courseCode,
			title,
			searchText,
			totalOfferings,
			totalStudents,
			averageGPA,
			averageRating,
			gradeDistribution,
			years,
			instructors
		});

		const sortedOfferings = [...offerings].sort((a, b) => {
			const left = `${a.Academic_Year}-${a.Term}`;
			const right = `${b.Academic_Year}-${b.Term}`;
			return left.localeCompare(right);
		});

		const detailPayload: CourseDetailPayload = {
			slug,
			department,
			courseNumber,
			courseCode,
			title,
			summary: {
				totalOfferings,
				totalStudents,
				averageGPA,
				averageRating,
				years,
				instructors
			},
			gradeDistribution,
			instructorStats: computeInstructorStats(offerings),
			offerings: sortedOfferings
		};

		if (!coursesByDepartment[departmentKey]) {
			coursesByDepartment[departmentKey] = {};
		}

		coursesByDepartment[departmentKey][slug] = detailPayload;
		courseDepartmentManifest[slug] = departmentKey;
	}

	coursesIndex.sort((a, b) => a.slug.localeCompare(b.slug));

	return { coursesIndex, courseDepartmentManifest, coursesByDepartment };
}
