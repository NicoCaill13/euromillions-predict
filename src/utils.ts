import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { makeFeatureVector } from './features.js';

export interface EvalResult {
    name: string;
    count: number;
    avgHits: number;
    baselineHits: number;
    gain: number;
    accChance: number;
    baselineChance: number;
    kl: number;
}

export async function evaluateDraws(
    model: tf.LayersModel,
    periodDraws: Draw[],
    fullHistory: Draw[],
    name: string
): Promise<EvalResult> {
    let hitsNums = 0;
    let hitsChance = 0;
    const agg = Array(MAX_NUMBER).fill(0);

    for (let i = LOOKBACK; i < periodDraws.length; i++) {
        const window = fullHistory.slice(i - LOOKBACK, i);
        const { bestNums, bestChance } = predictAll(model, window);
        const d = periodDraws[i];
        hitsNums += bestNums.filter(n => d.numbers.includes(n)).length;
        if (bestChance === d.chance) hitsChance++;
        // KL accumulation
        const vec = [...window.flatMap(w => oneHot(w.numbers)), ...makeFeatureVector(window)];
        const inp = tf.tensor2d([vec]);
        const [pNum] = model.predict(inp) as tf.Tensor[];
        pNum.dataSync().forEach((v, idx) => { agg[idx] += v; });
        inp.dispose(); pNum.dispose();
    }

    const N = periodDraws.length - LOOKBACK;
    const avgHits = hitsNums / N;
    const baselineHits = randomBaseline(periodDraws);
    const gain = avgHits - baselineHits;
    const accChance = hitsChance / N;
    const baselineChance = 1 / CHANCE_MAX;

    // KL divergence
    const uniform = 1 / MAX_NUMBER;
    const kl = agg.reduce((s, v) => {
        const p = v / N;
        return p ? s + p * Math.log(p / uniform) : s;
    }, 0);

    return { name, count: N, avgHits, baselineHits, gain, accChance, baselineChance, kl };
}


function envNum(key: string, def: number): number {
    const v = process.env[key];
    const n = v !== undefined ? Number(v) : def;
    return Number.isFinite(n) ? n : def;
}

export const MAX_NUMBER = 49;
export const CHANCE_MAX = 10;
export const NUMBERS_PER_DRAW = 5;
export const LOOKBACK = envNum('LOOKBACK', 10);
export const TEST_SIZE = envNum('TEST_SIZE', 50);
export const UNITS_H1 = envNum('UNITS_H1', 128);
export const UNITS_H2 = envNum('UNITS_H2', 64);
export const DROPOUT = envNum('DROPOUT', 0.3);
export const EPOCHS = envNum('EPOCHS', 300);
export const LR0 = envNum('LR0', 1e-3);
export const LOSS_WEIGHTS = { "num": 1, "chance": 5 }

/* ------------------------------------------------------------------
 *  Types & fichiers
 * ----------------------------------------------------------------*/
export interface Draw { date: string; numbers: number[]; chance?: number; }

function naturalIdx(file: string): number { const m = file.match(/\d+/); return m ? +m[0] : 0; }

export function loadDraws(dir = 'data'): Draw[] {
    const abs = path.resolve(dir);
    if (!fs.existsSync(abs)) throw new Error(`Répertoire introuvable : ${abs}`);

    const files = fs.readdirSync(abs)
        .filter(f => /^loto(\d*)?\.csv$/i.test(f))
        .sort((a, b) => naturalIdx(a) - naturalIdx(b))
        .map(f => path.join(abs, f));
    if (!files.length) throw new Error('Aucun fichier loto*.csv trouvé');

    const draws: Draw[] = [];
    for (const f of files) {
        const rows = parse(fs.readFileSync(f, 'utf-8'), { columns: true, delimiter: ',', trim: true });
        rows.forEach((r: any) => {
            const nums: number[] = [];
            for (let i = 1; i <= NUMBERS_PER_DRAW; i++) {
                const n = Number(r[`boule_${i}`]);
                if (Number.isFinite(n)) nums.push(n);
            }
            if (nums.length === NUMBERS_PER_DRAW) {
                draws.push({ date: r.date_de_tirage, numbers: nums, chance: Number(r.numero_chance) || undefined });
            }
        });
    }
    return draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}


export const oneHot = (nums: number[]): number[] => {
    const v = Array(MAX_NUMBER).fill(0);
    nums.forEach((n: number) => { if (n >= 1 && n <= MAX_NUMBER) v[n - 1] = 1; });
    return v;
};
export const oneHotChance = (c?: number): number[] => {
    const v = Array(CHANCE_MAX).fill(0);
    if (c && c >= 1 && c <= CHANCE_MAX) v[c - 1] = 1;
    return v;
};

/* ------------------------------------------------------------------
 *  Dataset (X + Y)
 * ----------------------------------------------------------------*/
