let freqMap: Record<number, number> = {};

export const setFrequencies = (frequencies: { number: number; count: number }[]) => {
    freqMap = Object.fromEntries(frequencies.map(f => [f.number, f.count]));
};

export const scoreFrequency = (numbers: number[]): number => {
    return numbers.reduce((acc, n) => {
        const freq = freqMap[n] ?? 0;
        return acc + freq / 10; // pondération à ajuster
    }, 0);
};
