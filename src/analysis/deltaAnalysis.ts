import { Draw } from '../loader.js';

export interface DeltaStats {
    deltas: number[];
    averageDelta: number;
}

export const analyzeDeltas = (draws: Draw[]): DeltaStats[] => {
    return draws.map(draw => {
        const sorted = [...draw.numbers].sort((a, b) => a - b);
        const deltas = [];

        for (let i = 1; i < sorted.length; i++) {
            deltas.push(sorted[i] - sorted[i - 1]);
        }

        const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

        return { deltas, averageDelta };
    });
};
