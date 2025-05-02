import * as tf from '@tensorflow/tfjs-node';
import { loadDraws, trainOn, LOOKBACK, yearsAgo } from './utils.js';

const dir = process.argv[2] ?? 'data';

export const trainModel = async (dir: string) => {

    const draws = loadDraws(dir);
    const splitValid = yearsAgo(10);
    const trainDraws = draws.filter(d => new Date(d.date) < splitValid);
    console.log(`Entraînement sur ${trainDraws.length} tirages (< ${splitValid.toISOString().slice(0, 10)})`);

    const model = await trainOn(trainDraws);

    await model.save('file://model');
    console.log('✅ Modèle sauvegardé dans ./model');
    tf.disposeVariables();

    return model
}

(async () => {
    await trainModel(dir)
})();