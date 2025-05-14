#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

// === Config final ===
const DATA_DIR = path.resolve(process.cwd(), 'data', 'loto');
const X_TRAIN_SEQ = 'x_train_seq.json';
const Y_TRAIN = 'y_train.json';
const MODEL_DIR = path.join(DATA_DIR, 'model-lstm-final');

const WINDOW_SIZE = 20;
const LABEL_DIM = 49 + 10;  // 59

// Hyperparams choisis
const LSTM_UNITS = 64;
const DENSE_UNITS = 16;
const DROPOUT = 0.4;
const LEARNING_RATE = 0.001;
const EPOCHS = 100;
const BATCH_SIZE = 32;
const VAL_SPLIT = 0.2;

// Charge séquences & labels
async function loadSeq(): Promise<{ xs: tf.Tensor3D; ys: tf.Tensor2D }> {
    const Xraw = JSON.parse(
        await fs.readFile(path.join(DATA_DIR, X_TRAIN_SEQ), 'utf-8')
    ) as number[][][];
    const Yraw = JSON.parse(
        await fs.readFile(path.join(DATA_DIR, Y_TRAIN), 'utf-8')
    ) as number[][];
    if (Xraw.length !== Yraw.length) throw new Error(`X/Y length mismatch: ${Xraw.length} vs ${Yraw.length}`);
    const xs = tf.tensor3d(Xraw, [Xraw.length, WINDOW_SIZE, LABEL_DIM]);
    const ys = tf.tensor2d(Yraw, [Yraw.length, LABEL_DIM]);
    return { xs, ys };
}

// Main training
(async () => {
    console.log('🔄 Chargement des données séquentielles…');
    const { xs, ys } = await loadSeq();
    console.log(`📐 Dimensions: X=[${xs.shape}], Y=[${ys.shape}]`);

    console.log('🚀 Construction du modèle LSTM final…');
    const model = tf.sequential();
    model.add(tf.layers.lstm({
        units: LSTM_UNITS,
        inputShape: [WINDOW_SIZE, LABEL_DIM],
        returnSequences: false,
    }));
    model.add(tf.layers.dropout({ rate: DROPOUT }));
    model.add(tf.layers.dense({ units: DENSE_UNITS, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: DROPOUT }));
    model.add(tf.layers.dense({ units: LABEL_DIM, activation: 'sigmoid' }));

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: 'binaryCrossentropy',
        metrics: ['binaryAccuracy'],
    });

    console.log(`🚀 Entraînement final: epochs=${EPOCHS}, batchSize=${BATCH_SIZE}`);
    await model.fit(xs, ys, {
        epochs: EPOCHS,
        batchSize: BATCH_SIZE,
        validationSplit: VAL_SPLIT,
        callbacks: tf.node.tensorBoard(path.join(DATA_DIR, 'logs-lstm-final')),
    });

    console.log('💾 Sauvegarde du modèle final…');
    await model.save(`file://${MODEL_DIR}`);
    console.log(`✔ Modèle final enregistré dans ${MODEL_DIR}`);

    xs.dispose(); ys.dispose();
})();
