import { Draw } from '../loader.js';

export const analyzeConsecutives = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        let consecutivePairs = 0;

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] === 1) consecutivePairs++;
        }

        return consecutivePairs;
    });
};
