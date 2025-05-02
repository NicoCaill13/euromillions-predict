// src/test.ts
import * as tf from '@tensorflow/tfjs-node';
import { loadDraws, yearsAgo, evaluateDraws } from './utils.js';

(async () => {
    const dir = process.argv[2] ?? 'data';
    const all = loadDraws(dir);

    const splitTest = yearsAgo(5);
    const test = all.filter(d => new Date(d.date) >= splitTest);
    const historyTest = all.filter(d => new Date(d.date) < splitTest).concat(test);

    const model = await tf.loadLayersModel('file://model/model.json');

    const res = await evaluateDraws(model, test, historyTest, 'Test');
    console.table([res], ['name', 'count', 'avgHits', 'baselineHits', 'gain', 'accChance', 'baselineChance', 'kl']);
})();
