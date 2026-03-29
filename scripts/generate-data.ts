import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
	CombinedCourseData,
	CourseIndexEntry,
	CourseDetailPayload,
	GradeDistributionItem,
	InstructorStat,
	FilterOptions,
	CoursesDepartmentManifest,
	DepartmentCoursesFile
} from '../src/lib/types';
import {
	parseCSV,
	transformEvalMedianData,
	transformEvalParamData,
	transformGradeData
} from '../src/lib/utils/csvParser';
import { combineData } from '../src/lib/utils/dataProcessor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATIC_DATA_DIR = path.join(PROJECT_ROOT, 'static', 'data');
const OUTPUT_DIR = path.join(STATIC_DATA_DIR, 'processed');
const COURSES_BY_DEPARTMENT_DIR = path.join(OUTPUT_DIR, 'courses-by-department');

const GRADE_KEYS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] as const;

function normalizeSearchText(...parts: Array<string | null | undefined>): string {
	return parts
		.filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
		.join(' ')
		.toLocaleLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

function uniqueSorted(values: Iterable<string>): string[] {
	return Array.from(new Set(Array.from(values).filter((v) => v.trim().length > 0))).sort((a, b) =>
		a.localeCompare(b)
	);
}

function sortAcademicYears(years: string[]): string[] {
	return [...years].sort((a, b) => a.localeCompare(b));
}

function sanitizeDepartmentKey(department: string): string {
	return department
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-+/g, '-');
}

function computeAverageRating(data: CombinedCourseData[]): number | null {
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

function computeGradeDistribution(data: CombinedCourseData[]): GradeDistributionItem[] {
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

function computeInstructorStats(data: CombinedCourseData[]): InstructorStat[] {
	const instructorMap = new Map<
		string,
		{
			name: string;
			offerings: number;
			totalStudents: number;
			totalGPA: number;
			ratingSum: number;
			ratingCount: number;
		}
	>();

	for (const course of data) {
		const instructor = course.Primary_Instructor?.trim() || 'Unknown';

		if (!instructorMap.has(instructor)) {
			instructorMap.set(instructor, {
				name: instructor,
				offerings: 0,
				totalStudents: 0,
				totalGPA: 0,
				ratingSum: 0,
				ratingCount: 0
			});
		}

		const stats = instructorMap.get(instructor)!;
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
			return a.name.localeCompare(b.name);
		});
}

function buildFilterOptions(data: CombinedCourseData[]): FilterOptions {
	return {
		departments: uniqueSorted(data.map((item) => item.department)),
		years: sortAcademicYears(uniqueSorted(data.map((item) => item.Academic_Year))),
		instructors: uniqueSorted(data.map((item) => item.Primary_Instructor))
	};
}

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

function buildCourseArtifact(data: CombinedCourseData[]): {
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
		const instructors = uniqueSorted(offerings.map((item) => item.Primary_Instructor));

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

async function readCsv(filename: string): Promise<string> {
	const filepath = path.join(STATIC_DATA_DIR, filename);
	return readFile(filepath, 'utf8');
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
	const json = JSON.stringify(value);
	await writeFile(filePath, json, 'utf8');
	console.log(
		`Wrote ${path.relative(OUTPUT_DIR, filePath)} (${Buffer.byteLength(json, 'utf8').toLocaleString()} bytes)`
	);
}

async function main(): Promise<void> {
	console.log('Reading CSV files...');

	const [gradesText, evalParamsText, evalMediansText] = await Promise.all([
		readCsv('grades.csv'),
		readCsv('eval-params.csv'),
		readCsv('eval-medians.csv')
	]);

	console.log('Parsing and transforming CSV data...');

	const gradesData = transformGradeData(parseCSV(gradesText));
	const evalParamsData = transformEvalParamData(parseCSV(evalParamsText));
	const evalMediansData = transformEvalMedianData(parseCSV(evalMediansText));

	console.log('Combining offering-level data...');
	const combinedData = combineData(gradesData, evalParamsData, evalMediansData);

	console.log('Building generated artifacts...');
	const filterOptions = buildFilterOptions(combinedData);
	const { coursesIndex, courseDepartmentManifest, coursesByDepartment } =
		buildCourseArtifact(combinedData);

	await mkdir(OUTPUT_DIR, { recursive: true });
	await mkdir(COURSES_BY_DEPARTMENT_DIR, { recursive: true });

	await Promise.all([
		writeJson(path.join(OUTPUT_DIR, 'filter-options.json'), filterOptions),
		writeJson(path.join(OUTPUT_DIR, 'courses-index.json'), coursesIndex),
		writeJson(path.join(OUTPUT_DIR, 'course-department-manifest.json'), courseDepartmentManifest)
	]);

	const departmentWritePromises = Object.entries(coursesByDepartment).map(
		async ([departmentKey, courses]) => {
			await writeJson(path.join(COURSES_BY_DEPARTMENT_DIR, `${departmentKey}.json`), courses);
		}
	);

	await Promise.all(departmentWritePromises);

	console.log('Done.');
	console.log(`Combined offerings: ${combinedData.length.toLocaleString()}`);
	console.log(`Unique courses: ${coursesIndex.length.toLocaleString()}`);
	console.log(`Department chunks: ${Object.keys(coursesByDepartment).length.toLocaleString()}`);
}

main().catch((error) => {
	console.error('Failed to generate processed data:', error);
	process.exitCode = 1;
});
