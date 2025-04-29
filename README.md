# 🎰 Euromillions‑Predict — Guide d’utilisation

> **Prerequis** : `npm install` pour récupérer les dépendances, puis `npx tsc` pour compiler tout le TypeScript vers `dist/`.
>
> Le dossier des CSV est par défaut `data/` (modifiable en passant un argument à chaque script).

---

## 🚀 Commandes NPM disponibles

| Script | Commande | Description courte |
|--------|----------|--------------------|
| **update**   | `npm run update` *(+ `[path]`)* | Récupère le dernier tirage via l’API Opendatasoft et l’insère **en ligne 2** du fichier `lotoN.csv` ayant l’index le plus élevé (ou crée `loto.csv`). |
| **train**    | `npm run train` *(+ `[path]`)* | Entraîne le modèle bi‑tête (49 boules + 10 Chance) sur **tout** l’historique → sauvegarde dans `./model`. |
| **predict**  | `npm run predict` *(+ `[path]`)* | Génère **5 grilles** (5 boules + Chance chacune) à partir du modèle courant. |
| **compare**  | `npm run compare` *(+ `[path]`)* | Compare ces 5 grilles au **dernier tirage réel** (ligne 2 de `lotoN.csv`) ; affiche boules correctes & exactitude Chance. |
| **evaluate** | `npm run evaluate` *(+ `[path]`)* | Audit complet : split 50 derniers tirages test → hits moyens, baseline hasard, précision Chance, divergence KL, export `weights.json`. |

> **Note** : tous les scripts acceptent un argument optionnel `path` pour spécifier un dossier différent de `data/` :
> ```bash
> npm run train -- archives
> ```

---

## 🟢 Première utilisation

```bash
# 1. Entraîner le réseau sur tout l’historique
npm run train

# 2. Obtenir 5 grilles pour le prochain tirage
npm run predict
```

---

## 🔄 Cycle hebdomadaire après chaque nouveau tirage

```bash
# 1. Ajouter le tirage du jour
npm run update

# 2. Ré‑entraîner le modèle avec l’historique à jour
npm run train

# 3. Vérifier la performance sur ce tirage tout juste ajouté
npm run compare

# 4. Générer 5 nouvelles grilles à jouer
npm run predict
```

*(Astuce : tout exécuter d’un seul trait :)*
```bash
npm run update && npm run train && npm run compare && npm run predict
```

---

## 📊 Audit ponctuel

```bash
# Quand vous le souhaitez (p. ex. une fois par mois)
npm run evaluate
```

Affiche :
* moyenne de boules correctes / tirage,
* baseline Monte‑Carlo (hasard),
* précision sur le numéro Chance,
* divergence KL,
* export des poids du dernier layer → `weights.json` (pour une heat‑map dans Python ou autre).

---

## 📝 Récapitulatif rapide

```
Première fois :  train  → predict
Routine :       update → train → compare → predict
Audit :          evaluate (optionnel)
```

