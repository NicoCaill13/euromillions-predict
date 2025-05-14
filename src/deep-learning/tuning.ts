#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

type SeqData = { xs: tf.Tensor3D; ys: tf.Tensor2D };

// Chemins et fichiers
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const X_TRAIN_SEQ = 'x_train_seq.json';
const Y_TRAIN = 'y_train.json';
const X_TEST_SEQ = 'x_test_seq.json';
const Y_TEST = 'y_test.json';

// Hyperparamètres
const WINDOW_SIZE = 20;
const LABEL_DIM = 49 + 10;  // 59
const EPOCHS = 20;        // pour tuning rapide
const BATCH_SIZE = 32;
const VAL_SPLIT = 0.2;
const THRESHOLD = 0.10;      // seuil optimisé

// Charge séquences et labels
async function loadSeq(xFile: string, yFile: string): Promise<SeqData> {
    const Xraw = JSON.parse(
        await fs.readFile(path.join(DATA_DIR, xFile), 'utf-8')
    ) as number[][][];
    const Yraw = JSON.parse(
        await fs.readFile(path.join(DATA_DIR, yFile), 'utf-8')
    ) as number[][];

    if (Xraw.length !== Yraw.length) {
        throw new Error(`X and Y lengths differ: ${Xraw.length} vs ${Yraw.length}`);
    }
    const xs = tf.tensor3d(Xraw, [Xraw.length, WINDOW_SIZE, LABEL_DIM]);
    const ys = tf.tensor2d(Yraw, [Yraw.length, LABEL_DIM]);
    return { xs, ys };
}

// Évaluation F1 sur un jeu
async function evaluateF1(model: tf.LayersModel, data: SeqData): Promise<number> {
    const { xs, ys } = data;
    const probsTensor = model.predict(xs) as tf.Tensor2D;
    const [probsArr, truthArr] = await Promise.all([
        probsTensor.array(),
        ys.array(),
    ]) as [number[][], number[][]];

    let TP = 0, FP = 0, FN = 0;
    for (let i = 0; i < probsArr.length; i++) {
        const pred = probsArr[i].map(p => (p >= THRESHOLD ? 1 : 0));
        const truth = truthArr[i];
        for (let j = 0; j < LABEL_DIM; j++) {
            if (pred[j] === 1 && truth[j] === 1) TP++;
            if (pred[j] === 1 && truth[j] === 0) FP++;
            if (pred[j] === 0 && truth[j] === 1) FN++;
        }
    }
    return (TP + FP > 0 && TP + FN > 0)
        ? 2 * TP / (2 * TP + FP + FN)
        : 0;
}

// Grid search des hyperparamètres
(async () => {
    console.log('🔄 Chargement des données pour tuning…');
    const train = await loadSeq(X_TRAIN_SEQ, Y_TRAIN);
    const test = await loadSeq(X_TEST_SEQ, Y_TEST);

    const configs: Array<{ lstmUnits: number; denseUnits: number; dropout: number; lr: number }> = [];
    for (const lstmUnits of [32, 64, 128]) {
        for (const denseUnits of [16, 32]) {
            for (const dropout of [0.2, 0.4]) {
                for (const lr of [0.001, 0.0005]) {
                    configs.push({ lstmUnits, denseUnits, dropout, lr });
                }
            }
        }
    }

    const results: Array<{ cfg: typeof configs[0]; f1: number }> = [];

    for (const cfg of configs) {
        console.log(`\n🔧 Configuration: LSTM=${cfg.lstmUnits}, Dense=${cfg.denseUnits}, Dropout=${cfg.dropout}, LR=${cfg.lr}`);
        const model = tf.sequential();
        model.add(tf.layers.lstm({ units: cfg.lstmUnits, inputShape: [WINDOW_SIZE, LABEL_DIM] }));
        model.add(tf.layers.dropout({ rate: cfg.dropout }));
        model.add(tf.layers.dense({ units: cfg.denseUnits, activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: cfg.dropout }));
        model.add(tf.layers.dense({ units: LABEL_DIM, activation: 'sigmoid' }));

        model.compile({
            optimizer: tf.train.adam(cfg.lr),
            loss: 'binaryCrossentropy',
            metrics: ['binaryAccuracy'],
        });

        await model.fit(train.xs, train.ys, {
            epochs: EPOCHS,
            batchSize: BATCH_SIZE,
            validationSplit: VAL_SPLIT,
            verbose: 0,
        });

        const f1 = await evaluateF1(model, test);
        console.log(`🏁 F1 obtenu = ${f1.toFixed(4)}`);
        results.push({ cfg, f1 });

        model.dispose();
        tf.disposeVariables();
    }

    results.sort((a, b) => b.f1 - a.f1);
    console.log('\n🎉 Top 3 configurations:');
    results.slice(0, 3).forEach(({ cfg, f1 }) => {
        console.log(`• LSTM=${cfg.lstmUnits}, Dense=${cfg.denseUnits}, Dropout=${cfg.dropout}, LR=${cfg.lr} → F1=${f1.toFixed(4)}`);
    });

    train.xs.dispose(); train.ys.dispose();
    test.xs.dispose(); test.ys.dispose();
})();
