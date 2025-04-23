import { Draw } from '../loader.js';

export const analyzeSymmetry = (draws: Draw[]): number[] => {
    const center = 25.5;
    return draws.map(draw => {
        const distances = draw.numbers.map(n => Math.abs(n - center));
        return distances.reduce((a, b) => a + b, 0); // somme des distances au centre
    });
};
