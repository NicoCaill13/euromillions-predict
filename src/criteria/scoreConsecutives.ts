export const scoreConsecutives = (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    let consecutivePairs = 0;

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 1) consecutivePairs++;
    }

    if (consecutivePairs === 0 || consecutivePairs === 1) return 20; // idéal
    if (consecutivePairs === 2) return 5; // tolérance
    return 0; // trop de consécutifs
};
