import { loadDraws } from './loader.js';
import { computeGapAnalysis } from './analysis/gap.js';
import { calculateFrequencies } from './analysis/frequency.js';

import { generateSmartGrids, getTotalMaxScore, initScoringContext, MAX_SCORES } from './generator/generateGrid.js';

const main = async () => {
    console.log('Chargement des tirages...');
    const draws = await loadDraws('data');

    console.log('Calcul des fréquences...');
    const frequencies = calculateFrequencies(draws);

    console.log('Calcul des gaps...');
    const gapStats = computeGapAnalysis(draws);

    console.log('Init contexte...');
    initScoringContext(frequencies, gapStats);

    console.log('Lancement génération...');
    const grids = await generateSmartGrids();

    console.log('\n🎰 Grilles générées :');
    const totalMax = getTotalMaxScore();
    grids.forEach((g, i) => {
        console.log(`Grille ${i + 1} : [${g.numbers.join(', ')}] → Score : ${g.score.toFixed(2)} / ${totalMax}`);
        console.log('🧩 Détails scoring :');

        Object.entries(g.details).forEach(([criterion, score]) => {
            const max = MAX_SCORES[criterion];
            console.log(`- ${criterion} : ${score} / ${max}`);
        });

        console.log(''); // ligne vide entre les grilles
    });

};

main().catch(err => {
    console.error('💥 Erreur dans la génération :', err);
});
