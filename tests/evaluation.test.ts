import { describe, expect, it } from "vitest";
import { calculateMetrics, type EvaluationInput } from "@/lib/evaluation";
import { escapeCsv, parseCsv, reportToCsv } from "@/lib/csv";
import { createDemoReport } from "@/lib/demo";
import type { CheckResult } from "@/lib/types";

function result(id: string, label: CheckResult["label"], referenceText = "A sufficiently long reference"): CheckResult {
  return { id, referenceText, parsed: null, label, reason: "", evidence: "", candidates: [], bestCandidate: null, comparatorUsed: false, elapsedMs: 100, tokens: 5 };
}

describe("research evaluation and CSV", () => {
  it("calculates confusion matrix, macro F1, and real non-DOI FPR", () => {
    const inputs: EvaluationInput[] = [
      { id: "1", reference_text: "real one", true_label: "valid", source_type: "journal" },
      { id: "2", reference_text: "real two", true_label: "valid", source_type: "journal" },
      { id: "3", reference_text: "fake", true_label: "suspected", source_type: "journal" },
    ];
    const metrics = calculateMetrics(inputs, [result("1", "valid"), result("2", "suspected"), result("3", "suspected")]);
    expect(metrics.confusionMatrix.valid.suspected).toBe(1);
    expect(metrics.perLabel.valid.recall).toBe(0.5);
    expect(metrics.falsePositiveRateRealNonDoi.value).toBe(0.5);
    expect(metrics.macroF1).toBeGreaterThan(0);
  });

  it("matches predictions by ID and honors manual labels consistently", () => {
    const inputs: EvaluationInput[] = [
      { id: "1", reference_text: "real one", true_label: "valid", source_type: "journal" },
      { id: "2", reference_text: "fake", true_label: "suspected", source_type: "journal" },
    ];
    const reordered = [result("2", "suspected"), { ...result("1", "suspected"), manualLabel: "valid" as const }];
    const metrics = calculateMetrics(inputs, reordered);
    expect(metrics.macroF1).toBe(0.5);
    expect(metrics.perLabel.valid.recall).toBe(1);
    expect(metrics.perLabel.suspected.recall).toBe(1);
    expect(metrics.falsePositiveRateRealNonDoi.value).toBe(0);
    expect(() => calculateMetrics(inputs, [result("1", "valid")])).toThrow("Jumlah");
  });

  it("round-trips commas, quotes, and newlines in CSV", () => {
    const csv = 'id,reference_text\r\n1,"Santoso, A. ""Title""\nNext line"';
    expect(parseCsv(csv)[1][1]).toContain('"Title"\nNext line');
    expect(escapeCsv('a,"b"')).toBe('"a,""b"""');
  });

  it("exports Indonesian labels and evidence", () => {
    const csv = reportToCsv(createDemoReport());
    expect(csv).toContain("Sebagian valid");
    expect(csv).toContain("10.1038/nature14236");
    expect(csv).toContain("reference_text");
  });
});
