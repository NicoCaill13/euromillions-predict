import { Draw } from '../loader.js';

export interface IntervalDistribution {
    low: number;
    mid: number;
    high: number;
    count: number;
}

export const analyzeIntervals = (draws: Draw[]): IntervalDistribution[] => {
    const counter = new Map<string, number>();

    draws.forEach(draw => {
        let low = 0, mid = 0, high = 0;

        draw.numbers.forEach(n => {
            if (n >= 1 && n <= 16) low++;
            else if (n >= 17 && n <= 33) mid++;
            else if (n >= 34 && n <= 50) high++;
        });

        const key = `${low}-${mid}-${high}`;
        const prev = counter.get(key) || 0;
        counter.set(key, prev + 1);
    });

    const result: IntervalDistribution[] = Array.from(counter.entries()).map(([key, count]) => {
        const [low, mid, high] = key.split('-').map(Number);
        return { low, mid, high, count };
    });

    return result.sort((a, b) => b.count - a.count);
};
