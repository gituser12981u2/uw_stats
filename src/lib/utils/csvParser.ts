import type { EvalMedian, EvalParam, GradeData } from '$lib/types';

type RawCSVRow = Record<string, string | number | ''>;

export function parseCSV(csvText: string): RawCSVRow[] {
	if (!csvText || typeof csvText !== 'string') {
		throw new Error('Invalid CSV text provided');
	}

	const trimmedText = csvText.trim();
	if (!trimmedText) {
		throw new Error('Empty CSV content');
	}

	const lines = trimmedText.split('\n');
	if (lines.length < 2) {
		throw new Error('CSV must contain at least a header and one data row');
	}

	const headers = parseCSVLine(lines[0])
		.map((h) => h.trim().replace(/^"|"$/g, '')) // Remove surrounding quotes
		.filter((h) => h.length > 0); // Remove empty headers

	if (headers.length === 0) {
		throw new Error('No valid headers found in CSV');
	}

	const data: RawCSVRow[] = [];
	const errors: string[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue; // Skip empty lines

		try {
			const values = parseCSVLine(line);
			const row: RawCSVRow = {};

			headers.forEach((header, index) => {
				const rawValue = values[index]?.trim().replace(/^"|"$/g, '') || '';
				row[header] = convertValue(rawValue);
			});

			data.push(row);
		} catch (error) {
			errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
			// Continue parsing other lines
		}
	}

	if (errors.length > 0 && errors.length > data.length * 0.1) {
		// If more than 10% of lines have errors, something is seriously wrong
		console.warn('CSV parsing errors:', errors.slice(0, 5)); // Log first 5 errors
		throw new Error(`Too many parsing errors (${errors.length}). First error: ${errors[0]}`);
	}

	if (data.length === 0) {
		throw new Error('No valid data rows found in CSV');
	}

	console.log(`Parsed CSV: ${data.length} rows, ${headers.length} columns`);
	if (errors.length > 0) {
		console.warn(`CSV parsing completed with ${errors.length} minor errors`);
	}

	return data;
}

/**
 * Parses a single CSV line, handling quoted values and commas within quotes
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote within quoted field
				current += '"';
				i += 2;
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
				i++;
			}
		} else if (char === ',' && !inQuotes) {
			// Field separator
			result.push(current);
			current = '';
			i++;
		} else {
			current += char;
			i++;
		}
	}

	// Add the last field
	result.push(current);
	return result;
}

/**
 * Converts string values to appropriate types
 */
function convertValue(value: string): string | number | '' {
	if (value === '' || value === 'NULL' || value === 'null') {
		return '';
	}

	// Try to convert to number
	if (value !== '' && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
		const num = parseFloat(value);
		// Check if it's an integer
		if (Number.isInteger(num)) {
			return parseInt(value, 10);
		}
		return num;
	}

	return value;
}

/**
 * Transforms raw CSV data to GradeData with validation
 */
export function transformGradeData(rawData: RawCSVRow[]): GradeData[] {
	if (!Array.isArray(rawData) || rawData.length === 0) {
		throw new Error('Invalid or empty grade data provided');
	}

	const transformed = rawData.map((row, index) => {
		try {
			return {
				Academic_Year: safeString(row.Academic_Year, ''),
				Term: safeString(row.Term, ''),
				Course_Number: safeString(row.Course_Number, ''),
				Course_Title: safeString(row.Course_Title, ''),
				Primary_Instructor: safeString(row.Primary_Instructor, ''),
				Student_Count: safeNumber(row.Student_Count, 0),
				A: safeNumber(row.A, 0),
				'A-': safeNumber(row['A-'], 0),
				'B+': safeNumber(row['B+'], 0),
				B: safeNumber(row.B, 0),
				'B-': safeNumber(row['B-'], 0),
				'C+': safeNumber(row['C+'], 0),
				C: safeNumber(row.C, 0),
				'C-': safeNumber(row['C-'], 0),
				'D+': safeNumber(row['D+'], 0),
				D: safeNumber(row.D, 0),
				'D-': safeNumber(row['D-'], 0),
				F: safeNumber(row.F, 0),
				W: safeNumber(row.W, 0),
				Average_GPA: safeNumber(row.Average_GPA, 0)
			};
		} catch (error) {
			throw new Error(
				`Row ${index + 1}: ${error instanceof Error ? error.message : 'Transformation error'}`
			);
		}
	});

	console.log(`Transformed ${transformed.length} grade records`);
	return transformed;
}

