export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinSimilarity(a: string, b: string) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return left === right ? 1 : 0;
  if (left === right) return 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

export function jaroWinklerSimilarity(a: string, b: string) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return left === right ? 1 : 0;
  if (left === right) return 1;
  const distance = Math.max(Math.floor(Math.max(left.length, right.length) / 2) - 1, 0);
  const leftMatches = new Array<boolean>(left.length).fill(false);
  const rightMatches = new Array<boolean>(right.length).fill(false);
  let matches = 0;
  for (let i = 0; i < left.length; i++) {
    for (let j = Math.max(0, i - distance); j < Math.min(i + distance + 1, right.length); j++) {
      if (rightMatches[j] || left[i] !== right[j]) continue;
      leftMatches[i] = true;
      rightMatches[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  const leftOrder = left.split("").filter((_, i) => leftMatches[i]);
  const rightOrder = right.split("").filter((_, i) => rightMatches[i]);
  const transpositions = leftOrder.filter((char, i) => char !== rightOrder[i]).length / 2;
  const jaro = (matches / left.length + matches / right.length + (matches - transpositions) / matches) / 3;
  const prefix = left.split("").findIndex((char, i) => char !== right[i]);
  const commonPrefix = prefix === -1 ? Math.min(4, left.length) : Math.min(4, prefix);
  return jaro + commonPrefix * 0.1 * (1 - jaro);
}

export function titleSimilarity(a: string | null, b: string | null) {
  return Math.max(levenshteinSimilarity(a ?? "", b ?? ""), jaroWinklerSimilarity(a ?? "", b ?? ""));
}

export function surname(value: string) {
  const cleaned = value.replace(/\([^)]*\)/g, "").trim();
  if (cleaned.includes(",")) return normalizeText(cleaned.split(",")[0]).split(" ")[0] ?? "";
  const parts = normalizeText(cleaned).split(" ");
  return parts.at(-1) ?? "";
}
