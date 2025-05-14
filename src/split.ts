#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

interface LotteryDraw {
    date: string;
    numbers: number[];
    chance: number;
}

// Répertoires et fichiers
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const INPUT_FILE = 'combined_loto.json';
const TRAIN_FILE = 'train_loto.json';
const TEST_FILE = 'test_loto.json';

// Ratio de split (train / total)
const TRAIN_RATIO = 0.8;

async function main(): Promise<void> {
    try {
        // 1. Charger le fichier JSON complet
        const inputPath = path.join(DATA_DIR, INPUT_FILE);
        const raw = await fs.readFile(inputPath, 'utf-8');
        const allDraws = JSON.parse(raw) as LotteryDraw[];

        // 2. Assurer l'ordre chronologique
        allDraws.sort((a, b) => a.date.localeCompare(b.date));

        // 3. Déterminer l'indice de split
        const splitIndex = Math.floor(allDraws.length * TRAIN_RATIO);

        const trainSet = allDraws.slice(0, splitIndex);
        const testSet = allDraws.slice(splitIndex);

        // 4. Écrire train et test
        const trainPath = path.join(DATA_DIR, TRAIN_FILE);
        const testPath = path.join(DATA_DIR, TEST_FILE);

        await fs.writeFile(trainPath, JSON.stringify(trainSet, null, 2), 'utf-8');
        await fs.writeFile(testPath, JSON.stringify(testSet, null, 2), 'utf-8');

        console.log(`Split effectué : ${trainSet.length} tirages en entraînement, ${testSet.length} en test.`);
        console.log(`Fichiers générés : ${TRAIN_FILE}, ${TEST_FILE}`);
    } catch (err) {
        console.error('Erreur durant le split :', err);
        process.exit(1);
    }
}

main();
