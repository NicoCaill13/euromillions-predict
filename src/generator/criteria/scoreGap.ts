import { computeGapAnalysis } from '../../analysis/gap.js';

let gapStats: { number: number; lastGap: number }[] = [];

export const setGapStats = (stats: typeof gapStats) => {
    gapStats = stats;
};

export const scoreGap = (numbers: number[]): number => {
    const gapMap = Object.fromEntries(gapStats.map(({ number, lastGap }) => [number, lastGap]));

    const score = numbers.reduce((acc, n) => {
        const gap = gapMap[n] ?? 0;
        if (gap >= 30) return acc + 20;
        if (gap >= 20) return acc + 10;
        return acc;
    }, 0);

    return score;
};
