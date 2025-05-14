#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface CsvRow {
    [key: string]: string;
}

interface LotteryDraw {
    date: string;
    numbers: number[];
    chance: number;
}

// Répertoire des données relatif au répertoire courant d'exécution (process.cwd())
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const OUTPUT_FILENAME = 'combined_loto.json';
const OUTPUT_PATH = path.join(DATA_DIR, OUTPUT_FILENAME);

async function main(): Promise<void> {
    try {
        // 1. Lister les fichiers CSV
        const files = await fs.readdir(DATA_DIR);
        const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
        if (csvFiles.length === 0) {
            throw new Error(`Aucun fichier CSV trouvé dans ${DATA_DIR}`);
        }

        const allDraws: LotteryDraw[] = [];

        // 2. Parser chaque CSV
        for (const file of csvFiles) {
            const filePath = path.join(DATA_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const rows = parse(content, {
                columns: true,
                skip_empty_lines: true
            }) as CsvRow[];

            for (const row of rows) {
                // 2.1. Date
                const rawDate = row.date_de_tirage ?? row.Date ?? row['date tirage'];
                let newRawDate;
                if (!rawDate) {
                    console.warn(`Ligne ignorée (pas de date) dans ${file}`);
                    continue;
                }
                if (rawDate.includes('/')) {
                    const splittedDate = rawDate.split("/");
                    newRawDate = new Date(`${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}T12:00:00`);
                }
                else {
                    const addedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6)}T12:00:00`
                    newRawDate = new Date(addedDate)
                }

                const dateObj = new Date(newRawDate);
                if (isNaN(dateObj.getTime())) {
                    console.warn(`Date invalide "${rawDate}" dans ${file}`);
                    continue;
                }
                const date = dateObj.toISOString().slice(0, 10);

                // 2.2. Numéros des boules
                const bouleKeys = Object.keys(row)
                    .filter(k => /^boule[_\s]?\d+$/i.test(k))
                    .sort((a, b) => {
                        const na = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
                        const nb = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
                        return na - nb;
                    });
                const numbers = bouleKeys
                    .map(k => parseInt(row[k], 10))
                    .filter(n => !isNaN(n));
                if (numbers.length !== 5) {
                    console.warn(`Ligne ignorée (boules incorrectes) dans ${file}`);
                    continue;
                }

                // 2.3. Numéro Chance
                const chanceKey = Object.keys(row).find(k => /chance/i.test(k));
                const chance = chanceKey ? parseInt(row[chanceKey], 10) : NaN;
                if (isNaN(chance)) {
                    console.warn(`Ligne ignorée (chance invalide) dans ${file}`);
                    continue;
                }

                allDraws.push({ date, numbers, chance });
            }
        }

        // 3. Tri chronologique
        allDraws.sort((a, b) => a.date.localeCompare(b.date));

        // 4. Écriture du JSON
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(allDraws, null, 2), 'utf-8');
        console.log(`JSON généré (${allDraws.length} tirages) => ${OUTPUT_PATH}`);
    } catch (err) {
        console.error('Erreur :', err);
        process.exit(1);
    }
}

main();
