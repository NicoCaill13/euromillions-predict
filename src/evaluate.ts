import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import {
    loadDraws,
    trainOn,
    predictAll,
    randomBaseline,
    LOOKBACK,
    TEST_SIZE,
    MAX_NUMBER,
    CHANCE_MAX,
    oneHot,
} from './utils.js';
import { makeFeatureVector } from './features.js';


(async () => {
    /* ---------------------------------------------------------------------- */
    /*  Chargement & split chronologique                                      */
    /* ---------------------------------------------------------------------- */
    const dir = process.argv[2] ?? 'data';
    const draws = loadDraws(dir);

    if (draws.length < LOOKBACK + TEST_SIZE) {
        throw new Error('Pas assez de données pour évaluer.');
    }

    const trainDraws = draws.slice(0, -TEST_SIZE);
    const testDraws = draws.slice(-TEST_SIZE);
    console.log(`Train: ${trainDraws.length}, Test: ${TEST_SIZE}`);

    /* ---------------------------------------------------------------------- */
    /*  Entraînement sur la partie TRAIN                                      */
    /* ---------------------------------------------------------------------- */
    const model = await trainOn(trainDraws);

    /* ---------------------------------------------------------------------- */
    /*  Boucles de test : hits boules + chance                                */
    /* ---------------------------------------------------------------------- */
    let hitsBoules = 0;
    let hitsChance = 0;

    for (let idx = 0; idx < TEST_SIZE; idx++) {
        const windowStart = trainDraws.length + idx - LOOKBACK;
        const window = draws.slice(windowStart, windowStart + LOOKBACK);
        const { bestNums, bestChance } = predictAll(model, window);

        const d = testDraws[idx];
        hitsBoules += bestNums.filter(n => d.numbers.includes(n)).length;
        if (bestChance === d.chance) hitsChance += 1;
    }

    const avgHitsBoules = hitsBoules / TEST_SIZE;          // moyenne de bons numéros
    const accChance = hitsChance / TEST_SIZE;          // exactitude du numéro Chance
    const randBoules = randomBaseline(testDraws);       // baseline empirique boules
    const randChance = 1 / CHANCE_MAX;                  // probabilité aléatoire Chance

    /* ---------------------------------------------------------------------- */
    /*  KL divergence sur la distribution des boules                          */
    /* ---------------------------------------------------------------------- */
    const agg = Array(MAX_NUMBER).fill(0);
    for (let i = 0; i < TEST_SIZE; i++) {
        const win = draws.slice(trainDraws.length + i - LOOKBACK, trainDraws.length + i);

        const vec = [
            ...win.flatMap(d => oneHot(d.numbers)),   // 10×49
            ...makeFeatureVector(win),                // +124 = 602
        ];
        const inp = tf.tensor2d([vec]);

        const [pNum] = model.predict(inp) as tf.Tensor<tf.Rank>[];
        pNum.dataSync().forEach((v, j) => (agg[j] += v));
        inp.dispose();
        pNum.dispose();
    }
    const uniform = 1 / MAX_NUMBER;
    const kl = agg.reduce((s, v) => {
        const p = v / TEST_SIZE;
        return p ? s + p * Math.log(p / uniform) : s;
    }, 0);

    /* ---------------------------------------------------------------------- */
    /*  Export poids du layer final boules                                    */
    /* ---------------------------------------------------------------------- */
    const kernel = (model.layers.at(-2) as tf.layers.Layer).getWeights()[0]; // -1 = chance, -2 = boules
    fs.writeFileSync('weights.json', JSON.stringify(await (kernel as tf.Tensor).array()));

    /* ---------------------------------------------------------------------- */
    /*  Affichage des résultats                                               */
    /* ---------------------------------------------------------------------- */
    console.log('\n── RÉSULTATS TEST ───────────────');
    console.log(`Hits boules / tirage    : ${avgHitsBoules.toFixed(3)}`);
    console.log(`Baseline boules hasard  : ${randBoules.toFixed(3)}`);
    console.log(`Gain absolu boules      : ${(avgHitsBoules - randBoules).toFixed(3)}`);
    console.log(`Exactitude n° Chance    : ${(accChance * 100).toFixed(1)} % (baseline ${(randChance * 100).toFixed(1)} %)`);
    console.log(`KL(uniforme‖prédite)    : ${kl.toFixed(4)}`);
    console.log('Poids exportés → weights.json');
})();
