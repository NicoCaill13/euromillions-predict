import { Draw } from '../loader.js';

export interface SumRange {
    range: string;
    count: number;
}

export const analyzeSums = (draws: Draw[]): SumRange[] => {
    const ranges = [
        { min: 80, max: 100 },
        { min: 101, max: 120 },
        { min: 121, max: 140 },
        { min: 141, max: 160 },
        { min: 161, max: 180 },
        { min: 181, max: 200 },
        { min: 201, max: 220 },
        { min: 221, max: 240 },
    ];

    const counter = new Map<string, number>();

    draws.forEach(draw => {
        const sum = draw.numbers.reduce((a, b) => a + b, 0);

        const range = ranges.find(r => sum >= r.min && sum <= r.max);
        if (range) {
            const key = `${range.min}-${range.max}`;
            const prev = counter.get(key) || 0;
            counter.set(key, prev + 1);
        }
    });

    const result: SumRange[] = Array.from(counter.entries()).map(([range, count]) => ({
        range,
        count
    }));

    return result.sort((a, b) => a.range.localeCompare(b.range));
};
