import { parse } from 'csv-parse/sync';

export const parseCSV = (data: string, delimiter: string): any[] => {
  return parse(data, {
    delimiter: [',', ';'],
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
};

