import { Draw } from '../loader.js';
import _ from 'lodash';


// Génère toutes les combinaisons possibles de taille 'k'
const combinations = (arr: number[], k: number): number[][] => {
    if (k === 0) return [[]];
    if (arr.length < k) return [];

    const [first, ...rest] = arr;

    const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
    const withoutFirst = combinations(rest, k);

    return withFirst.concat(withoutFirst);
};

export interface ComboCount {
    combo: number[];
    count: number;
}



const countCombinations = (draws: Draw[], size: number): ComboCount[] => {
    const counter = new Map<string, number>();

    for (const draw of draws) {
        const combination = combinations(draw.numbers, size);
        combination.forEach(combo => {
            const sortedCombo = combo.slice().sort((a, b) => a - b);
            const key = sortedCombo.join(',');

            const prev = counter.get(key) || 0;
            counter.set(key, prev + 1);
        });
    }

    const result: ComboCount[] = Array.from(counter.entries()).map(([key, count]) => ({
        combo: key.split(',').map(Number),
        count
    }));

    return result.sort((a, b) => b.count - a.count);
};

export const findTopPairs = (draws: Draw[], top: number = 10): ComboCount[] => {
    return countCombinations(draws, 2).slice(0, top);
};

export const findTopTriplets = (draws: Draw[], top: number = 10): ComboCount[] => {
    return countCombinations(draws, 3).slice(0, top);
};
