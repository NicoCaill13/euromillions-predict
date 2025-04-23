export const scoreDelta = (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const deltas = [];

    for (let i = 1; i < sorted.length; i++) {
        deltas.push(sorted[i] - sorted[i - 1]);
    }

    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

    // Idéal : entre 6 et 10
    if (avgDelta >= 6 && avgDelta <= 10) return 25;
    if (avgDelta >= 4 && avgDelta <= 12) return 10;
    return 0;
};
