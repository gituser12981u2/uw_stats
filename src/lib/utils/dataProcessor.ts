import type { GradeData, EvalParam, EvalMedian, CombinedCourseData, CourseStats } from '../types';

function extractDepartmentAndNumber(courseNumber: string): {
	department: string;
	number: string;
	section: string;
} {
	const parts = courseNumber.trim().split(/\s+/);

	const departmentParts: string[] = [];
	let numberIndex = -1;

	// Find the first part that starts with a number
	for (let i = 0; i < parts.length; i++) {
		if (/^\d/.test(parts[i])) {
			numberIndex = i;
			break;
		}
		departmentParts.push(parts[i]);
	}

	const department = departmentParts.join(' ');
	const number = numberIndex >= 0 ? parts[numberIndex] : '';
	const section = numberIndex >= 0 && parts[numberIndex + 1] ? parts[numberIndex + 1] : 'A';

	return { department, number, section };
}

export function combineData(
	gradesData: GradeData[],
	evalParamsData: EvalParam[],
	evalMediansData: EvalMedian[]
): CombinedCourseData[] {
	console.log('Starting data combination...');

	const evalMediansMap = new Map<number, EvalMedian>();
	evalMediansData.forEach((median) => {
		evalMediansMap.set(median.EvalID, median);
	});

	const combinedEvaluations = new Map<
		string,
		{
			param: EvalParam;
			median: EvalMedian | null;
		}
	>();

	evalParamsData.forEach((param) => {
		const median = evalMediansMap.get(param.EvalID) || null;

		// Create multiple keys for flexible matching with grades
		const matchingKeys = [
			// Primary: Term-Year-CourseAbbrev-CourseNumber-LastName-FirstName
			`${param.Term}-${param.Year}-${param.CourseAbbrev}-${param.CourseNumber}-${param.LastName}-${param.FirstName}`,
			// Secondary: Term-Year-CourseAbbrev-CourseNumber-LastName (no first name)
			`${param.Term}-${param.Year}-${param.CourseAbbrev}-${param.CourseNumber}-${param.LastName}`,
			// Tertiary: Just course and instructor last name
			`${param.CourseAbbrev}-${param.CourseNumber}-${param.LastName}`,
			// Quaternary: Course only (least reliable)
			`${param.CourseAbbrev}-${param.CourseNumber}`
		];

		matchingKeys.forEach((key) => {
			if (!combinedEvaluations.has(key)) {
				combinedEvaluations.set(key, { param, median });
			}
		});
	});

	console.log('Combined evaluations created:', combinedEvaluations.size, 'keys');
	console.log('EvalIDs with median data:', Array.from(evalMediansMap.keys()).length);

	// Log some examples of successful EvalID matches
	let matchedCount = 0;
	evalParamsData.slice(0, 10).forEach((param) => {
		const median = evalMediansMap.get(param.EvalID);
		if (median) {
			matchedCount++;
			if (matchedCount <= 3) {
				console.log(
					`EvalID ${param.EvalID}: ${param.CourseAbbrev} ${param.CourseNumber} has median data (MedianGlobal: ${median.MedianGlobal})`
				);
			}
		}
	});

	const combined: CombinedCourseData[] = [];
	let successfulMatches = 0;
	let gradesWithEvalData = 0;

	gradesData.forEach((grade, index) => {
		// Parse course information from grade data
		const {
			department: dept,
			number: num,
			section
		} = extractDepartmentAndNumber(grade.Course_Number);

		// Extract instructor last name (assuming format "LAST, FIRST" or just "LAST")
		const instructorParts = grade.Primary_Instructor.split(',');
		const instructorLastName = instructorParts[0]?.trim() || grade.Primary_Instructor;
		const instructorFirstName = instructorParts[1]?.trim() || '';

		// Try to find matching evaluation data with different strategies
		let matchedEval: { param: EvalParam; median: EvalMedian | null } | null = null;

		// Convert academic year to term/year combinations
		const academicYear = grade.Academic_Year;
		const possibleTermYears = [
			{ term: 'Autumn', year: parseInt(academicYear.split('-')[0]) },
			{ term: 'Winter', year: parseInt(academicYear.split('-')[1]) },
			{ term: 'Spring', year: parseInt(academicYear.split('-')[1]) },
			{ term: 'Summer', year: parseInt(academicYear.split('-')[1]) }
		];

		// Try different matching strategies in order of reliability
		for (const { term, year } of possibleTermYears) {
			if (matchedEval) break;

			const searchKeys = [
				`${term}-${year}-${dept}-${num}-${instructorLastName}-${instructorFirstName}`,
				`${term}-${year}-${dept}-${num}-${instructorLastName}`,
				`${dept}-${num}-${instructorLastName}`,
				`${dept}-${num}`
			];

			for (const key of searchKeys) {
				matchedEval = combinedEvaluations.get(key) || null;
				if (matchedEval) {
					if (index < 5) {
						console.log(
							`✓ Matched grade ${grade.Course_Number} ${grade.Primary_Instructor} using key: ${key}`
						);
						console.log(
							`  -> EvalID: ${matchedEval.param.EvalID}, MedianGlobal: ${matchedEval.median?.MedianGlobal || 'N/A'}`
						);
					}
					break;
				}
			}
		}

		if (matchedEval) {
			successfulMatches++;
			if (matchedEval.median?.MedianGlobal && matchedEval.median.MedianGlobal > 0) {
				gradesWithEvalData++;
			}
		} else if (index < 5) {
			console.log(`No match found for ${grade.Course_Number} ${grade.Primary_Instructor}`);
		}

		const combinedItem: CombinedCourseData = {
			...grade,
			department: dept,
			courseNumber: num,
			section: section,
			evalParam: matchedEval?.param,
			evalMedian: matchedEval?.median || undefined
		};

		combined.push(combinedItem);
	});

	console.log('=== MATCHING RESULTS ===');
	console.log(`Total grades: ${gradesData.length}`);
	console.log(
		`Grades matched to eval params: ${successfulMatches} (${((successfulMatches / gradesData.length) * 100).toFixed(1)}%)`
	);
	console.log(
		`Grades with actual rating data: ${gradesWithEvalData} (${((gradesWithEvalData / gradesData.length) * 100).toFixed(1)}%)`
	);

	// Sample some successful matches for verification
	const samplesWithRatings = combined
		.filter((c) => c.evalMedian?.MedianGlobal && c.evalMedian.MedianGlobal > 0)
		.slice(0, 3);

	console.log('Sample successful matches:');
	samplesWithRatings.forEach((sample) => {
		console.log(`  ${sample.department} ${sample.courseNumber}: ${sample.Course_Title}`);
		console.log(`    Instructor: ${sample.Primary_Instructor}`);
		console.log(`    GPA: ${sample.Average_GPA}, Rating: ${sample.evalMedian?.MedianGlobal}`);
		console.log(`    EvalID: ${sample.evalParam?.EvalID}, Form: ${sample.evalParam?.Form}`);
	});

	return combined;
}
export function calculateStats(data: CombinedCourseData[]): CourseStats {
	const validGPA = data.filter((d) => d.Average_GPA > 0);
	const validRating = data.filter((d) => d.evalMedian && d.evalMedian.MedianGlobal > 0);

	return {
		totalCourses: data.length,
		avgGPA:
			validGPA.length > 0
				? validGPA.reduce((sum, d) => sum + d.Average_GPA, 0) / validGPA.length
				: 0,
		avgRating:
			validRating.length > 0
				? validRating.reduce((sum, d) => sum + (d.evalMedian?.MedianGlobal || 0), 0) /
					validRating.length
				: 0,
		totalStudents: data.reduce((sum, d) => sum + (d.Student_Count || 0), 0)
	};
}

export function getUniqueValues<T>(data: T[], key: keyof T): string[] {
	const uniqueValues = new Set<string>();

	data.forEach((item) => {
		const value = String(item[key]);
		if (value && value.trim() !== '') {
			uniqueValues.add(value);
		}
	});

	return Array.from(uniqueValues).sort();
}

export function filterData(
	data: CombinedCourseData[],
	filters: {
		department?: string;
		year?: string;
		instructor?: string;
		search?: string;
	}
): CombinedCourseData[] {
	return data.filter((item) => {
		const matchesDept = !filters.department || item.department === filters.department;
		const matchesYear = !filters.year || item.Academic_Year === filters.year;
		const matchesInstructor = !filters.instructor || item.Primary_Instructor === filters.instructor;
		const matchesSearch =
			!filters.search ||
			item.Course_Title.toLowerCase().includes(filters.search.toLowerCase()) ||
			item.Course_Number.toLowerCase().includes(filters.search.toLowerCase());

		return matchesDept && matchesYear && matchesInstructor && matchesSearch;
	});
}
