import { Draw } from '../loader.js';

export const analyzeConcentration = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        let minWindow = 50;

        for (let i = 0; i <= sorted.length - 3; i++) {
            const window = sorted[i + 2] - sorted[i]; // fenêtre de 3 numéros
            if (window < minWindow) minWindow = window;
        }

        return minWindow; // plus petite fenêtre sur 3 numéros
    });
};
