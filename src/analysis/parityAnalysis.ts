import { Draw } from '../loader.js';

export interface ParityDistribution {
    pair: number;
    impair: number;
    count: number;
}

export const analyzeParity = (draws: Draw[]): ParityDistribution[] => {
    const counter = new Map<string, number>();

    draws.forEach(draw => {
        const pairCount = draw.numbers.filter(n => n % 2 === 0).length;
        const impairCount = draw.numbers.length - pairCount;

        const key = `${pairCount}-${impairCount}`;
        const prev = counter.get(key) || 0;
        counter.set(key, prev + 1);
    });

    const result: ParityDistribution[] = Array.from(counter.entries()).map(([key, count]) => {
        const [pair, impair] = key.split('-').map(Number);
        return { pair, impair, count };
    });

    return result.sort((a, b) => b.count - a.count);
};
