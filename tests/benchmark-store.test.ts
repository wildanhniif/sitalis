import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addBenchmarkRun, listBenchmarkRuns, rankBenchmarkRuns, removeBenchmarkRun } from "@/lib/benchmark-store";

const metrics = {
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
  model: "test-model",
  llmBaseUrl: "https://example.com/v1",
  datasetFile: "benchmark_60.csv",
  labelCounts: { valid: 15, partial: 15, suspected: 15, unverified: 15 },
  comparatorUsedCount: 12,
  comparatorUsedPercentage: 20,
  isDemo: false,
};

function storePath() {
  return path.join(mkdtempSync(path.join(tmpdir(), "bench-")), "runs.json");
}

describe("benchmark store", () => {
  it("menambah dan membaca run dari berkas", () => {
    const file = storePath();
    const run = addBenchmarkRun(metrics, file);
    expect(run.id).toBeTruthy();
    const runs = listBenchmarkRuns(file);
    expect(runs).toHaveLength(1);
    expect(runs[0].model).toBe("test-model");
    expect(runs[0].macroF1).toBe(0.79);
  });

  it("mengurutkan run macro-F1 tertinggi, seri dipecah token terkecil", () => {
    const file = storePath();
    addBenchmarkRun({ ...metrics, macroF1: 0.7, averageTokensPerReference: 100 }, file);
    addBenchmarkRun({ ...metrics, macroF1: 0.9, averageTokensPerReference: 500 }, file);
    addBenchmarkRun({ ...metrics, macroF1: 0.7, averageTokensPerReference: 50 }, file);
    const ranked = rankBenchmarkRuns(listBenchmarkRuns(file));
    expect(ranked.map((run) => run.macroF1)).toEqual([0.9, 0.7, 0.7]);
    expect(ranked[1].averageTokensPerReference).toBe(50);
  });

  it("menghapus run berdasarkan id dan tahan berkas hilang/rusak", () => {
    const file = storePath();
    const run = addBenchmarkRun(metrics, file);
    removeBenchmarkRun(run.id, file);
    expect(listBenchmarkRuns(file)).toHaveLength(0);
    expect(listBenchmarkRuns(path.join(tmpdir(), "tidak-ada-sekali-pun.json"))).toEqual([]);
  });
});
