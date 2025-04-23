export const scoreParity = (numbers: number[]): number => {
    const even = numbers.filter(n => n % 2 === 0).length;
    return (even === 2 || even === 3) ? 20 : 5;
};
