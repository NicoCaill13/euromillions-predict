/*
 * Feature engineering utilitaires — 100 % TypeScript
 * Ajout des indicateurs LOW / MID / HIGH (répartition 1‑16, 17‑33, 34‑49)
 * ------------------------------------------------------------------------
 * Le vecteur retourné a désormais **62 dimensions** :
 *   49  one‑hot des boules courantes
 *    1  somme/250
 *    1  moyenne des gaps / 10
 *    1  écart‑type des gaps / 10
 *    1  proportion paires
 *    1  z‑score somme
 *    5  hotness locale (fréquence des 5 boules)
 *    3  ratio low | mid | high  (chacune /5)
 * ------------------------------------------------------------------------*/

import { Draw, MAX_NUMBER, NUMBERS_PER_DRAW, oneHot } from './utils.js';
import mean from 'ml-array-mean';
import variance from 'ml-array-variance';

/* Helper : écarts entre boules triées */
function numberGaps(numbers: number[]): number[] {
    const s = [...numbers].sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < s.length; i++) gaps.push(s[i] - s[i - 1]);
    return gaps;
}

export function makeFeatureVector(history: Draw[]): number[] {
    const cur = history.at(-1)!;
    const xs: number[] = [];

    /* 1) One-hot 49 dims */
    xs.push(...oneHot(cur.numbers));

    /* 2) Somme normalisée */
    const sum = cur.numbers.reduce((a, b) => a + b, 0);
    xs.push(sum / 250);

    /* 3) Stats des gaps */
    const gaps = numberGaps(cur.numbers);
    xs.push(mean(gaps) / 10);
    xs.push(Math.sqrt(variance(gaps)) / 10);

    /* 4) Parité */
    xs.push(cur.numbers.filter(n => n % 2 === 0).length / NUMBERS_PER_DRAW);

    /* 5) Z-score somme dans fenêtre */
    const sumsHist = history.map(d => d.numbers.reduce((a, b) => a + b, 0));
    const mu = mean(sumsHist);
    const sigma = Math.sqrt(variance(sumsHist) || 1e-6);
    xs.push((sum - mu) / sigma);

    /* 6) Hotness locale des 5 boules + fréquence globale 49 dims */
    const freq = Array(MAX_NUMBER).fill(0);
    history.forEach(d => d.numbers.forEach(n => freq[n - 1]++));
    const freqNorm = freq.map(c => c / history.length); // 0‑5 / LOOKBACK

    // a) hotness des seules boules courantes (5 dims)
    cur.numbers.forEach(n => xs.push(freqNorm[n - 1]));

    // b) fréquence complète (49 dims) — donne au réseau la distribution entière
    xs.push(...freqNorm);

    /* 7) Ratio LOW / MID / HIGH * Ratio LOW / MID / HIGH */
    const low = cur.numbers.filter(n => n <= 16).length;
    const mid = cur.numbers.filter(n => n >= 17 && n <= 33).length;
    const high = cur.numbers.filter(n => n >= 34).length;
    xs.push(low / NUMBERS_PER_DRAW, mid / NUMBERS_PER_DRAW, high / NUMBERS_PER_DRAW);

    /* 8) Entropie de la distribution dans la fenêtre LOOKBACK */
    const totalBalls = history.length * NUMBERS_PER_DRAW;
    const probs = freq.map(c => c / totalBalls);
    const entropy = -probs.reduce((s, p) => (p ? s + p * Math.log2(p) : s), 0);
    // Normalise par log2(49) pour avoir une valeur 0‑1
    xs.push(entropy / Math.log2(MAX_NUMBER));

    return xs; // 63 dims
} 
