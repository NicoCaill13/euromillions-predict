// src/validate.ts
import * as tf from '@tensorflow/tfjs-node';
import { loadDraws, yearsAgo, evaluateDraws } from './utils.js';

(async () => {
    const dir = process.argv[2] ?? 'data';
    const all = loadDraws(dir);

    const splitValid = yearsAgo(10);
    const splitTest = yearsAgo(5);

    const valid = all.filter(d => {
        const dt = new Date(d.date);
        return dt >= splitValid && dt < splitTest;
    });
    const historyValid = all.filter(d => new Date(d.date) < splitValid).concat(valid);

    const model = await tf.loadLayersModel('file://model/model.json');

    const res = await evaluateDraws(model, valid, historyValid, 'Validation');
    console.table([res], ['name', 'count', 'avgHits', 'baselineHits', 'gain', 'accChance', 'baselineChance', 'kl']);
})();
