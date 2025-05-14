/* -----------------------------------------------------------------------------
 * update_dataset.ts – Ajout du dernier tirage au format dd/MM/yyyy en LIGNE 2
 * -----------------------------------------------------------------------------
 * • API Opendatasoft renvoie "YYYY-MM-DD" → converti en "DD/MM/YYYY"
 * • Insère la ligne juste après l'en‑tête du fichier ayant l'index maximal
 *   (loto4.csv, loto5.csv, …). Crée loto.csv si aucun n'existe encore.
 * --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const DATA_DIR = process.argv[2] ?? 'data';
const API_URL = 'https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/resultats-loto-2019-a-aujourd-hui@agrall/records?limit=3';

interface ApiRow {
    date_de_tirage: string; // YYYY-MM-DD
    boule_1: number; boule_2: number; boule_3: number; boule_4: number; boule_5: number;
    numero_chance: number;
}

function numericIndex(f: string) { const m = f.match(/^loto(\d+)\.csv$/i); return m ? +m[1] : 0; }

/* --------------------------------------------------------------------------- */
async function fetchLastDraw() {
    const { results } = await fetch(API_URL).then(r => r.json());
    const d: ApiRow = results[0];
    const [y, m, day] = d.date_de_tirage.split('-');      // « 2025-04-28 »
    const dateEU = `${day}/${m}/${y}`;                    // « 28/04/2025 »

    const csvLine = [
        dateEU,
        d.boule_1, d.boule_2, d.boule_3, d.boule_4, d.boule_5,
        d.numero_chance,
    ].join(',');
    return { date: dateEU, csvLine };
}

/* --------------------------------------------------------------------------- */
function dateExists(date: string): boolean {
    if (!fs.existsSync(DATA_DIR)) return false;
    return fs.readdirSync(DATA_DIR)
        .filter(f => /^loto(\d*)?\.csv$/i.test(f))
        .some(f => fs.readFileSync(path.join(DATA_DIR, f), 'utf-8').includes(date));
}

function resolveTargetFile(): string {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    const files = fs.readdirSync(DATA_DIR).filter(f => /^loto(\d*)?\.csv$/i.test(f));
    if (!files.length) return path.join(DATA_DIR, 'loto.csv');
    const maxIdx = Math.max(...files.map(numericIndex));
    return path.join(DATA_DIR, maxIdx === 0 ? 'loto.csv' : `loto${maxIdx}.csv`);
}

/* --------------------------------------------------------------------------- */
function insertAfterHeader(line: string, filePath: string) {
    const exists = fs.existsSync(filePath);
    if (!exists) {
        // créer le fichier avec en-tête + ligne
        const header = 'date_de_tirage,boule_1,boule_2,boule_3,boule_4,boule_5,numero_chance';
        fs.writeFileSync(filePath, `${header}\n${line}`);
        console.log(`✅ Créé ${path.basename(filePath)} avec le premier tirage.`);
        return;
    }

    const contents = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
    const header = contents[0];
    const rest = contents.slice(1); // lignes existantes
    const newContent = [header, line, ...rest].join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Tirage ajouté en ligne 2 de ${path.basename(filePath)}`);
}

/* --------------------------------------------------------------------------- */
(async () => {
    try {
        const { date, csvLine } = await fetchLastDraw();
        if (dateExists(date)) {
            console.log(`ℹ️  Le tirage du ${date} est déjà présent – aucune modification.`);
            return;
        }
        insertAfterHeader(csvLine, resolveTargetFile());
    } catch (err) {
        console.error('❌ update_dataset :', err);
        process.exit(1);
    }
})();
