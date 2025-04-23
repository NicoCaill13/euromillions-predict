import { Draw } from '../loader.js';
import { geometricMean, harmonicMean } from 'simple-statistics';

export interface MeanStats {
    geometric: number;
    harmonic: number;
}

export const analyzeMeans = (draws: Draw[]): MeanStats[] => {
    return draws.map(draw => ({
        geometric: geometricMean(draw.numbers),
        harmonic: harmonicMean(draw.numbers)
    }));
};
