import { parseCSV, transformEvalMedianData, transformEvalParamData, transformGradeData } from '../src/lib/utils/csvParser.ts';
import { combineData } from '../src/lib/utils/dataProcessor.ts';
import fs from 'fs';
import path from 'path';


async function processData() {
    try {
        // Read CSV files
        const gradesText = fs.readFileSync('static/data/grades.csv', 'utf8');
        const evalParamsText = fs.readFileSync('static/data/eval-params.csv', 'utf8');
        const evalMediansText = fs.readFileSync('static/data/eval-medians.csv', 'utf8');

        // Parse CSV data
        const gradesData = transformGradeData(parseCSV(gradesText));
        const evalParamsData = transformEvalParamData(parseCSV(evalParamsText));
        const evalMediansData = transformEvalMedianData(parseCSV(evalMediansText));

        // Combine data
        const combinedData = combineData(gradesData, evalParamsData, evalMediansData);

        // Generate filter options
        const departments = [...new Set(combinedData.map(d => d.department))].sort();
        const years = [...new Set(combinedData.map(d => d.Academic_Year))].sort();
        const instructors = [...new Set(combinedData.map(d => d.Primary_Instructor))].sort();

        // Write processed data to JSON files
        const outputDir = 'static/data/processed';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(outputDir, 'combined-data.json'),
            JSON.stringify(combinedData)
        );

        fs.writeFileSync(
            path.join(outputDir, 'filter-options.json'),
            JSON.stringify({ departments, years, instructors })
        );

        console.log(`Processed ${combinedData.length} course records`);
        console.log(`Generated ${departments.length} departments, ${years.length} years, ${instructors.length} instructors`);
    } catch (error) {
        console.error('Error processing data:', error);
        process.exit(1);
    }
}

processData();
