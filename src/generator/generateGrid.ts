import { Draw } from '../loader.js';
import { saveGeneratedGrid } from '../tracking/gridTracker.js';
import _ from 'lodash';
import { scoreSum } from './criteria/scoreSum.js';
import { scoreParity } from './criteria/scoreParity.js';
import { scoreLowMidHigh } from './criteria/scoreLowMidHigh.js';
import { scoreDelta } from './criteria/scoreDelta.js';
import { scoreGap, setGapStats } from './criteria/scoreGap.js';
import { scoreClusters } from './criteria/scoreClusters.js';
import { scoreFrequency, setFrequencies } from './criteria/scoreFrequency.js';
import { scoreConsecutives } from './criteria/scoreConsecutives.js';
import { scoreDispersion } from './criteria/scoreDispersion.js';


interface ScoreDetail {
    [key: string]: number;
}


interface ScoredGrid {
    numbers: number[];
    score: number;
    details: ScoreDetail;
}

interface FrequencyStat {
    number: number;
    count: number;
}

interface GapStat {
    number: number;
    lastGap: number;
}


export const MAX_SCORES: Record<string, number> = {
    sum: 30,
    parity: 20,
    lowMidHigh: 25,
    delta: 25,
    gap: 100,
    frequency: 150, // à ajuster selon ta pondération réelle
    clusters: 20,
    consecutives: 20,
    dispersion: 25
};

export const getTotalMaxScore = (): number => {
    return Object.values(MAX_SCORES).reduce((a, b) => a + b, 0);
};

// Helper : génère une grille aléatoire unique de 5 numéros
const generateRandomGrid = (): number[] => {
    return _.sampleSize(_.range(1, 51), 5).sort((a, b) => a - b);
};

export const scoreGrid = (numbers: number[]): { total: number; details: ScoreDetail } => {
    const details: ScoreDetail = {};

    details['sum'] = scoreSum(numbers);
    details['parity'] = scoreParity(numbers);
    details['lowMidHigh'] = scoreLowMidHigh(numbers);
    details['delta'] = scoreDelta(numbers);
    details['gap'] = scoreGap(numbers);
    details['frequency'] = scoreFrequency(numbers);
    details['clusters'] = scoreClusters(numbers);
    details['consecutives'] = scoreConsecutives(numbers);
    details['dispersion'] = scoreDispersion(numbers);

    const total = Object.values(details).reduce((a, b) => a + b, 0);

    return { total, details };
};


export const initScoringContext = (frequencies: FrequencyStat[], gapStats: GapStat[]) => {

    setFrequencies(frequencies);
    setGapStats(gapStats);
};

// Génère et retourne 4 grilles pondérées
export const generateSmartGrids = async () => {
    const allGrids: ScoredGrid[] = [];

    while (allGrids.length < 30) {
        const grid = generateRandomGrid();
        const { total, details } = scoreGrid(grid);

        allGrids.push({ numbers: grid, score: total, details });
    }

    // Garde les 4 meilleures
    const topGrids = allGrids
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

    // Sauvegarde dans le tracker
    for (const g of topGrids) {
        await saveGeneratedGrid({
            date: new Date().toISOString(),
            numbers: g.numbers,
            score: g.score
        });
    }

    return topGrids;
};