/**
 * Transforms raw CSV data to EvalParam with validation
 */
export function transformEvalParamData(rawData: RawCSVRow[]): EvalParam[] {
	if (!Array.isArray(rawData) || rawData.length === 0) {
		throw new Error('Invalid or empty eval param data provided');
	}

	const transformed = rawData.map((row, index) => {
		try {
			return {
				InstCode: safeString(row.InstCode, ''),
				Term: safeString(row.Term, ''),
				Year: safeNumber(row.Year, 0),
				EvalID: safeNumber(row.EvalID, 0),
				Form: safeString(row.Form, ''),
				CourseType: safeString(row.CourseType, ''),
				EvaluationType: safeNumber(row.EvaluationType, 0),
				Group: safeString(row.Group, ''),
				Enrollment: safeNumber(row.Enrollment, 0),
				Questionnaires: safeNumber(row.Questionnaires, 0),
				CrossList: safeNumber(row.CrossList, 0),
				CollegeCode: safeString(row.CollegeCode, ''),
				CollegeText: safeString(row.CollegeText, ''),
				SubCollegeCode: safeString(row.SubCollegeCode, ''),
				SubCollegeText: safeString(row.SubCollegeText, ''),
				DepartmentCode: safeString(row.DepartmentCode, ''),
				DepartmentText: safeString(row.DepartmentText, ''),
				CourseAbbrev: safeString(row.CourseAbbrev, ''),
				CourseNumber: safeString(row.CourseNumber, ''),
				Section: safeString(row.Section, ''),
				CourseTitle: safeString(row.CourseTitle, ''),
				Credits: safeNumber(row.Credits, 0),
				MultInst: safeNumber(row.MultInst, 0),
				LastName: safeString(row.LastName, ''),
				FirstName: safeString(row.FirstName, ''),
				MiddleName: safeString(row.MiddleName, ''),
				Rank: safeNumber(row.Rank, 0),
				EvalURL: safeString(row.EvalURL, ''),
				AssignedInstructor: safeString(row.AssignedInstructor, '')
			};
		} catch (error) {
			throw new Error(
				`Row ${index + 1}: ${error instanceof Error ? error.message : 'Transformation error'}`
			);
		}
	});

	console.log(`Transformed ${transformed.length} eval param records`);
	return transformed;
}

/**
 * Transforms raw CSV data to EvalMedian with validation
 */
export function transformEvalMedianData(rawData: RawCSVRow[]): EvalMedian[] {
	if (!Array.isArray(rawData) || rawData.length === 0) {
		throw new Error('Invalid or empty eval median data provided');
	}

	const transformed = rawData.map((row, index) => {
		try {
			return {
				InstCode: safeString(row.InstCode, ''),
				Term: safeString(row.Term, ''),
				Year: safeNumber(row.Year, 0),
				EvalID: safeNumber(row.EvalID, 0),
				Form: safeString(row.Form, ''),
				MedianGlobal: safeNumber(row.MedianGlobal, 0),
				Median01: safeNumber(row.Median01, 0),
				Median02: safeNumber(row.Median02, 0),
				Median03: safeNumber(row.Median03, 0),
				Median04: safeNumber(row.Median04, 0),
				CEI: safeNumber(row.CEI, 0),
				NGlobal: safeNumber(row.NGlobal, 0),
				N01: safeNumber(row.N01, 0),
				N02: safeNumber(row.N02, 0),
				NCEI: safeNumber(row.NCEI, 0)
			};
		} catch (error) {
			throw new Error(
				`Row ${index + 1}: ${error instanceof Error ? error.message : 'Transformation error'}`
			);
		}
	});

	console.log(`Transformed ${transformed.length} eval median records`);
	return transformed;
}

/**
 * Safely converts value to string with fallback
 */
function safeString(value: unknown, fallback: string = ''): string {
	if (value === null || value === undefined) {
		return fallback;
	}
	return String(value).trim();
}

/**
 * Safely converts value to number with fallback
 */
function safeNumber(value: unknown, fallback: number = 0): number {
	if (value === null || value === undefined || value === '') {
		return fallback;
	}

	const num = Number(value);
	if (isNaN(num)) {
		return fallback;
	}

	return num;
}
