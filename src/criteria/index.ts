/**
 * Aggregates all individual score functions into a single `totalScore` helper.
 * Each file in this folder must export a **default** function `(nums:number[])=>number`.
 */

import { scoreClusters } from './scoreClusters.js';
import { scoreConsecutives } from './scoreConsecutives.js';
import { scoreDelta } from './scoreDelta.js';
import { scoreDispersion } from './scoreDispersion.js';
import { scoreFrequency } from './scoreFrequency.js';
import { scoreLowMidHigh } from './scoreLowMidHigh.js';
import { scoreParity } from './scoreParity.js';
import { scoreSum } from './scoreSum.js';

const ALL = [
    scoreClusters,
    scoreConsecutives,
    scoreDelta,
    scoreDispersion,
    scoreFrequency,
    scoreLowMidHigh,
    scoreParity,
    scoreSum,
];

export function totalScore(nums: number[]): number {
    return ALL.reduce((s, fn) => s + fn(nums), 0);
}

export { scoreClusters, scoreConsecutives, scoreDelta, scoreDispersion, scoreFrequency, scoreLowMidHigh, scoreParity, scoreSum };
