export const scoreSum = (numbers: number[]): number => {
    const sum = numbers.reduce((a, b) => a + b, 0);

    // Score maximal si la somme est entre 121 et 140
    if (sum >= 121 && sum <= 140) return 30;
    if (sum >= 101 && sum <= 160) return 20;
    return 0;
};
