import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { Draw } from '../loader.js'; // utilise ton type Draw existant

export const parseFutureCSV = async (filePath: string): Promise<Draw[]> => {
    const content = await fs.readFile(filePath, 'utf-8');

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: [';', ',']
    });

    return records.map((row: any) => ({
        date: row['date_de_tirage'], // format : 18/03/2025
        numbers: [
            parseInt(row['boule_1'], 10),
            parseInt(row['boule_2'], 10),
            parseInt(row['boule_3'], 10),
            parseInt(row['boule_4'], 10),
            parseInt(row['boule_5'], 10)
        ].filter(n => !isNaN(n))
    }));
};
