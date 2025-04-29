import * as tf from '@tensorflow/tfjs-node';
import { loadDraws, trainOn } from './utils.js';

(async () => {
    const dir = process.argv[2] ?? 'data';
    const draws = loadDraws(dir);
    const model = await trainOn(draws);
    await model.save('file://model');
    console.log('✅ Modèle sauvegardé dans ./model');
    tf.disposeVariables();
})();