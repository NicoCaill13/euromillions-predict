import * as tf from '@tensorflow/tfjs-node';
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
const KEEP = 5;        // nb de grilles finales affichées
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


(async () => {
    const dir = process.argv[2] ?? 'data';
    const draws = loadDraws(dir);
    if (draws.length < LOOKBACK) throw new Error('Pas assez de tirages.');

    /* probas réseau */
    const model = await tf.loadLayersModel('file://model/model.json');
    const { pNum, pChance } = predictProbs(model, draws.slice(-LOOKBACK));

    const pool: { nums: number[]; chance: number; score: number; prob: number }[] = [];

    /* Monte-Carlo pondéré */
    while (pool.length < CANDIDATES) {
        /* boules sans remise */
        const w = pNum.slice();                 // copie des poids
        const nums: number[] = [];
        for (let k = 0; k < NUMBERS_PER_DRAW; k++) {
            const idx = weightedPick(w);
            nums.push(idx + 1);
            w[idx] = 0;                           // retire la boule
        }
        nums.sort((a, b) => a - b);

        /* numéro Chance */
        const cIdx = weightedPick(pChance);
        const chance = cIdx + 1;

        /* score critères (0-200) & facteur phi 0-1 */
        const score = totalScore(nums);
        const phi = score / MAX_SCORE;

        /* probabilité réseau pour cette grille */
        const pNN = nums.reduce((s, n) => s * pNum[n - 1], pChance[cIdx]);
        const prob = pNN * phi;

        pool.push({ nums, chance, score, prob });
    }

    const sorted = pool.sort((a, b) => b.prob - a.prob);
    const best: typeof pool = [];
    const MAX_OVERLAP = 2;

    for (const cand of sorted) {
        const similar = best.some(sel => {
            const common = sel.nums.filter(n => cand.nums.includes(n)).length;
            return common > MAX_OVERLAP || sel.chance === cand.chance;
        });
        if (!similar) best.push(cand);
        if (best.length === KEEP) break;
    }

    console.log(`── ${best.length} grilles retenues sur ${CANDIDATES} `
        + `(diversité ≤ ${MAX_OVERLAP} boules communes + Chance unique) ──`);
    best.forEach((g, i) => {
        const pct = ((g.score / MAX_SCORE) * 100).toFixed(1);
        console.log(`${i + 1})`, [...g.nums, g.chance].join('  '),
            `| score ${g.score} (${pct} %)  P≈ ${g.prob.toExponential(2)}`);
    });

})();