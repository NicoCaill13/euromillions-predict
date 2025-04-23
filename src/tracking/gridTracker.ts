import fs from 'fs/promises';
import path from 'path';

interface GeneratedGrid {
    date: string;
    numbers: number[];
    score: number; // pondération globale de la grille
}

const filePath = path.join('data', 'generated_grids.json');

// Sauvegarder une grille
export const saveGeneratedGrid = async (grid: GeneratedGrid) => {
    let grids: GeneratedGrid[] = [];

    try {
        const data = await fs.readFile(filePath, 'utf-8');
        grids = JSON.parse(data);
    } catch {
        // Si le fichier n'existe pas encore
        grids = [];
    }

    grids.push(grid);

    await fs.writeFile(filePath, JSON.stringify(grids, null, 2));
};

// Charger toutes les grilles générées
export const loadGeneratedGrids = async (): Promise<GeneratedGrid[]> => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

export const clearGeneratedGrids = async () => {
    try {
        await fs.unlink(filePath);
        console.log('🗑️ Fichier generated_grids.json supprimé après comparaison.');
    } catch (err) {
        console.log('⚠️ Aucun fichier generated_grids.json à supprimer.');
    }
};
