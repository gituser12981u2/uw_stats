import type {
	CombinedCourseData,
	FilterOptions,
	GradeDistributionItem,
	InstructorStat
} from '../src/lib/types';
import { normalizeInstructorName } from './courseNormalization';

export const GRADE_KEYS = [
	'A',
	'A-',
	'B+',
	'B',
	'B-',
	'C+',
	'C',
	'C-',
	'D+',
	'D',
	'D-',
	'F'
] as const;

export function uniqueSorted(values: Iterable<string>): string[] {
	return Array.from(new Set(Array.from(values).filter((v) => v.trim().length > 0))).sort((a, b) =>
		a.localeCompare(b)
	);
}

export function sortAcademicYears(years: string[]): string[] {
	return [...years].sort((a, b) => a.localeCompare(b));
}

export function sanitizeDepartmentKey(department: string): string {
	return department
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-+/g, '-');
}

export function collectInstructorNames(data: CombinedCourseData[]): string[] {
	return uniqueSorted(
		data
			.map((item) => item.Primary_Instructor)
			.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
	);
}

export function computeAverageRating(data: CombinedCourseData[]): number | null {
	let ratingSum = 0;
	let ratingCount = 0;

	for (const item of data) {
		const rating = item.evalMedian?.MedianGlobal;
		if (typeof rating === 'number' && rating > 0) {
			ratingSum += rating;
			ratingCount++;
		}
	}

	return ratingCount > 0 ? ratingSum / ratingCount : null;
}

export function computeGradeDistribution(data: CombinedCourseData[]): GradeDistributionItem[] {
	const totals: Record<(typeof GRADE_KEYS)[number], number> = {
		A: 0,
		'A-': 0,
		'B+': 0,
		B: 0,
		'B-': 0,
		'C+': 0,
		C: 0,
		'C-': 0,
		'D+': 0,
		D: 0,
		'D-': 0,
		F: 0
	};

	for (const course of data) {
		for (const key of GRADE_KEYS) {
			totals[key] += course[key] || 0;
		}
	}

	const totalCount = Object.values(totals).reduce((sum, value) => sum + value, 0);

	return GRADE_KEYS.map((grade) => {
		const count = totals[grade];
		return {
			grade,
			count,
			percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
		};
	});
}

export function computeInstructorStats(data: CombinedCourseData[]): InstructorStat[] {
	const instructorMap = new Map<
		string,
		{
			name: string | null;
			offerings: number;
			totalStudents: number;
			totalGPA: number;
			ratingSum: number;
			ratingCount: number;
		}
	>();

	for (const course of data) {
		const normalized = normalizeInstructorName(course.Primary_Instructor);
		const key = normalized.key ?? '__unknown__';

		if (!instructorMap.has(key)) {
			instructorMap.set(key, {
				name: normalized.displayName,
				offerings: 0,
				totalStudents: 0,
				totalGPA: 0,
				ratingSum: 0,
				ratingCount: 0
			});
		}

		const stats = instructorMap.get(key)!;
		stats.offerings++;
		stats.totalStudents += course.Student_Count || 0;
		stats.totalGPA += course.Average_GPA || 0;

		const rating = course.evalMedian?.MedianGlobal;
		if (typeof rating === 'number' && rating > 0) {
			stats.ratingSum += rating;
			stats.ratingCount++;
		}
	}

	return Array.from(instructorMap.values())
		.map((instructor) => ({
			name: instructor.name,
			offerings: instructor.offerings,
			totalStudents: instructor.totalStudents,
			averageGPA: instructor.offerings > 0 ? instructor.totalGPA / instructor.offerings : 0,
			averageRating:
				instructor.ratingCount > 0 ? instructor.ratingSum / instructor.ratingCount : null
		}))
		.sort((a, b) => {
			if (b.offerings !== a.offerings) return b.offerings - a.offerings;
			return (a.name ?? '').localeCompare(b.name ?? '');
		});
}

export function buildFilterOptions(data: CombinedCourseData[]): FilterOptions {
	return {
		departments: uniqueSorted(data.map((item) => item.department)),
		years: sortAcademicYears(uniqueSorted(data.map((item) => item.Academic_Year))),
		instructors: collectInstructorNames(data)
	};
}
