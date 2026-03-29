import type { CombinedCourseData } from '../src/lib/types';

function toTitleCaseWord(word: string): string {
	return word.toLowerCase().replace(/^[a-z]/, (m) => m.toUpperCase());
}

function normalizeNameCasing(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => {
			// Initials are upper case
			if (/^[A-Za-z]\.?$/.test(part)) {
				return part.toUpperCase();
			}

			return part
				.split(/([-'])/)
				.map((segment) => {
					if (segment === '-' || segment === "'") return segment;
					return toTitleCaseWord(segment);
				})
				.join('');
		})
		.join(' ');
}

export type NormalizedInstructor = {
	displayName: string | null;
	key: string | null;
};

export function normalizeCombinedData(data: CombinedCourseData[]): CombinedCourseData[] {
	return data.map((item) => ({
		...item,
		Primary_Instructor: normalizeInstructorName(item.Primary_Instructor).displayName
	}));
}

export function normalizeSearchText(...parts: Array<string | null | undefined>): string {
	return parts
		.filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
		.join(' ')
		.toLocaleLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}


export function normalizeInstructorName(raw: string | null | undefined): NormalizedInstructor {
	if (raw == null) {
		return { displayName: null, key: null };
	}

	const trimmed = raw.trim();
	if (!trimmed || trimmed.toUpperCase() === 'NULL') {
		return { displayName: null, key: null };
	}

	let displayName: string;

	// The format pre spring term of the year 2016 formats instructors names as "FINE, ARTHUR" instead
	// of as the post spring term 2016 "Arthur Fine". This normalizes to "Arthur Fine" format.
	if (trimmed.includes(',')) {
		const [lastPart, firstPart, ...rest] = trimmed.split(',').map((s) => s.trim());
		const leftover = rest.join(' ').trim();

		const pieces = [firstPart, leftover, lastPart].filter(Boolean);
		displayName = normalizeNameCasing(pieces.join(' '));
	} else {
		displayName = normalizeNameCasing(trimmed);
	}

	const key = displayName.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();

	return { displayName, key: key || null };
}

