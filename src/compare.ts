// import * as tf from '@tensorflow/tfjs-node';
// import fs from 'fs';
// import path from 'path';
// import {
//     loadDraws,
//     LOOKBACK,
//     predictProbs,
//     NUMBERS_PER_DRAW,
// } from './utils.js';
// import { totalScore } from './criteria/index.js';

// const CANDIDATES = 1000;
// const KEEP = 5;
// const MAX_SCORE = 200;

// function latestCsv(dir: string) {
//     const files = fs.readdirSync(dir).filter(f => /^loto(\d*)?\.csv$/i.test(f));
//     if (!files.length) throw new Error('Aucun loto*.csv');
//     const max = Math.max(...files.map(f => +(f.match(/^loto(\\d+)/)?.[1] || 0)));
//     return path.join(dir, max ? `loto${max}.csv` : 'loto.csv');
// }

// function line2(file: string) {
//     const [, l2] = fs.readFileSync(file, 'utf-8').trim().split(',');
//     console.log(l2)
//     const c = l2.split(',');

//     return { nums: c.slice(1, 6).map(Number), chance: Number(c[6]) };
// }

// function weightedPick(w: number[]): number {
//     const tot = w.reduce((a, b) => a + b, 0);
//     let r = Math.random() * tot;
//     for (let i = 0; i < w.length; i++) {
//         r -= w[i];
//         if (r <= 0) return i;
//     }
//     return w.length - 1;
// }

// (async () => {
//     const dir = process.argv[2] ?? 'data';
//     const draws = loadDraws(dir);
//     if (draws.length < LOOKBACK) throw new Error('Pas assez de tirages.');

//     const model = await tf.loadLayersModel('file://model/model.json');
//     const { pNum, pChance } = predictProbs(model, draws.slice(-LOOKBACK));

//     /* génère la même population aléatoire que predict.ts */
//     const pool: { nums: number[]; chance: number; score: number; prob: number }[] = [];
//     while (pool.length < CANDIDATES) {
//         const w = pNum.slice();
//         const nums: number[] = [];
//         for (let k = 0; k < NUMBERS_PER_DRAW; k++) {
//             const idx = weightedPick(w);
//             nums.push(idx + 1);
//             w[idx] = 0;
//         }
//         nums.sort((a, b) => a - b);
//         const cIdx = weightedPick(pChance);
//         const chance = cIdx + 1;
//         const score = totalScore(nums);
//         const phi = score / MAX_SCORE;
//         const pNN = nums.reduce((s, n) => s * pNum[n - 1], pChance[cIdx]);
//         const prob = pNN * phi;
//         pool.push({ nums, chance, score, prob });
//     }

//     const best = pool.sort((a, b) => b.prob - a.prob).slice(0, KEEP);

//     /* tirage réel */
//     const real = line2(latestCsv(dir));
//     console.log(real)
//     console.log('Tirage réel :', [...real.nums, real.chance].join('  '));

//     best.forEach((g, i) => {
//         const hits = g.nums.filter(n => real.nums.includes(n)).length;
//         const okC = g.chance === real.chance ? '✓' : '×';
//         const pct = ((g.score / MAX_SCORE) * 100).toFixed(1);
//         console.log(`${i + 1})`, [...g.nums, g.chance].join('  '),
//             `| Boules ${hits}/5 Chance ${okC} | score ${g.score} (${pct} %)`);
//     });
// })();

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import {
    loadDraws,
    LOOKBACK,
    predictProbs,
    NUMBERS_PER_DRAW,
} from './utils.js';
import { totalScore } from './criteria/index.js';

// Paramètres
const CANDIDATES = 1_000_000;
const KEEP = 5;
const MAX_SCORE = 200;
const MAX_OVERLAP = 2;

/** 1) Trouver le CSV le plus récent */
function latestCsv(dir: string): string {
    const files = fs.readdirSync(dir).filter(f => /^loto(?:\d*)\.csv$/.test(f));
    if (!files.length) throw new Error(`Aucun loto*.csv dans ${dir}`);
    const maxIdx = files
        .map(f => {
            const m = f.match(/^loto(?:([0-9]+))?\.csv$/);
            return m && m[1] ? Number(m[1]) : 0;
        })
        .reduce((a, b) => Math.max(a, b), 0);
    return path.join(dir, maxIdx === 0 ? 'loto.csv' : `loto${maxIdx}.csv`);
}

/** 2) Lire la ligne 2 (premier tirage) */
function parseLine2(file: string) {
    const lines = fs.readFileSync(file, 'utf-8')
        .split(/\r?\n/)
        .filter(l => l.trim());         // ignore blank lines
    if (lines.length < 2) {
        throw new Error(`Pas de deuxième ligne dans ${file}`);
    }
    const cols = lines[1].split(',');
    const nums = cols.slice(1, 6).map(x => {
        const n = Number(x);
        if (Number.isNaN(n)) throw new Error(`Num invalide "${x}"`);
        return n;
    });
    const chance = Number(cols[6]);
    if (Number.isNaN(chance)) throw new Error(`Chance invalide "${cols[6]}"`);
    return { nums, chance };
}

/** 3) Tirage pondéré */
function weightedPick(weights: number[]) {
    const tot = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

(async () => {
    try {
        const dir = process.argv[2] ?? 'data';
        const draws = loadDraws(dir);
        if (draws.length < LOOKBACK) {
            console.error(`Pas assez de tirages (${draws.length} < ${LOOKBACK})`);
            process.exit(1);
        }

        // Charger le modèle et proba
        const model = await tf.loadLayersModel('file://model/model.json');
        const { pNum, pChance } = predictProbs(model, draws.slice(-LOOKBACK));

        // Générer la population
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

        // Sélection TOP-KEEP avec diversité
        const sorted = pool.sort((a, b) => b.prob - a.prob);
        const best: typeof pool = [];
        for (const cand of sorted) {
            const tooSimilar = best.some(sel => {
                const common = sel.nums.filter(n => cand.nums.includes(n)).length;
                return common > MAX_OVERLAP || sel.chance === cand.chance;
            });
            if (!tooSimilar) {
                best.push(cand);
                if (best.length === KEEP) break;
            }
        }

        // Tirage réel
        const real = parseLine2(latestCsv(dir));

        // Affichage final
        console.log('Tirage réel      :', [...real.nums, real.chance].join('  '));
        best.forEach((g, i) => {
            const hits = g.nums.filter(n => real.nums.includes(n)).length;
            const okC = g.chance === real.chance ? '✓' : '×';
            const pct = ((g.score / MAX_SCORE) * 100).toFixed(1);
            console.log(
                `${i + 1})`, [...g.nums, g.chance].join('  '),
                `| Boules ${hits}/5  Chance ${okC}  | score ${g.score} (${pct}%)  P≈ ${g.prob.toExponential(2)}`
            );
        });
    } catch (err: any) {
        console.error('compare.js erreur:', err.message || err);
        process.exit(1);
    }
})();
