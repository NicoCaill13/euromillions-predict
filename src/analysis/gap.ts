import { Draw } from '../loader.js';
import { mean, median, min, max } from 'simple-statistics';

export interface NumberGapStats {
    number: number;
    appearances: number;
    averageGap: number;
    medianGap: number;
    minGap: number;
    maxGap: number;
    lastGap: number;
}

export const computeGapAnalysis = (draws: Draw[]): NumberGapStats[] => {
    const stats: NumberGapStats[] = [];

    for (let n = 1; n <= 50; n++) {
        const appearances: number[] = [];

        draws.forEach((draw, index) => {
            if (draw.numbers.includes(n)) {
                appearances.push(index);
            }
        });

        const gaps: number[] = [];
        for (let i = 1; i < appearances.length; i++) {
            gaps.push(appearances[i] - appearances[i - 1]);
        }

        stats.push({
            number: n,
            appearances: appearances.length,
            averageGap: gaps.length ? mean(gaps) : 0,
            medianGap: gaps.length ? median(gaps) : 0,
            minGap: gaps.length ? min(gaps) : 0,
            maxGap: gaps.length ? max(gaps) : 0,
            lastGap: appearances.length >= 1 ? (draws.length - appearances[0] - 1) : -1
        });
    }

    return stats
};

export const displayGapNarrative = (stats: NumberGapStats[]) => {
    const barLength = 20;
    const maxLastGap = 60;

    stats.forEach(stat => {
        const { number, appearances, averageGap, maxGap, lastGap } = stat;

        const minFilled = 1;
        const ratio = Math.min(lastGap, maxLastGap) / maxLastGap;
        let filledBlocks = Math.floor((1 - ratio) * barLength);

        // Assurer un minimum de 1 bloc plein
        filledBlocks = Math.max(filledBlocks, minFilled);
        const emptyBlocks = barLength - filledBlocks;
        const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

        console.log(`Numéro ${number} :`);
        console.log(`- Apparitions totales : ${appearances} fois.`);
        console.log(`- Écart moyen entre apparitions : ${averageGap.toFixed(2)} tirages.`);
        console.log(`- Dernier écart (absence actuelle) : ${lastGap} tirages.`);
        console.log(`- Plus grand écart vécu : ${maxGap} tirages sans sortie.`);
        console.log(`- Statut actuel : ${bar} (${lastGap} tirages d'absence)`);
        console.log('');
    });

};

