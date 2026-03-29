import type { GradeData, EvalParam, EvalMedian, CombinedCourseData } from '../src/lib/types';

type EvalMatch = {
	param: EvalParam;
	median: EvalMedian | null;
};

type TermYear = {
	term: string;
	year: number;
};

function extractDepartmentAndNumber(courseNumber: string): {
	department: string;
	number: string;
	section: string;
} {
	const parts = courseNumber.trim().split(/\s+/);

	const departmentParts: string[] = [];
	let numberIndex = -1;

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

function getPossibleTermYears(academicYear: string): TermYear[] {
	const [startYearRaw, endYearRaw] = academicYear.split('-');
	const startYear = Number.parseInt(startYearRaw, 10);
	const endYear = Number.parseInt(endYearRaw, 10);

	if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
		return [];
	}

	return [
		{ term: 'Autumn', year: startYear },
		{ term: 'Winter', year: endYear },
		{ term: 'Spring', year: endYear },
		{ term: 'Summer', year: endYear }
	];
}

function extractInstructorNameParts(name: string | null): {
	lastName: string;
	firstName: string;
} {
	if (!name) {
		return { lastName: '', firstName: '' };
	}

	const trimmed = name.trim();
	if (!trimmed) {
		return { lastName: '', firstName: '' };
	}

	if (trimmed.includes(',')) {
		const [lastName, firstName = ''] = trimmed.split(',').map((part) => part.trim());
		return { lastName, firstName };
	}

	const parts = trimmed.split(/\s+/);
	if (parts.length === 1) {
		return { lastName: parts[0], firstName: '' };
	}

	return {
		lastName: parts[parts.length - 1],
		firstName: parts.slice(0, -1).join(' ')
	};
}

function buildEvalLookupKeys(param: EvalParam): string[] {
	return [
		// Primary: Term-Year-CourseAbbrev-CourseNumber-LastName-FirstName
		`${param.Term}-${param.Year}-${param.CourseAbbrev}-${param.CourseNumber}-${param.LastName}-${param.FirstName}`,
		// Secondary: Term-Year-CourseAbbrev-CourseNumber-LastName (no first name)
		`${param.Term}-${param.Year}-${param.CourseAbbrev}-${param.CourseNumber}-${param.LastName}`,
		// Tertiary: Course and instructor last name
		`${param.CourseAbbrev}-${param.CourseNumber}-${param.LastName}`,
		// Quaternary: Course only
		`${param.CourseAbbrev}-${param.CourseNumber}`
	];
}

function buildGradeLookupKeys(args: {
	term: string;
	year: number;
	department: string;
	courseNumber: string;
	instructorLastName: string;
	instructorFirstName: string;
}): string[] {
	const { term, year, department, courseNumber, instructorLastName, instructorFirstName } = args;

	return [
		`${term}-${year}-${department}-${courseNumber}-${instructorLastName}-${instructorFirstName}`,
		`${term}-${year}-${department}-${courseNumber}-${instructorLastName}`,
		`${department}-${courseNumber}-${instructorLastName}`,
		`${department}-${courseNumber}`
	];
}

function findMatchingEvaluation(
	grade: GradeData,
	department: string,
	courseNumber: string,
	evaluationLookup: Map<string, EvalMatch>
): EvalMatch | null {
	const { lastName, firstName } = extractInstructorNameParts(grade.Primary_Instructor);
	const possibleTermYears = getPossibleTermYears(grade.Academic_Year);

	for (const { term, year } of possibleTermYears) {
		for (const key of buildGradeLookupKeys({
			term,
			year,
			department,
			courseNumber,
			instructorLastName: lastName,
			instructorFirstName: firstName
		})) {
			const match = evaluationLookup.get(key);
			if (match) {
				return match;
			}
		}
	}

	return null;
}

export function combineData(
	gradesData: GradeData[],
	evalParamsData: EvalParam[],
	evalMediansData: EvalMedian[]
): CombinedCourseData[] {
	console.log('Starting data combination...');

	const evalMediansById = new Map<number, EvalMedian>();
	evalMediansData.forEach((median) => {
		evalMediansById.set(median.EvalID, median);
	});

	const evaluationLookup = new Map<string, EvalMatch>();
	evalParamsData.forEach((param) => {
		const match: EvalMatch = {
			param,
			median: evalMediansById.get(param.EvalID) ?? null
		};

		buildEvalLookupKeys(param).forEach((key) => {
			if (!evaluationLookup.has(key)) {
				evaluationLookup.set(key, match);
			}
		});
	});

	const combined: CombinedCourseData[] = [];
	let matchedToEvalParams = 0;
	let matchedToRatings = 0;

	for (const grade of gradesData) {
		const {
			department,
			number: courseNumber,
			section
		} = extractDepartmentAndNumber(grade.Course_Number);

		const matchedEval = findMatchingEvaluation(grade, department, courseNumber, evaluationLookup);

		if (matchedEval) {
			matchedToEvalParams++;
			if (
				typeof matchedEval.median?.MedianGlobal === 'number' &&
				matchedEval.median.MedianGlobal > 0
			) {
				matchedToRatings++;
			}
		}

		combined.push({
			...grade,
			department,
			courseNumber,
			section,
			evalParam: matchedEval?.param,
			evalMedian: matchedEval?.median ?? undefined
		});
	}

	console.log('=== MATCHING RESULTS ===');
	console.log(`Total grades: ${gradesData.length}`);
	console.log(
		`Grades matched to eval params: ${matchedToEvalParams} (${((matchedToEvalParams / gradesData.length) * 100).toFixed(1)}%)`
	);
	console.log(
		`Grades with actual rating data: ${matchedToRatings} (${((matchedToRatings / gradesData.length) * 100).toFixed(1)}%)`
	);

	return combined;
}
