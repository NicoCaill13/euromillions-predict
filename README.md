# Loto Predictor (Deep Learning)

Ce projet utilise **Node.js**, **TypeScript** et **TensorFlow\.js** pour prédire les tirages du Loto français via un modèle **LSTM**. Il couvre l'intégralité du pipeline : extraction et préparation des données, entraînement, évaluation et génération de grilles.

---

## 🔧 Prérequis

* **Node.js** v14 ou supérieur
* **npm**
* **TypeScript** et **ts-node** (en développement)

```bash
npm install --save-dev typescript ts-node @types/node
```

* (Optionnel) **TensorBoard** pour visualiser les logs :

```bash
npm install --global @tensorflow/tfjs-node-gpu
```

---

## ⚙️ Installation & build

1. Cloner le dépôt et installer les dépendances :

   ```bash
   git clone <url-du-repo>
   cd euromillions-predict
   npm install
   ```

2. Compiler le TypeScript (optionnel) :

   ```bash
   npx tsc
   ```

   Cela génère les fichiers JavaScript dans le dossier `dist/`.

---

## 🚀 Pipeline de production

| Étape                                        | Commande           | Script appelé               | Résultat                                                                                                     |
| -------------------------------------------- | ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 0. Conversion CSV → JSON                     | `npm run convert`  | `dist/deep-learning/convert.js`           | `data/loto/combined.json`                                                                                    |
| 1. Split train/test                          | `npm run split`    | `dist/deep-learning/split.js`             | `data/loto/train_loto.json`, `data/loto/test_loto.json`                                                      |
| 2. Génération du dataset séquentiel          | `npm run build`    | `dist/deep-learning/build-dataset.js`     | `data/loto/x_train_seq.json`, `data/loto/y_train.json`, `data/loto/x_test_seq.json`, `data/loto/y_test.json` |
| Génération du dataset séquentiel             | `npm run build`    | `dist/deep-learning/build-dataset.js`     | `x_train_seq.json`, `y_train.json`, `x_test_seq.json`, `y_test.json`                                         |
| 2. Entraînement du modèle final (LSTM)       | `npm run train`    | `dist/deep-learning/train.js`             | `data/loto/model-lstm-final/`                                                                                |
| 3. Évaluation finale (loss & F1)             | `npm run validate` | `dist/deep-learning/validate.js`          | Loss, binaryAccuracy, Precision, Recall, F1, Exact Match Ratio                                               |
| 4. Prédiction du prochain tirage (5 grilles) | `npm run predict`  | `dist/deep-learning/predict.js` | Affiche 5 grilles pondérées                                                                                  |

\-------------------------------------------------|-------------------------|----------------------------|-----------------------------------------------------------------|
\| 1. Génération du dataset séquentiel             | `npm run build`         | `dist/build-dataset.js`    | `data/loto/x_train_seq.json`, `y_train.json`, `x_test_seq.json`, `y_test.json` |
\| 2. Entraînement du modèle final (LSTM)          | `npm run train`         | `dist/train.js`            | `data/loto/model-lstm-final/`                                   |
\| 3. Évaluation finale (loss & F1)                | `npm run validate`      | `dist/validate.js`         | Loss, binaryAccuracy, Precision, Recall, F1, Exact Match Ratio  |
\| 4. Prédiction du prochain tirage (5 grilles)    | `npm run predict`       | `dist/predict.js data/loto`| Affiche 5 grilles pondérées                                     |

---

## 🧪 Outils d’analyse & tuning

Ces scripts **ne** font **pas** partie du pipeline de production, mais servent au benchmark et à l’optimisation :

| Script                       | Commande            | Objectif                                                               |
| ---------------------------- | ------------------- | ---------------------------------------------------------------------- |
| Baseline fréquentiel         | `npm run baseline`  | Score F1 d’une règle top-5 boules + top-1 chance (20 derniers tirages) |
| Sweep de seuil (threshold)   | `npm run threshold` | Recherche du seuil optimal (0.1–0.85) maximisant le F1 multi-label     |
| Grid-search hyperparams LSTM | `npm run tuning`    | Teste combos (LSTM units, Dropout, LR) et affiche le top-3 par F1      |

---

## 📂 Structure du projet

```
euromillions-predict/
├─ data/
│  └─ loto/
│     ├─ train_loto.json
│     ├─ test_loto.json
│     ├─ x_train_seq.json
│     ├─ y_train.json
│     ├─ x_test_seq.json
│     ├─ y_test.json
│     └─ model-lstm-final/
├─ src/
│  ├─ build-dataset.ts
│  ├─ train-lstm-final.ts
│  ├─ evaluate-lstm-final.ts
│  ├─ predict-next-draw.ts
│  ├─ baseline.ts
│  ├─ threshold-sweep.ts
│  └─ tune-lstm.ts
├─ dist/                  
├─ package.json
├─ tsconfig.json
└─ README.md              
```

---

## 📈 Monitoring & automatisation

* **TensorBoard** :

  ```bash
  tensorboard --logdir data/loto/logs-lstm-final
  ```

* **Automatisation** (cron / CI) :

  * Exécuter périodiquement (mensuel ou après chaque tirage) :

    ```bash
    npm run build && npm run train && npm run validate
    ```
  * Mettre en place des notifications si la performance (F1) chute.

---

## 📜 Licence

MIT © \[Votre Nom ou Organisation]
