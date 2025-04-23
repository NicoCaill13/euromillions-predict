import { loadDraws, loadFutureDraws } from './loader.js';
import { computeGapAnalysis, displayGapNarrative } from './analysis/gap.js';
import { findTopPairs, findTopTriplets } from './analysis/combinations.js';
import { calculateFrequencies } from './analysis/frequency.js';
import { analyzeRepetitions } from './analysis/repetitions.js';
import { analyzeSums } from './analysis/sumAnalysis.js';
import { analyzeParity } from './analysis/parityAnalysis.js';
import { analyzeIntervals } from './analysis/intervalAnalysis.js';
import { analyzeDeltas } from './analysis/deltaAnalysis.js';
import { analyzeConsecutives } from './analysis/consecutiveAnalysis.js';
import { analyzeDispersion } from './analysis/dispersionAnalysis.js';
import { analyzeConcentration } from './analysis/concentrationAnalysis.js';
import { analyzeSymmetry } from './analysis/symmetryAnalysis.js';
import { analyzeMirroring } from './analysis/mirroringAnalysis.js';
import { analyzeDeltaSum } from './analysis/deltaSumAnalysis.js';
import { analyzeGroupOfTen } from './analysis/groupOfTenAnalysis.js';
import { analyzeEntropy } from './analysis/entropyAnalysis.js';
import { analyzeMeans } from './analysis/meanAnalysis.js';
import { analyzeBinaryPositions } from './analysis/binaryPositionAnalysis.js';
import { analyzeClusters } from './analysis/clusterAnalysis.js';
import { loadGeneratedGrids } from './tracking/gridTracker.js';
import { compareGridsWithDraws } from './tracking/comparator.js';
import { saveGeneratedGrid, clearGeneratedGrids } from './tracking/gridTracker.js';


