import * as tf from '@tensorflow/tfjs-node';
import 'dotenv/config';
import {
    loadDraws,
    LOOKBACK,
    predictProbs,
    NUMBERS_PER_DRAW,
} from './utils.js';
import { totalScore } from './criteria/index.js';
const MAX_SCORE = 200;
const dir = process.argv[2] ?? 'data';
const CANDIDATES = 1000000;      // nombre de grilles générées
const KEEP = 5;
const LAMBDA = Number(process.env.LAMBDA) || 1;
export const MAX_SCORES: Record<string, number> = {
    sum: 30,
    parity: 20,
    lowMidHigh: 25,
    delta: 25,
    gap: 100,
    frequency: 150,
    clusters: 20,
    consecutives: 20,
    dispersion: 25
};


function weightedPick(weights: number[]): number {
    const tot = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

function jaccardDistance(a: number[], b: number[]): number {
    const setA = new Set(a);
    const setB = new Set(b);
    let intersectionSize = 0;
    setA.forEach(val => { if (setB.has(val)) intersectionSize++; });
    const unionSize = new Set([...a, ...b]).size;
    return 1 - intersectionSize / unionSize;
}

(async () => {
    const dir = process.argv[2] ?? 'data';
    const draws = loadDraws(dir);
    if (draws.length < LOOKBACK) throw new Error('Pas assez de tirages.');

    const model = await tf.loadLayersModel('file://model/model.json');
    const { pNum, pChance } = predictProbs(model, draws.slice(-LOOKBACK));

    const pool: { nums: number[]; chance: number; score: number; prob: number }[] = [];
    while (pool.length < CANDIDATES) {
        const w = pNum.slice();
        const nums: number[] = [];
        for (let k = 0; k < NUMBERS_PER_DRAW; k++) {
            const idx = weightedPick(w);
            nums.push(idx + 1);
            w[idx] = 0;
        }
        nums.sort((a, b) => a - b);
        const cIdx = weightedPick(pChance);
        const chance = cIdx + 1;
        const score = totalScore(nums);
        const phi = score / MAX_SCORE;
        const pNN = nums.reduce((s, n) => s * pNum[n - 1], pChance[cIdx]);
        const prob = pNN * phi;
        pool.push({ nums, chance, score, prob });
    }

    // Sort by probability descending
    const sorted = pool.sort((a, b) => b.prob - a.prob);
    const best: typeof pool = [];

    // k-Center Greedy selection maximizing minimal Jaccard distance
    while (best.length < KEEP && sorted.length > 0) {
        if (best.length === 0) {
            best.push(sorted.shift()!);
            continue;
        }
        let selectedIndex = 0;
        let maxMinDist = -Infinity;
        sorted.forEach((cand, idx) => {
            // compute minimal distance to current best
            const minDist = best.reduce((minD, sel) => {
                const d = jaccardDistance(sel.nums, cand.nums);
                return d < minD ? d : minD;
            }, Infinity);
            if (minDist > maxMinDist) {
                maxMinDist = minDist;
                selectedIndex = idx;
            }
        });
        best.push(sorted.splice(selectedIndex, 1)[0]);
    }

    console.log(`── ${best.length} grilles retenues sur ${CANDIDATES} ` +
        `(k-Center diversity) ──`);
    best.forEach((g, i) => {
        const pct = ((g.score / MAX_SCORE) * 100).toFixed(1);
        console.log(
            `${i + 1})`, [...g.nums, g.chance].join('  '),
            `| score ${g.score} (${pct} %)  P≈ ${g.prob.toExponential(2)}`
        );
    });
})();