#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

// Chemins
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const DRAW_FILE = 'train_loto.json'; // tous les tirages
const MODEL_DIR = path.join(DATA_DIR, 'model-lstm-final');

const WINDOW_SIZE = 20;
const LABEL_DIM = 49 + 10; // 59
const THRESHOLD = 0.1; // seuil optimisé
const NUM_GRIDS = 5; // nombre de grilles à générer

// Interfaces
interface Draw {
    date: string;
    numbers: number[];
    chance: number;
}

// Chargement des 20 derniers tirages
async function loadLastDraws(): Promise<Draw[]> {
    const raw = await fs.readFile(path.join(DATA_DIR, DRAW_FILE), 'utf-8');
    const draws: Draw[] = JSON.parse(raw);
    return draws.slice(-WINDOW_SIZE);
}

// Construction de la séquence 3D
function buildSequence(window: Draw[]): number[][][] {
    return [
        window.map((draw) => {
            const lbl = Array(LABEL_DIM).fill(0);
            draw.numbers.forEach((n) => {
                if (n >= 1 && n <= 49) lbl[n - 1] = 1;
            });
            if (draw.chance >= 1 && draw.chance <= 10) lbl[49 + draw.chance - 1] = 1;
            return lbl;
        }),
    ];
}

// Échantillonnage pondéré sans remise
function weightedSampleWithoutReplacement<T>(
    items: T[],
    weights: number[],
    k: number,
): T[] {
    const result: T[] = [];
    const availItems = items.slice();
    const availWeights = weights.slice();
    for (let i = 0; i < k && availItems.length > 0; i++) {
        const sum = availWeights.reduce((a, b) => a + b, 0);
        let r = Math.random() * sum;
        let idx = 0;
        while (r > availWeights[idx]) {
            r -= availWeights[idx];
            idx++;
        }
        result.push(availItems[idx]);
        // retirer
        availItems.splice(idx, 1);
        availWeights.splice(idx, 1);
    }
    return result;
}

// Échantillonnage pondéré 1 élément
function weightedSampleOne<T>(items: T[], weights: number[]): T | null {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum === 0) return null;
    let r = Math.random() * sum;
    for (let i = 0; i < items.length; i++) {
        if (r < weights[i]) return items[i];
        r -= weights[i];
    }
    return items[items.length - 1];
}

(async () => {
    console.log('🔄 Chargement des 20 derniers tirages…');
    const last20 = await loadLastDraws();
    if (last20.length < WINDOW_SIZE) {
        console.error(`Il faut au moins ${WINDOW_SIZE} tirages pour prédire.`);
        process.exit(1);
    }

    console.log('📐 Construction de la séquence…');
    const seq3d = buildSequence(last20); // [1,20,59]
    const input = tf.tensor3d(seq3d, [1, WINDOW_SIZE, LABEL_DIM]);

    console.log('🔍 Chargement du modèle…');
    const model = await tf.loadLayersModel(`file://${MODEL_DIR}/model.json`);

    console.log('🔢 Prédiction des probabilités…');
    const probs = (model.predict(input) as tf.Tensor2D).arraySync()[0]; // [59]

    // Séparer boules et chance
    const ballProbs = probs.slice(0, 49);
    const chanceProbs = probs.slice(49);
    const ballsIdx = Array.from({ length: 49 }, (_, i) => i + 1);
    const chanceIdx = Array.from({ length: 10 }, (_, i) => i + 1);

    console.log(`🎯 Génération de ${NUM_GRIDS} grilles…`);
    for (let g = 1; g <= NUM_GRIDS; g++) {
        const balls = weightedSampleWithoutReplacement(ballsIdx, ballProbs, 5);
        const chance = weightedSampleOne(chanceIdx, chanceProbs);

        console.log(`
Grille #${g}:`);
        console.log(`• Boules : ${balls.join(', ')}`);
        console.log(`• Chance : ${chance ?? '(aucune)'}`);
    }

    // Cleanup
    input.dispose();
    tf.disposeVariables();
})();
