import { Draw } from '../loader.js';

export const analyzeClusters = (draws: Draw[]): number[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        let clusters = 1; // au moins un cluster

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] > 5) clusters++; // coupure si écart > 5
        }

        return clusters;
    });
};
