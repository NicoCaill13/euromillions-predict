import { Draw } from '../loader.js';

export const analyzeDispersion = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        return sorted[sorted.length - 1] - sorted[0]; // max - min
    });
};
