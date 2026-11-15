import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { parseCsv } from "../src/lib/csv";
import { labels, type Label } from "../src/lib/types";

const file = process.argv[2] || "data/benchmark_60.csv";

if (!existsSync(file)) {
  console.error(`File tidak ditemukan: ${file}`);
  process.exit(1);
}

const content = await readFile(file, "utf8");
const rows = parseCsv(content);
const headers = rows[0];

if (!headers.includes("id") || !headers.includes("reference_text") || !headers.includes("true_label") || !headers.includes("source_type")) {
  console.error("Header CSV tidak lengkap. Wajib: id,reference_text,true_label,source_type");
  process.exit(1);
}

const dataRows = rows.slice(1).filter((r) => r.some(Boolean));
const labelCounts: Record<string, number> = {};
const sourceCounts: Record<string, number> = {};
const ids = new Set<string>();
const duplicates: string[] = [];

for (const row of dataRows) {
  const rowObj = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]));
  const id = rowObj.id;
  const label = rowObj.true_label;
  const source = rowObj.source_type;

  if (ids.has(id)) duplicates.push(id);
  ids.add(id);

  if (!labels.includes(label as Label)) {
    console.error(`Label tidak valid pada baris id ${id}: ${label}`);
  }

  labelCounts[label] = (labelCounts[label] || 0) + 1;
  sourceCounts[source] = (sourceCounts[source] || 0) + 1;
}

console.log("=== LAPORAN VALIDASI DATASET BENCHMARK ===");
console.log(`Total entri: ${dataRows.length}`);
console.log(`Entri unik: ${ids.size}`);
if (duplicates.length) {
  console.error(`ID Duplikat: ${duplicates.join(", ")}`);
} else {
  console.log("Semua ID unik: OK");
}

console.log("\nDistribusi True Label:");
for (const [lbl, count] of Object.entries(labelCounts)) {
  const pct = ((count / dataRows.length) * 100).toFixed(1);
  console.log(`- ${lbl}: ${count} (${pct}%)`);
}

console.log("\nDistribusi Source Type:");
for (const [src, count] of Object.entries(sourceCounts)) {
  const pct = ((count / dataRows.length) * 100).toFixed(1);
  console.log(`- ${src}: ${count} (${pct}%)`);
}
