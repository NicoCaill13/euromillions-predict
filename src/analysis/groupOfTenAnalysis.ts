import { Draw } from '../loader.js';

export interface GroupOfTenDistribution {
    g1_10: number;
    g11_20: number;
    g21_30: number;
    g31_40: number;
    g41_50: number;
}

export const analyzeGroupOfTen = (draws: Draw[]): GroupOfTenDistribution[] => {
    return draws.map(draw => {
        const counts = { g1_10: 0, g11_20: 0, g21_30: 0, g31_40: 0, g41_50: 0 };

        draw.numbers.forEach(n => {
            if (n <= 10) counts.g1_10++;
            else if (n <= 20) counts.g11_20++;
            else if (n <= 30) counts.g21_30++;
            else if (n <= 40) counts.g31_40++;
            else counts.g41_50++;
        });

        return counts;
    });
};
