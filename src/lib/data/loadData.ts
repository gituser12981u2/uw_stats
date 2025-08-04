import { parseCSV, transformEvalMedianData, transformEvalParamData, transformGradeData } from "$lib/utils/csvParser";

export async function loadDataFromFiles() {
    try {
        const [gradesResponse, evalParamsResponse, evalMediansResponse] = await Promise.all([
            fetch('/data/grades.csv'),
            fetch('/data/eval-params.csv'),
            fetch('/data/eval-medians.csv')
        ]);

        // Check if all responses are OK
        if (!gradesResponse.ok || !evalParamsResponse.ok || !evalMediansResponse.ok) {
            throw new Error('One or more CSV files could not be loaded');
        }

        const [gradesText, evalParamsText, evalMediansText] = await Promise.all([
            gradesResponse.text(),
            evalParamsResponse.text(),
            evalMediansResponse.text()
        ]);

        return {
            gradesData: transformGradeData(parseCSV(gradesText)),
            evalParamsData: transformEvalParamData(parseCSV(evalParamsText)),
            evalMediansData: transformEvalMedianData(parseCSV(evalMediansText))
        };
    } catch (error) {
        console.error('Error loading CSV files:', error);
        return null;
    }
}
