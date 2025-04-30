export const scoreDispersion = (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const dispersion = sorted[sorted.length - 1] - sorted[0];

    if (dispersion >= 30 && dispersion <= 38) return 25; // plage idéale
    if (dispersion >= 25 && dispersion <= 40) return 10; // plage étendue
    return 0;
};
