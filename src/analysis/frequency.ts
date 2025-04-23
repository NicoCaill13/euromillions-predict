import { Draw } from '../loader.js';

export interface Frequency {
    number: number;
    count: number;
}

export const calculateFrequencies = (draws: Draw[]): Frequency[] => {
    const counter = new Map<number, number>();

    for (const draw of draws) {
        draw.numbers.forEach(num => {
            const prev = counter.get(num) || 0;
            counter.set(num, prev + 1);
        });
    }

    const frequencies: Frequency[] = Array.from(counter.entries()).map(([number, count]) => ({
        number,
        count
    }));

    return frequencies.sort((a, b) => b.count - a.count);
};
