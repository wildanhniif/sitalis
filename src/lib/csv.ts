import type { Report } from "./types";
import { labelText } from "./pipeline/label";

export function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportToCsv(report: Report) {
  const rows = report.results.map((result) => [
    result.id,
    result.referenceText,
    labelText[result.manualLabel ?? result.label],
    result.parsed?.title ?? "",
    result.parsed?.authors[0] ?? "",
    result.parsed?.year ?? "",
    result.bestCandidate?.work.DOI ?? "",
    result.bestCandidate?.score.toFixed(4) ?? "",
    result.reason,
    result.evidence,
    result.elapsedMs,
    result.tokens,
  ]);
  return `\uFEFF${[["id", "reference_text", "label", "title", "first_author", "year", "crossref_doi", "score", "reason", "evidence", "elapsed_ms", "tokens"], ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
