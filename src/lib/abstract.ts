const entities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

function decodeEntities(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name[0] !== "#") return entities[name.toLowerCase()] ?? entity;
    const hexadecimal = name[1]?.toLowerCase() === "x";
    const codePoint = Number.parseInt(name.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : entity;
  });
}

export function cleanAbstract(abstract?: string) {
  if (!abstract) return null;
  const plainText = decodeEntities(abstract.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return plainText || null;
}

export function summarizeAbstract(abstract?: string, maxLength = 480) {
  const plainText = cleanAbstract(abstract);
  if (!plainText) return null;

  const sentences = plainText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [plainText];
  let summary = sentences.slice(0, 2).map((sentence) => sentence.trim()).join(" ");
  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength + 1).replace(/\s+\S*$/, "").trimEnd();
  }
  if (summary.length < plainText.length && !summary.endsWith("…")) summary += " …";
  return summary;
}
