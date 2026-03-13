export function getPluralForm(count: number, one: string, few: string, many: string): string {
    if (count === 1) return one;
    const rest10 = count % 10;
    const rest100 = count % 100;
    if (rest10 >= 2 && rest10 <= 4 && (rest100 < 10 || rest100 >= 20)) return few;
    return many;
}
