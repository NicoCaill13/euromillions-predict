#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

type Draw = { date: string; numbers: number[]; chance: number };

// Paramètres\const WINDOW_SIZE = 20;

// Fichiers\const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const TRAIN_FILE = 'train_loto.json';
const TEST_FILE = 'test_loto.json';
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const WINDOW_SIZE = 20;


// Chargement des tirages
async function loadDraws(fileName: string): Promise<Draw[]> {
    const raw = await fs.readFile(path.join(DATA_DIR, fileName), 'utf-8');
    return JSON.parse(raw) as Draw[];
}

(async () => {
    console.log('🔄 Chargement des tirages...');
    const trainDraws = await loadDraws(TRAIN_FILE);
    const testDraws = await loadDraws(TEST_FILE);

    console.log('📊 Calcul du baseline fréquentiel...');
    let history: Draw[] = [...trainDraws];

    let TP = 0, FP = 0, FN = 0, exactMatch = 0;
    const total = testDraws.length;

    for (const draw of testDraws) {
        // Fenêtre historique
        const window = history.slice(-WINDOW_SIZE);

        // Calcul des fréquences
        const freq = Array(49).fill(0);
        const freqChance = Array(10).fill(0);
        for (const d of window) {
            d.numbers.forEach(n => freq[n - 1]++);
            if (d.chance >= 1 && d.chance <= 10) freqChance[d.chance - 1]++;
        }

        // Top 5 boules
        const predBalls = freq
            .map((count, idx) => ({ num: idx + 1, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(o => o.num);
        // Top 1 chance
        const predChance = freqChance
            .map((count, idx) => ({ num: idx + 1, count }))
            .sort((a, b) => b.count - a.count)[0].num;

        // Vérité terrain
        const trueBalls = draw.numbers;
        const trueChance = draw.chance;

        // Comptage TP, FP, FN
        const predSet = new Set([...predBalls, predChance]);
        const trueSet = new Set([...trueBalls, trueChance]);

        for (const p of predSet) {
            if (trueSet.has(p)) TP++; else FP++;
        }
        for (const t of trueSet) {
            if (!predSet.has(t)) FN++;
        }
        if (predSet.size === trueSet.size && [...predSet].every(n => trueSet.has(n))) {
            exactMatch++;
        }

        // Ajout au passé
        history.push(draw);
    }

    const precision = TP / (TP + FP);
    const recall = TP / (TP + FN);
    const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
    const emRatio = exactMatch / total;

    console.log('🎯 Résultats baseline fréquentiel :');
    console.log(`• Precision: ${precision.toFixed(4)}`);
    console.log(`• Recall   : ${recall.toFixed(4)}`);
    console.log(`• F1-score : ${f1.toFixed(4)}`);
    console.log(`• Exact Match Ratio: ${emRatio.toFixed(4)} (sur ${total} tirages)`);
})();
