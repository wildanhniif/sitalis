import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getCrossrefClient } from "../src/lib/crossref/client";
import { parseCsv, escapeCsv } from "../src/lib/csv";
import { calculateMetrics, type EvaluationInput } from "../src/lib/evaluation";
import { getLlmClient } from "../src/lib/llm/client";
import { checkReference } from "../src/lib/pipeline/check";
import { labels, type CheckResult, type Label } from "../src/lib/types";

if (existsSync(".env")) process.loadEnvFile(".env");

const file = process.argv[2];
if (!file) {
  console.error("Penggunaan: npm run eval -- data/test.csv");
  process.exit(1);
}
if (!process.env.CROSSREF_MAILTO || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
  console.error("Isi CROSSREF_MAILTO, LLM_BASE_URL, LLM_MODEL, dan LLM_API_KEY sebelum evaluasi.");
  process.exit(1);
}

const rowSchema = z.object({ id: z.string().min(1), reference_text: z.string().min(15), true_label: z.enum(labels), source_type: z.string() });
const rows = parseCsv(await readFile(file, "utf8"));
const headers = rows[0];
const inputs: EvaluationInput[] = rows.slice(1).filter((row) => row.some(Boolean)).map((row) => {
  const value = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
  return rowSchema.parse({ ...value, true_label: value.true_label as Label });
});
const results: CheckResult[] = [];
for (let index = 0; index < inputs.length; index++) {
  console.log(`[${index + 1}/${inputs.length}] ${inputs[index].id}`);
  results.push(await checkReference(inputs[index].reference_text, { crossref: getCrossrefClient(), llm: getLlmClient() }, inputs[index].id));
}
const predictions = [["id", "reference_text", "true_label", "predicted_label", "score", "elapsed_ms", "tokens"], ...inputs.map((input, index) => {
  const result = results[index];
  return [input.id, input.reference_text, input.true_label, result.label, result.bestCandidate?.score.toFixed(4) ?? "", result.elapsedMs, result.tokens];
})].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
const metrics = { generatedAt: new Date().toISOString(), ...calculateMetrics(inputs, results) };
await writeFile(path.join(process.cwd(), "predictions.csv"), `\uFEFF${predictions}`, "utf8");
await writeFile(path.join(process.cwd(), "metrics.json"), JSON.stringify(metrics, null, 2), "utf8");
console.log(`Selesai. Macro-F1: ${metrics.macroF1.toFixed(4)}. Hasil: predictions.csv dan metrics.json`);
