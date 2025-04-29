export const scoreClusters = (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    let clusters = 1;

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] > 5) clusters++;
    }

    return (clusters === 3 || clusters === 4) ? 20 : 5;
};
