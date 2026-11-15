import { describe, expect, it } from "vitest";
import { computeBestRuns, parseMetricsJson, type BenchmarkRun } from "@/lib/benchmark";

const baseMetrics = {
  generatedAt: "2026-11-15T00:00:00.000Z",
  referenceCount: 60,
  perLabel: {
    valid: { precision: 1, recall: 0.53, f1: 0.7, support: 15 },
    partial: { precision: 0.71, recall: 0.67, f1: 0.69, support: 15 },
    suspected: { precision: 0.68, recall: 1, f1: 0.81, support: 15 },
    unverified: { precision: 0.94, recall: 1, f1: 0.97, support: 15 },
  },
  macroF1: 0.79,
  confusionMatrix: {
    valid: { valid: 8, partial: 4, suspected: 2, unverified: 1 },
    partial: { valid: 0, partial: 10, suspected: 5, unverified: 0 },
    suspected: { valid: 0, partial: 0, suspected: 15, unverified: 0 },
    unverified: { valid: 0, partial: 0, suspected: 0, unverified: 15 },
  },
  falsePositiveRateRealNonDoi: { value: 0.5, falsePositives: 7, denominator: 14 },
  totalElapsedMs: 1000,
  totalTokens: 500,
  averageTimeMsPerReference: 100,
  averageTokensPerReference: 50,
};

function run(overrides: Partial<BenchmarkRun> = {}): BenchmarkRun {
  return { ...parseMetricsJson(JSON.stringify(baseMetrics)), id: Math.random().toString(), importedAt: "2026-11-15T00:00:00.000Z", isDemo: false, ...overrides };
}

describe("benchmark metrics parsing", () => {
  it("parses metrics.json lengkap dengan metadata run", () => {
    const metrics = parseMetricsJson(JSON.stringify({ ...baseMetrics, model: "llama-3.3-70b-versatile", llmBaseUrl: "https://api.example.com/v1", datasetFile: "benchmark_60.csv", labelCounts: { valid: 15, partial: 15, suspected: 15, unverified: 15 }, comparatorUsedCount: 12, comparatorUsedPercentage: 20 }));
    expect(metrics.model).toBe("llama-3.3-70b-versatile");
    expect(metrics.datasetFile).toBe("benchmark_60.csv");
    expect(metrics.comparatorUsedPercentage).toBe(20);
    expect(metrics.macroF1).toBe(0.79);
    expect(metrics.confusionMatrix.valid.suspected).toBe(2);
  });

  it("menerima metrics.json format lama (backward compatible) dengan default metadata", () => {
    const metrics = parseMetricsJson(JSON.stringify(baseMetrics));
    expect(metrics.model).toBe("Tidak diketahui");
    expect(metrics.comparatorUsedCount).toBe(0);
    expect(metrics.comparatorUsedPercentage).toBe(0);
    expect(metrics.labelCounts).toEqual({});
  });

  it("menolak JSON yang tidak valid atau field wajib hilang", () => {
    expect(() => parseMetricsJson("bukan json")).toThrow();
    expect(() => parseMetricsJson(JSON.stringify({ ...baseMetrics, macroF1: "tinggi" }))).toThrow();
    expect(() => parseMetricsJson(JSON.stringify({ ...baseMetrics, referenceCount: undefined }))).toThrow();
  });
});

describe("agregasi tabel perbandingan", () => {
  const a = run({ id: "a", model: "A", macroF1: 0.8, averageTimeMsPerReference: 5000, averageTokensPerReference: 3000, comparatorUsedPercentage: 10, perLabel: { ...baseMetrics.perLabel, valid: { precision: 1, recall: 0.6, f1: 0.75, support: 15 } } });
  const b = run({ id: "b", model: "B", macroF1: 0.85, averageTimeMsPerReference: 3000, averageTokensPerReference: 4000, comparatorUsedPercentage: 25, perLabel: { ...baseMetrics.perLabel, valid: { precision: 1, recall: 0.5, f1: 0.66, support: 15 } } });

  it("menorotkan run terbaik per metrik (max F1, min waktu/token/pembanding)", () => {
    const best = computeBestRuns([a, b]);
    expect(best.macroF1.has("b")).toBe(true);
    expect(best.f1Valid.has("a")).toBe(true);
    expect(best.averageTimeMsPerReference.has("b")).toBe(true);
    expect(best.averageTokensPerReference.has("a")).toBe(true);
    expect(best.comparatorUsedPercentage.has("a")).toBe(true);
  });

  it("run demo tidak pernah disorot sebagai terbaik", () => {
    const demo = run({ id: "demo", isDemo: true, macroF1: 0.99 });
    const best = computeBestRuns([a, demo]);
    expect(best.macroF1.has("demo")).toBe(false);
    expect(best.macroF1.has("a")).toBe(true);
  });

  it("mengembalikan set kosong ketika hanya ada run demo", () => {
    const demo = run({ id: "demo", isDemo: true });
    const best = computeBestRuns([demo]);
    expect(best.macroF1.size).toBe(0);
  });
});
