import { parseCSV, transformEvalMedianData, transformEvalParamData, transformGradeData } from "$lib/utils/csvParser";

export async function loadDataFromFiles() {
    try {
        const [combinedResponse, filtersResponse] = await Promise.all([
            fetch('/data/processed/combined-data.json'),
            fetch('/data/processed/filter-options.json'),
        ]);

        // Check if all responses are OK
        if (!combinedResponse.ok || !filtersResponse.ok) {
            throw new Error('Could not load processed data files');
        }

        const [combinedData, filterOptions] = await Promise.all([
            combinedResponse.json(),
            filtersResponse.json(),
        ]);

        return {
            combinedData,
            filterOptions,
            gradesData: [],
            evalParamsData: [],
            evalMediansData: []
        };
    } catch (error) {
        console.error('Error loading CSV files:', error);
        // Fallback to loading from CSV files if the processed data is not available
        return await loadDataFromCSVFiles();
    }
}

export async function loadDataFromCSVFiles() {
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
            combinedData: null,
            filterOptions: null,
            gradesData: transformGradeData(parseCSV(gradesText)),
            evalParamsData: transformEvalParamData(parseCSV(evalParamsText)),
            evalMediansData: transformEvalMedianData(parseCSV(evalMediansText))
        };
    } catch (error) {
        console.error('Error loading CSV files:', error);
        return null;
    }
}
