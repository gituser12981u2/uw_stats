export interface GradeData {
	Academic_Year: string;
	Term: string;
	Course_Number: string;
	Course_Title: string;
	Primary_Instructor: string;
	Student_Count: number;
	A: number;
	'A-': number;
	'B+': number;
	B: number;
	'B-': number;
	'C+': number;
	C: number;
	'C-': number;
	'D+': number;
	D: number;
	'D-': number;
	F: number;
	W: number;
	Average_GPA: number;
}

export interface EvalParam {
	InstCode: string;
	Term: string;
	Year: number;
	EvalID: number;
	Form: string;
	CourseType: string;
	EvaluationType: number;
	Group: string;
	Enrollment: number;
	Questionnaires: number;
	CrossList: number;
	CollegeCode: string;
	CollegeText: string;
	SubCollegeCode: string;
	SubCollegeText: string;
	DepartmentCode: string;
	DepartmentText: string;
	CourseAbbrev: string;
	CourseNumber: string;
	Section: string;
	CourseTitle: string;
	Credits: number;
	MultInst: number;
	LastName: string;
	FirstName: string;
	MiddleName: string;
	Rank: number;
	EvalURL: string;
	AssignedInstructor: string;
}

export interface EvalMedian {
	InstCode: string;
	Term: string;
	Year: number;
	EvalID: number;
	Form: string;
	MedianGlobal: number;
	Median01: number;
	Median02: number;
	Median03: number;
	Median04: number;
	CEI: number;
	NGlobal: number;
	N01: number;
	N02: number;
	NCEI: number;
}

export interface CombinedCourseData extends GradeData {
	department: string;
	courseNumber: string;
	section: string;
	evalParam?: EvalParam;
	evalMedian?: EvalMedian;
}

export interface CourseStats {
	totalCourses: number;
	avgGPA: number;
	avgRating: number;
	totalStudents: number;
}

export type CourseIndexEntry = {
	slug: string;
	department: string;
	courseNumber: string;
	courseCode: string;
	title: string;
	searchText: string;
	totalOfferings: number;
	totalStudents: number;
	averageGPA: number;
	averageRating: number | null;
	gradeDistribution: GradeDistributionItem[];
	years: string[];
	instructors: string[];
};

export type CoursesSearchResponse = {
	courses: CourseIndexEntry[];
	gradeDistribution: GradeDistributionItem[];
};

export type FilterOptions = {
	departments: string[];
	years: string[];
	instructors: string[];
};

export type GradeDistributionItem = {
	grade: string;
	count: number;
	percentage: number;
};

export type InstructorStat = {
	name: string;
	offerings: number;
	totalStudents: number;
	averageGPA: number;
	averageRating: number | null;
};

export type CourseDetailPayload = {
	slug: string;
	department: string;
	courseNumber: string;
	courseCode: string;
	title: string;
	summary: {
		totalOfferings: number;
		totalStudents: number;
		averageGPA: number;
		averageRating: number | null;
		years: string[];
		instructors: string[];
	};
	gradeDistribution: GradeDistributionItem[];
	instructorStats: InstructorStat[];
	offerings: CombinedCourseData[];
};

export type DepartmentCoursesFile = Record<string, CourseDetailPayload>;
export type CoursesDepartmentManifest = Record<string, string>;

export type HomePageData = {
	filterOptions: FilterOptions;
	courses: CourseIndexEntry[];
	gradeDistribution: GradeDistributionItem[];
	filters: {
		search: string;
		department: string;
		year: string;
		instructor: string;
	};
};
