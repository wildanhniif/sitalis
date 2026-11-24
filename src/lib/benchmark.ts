import { z } from "zod";
import type { Label } from "./types";

const metricSchema = z.object({ precision: z.number(), recall: z.number(), f1: z.number(), support: z.number() });
const squareSchema = z.record(z.string(), z.number());
const rowSchema = z.record(z.string(), squareSchema);
const fractionSchema = z.object({ value: z.number(), falsePositives: z.number(), denominator: z.number() });

export const benchmarkRunSchema = z.object({
  generatedAt: z.string().min(1),
  referenceCount: z.number().int().min(0),
  perLabel: z.record(z.string(), metricSchema),
  macroF1: z.number().min(0).max(1),
  confusionMatrix: rowSchema,
  falsePositiveRateRealNonDoi: fractionSchema,
  totalElapsedMs: z.number().min(0),
  totalTokens: z.number().min(0),
  averageTimeMsPerReference: z.number().min(0),
  averageTokensPerReference: z.number().min(0),
  model: z.string().default("Tidak diketahui"),
  llmBaseUrl: z.string().default("Tidak diketahui"),
  datasetFile: z.string().default("Tidak diketahui"),
  labelCounts: z.record(z.string(), z.number()).default({}),
  comparatorUsedCount: z.number().min(0).default(0),
  comparatorUsedPercentage: z.number().min(0).default(0),
});

export type BenchmarkRun = z.infer<typeof benchmarkRunSchema> & { id: string; importedAt: string; isDemo: boolean };


/** Memvalidasi dan menormalkan isi metrics.json menjadi run benchmark. Field metadata lama yang absen diisi nilai default. */
export function parseMetricsJson(text: string): Omit<BenchmarkRun, "id" | "importedAt" | "isDemo"> {
  return benchmarkRunSchema.parse(JSON.parse(text));
}


/** Metrik utama yang disorot pada tabel perbandingan beserta arah terbaiknya. */
export const comparisonMetrics = [
  { key: "macroF1", label: "Macro-F1", higherIsBetter: true },
  { key: "f1Valid", label: "F1 Valid", higherIsBetter: true },
  { key: "f1Partial", label: "F1 Sebagian", higherIsBetter: true },
  { key: "f1Suspected", label: "F1 Diduga", higherIsBetter: true },
  { key: "f1Unverified", label: "F1 Unverified", higherIsBetter: true },
  { key: "averageTokensPerReference", label: "Rata-rata Token", higherIsBetter: false },
  { key: "averageTimeMsPerReference", label: "Rata-rata Waktu", higherIsBetter: false },
  { key: "comparatorUsedPercentage", label: "% Pembanding", higherIsBetter: false },
] as const;

export type ComparisonMetricKey = (typeof comparisonMetrics)[number]["key"];

function metricValue(run: BenchmarkRun, key: ComparisonMetricKey): number {
  if (key === "macroF1") return run.macroF1;
  if (key === "f1Valid") return run.perLabel?.valid?.f1 ?? 0;
  if (key === "f1Partial") return run.perLabel?.partial?.f1 ?? 0;
  if (key === "f1Suspected") return run.perLabel?.suspected?.f1 ?? 0;
  if (key === "f1Unverified") return run.perLabel?.unverified?.f1 ?? 0;
  return run[key];
}

/**
 * Menghitung run terbaik tiap metrik utama untuk disorot.
 * Run demo (isDemo) tidak pernah disorot agar data contoh tidak tampak sebagai hasil evaluasi nyata.
 * Mengembalikan map key metrik ke set id run terbaik (seri jika seri).
 */
export function computeBestRuns(runs: BenchmarkRun[]): Record<ComparisonMetricKey, Set<string>> {
  const result = {} as Record<ComparisonMetricKey, Set<string>>;
  const realRuns = runs.filter((run) => !run.isDemo);
  for (const metric of comparisonMetrics) {
    const values = realRuns.map((run) => metricValue(run, metric.key));
    if (!values.length) { result[metric.key] = new Set(); continue; }
    const best = metric.higherIsBetter ? Math.max(...values) : Math.min(...values);
    result[metric.key] = new Set(realRuns.filter((run) => metricValue(run, metric.key) === best).map((run) => run.id));
  }
  return result;
}

/** Satu contoh run bertanda isDemo; selalu ditampilkan sebagai data contoh, bukan hasil evaluasi nyata. */
export const demoBenchmarkRun: BenchmarkRun = {
  id: "demo-run",
  importedAt: "2026-01-01T00:00:00.000Z",
  isDemo: true,
  generatedAt: "2026-01-01T00:00:00.000Z",
  model: "contoh-model (data contoh)",
  llmBaseUrl: "https://contoh.localhost/v1",
  datasetFile: "contoh_dataset.csv",
  referenceCount: 60,
  perLabel: {
    valid: { precision: 1, recall: 0.53, f1: 0.697, support: 15 },
    partial: { precision: 0.71, recall: 0.67, f1: 0.69, support: 15 },
    suspected: { precision: 0.68, recall: 1, f1: 0.81, support: 15 },
    unverified: { precision: 0.94, recall: 1, f1: 0.97, support: 15 },
  },
  macroF1: 0.793,
  confusionMatrix: {
    valid: { valid: 8, partial: 4, suspected: 2, unverified: 1 },
    partial: { valid: 0, partial: 10, suspected: 5, unverified: 0 },
    suspected: { valid: 0, partial: 0, suspected: 15, unverified: 0 },
    unverified: { valid: 0, partial: 0, suspected: 0, unverified: 15 },
  },
  falsePositiveRateRealNonDoi: { value: 0.54, falsePositives: 7, denominator: 13 },
  totalElapsedMs: 236733,
  totalTokens: 211064,
  averageTimeMsPerReference: 3945.55,
  averageTokensPerReference: 3517.73,
  labelCounts: { valid: 15, partial: 15, suspected: 15, unverified: 15 },
  comparatorUsedCount: 12,
  comparatorUsedPercentage: 20,
};

export function labelCount(run: BenchmarkRun, label: Label): number {
  return run.labelCounts?.[label] ?? 0;
}
