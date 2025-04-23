import { Draw } from '../loader.js';
import { variance } from 'simple-statistics';

export const analyzeEntropy = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        return variance(sorted); // plus la variance est haute, plus le tirage est dispersé
    });
};
