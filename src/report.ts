import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import {
    loadDraws,
    trainOn,
    predictAll,
    yearsAgo,
    evaluateDraws,
    LOOKBACK,
    MAX_NUMBER,
    CHANCE_MAX,
    randomBaseline,
    oneHot,
    Draw
} from './utils.js';
import { makeFeatureVector } from './features.js';


function splitDraws(draws: Draw[]) {
    const splitValid = yearsAgo(10);
    const splitTest = yearsAgo(5);
    const train = draws.filter(d => new Date(d.date) < splitValid);
    const valid = draws.filter(d => {
        const dt = new Date(d.date);
        return dt >= splitValid && dt < splitTest;
    });
    const test = draws.filter(d => new Date(d.date) >= splitTest);
    return { train, valid, test, splitValid, splitTest };
}

async function evaluatePeriod(
    name: string,
    model: tf.LayersModel,
    periodDraws: any[],
    fullHistory: any[]
) {
    let hitsNums = 0;
    let hitsChance = 0;
    const agg = Array(MAX_NUMBER).fill(0);

    for (let i = LOOKBACK; i < periodDraws.length; i++) {
        const window = fullHistory.slice(i - LOOKBACK, i);
        const { bestNums, bestChance } = predictAll(model, window);
        const d = periodDraws[i];
        hitsNums += bestNums.filter(n => d.numbers.includes(n)).length;
        if (bestChance === d.chance) hitsChance++;
        // KL accumulation
        const vec = [...window.flatMap(w => oneHot(w.numbers)), ...makeFeatureVector(window)];
        const inp = tf.tensor2d([vec]);
        const [pNum] = model.predict(inp) as tf.Tensor[];
        pNum.dataSync().forEach((v, idx) => { agg[idx] += v; });
        inp.dispose(); pNum.dispose();
    }

    const N = periodDraws.length - LOOKBACK;
    const avgHits = hitsNums / N;
    const accCh = hitsChance / N;
    const baseNums = randomBaseline(periodDraws);
    const baseCh = 1 / CHANCE_MAX;
    // KL divergence
    const uniform = 1 / MAX_NUMBER;
    const kl = agg.reduce((s, v) => {
        const p = v / N;
        return p ? s + p * Math.log(p / uniform) : s;
    }, 0);

    return { name, count: N, avgHits, baseNums, gain: avgHits - baseNums, accCh, baseCh, kl };
}

(async () => {
    try {
        const dir = process.argv[2] ?? 'data';
        const draws = loadDraws(dir);
        const { train, valid, test, splitValid, splitTest } = splitDraws(draws);

        console.log(`Train (< ${splitValid.toISOString().slice(0, 10)}) : ${train.length}`);
        console.log(`Valid (${splitValid.toISOString().slice(0, 10)} - ${splitTest.toISOString().slice(0, 10)}) : ${valid.length}`);
        console.log(`Test  (>= ${splitTest.toISOString().slice(0, 10)}) : ${test.length}`);

        // 1) Entraînement
        const model = await trainOn(train);
        await model.save('file://model');

        // 2) Évaluation sur valid et test
        const results = [];
        results.push(await evaluatePeriod('Validation', model, valid, train.concat(valid)));
        results.push(await evaluatePeriod('Test', model, test, train.concat(valid).concat(test)));

        // 3) Export poids du layer boules
        const kernel = (model.layers.at(-2)!).getWeights()[0] as tf.Tensor;
        const weights = await kernel.array();
        fs.writeFileSync('weights.json', JSON.stringify(weights));

        // 4) Générer rapport JSON + Markdown
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const report = { date: new Date().toISOString(), results };
        const jsonPath = `report-${timestamp}.json`;
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // Markdown
        const mdLines = [
            `# Rapport du ${new Date().toISOString().slice(0, 10)}`,
            '',
            '## Résumé des performances',
            '| Période    | N tirages | Hits moy. | Gain vs hasard | Exact. Chance | Divergence KL |',
            '|------------|---------:|----------:|---------------:|--------------:|--------------:|',
            ...results.map(r =>
                `| ${r.name.padEnd(10)} ` +
                `| ${r.count.toString().padStart(8)} ` +
                `| ${r.avgHits.toFixed(3)} ` +
                `| ${r.gain.toFixed(3)} ` +
                `| ${(r.accCh * 100).toFixed(1)}% ` +
                `| ${r.kl.toFixed(4)} |`
            ),
            '',
            '---',
            '## Analyse détaillée et recommandations',
            '',
            ...results.map(r => {
                const lines = [];
                if (r.name === 'Validation') {
                    lines.push(`### Validation (${r.count} tirages)`);
                    lines.push(`- **Hits boules** : ${r.avgHits.toFixed(3)} (gain de ${r.gain.toFixed(3)} par rapport au hasard).`);
                    lines.push(`- **Exactitude du numéro Chance** : ${(r.accCh * 100).toFixed(1)}% (baseline ${(r.baseCh * 100).toFixed(1)}%).`);
                    lines.push(`- **Divergence KL** : ${r.kl.toFixed(3)} (indique le niveau de confiance du modèle).`);
                    lines.push('**Actions suggérées** : ajuster hyperparamètres via la fenêtre de validation, tester différents poids de perte pour la tête Chance.');
                } else if (r.name === 'Test') {
                    lines.push(`### Test (${r.count} tirages)`);
                    lines.push(`- **Hits boules** : ${r.avgHits.toFixed(3)} (gain de ${r.gain.toFixed(3)}).`);
                    lines.push(`- **Exactitude du numéro Chance** : ${(r.accCh * 100).toFixed(1)}%.`);
                    lines.push(`- **Divergence KL** : ${r.kl.toFixed(3)}.`);
                    lines.push('**Actions finales** : valider le modèle pour production, envisager un scaling de température ou un ensemble de modèles.');
                }
                return ['', ...lines, ''];
            }).flat(),
        ];
        for (const r of results) {
            mdLines.push(
                `| ${r.name.padEnd(10)} ` +
                `| ${r.count.toString().padStart(8)} ` +
                `| ${r.avgHits.toFixed(3)} ` +
                `| ${r.baseNums.toFixed(3)} ` +
                `| ${(r.gain).toFixed(3)} ` +
                `| ${(r.accCh * 100).toFixed(1)}% ` +
                `| ${(r.baseCh * 100).toFixed(1)}% ` +
                `| ${r.kl.toFixed(4)} |`
            );
        }
        const mdPath = `report-${timestamp}.md`;
        fs.writeFileSync(mdPath, mdLines.join('\n'));

        console.log(`Rapport JSON sauvegardé → ${jsonPath}`);
        console.log(`Rapport Markdown sauvegardé → ${mdPath}`);
    } catch (err: any) {
        console.error('report.ts error:', err.message || err);
        process.exit(1);
    }
})();

