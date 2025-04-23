import { Draw } from '../loader.js';

export const analyzeDeltaSum = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        let sumDeltas = 0;
        for (let i = 1; i < sorted.length; i++) {
            sumDeltas += sorted[i] - sorted[i - 1];
        }
        return sumDeltas;
    });
};
