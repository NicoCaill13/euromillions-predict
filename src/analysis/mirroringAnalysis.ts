import { Draw } from '../loader.js';

export const analyzeMirroring = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const mirrored = draw.numbers.map(n => 51 - n).sort((a, b) => a - b);
        const original = [...draw.numbers].sort((a, b) => a - b);

        // Calcul de la somme des écarts entre le tirage et son miroir
        const diffs = original.map((n, i) => Math.abs(n - mirrored[i]));
        return diffs.reduce((a, b) => a + b, 0); // plus c'est petit, plus c'est miroir
    });
};
