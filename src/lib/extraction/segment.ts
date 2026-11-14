const headingPattern = /^\s*(daftar\s+(pustaka|referensi)|referensi|bibliography|references)\s*:?\s*$/i;
const appendixPattern = /^\s*(lampiran|appendix|appendices)\b/i;

export function extractBibliography(text: string, requireHeading = false): string {
  const lines = text.replace(/\r/g, "").split("\n");
  let start = -1;
  for (let index = 0; index < lines.length; index++) {
    if (headingPattern.test(lines[index])) start = index + 1;
  }
  if (start < 0) {
    if (requireHeading) throw new Error("Bagian Daftar Pustaka tidak ditemukan. Tempel daftar pustaka secara manual.");
    return text.trim();
  }
  const end = lines.slice(start).findIndex((line) => appendixPattern.test(line));
  const section = lines.slice(start, end < 0 ? undefined : start + end).join("\n").trim();
  if (!section) throw new Error("Bagian Daftar Pustaka kosong. Tempel referensi secara manual.");
  return section;
}

function cleanLines(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/-\n(?=[a-z])/g, "")
    .split("\n")
    .map((line) => line.trim());
}

function beginsReference(line: string) {
  return /^(?:\[\d+\]|\d{1,3}[.)])\s+/.test(line) ||
    (/^[A-ZÀ-Þ][\p{L}'’-]+(?:,\s+(?:[A-Z]\.?|[A-Z][\p{L}'’-]+))?(?:\s+(?:&|dan|and)\s+[A-ZÀ-Þ][\p{L}'’-]+|(?:,\s*[A-ZÀ-Þ][\p{L}'’-]+)+)*[,.\s]*\(?\d{4}[a-z]?\)?/u.test(line) && line.length < 240);
}

function stripNumbering(value: string) {
  return value.replace(/^(?:\[\d+\]|\d{1,3}[.)])\s+/, "").trim();
}

export function splitReferences(section: string): string[] {
  const lines = cleanLines(section);
  const references: string[] = [];
  let current = "";
  let blankLines = 0;

  const flush = () => {
    const cleaned = stripNumbering(current.replace(/\s+/g, " ").trim());
    if (cleaned.length >= 15) references.push(cleaned);
    current = "";
  };

  for (const line of lines) {
    if (!line) {
      blankLines++;
      if (current && blankLines === 1) flush();
      continue;
    }
    if (beginsReference(line) && current) flush();
    current += `${current ? " " : ""}${line}`;
    blankLines = 0;
  }
  flush();
  return references;
}
