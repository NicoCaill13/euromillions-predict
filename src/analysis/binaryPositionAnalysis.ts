import { Draw } from '../loader.js';

export const analyzeBinaryPositions = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const binaryArray = Array(50).fill(0);
        draw.numbers.forEach(n => binaryArray[n - 1] = 1);

        // Calculer la densité locale : somme des 1 voisins sur 5 positions
        let maxDensity = 0;
        for (let i = 0; i <= binaryArray.length - 5; i++) {
            const density = binaryArray.slice(i, i + 5).reduce((a, b) => a + b, 0);
            if (density > maxDensity) maxDensity = density;
        }

        return maxDensity; // densité locale max (max de 1 proches dans une fenêtre de 5)
    });
};
