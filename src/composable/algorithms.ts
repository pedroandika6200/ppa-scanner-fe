export const normalize = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g,"")
    .trim();
};

export const createBigrams = (text: string): string[] => {
  const normalized = normalize(text);

  const bigrams: string[] = [];

  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.push(normalized.slice(i, i + 2));
  }

  return bigrams;
};

export const sorensenDice = (a: string, b: string): number => {
  const bigramsA = createBigrams(a);
  const bigramsB = createBigrams(b);

  if (!bigramsA.length || !bigramsB.length) {
    return 0;
  }

  let matches = 0;

  const used = new Set<number>();

  for (const bigramA of bigramsA) {
    for (let i = 0; i < bigramsB.length; i++) {
      if (used.has(i)) continue;

      if (bigramA === bigramsB[i]) {
        matches++;
        used.add(i);
        break;
      }
    }
  }

  return (2 * matches) / (bigramsA.length + bigramsB.length);
};

export const levenshtein = (a: string, b: string): number => {
  a = a.toLowerCase();
  b = b.toLowerCase();

  const matrix: number[][] = Array.from(
    { length: b.length + 1 },
    () => Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i]![0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;

      matrix[i]![j] = Math.min(
        Number(matrix[i - 1]![j]) + 1,
        Number(matrix[i]![j - 1]) + 1,
        Number(matrix[i - 1]![j - 1]) + cost
      );
    }
  }

  return Number(matrix[b.length]![a.length]);
}