export function buildDataset(draws: Draw[]) {
    const xs: number[][] = [];
    const ysNum: number[][] = [];
    const ysChance: number[][] = [];

    for (let i = LOOKBACK; i < draws.length; i++) {
        const hist = draws.slice(i - LOOKBACK, i);
        xs.push([
            ...hist.flatMap((d: Draw) => oneHot(d.numbers)),
            ...makeFeatureVector(hist),
        ]);
        ysNum.push(oneHot(draws[i].numbers));
        ysChance.push(oneHotChance(draws[i].chance));
    }
    return { xs: tf.tensor2d(xs), ys: { num: tf.tensor2d(ysNum), chance: tf.tensor2d(ysChance) } };
}

/* ------------------------------------------------------------------
 *  Modèle bi‑tête
 * ----------------------------------------------------------------*/
export function createModel(inputSize: number) {

    const inp = tf.input({ shape: [inputSize] });
    let x: tf.SymbolicTensor = tf.layers.dense({ units: UNITS_H1, activation: 'relu' }).apply(inp) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: DROPOUT }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: UNITS_H2, activation: 'relu' }).apply(x) as tf.SymbolicTensor;

    const outNum = tf.layers.dense({ units: MAX_NUMBER, activation: 'sigmoid', name: 'num' }).apply(x) as tf.SymbolicTensor;
    const outCh = tf.layers.dense({ units: CHANCE_MAX, activation: 'softmax', name: 'chance' }).apply(x) as tf.SymbolicTensor;

    const model = tf.model({ inputs: inp, outputs: [outNum, outCh] });
    const compileArgs = {
        loss: { num: 'binaryCrossentropy', chance: 'categoricalCrossentropy' },
        LOSS_WEIGHTS,
        optimizer: tf.train.adam(LR0),
    };
    model.compile(compileArgs as any);
    return model;
}

/* ------------------------------------------------------------------
 *  Entraînement pratique
 * ----------------------------------------------------------------*/
export async function trainOn(draws: Draw[]) {
    const { xs, ys } = buildDataset(draws);
    const model = createModel(xs.shape[1]);
    const early = tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 15 });
    await model.fit(xs, ys, { epochs: EPOCHS, batchSize: 32, validationSplit: 0.2, callbacks: [early] });
    xs.dispose(); ys.num.dispose(); ys.chance.dispose();
    return model;
}

/* ------------------------------------------------------------------
 *  Prédiction (5 nums + chance)
 * ----------------------------------------------------------------*/
export function predictAll(model: tf.LayersModel, history: Draw[]) {
    const inp = tf.tensor2d([
        ...history.flatMap((d: Draw) => oneHot(d.numbers)),
        ...makeFeatureVector(history),
    ], [1, (history.length * MAX_NUMBER) + makeFeatureVector(history).length]);

    const [pNum, pCh] = model.predict(inp) as tf.Tensor[];
    const probsNum = Array.from(pNum.dataSync());
    const bestNums = probsNum.map((p, i) => ({ n: i + 1, p }))
        .sort((a, b) => b.p - a.p)
        .slice(0, NUMBERS_PER_DRAW)
        .map(o => o.n);
    const bestChance = pCh.argMax(-1).dataSync()[0] + 1;

    inp.dispose(); pNum.dispose(); pCh.dispose();
    return { bestNums, bestChance };
}

/* ------------------------------------------------------------------
 *  Baseline aléatoire pour evaluation
 * ----------------------------------------------------------------*/
export function randomBaseline(test: Draw[], trials = 10000) {
    let acc = 0;
    for (let t = 0; t < trials; t++) {
        let hits = 0;
        for (const d of test) {
            const pick: number[] = [];
            while (pick.length < NUMBERS_PER_DRAW) {
                const n = Math.floor(Math.random() * MAX_NUMBER) + 1;
                if (!pick.includes(n)) pick.push(n);
            }
            hits += pick.filter((n: number) => d.numbers.includes(n)).length;
        }
        acc += hits / test.length;
    }
    return acc / trials;
}

/* ------------------------------------------------------------------
 * Probabilités complètes (49 boules + 10 Chance)
 * -----------------------------------------------------------------*/
export function predictProbs(model: tf.LayersModel, history: Draw[]) {
    const input = [
        ...history.flatMap(d => oneHot(d.numbers)),   // LOOKBACK×49
        ...makeFeatureVector(history),                // 124 dims
    ];
    const inp = tf.tensor2d([input]);

    const [tNum, tCh] = model.predict(inp) as tf.Tensor[];
    const pNum = Array.from(tNum.dataSync());
    const pChance = Array.from(tCh.dataSync());

    inp.dispose(); tNum.dispose(); tCh.dispose();
    return { pNum, pChance };
}


export const yearsAgo = (n: number): Date => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d;
}