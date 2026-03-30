import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	parseCSV,
	transformEvalMedianData,
	transformEvalParamData,
	transformGradeData
} from '../src/lib/utils/csvParser';
import { buildCourseArtifacts } from './courseArtifacts';
import { buildFilterOptions } from './courseAggregates';
import { combineData } from './courseMatching';
import { normalizeCombinedData } from './courseNormalization';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RAW_DATA_DIR = path.join(PROJECT_ROOT, 'static', 'data');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'lib', 'server', 'generated');
const COURSES_BY_DEPARTMENT_DIR = path.join(OUTPUT_DIR, 'courses-by-department');

async function readCsv(filename: string): Promise<string> {
	const filepath = path.join(RAW_DATA_DIR, filename);
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
	const combinedRaw = combineData(gradesData, evalParamsData, evalMediansData);

	console.log('Normalizing combined data...');
	const combinedData = normalizeCombinedData(combinedRaw);

	console.log('Building generated artifacts...');
	const filterOptions = buildFilterOptions(combinedData);
	const { coursesIndex, courseDepartmentManifest, coursesByDepartment } =
		buildCourseArtifacts(combinedData);

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
