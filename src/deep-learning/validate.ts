#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

// Chemins
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const X_TEST_SEQ = 'x_test_seq.json';
const Y_TEST = 'y_test.json';
const MODEL_DIR = path.join(DATA_DIR, 'model-lstm-final');

// Constantes
const WINDOW_SIZE = 20;
const LABEL_DIM = 49 + 10; // 59
const BATCH_SIZE = 32;
const THRESHOLD = 0.10;    // seuil optimisé

// Charge les séquences de test
async function loadTestSeq(): Promise<{ xs: tf.Tensor3D; ys: tf.Tensor2D }> {
    const Xraw = JSON.parse(
        await fs.readFile(path.join(DATA_DIR, X_TEST_SEQ), 'utf-8')
    ) as number[][][];
    const Yraw = JSON.parse(
        await fs.readFile(path.join(DATA_DIR, Y_TEST), 'utf-8')
    ) as number[][];
    const xs = tf.tensor3d(Xraw, [Xraw.length, WINDOW_SIZE, LABEL_DIM]);
    const ys = tf.tensor2d(Yraw, [Yraw.length, LABEL_DIM]);
    return { xs, ys };
}

(async () => {
    console.log('🔄 Chargement des données de test…');
    const { xs, ys } = await loadTestSeq();
    console.log(`📐 Test set: X=[${xs.shape}], Y=[${ys.shape}]`);

    console.log('🔍 Chargement du modèle final…');
    const model = await tf.loadLayersModel(`file://${MODEL_DIR}/model.json`);
    // Recompiler pour évaluation
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'binaryCrossentropy',
        metrics: ['binaryAccuracy'],
    });

    console.log('📊 Évaluation (loss & accuracy)…');
    const [lossTensor, accTensor] = model.evaluate(xs, ys, { batchSize: BATCH_SIZE }) as tf.Scalar[];
    const loss = (await lossTensor.data())[0];
    const acc = (await accTensor.data())[0];
    console.log(`🔢 Loss: ${loss.toFixed(4)}, Binary Accuracy: ${acc.toFixed(4)}`);

    console.log('🔢 Prédiction des probabilités…');
    const probsTensor = model.predict(xs) as tf.Tensor2D;
    const [probsArr, truthArr] = await Promise.all([
        probsTensor.array(),
        ys.array(),
    ]) as [number[][], number[][]];

    // Calcul du F1 avec seuil fixe
    let TP = 0, FP = 0, FN = 0, exactMatch = 0;
    for (let i = 0; i < probsArr.length; i++) {
        const pred = probsArr[i].map(p => p >= THRESHOLD ? 1 : 0);
        const truth = truthArr[i];
        // TP/FP/FN
        for (let j = 0; j < LABEL_DIM; j++) {
            if (pred[j] === 1 && truth[j] === 1) TP++;
            if (pred[j] === 1 && truth[j] === 0) FP++;
            if (pred[j] === 0 && truth[j] === 1) FN++;
        }
        // Exact match
        if (pred.every((v, j) => v === truth[j])) exactMatch++;
    }
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
    const emRatio = exactMatch / probsArr.length;

    console.log('✅ Métriques finales :');
    console.log(`• Precision: ${precision.toFixed(4)}`);
    console.log(`• Recall   : ${recall.toFixed(4)}`);
    console.log(`• F1-score : ${f1.toFixed(4)}`);
    console.log(`• Exact Match Ratio: ${emRatio.toFixed(4)}`);

    // Libération
    xs.dispose(); ys.dispose(); probsTensor.dispose();
})();
