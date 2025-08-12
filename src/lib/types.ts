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
