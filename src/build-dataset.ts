#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

// Répertoire des données (depuis la racine du projet)
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const TRAIN_FILE = 'train_loto.json';
const TEST_FILE = 'test_loto.json';

// Fichiers de sortie pour LSTM
const X_TRAIN_SEQ = 'x_train_seq.json'; // shape: [N_train, WINDOW_SIZE, LABEL_DIM]
const Y_TRAIN = 'y_train.json';      // shape: [N_train, LABEL_DIM]
const X_TEST_SEQ = 'x_test_seq.json';  // shape: [N_test, WINDOW_SIZE, LABEL_DIM]
const Y_TEST = 'y_test.json';      // shape: [N_test, LABEL_DIM]

// Paramètres
const WINDOW_SIZE = 20;
export const LABEL_DIM = 49 + 10; // 59

// Interface d'un tirage
interface Draw {
    date: string;
    numbers: number[];
    chance: number;
}

// Charge un fichier JSON de tirages
async function loadDraws(fileName: string): Promise<Draw[]> {
    const raw = await fs.readFile(path.join(DATA_DIR, fileName), 'utf-8');
    return JSON.parse(raw) as Draw[];
}

// Construit un vecteur multi-hot pour un tirage
function makeLabel(draw: Draw): number[] {
    const lbl = Array(LABEL_DIM).fill(0);
    // boules numérotées 1-49
    for (const n of draw.numbers) {
        if (n >= 1 && n <= 49) lbl[n - 1] = 1;
    }
    // chance numérotée 1-10
    if (draw.chance >= 1 && draw.chance <= 10) {
        lbl[49 + draw.chance - 1] = 1;
    }
    return lbl;
}

// Construction des séquences pour LSTM
function buildSequences(draws: Draw[]): { X: number[][][]; Y: number[][] } {
    const X: number[][][] = [];
    const Y: number[][] = [];

    for (let i = WINDOW_SIZE; i < draws.length; i++) {
        // séquence des WINDOW_SIZE tirages précédents
        const seq: number[][] = [];
        for (let j = i - WINDOW_SIZE; j < i; j++) {
            seq.push(makeLabel(draws[j]));
        }
        X.push(seq);
        // label à prédire : le tirage i
        Y.push(makeLabel(draws[i]));
    }

    return { X, Y };
}

(async () => {
    console.log('🔄 Chargement des tirages...');
    const trainDraws = await loadDraws(TRAIN_FILE);
    const testDraws = await loadDraws(TEST_FILE);

    console.log('📐 Construction des séquences train...');
    const { X: XtrSeq, Y: Ytr } = buildSequences(trainDraws);
    console.log(`→ ${XtrSeq.length} séquences générées pour l'entraînement`);

    console.log('📐 Construction des séquences test...');
    const { X: XteSeq, Y: Yte } = buildSequences(testDraws);
    console.log(`→ ${XteSeq.length} séquences générées pour le test`);

    console.log('💾 Export JSON...');
    await fs.writeFile(path.join(DATA_DIR, X_TRAIN_SEQ), JSON.stringify(XtrSeq, null, 2), 'utf-8');
    await fs.writeFile(path.join(DATA_DIR, Y_TRAIN), JSON.stringify(Ytr, null, 2), 'utf-8');
    await fs.writeFile(path.join(DATA_DIR, X_TEST_SEQ), JSON.stringify(XteSeq, null, 2), 'utf-8');
    await fs.writeFile(path.join(DATA_DIR, Y_TEST), JSON.stringify(Yte, null, 2), 'utf-8');

    console.log(`✅ Séquences exportées: train=${XtrSeq.length}, test=${XteSeq.length}`);
})();