const main = async () => {
    const draws = await loadDraws('data');
    const futureDraws = await loadFutureDraws('data'); // ⚠️ Vérifie si le fichier existe bien

    const gapStats = computeGapAnalysis(draws);
    const sortedStats = gapStats.sort((a, b) => b.lastGap - a.lastGap);
    const topPairs = findTopPairs(draws);
    const topTriplets = findTopTriplets(draws);
    const frequencies = calculateFrequencies(draws);
    const repetitionStats = analyzeRepetitions(draws);
    const sumRanges = analyzeSums(draws);
    const parityStats = analyzeParity(draws);
    const intervalStats = analyzeIntervals(draws);
    const deltaStats = analyzeDeltas(draws);
    const consecutives = analyzeConsecutives(draws);
    const dispersions = analyzeDispersion(draws);
    const concentrations = analyzeConcentration(draws);
    const symmetries = analyzeSymmetry(draws);
    const mirrorings = analyzeMirroring(draws);
    const deltaSums = analyzeDeltaSum(draws);
    const groupsOfTen = analyzeGroupOfTen(draws);
    const entropies = analyzeEntropy(draws);
    const meanStats = analyzeMeans(draws);
    const binaryDensities = analyzeBinaryPositions(draws);
    const clusters = analyzeClusters(draws);

    displayGapNarrative(sortedStats.slice(0, 5));

    console.log('🔗 Top 10 paires :');
    topPairs.forEach(({ combo, count }) => {
        console.log(`- [${combo.join(', ')}] => ${count} fois`);
    });

    console.log('\n🔗 Top 10 triplets :');
    topTriplets.forEach(({ combo, count }) => {
        console.log(`- [${combo.join(', ')}] => ${count} fois`);
    });

    console.log('\n🎯 Top 10 numéros les plus tirés :');
    frequencies.slice(0, 10).forEach(({ number, count }) => {
        console.log(`- Numéro ${number} : ${count} apparitions`);
    });

    // 🎯 Croisement entre les tops
    const topNumbers = frequencies.slice(0, 10).map(f => f.number);

    console.log('\n🔗 Lien entre les 10 numéros les plus tirés et les top paires/triplets :');

    // Vérifier pour les paires
    console.log('\n🔗 Top paires contenant un numéro du Top 10 :');
    topPairs.forEach(({ combo, count }) => {
        if (combo.some(num => topNumbers.includes(num))) {
            console.log(`- [${combo.join(', ')}] => ${count} fois`);
        }
    });

    // Vérifier pour les triplets
    console.log('\n🔗 Top triplets contenant un numéro du Top 10 :');
    topTriplets.forEach(({ combo, count }) => {
        if (combo.some(num => topNumbers.includes(num))) {
            console.log(`- [${combo.join(', ')}] => ${count} fois`);
        }
    });

    console.log('\n🔄 Répétitions inter-tirages (combien de numéros reviennent) :');
    repetitionStats.forEach(({ repeats, count }) => {
        console.log(`- ${repeats} numéros répétés : ${count} fois`);
    });

    console.log('\n📊 Répartition des sommes :');
    sumRanges.forEach(({ range, count }) => {
        console.log(`- ${range} : ${count} tirages`);
    });

    console.log('\n⚖️ Répartition pair/impair :');
    parityStats.forEach(({ pair, impair, count }) => {
        console.log(`- ${pair} pairs / ${impair} impairs : ${count} tirages`);
    });

    console.log('\n📊 Répartition Low/Mid/High :');
    intervalStats.forEach(({ low, mid, high, count }) => {
        console.log(`- ${low} low / ${mid} mid / ${high} high : ${count} tirages`);
    });

    const averageDeltas = deltaStats.map(d => d.averageDelta);
    const globalAvgDelta = (averageDeltas.reduce((a, b) => a + b, 0)) / averageDeltas.length;

    console.log(`\n📏 Delta moyen global : ${globalAvgDelta.toFixed(2)}`);

    const consecutiveCounts = consecutives.reduce((acc, n) => {
        acc[n] = (acc[n] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    console.log('\n🔗 Nombre de paires consécutives :');
    Object.entries(consecutiveCounts).forEach(([pairs, count]) => {
        console.log(`- ${pairs} paires consécutives : ${count} tirages`);
    });

    const avgDispersion = dispersions.reduce((a, b) => a + b, 0) / dispersions.length;

    console.log(`\n🌐 Dispersion moyenne (écart max-min) : ${avgDispersion.toFixed(2)}`);

    const avgConcentration = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;
    console.log(`\n🎯 Concentration moyenne (fenêtre 3 numéros) : ${avgConcentration.toFixed(2)}`);

    const avgSymmetry = symmetries.reduce((a, b) => a + b, 0) / symmetries.length;
    console.log(`\n🔄 Symétrie moyenne (distance au centre) : ${avgSymmetry.toFixed(2)}`);

    const avgMirroring = mirrorings.reduce((a, b) => a + b, 0) / mirrorings.length;
    console.log(`\n🪞 Mirroring moyen (écart miroir) : ${avgMirroring.toFixed(2)}`);

    const avgDeltaSum = deltaSums.reduce((a, b) => a + b, 0) / deltaSums.length;
    console.log(`\n📏 Somme totale des deltas moyenne : ${avgDeltaSum.toFixed(2)}`);

    const avgGroups = groupsOfTen.reduce((acc, g) => {
        acc.g1_10 += g.g1_10;
        acc.g11_20 += g.g11_20;
        acc.g21_30 += g.g21_30;
        acc.g31_40 += g.g31_40;
        acc.g41_50 += g.g41_50;
        return acc;
    }, { g1_10: 0, g11_20: 0, g21_30: 0, g31_40: 0, g41_50: 0 });

    console.log(`\n📊 Répartition moyenne par groupes de 10 :`);
    Object.entries(avgGroups).forEach(([range, count]) => {
        console.log(`- ${range} : ${(count / draws.length).toFixed(2)} numéros par tirage`);
    });

    const avgEntropy = entropies.reduce((a, b) => a + b, 0) / entropies.length;
    console.log(`\n🌪️ Entropie moyenne (variance) : ${avgEntropy.toFixed(2)}`);

    const avgGeo = meanStats.reduce((acc, m) => acc + m.geometric, 0) / meanStats.length;
    const avgHarm = meanStats.reduce((acc, m) => acc + m.harmonic, 0) / meanStats.length;

    console.log(`\n📐 Moyenne géométrique : ${avgGeo.toFixed(2)}`);
    console.log(`📏 Moyenne harmonique : ${avgHarm.toFixed(2)}`);

    const avgDensity = binaryDensities.reduce((a, b) => a + b, 0) / binaryDensities.length;

    console.log(`\n🧩 Densité locale binaire : ${avgDensity.toFixed(2)}`);

    const avgClusters = clusters.reduce((a, b) => a + b, 0) / clusters.length;

    console.log(`\n🌐 Nombre moyen de clusters (DBSCAN-like) : ${avgClusters.toFixed(2)}`);



    const generatedGrids = await loadGeneratedGrids();

    if (futureDraws.length === 0) {
        console.log('\n⚠️ Aucun futur tirage trouvé pour la comparaison.');
    } else if (generatedGrids.length === 0) {
        console.log('\n⚠️ Aucune grille générée disponible pour comparaison.');
    } else {
        const gridsOnly = generatedGrids.map(g => g.numbers);
        const comparison = compareGridsWithDraws(gridsOnly, futureDraws);

        console.log('\n📊 Comparaison des grilles générées avec les futurs tirages :');
        comparison.forEach(result => {
            console.log(`- Grille [${result.grid.join(', ')}] vs Tirage ${result.drawDate} => ${result.matchCount} bons numéros`);
        });

        if (comparison.length > 0) {
            await clearGeneratedGrids();
        }
    }

}

main();
