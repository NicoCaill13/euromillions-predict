import fs from 'fs/promises';
import path from 'path';
import { parseCSV } from './utils/parseCSV.js';
import { parseFutureCSV } from './utils/futureParser.js';

export interface Draw {
  date: string;
  numbers: number[];
}


export const loadDraws = async (dataDir: string): Promise<Draw[]> => {
  const files = await fs.readdir(dataDir);
  const csvFiles = files.filter(f => f.startsWith('euromillions') && f.endsWith('.csv'));

  let allDraws: Draw[] = [];

  for (const file of csvFiles) {
    const content = await fs.readFile(path.join(dataDir, file), 'utf-8');

    // Essai avec ;
    let records = await parseCSV(content, ';');

    // Si ça capte mal (1 seule colonne détectée), on réessaie avec ,
    if (Object.keys(records[0]).length === 1) {
      records = await parseCSV(content, ',');
    }

    const draws: Draw[] = records.map(row => ({
      date: row.date_de_tirage,
      numbers: [
        Number(row.boule_1),
        Number(row.boule_2),
        Number(row.boule_3),
        Number(row.boule_4),
        Number(row.boule_5)
      ]
    }));

    allDraws = allDraws.concat(draws);
  }

  allDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return allDraws;
};



export const loadFutureDraws = async (dir: string): Promise<Draw[]> => {
  const file = path.join(dir, 'last_draw.csv');

  try {
    await fs.access(file);
    console.log(`✅ Fichier futur tirages détecté : ${file}`);
    const draws = await parseFutureCSV(file);
    console.log(`🔢 Nombre de tirages futurs chargés : ${draws.length}`);
    return draws;
  } catch (error) {
    console.log('⚠️ Aucun fichier de futurs tirages trouvé.');
    console.log(error)
    return [];
  }
};