const headingPattern = /^\s*(daftar\s+(pustaka|referensi)|referensi|bibliography|references)\s*:?\s*$/i;
const appendixPattern = /^\s*(lampiran|appendix|appendices)\b/i;
const numberingPattern = /^(?:\[\d+\]|\d{1,3}[.)]?)\s+/;
const numberedStartPattern = /^\s*(?:\[\d+\]|\d{1,3}[.)]?)\s+\S/;

const tableHeaderWords = ["no", "nomor", "format", "sitasi", "referensi", "status", "catatan", "keterangan", "doi", "judul", "tahun"];
const statusTailPattern = /\s*(?:[.;,]\s*)?(?:status\s*[:=]?\s*)?(?:tidak\s+aktif|aktif|terverifikasi|tidak\s+terverifikasi|belum\s+diverifikasi|valid)\s*(?:\(([^()]*)\))?\s*[.;,]?\s*$/iu;

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

/** Baris judul kolom hasil salin tabel (mis. "No | Format Sitasi | Status | DOI/Catatan"). */
function isTableHeader(line: string) {
  const value = line.trim();
  if (!value || value.length > 160) return false;
  if (/\d{4}/.test(value)) return false;
  const hits = tableHeaderWords.filter((word) => new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "iu").test(value));
  return hits.length >= 3;
}

function beginsReference(line: string) {
  return numberingPattern.test(line) ||
    (/^[A-ZÀ-Þ][\p{L}'’-]+(?:,\s+(?:[A-Z]\.?|[A-Z][\p{L}'’-]+))?(?:\s+(?:&|dan|and)\s+[A-ZÀ-Þ][\p{L}'’-]+|(?:,\s*[A-ZÀ-Þ][\p{L}'’-]+)+)*[,.\s]*\(?\d{4}[a-z]?\)?/u.test(line) && line.length < 240);
}

function stripNumbering(value: string) {
  let result = value.trim();
  for (let guard = 0; guard < 3 && numberingPattern.test(result); guard++) {
    result = result.replace(numberingPattern, "").trim();
  }
  return result;
}

/**
 * Kolom "Status"/"Catatan" hasil salin tabel ikut terbawa ke dalam entri.
 * DOI yang berada di dalam kurung tetap dipertahankan karena berguna untuk pencarian.
 */
function stripStatusTail(value: string) {
  let result = value.trim();
  for (let guard = 0; guard < 4; guard++) {
    const match = result.match(statusTailPattern);
    if (!match || match.index === undefined) break;
    const doi = match[1]?.match(/10\.\d{4,9}\/[^\s,;)\]]+/i)?.[0]?.replace(/[.,;]+$/, "");
    const head = result.slice(0, match.index).replace(/[\s,;.]+$/u, "").trim();
    const alreadyHasDoi = doi ? head.toLowerCase().includes(doi.toLowerCase()) : false;
    result = doi && !alreadyHasDoi ? `${head} ${doi}` : head;
  }
  return result;
}

/** Deteksi hasil salin tabel: ada baris judul kolom, atau banyak entri berkolom status. */
function looksLikeTable(lines: string[]) {
  if (lines.some((line) => isTableHeader(line))) return true;
  return lines.filter((line) => /\s(?:aktif|tidak\s+aktif)\s*\(/iu.test(line)).length >= 2;
}

export function splitReferences(section: string): string[] {
  const allLines = cleanLines(section);
  const tableMode = looksLikeTable(allLines);
  const lines = allLines.filter((line) => !isTableHeader(line));
  const references: string[] = [];
  let current = "";
  let blankLines = 0;

  const flush = () => {
    let cleaned = stripNumbering(current.replace(/\s+/g, " ").trim());
    if (tableMode) cleaned = stripStatusTail(cleaned);
    cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/[\s,;]+$/u, "").trim();
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

/**
 * Pemisahan heuristik dianggap meragukan bila teks panjang tetapi hanya menghasilkan
 * sedikit entri, satu entri terlalu panjang, atau jumlah penomoran jauh melebihi entri.
 */
export function needsAiSegmentation(section: string, references: string[]): boolean {
  const trimmed = section.trim();
  if (trimmed.length < 60) return false;
  if (!references.length) return trimmed.length > 120;
  if (references.length <= 2 && trimmed.length > 500) return true;
  if (references.some((item) => item.length > 1200)) return true;
  const numbered = trimmed.split("\n").filter((line) => numberedStartPattern.test(line)).length;
  if (numbered >= 3 && references.length * 2 <= numbered) return true;
  const inlineNumbering = (trimmed.match(/(?:^|\s)(?:\[\d+\]|\d{1,3}[.)]?)\s+\p{Lu}/gu) ?? []).length;
  return references.length <= 2 && inlineNumbering >= 3;
}
