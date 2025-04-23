import { Draw } from '../loader.js';

export interface RepetitionStats {
    repeats: number;
    count: number;
}

export const analyzeRepetitions = (draws: Draw[]): RepetitionStats[] => {
    const counter = new Map<number, number>();

    for (let i = 0; i < draws.length - 1; i++) {
        const current = new Set(draws[i].numbers);
        const next = new Set(draws[i + 1].numbers);

        // Compter combien de numéros se répètent entre current et next
        const repeats = [...current].filter(n => next.has(n)).length;

        const prev = counter.get(repeats) || 0;
        counter.set(repeats, prev + 1);
    }

    const stats: RepetitionStats[] = Array.from(counter.entries()).map(([repeats, count]) => ({
        repeats,
        count
    }));

    // Trier par nombre de répétitions
    return stats.sort((a, b) => a.repeats - b.repeats);
};
