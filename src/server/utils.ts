const alphabetLength = 16;
const alphabet: string[] = new Array(alphabetLength).fill(0).map((_, i) => i.toString(alphabetLength));

export function guid(): string {
    return "xxxx-xxxx-xxxx".replace(/x/g, () => {
        return alphabet[Math.floor(Math.random() * alphabetLength)];
    });
}