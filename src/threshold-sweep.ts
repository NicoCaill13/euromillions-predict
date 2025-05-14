#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const X_TEST_FILE = 'x_test.json';
const Y_TEST_FILE = 'y_test.json';
const MODEL_DIR = path.join(DATA_DIR, 'model');

const FEATURE_DIM = 150;
const LABEL_DIM = 59;
const TOTAL_BALLS = 49;

async function loadTestData() {
    const X: number[][] = JSON.parse(await fs.readFile(path.join(DATA_DIR, X_TEST_FILE), 'utf-8'));
    const Y: number[][] = JSON.parse(await fs.readFile(path.join(DATA_DIR, Y_TEST_FILE), 'utf-8'));
    return { X, Y };
}

(async () => {
    console.log('🔄 Loading test data...');
    const { X, Y } = await loadTestData();
    const xs = tf.tensor2d(X, [X.length, FEATURE_DIM]);

    console.log('🔍 Loading model...');
    const model = await tf.loadLayersModel(`file://${MODEL_DIR}/model.json`);

    console.log('🔢 Predicting probabilities...');
    const probsTensor = model.predict(xs) as tf.Tensor2D;
    const probsArr = await probsTensor.array() as number[][];

    let bestThreshold = 0;
    let bestF1 = 0;
    console.log('⚖️ Sweeping thresholds...');
    for (let t = 0.1; t < 0.9; t += 0.05) {
        let TP = 0, FP = 0, FN = 0;
        for (let i = 0; i < probsArr.length; i++) {
            const pred = probsArr[i].map(p => p >= t ? 1 : 0);
            const truth = Y[i];
            for (let j = 0; j < LABEL_DIM; j++) {
                if (pred[j] === 1 && truth[j] === 1) TP++;
                if (pred[j] === 1 && truth[j] === 0) FP++;
                if (pred[j] === 0 && truth[j] === 1) FN++;
            }
        }
        const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
        const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
        const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
        console.log(`Threshold ${t.toFixed(2)} → Precision=${precision.toFixed(4)}, Recall=${recall.toFixed(4)}, F1=${f1.toFixed(4)}`);
        if (f1 > bestF1) {
            bestF1 = f1;
            bestThreshold = t;
        }
    }
    console.log(`
🏆 Best threshold=${bestThreshold.toFixed(2)}, F1=${bestF1.toFixed(4)}`);
})();
