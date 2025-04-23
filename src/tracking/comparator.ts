import { Draw } from '../loader.js';

export interface ComparisonResult {
    grid: number[];
    matchCount: number;
    drawDate: string;
}

export const compareGridsWithDraws = (grids: number[][], draws: Draw[]): ComparisonResult[] => {
    const results: ComparisonResult[] = [];

    draws.forEach(draw => {
        console.log(`🔍 Tirage futur : ${draw.date} => ${draw.numbers}`); // ajout debug
        grids.forEach(grid => {
            const matches = grid.filter(n => draw.numbers.includes(n)).length;
            results.push({
                grid,
                matchCount: matches,
                drawDate: draw.date
            });
        });
    });

    return results;
};
