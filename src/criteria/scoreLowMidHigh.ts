export const scoreLowMidHigh = (numbers: number[]): number => {
    let low = 0, mid = 0, high = 0;

    numbers.forEach(n => {
        if (n <= 16) low++;
        else if (n <= 33) mid++;
        else high++;
    });

    // Favoriser 1/2/2 ou 2/2/1 répartitions
    const patterns = [`1-2-2`, `2-2-1`, `2-1-2`];
    const key = `${low}-${mid}-${high}`;
    return patterns.includes(key) ? 25 : 10;
};
