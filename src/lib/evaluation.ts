import { labels, type CheckResult, type Label } from "./types";

export type EvaluationInput = { id: string; reference_text: string; true_label: Label; source_type: string };
const divide = (a: number, b: number) => b ? a / b : 0;
const effectiveLabel = (result: CheckResult) => result.manualLabel ?? result.label;

export function calculateMetrics(inputs: EvaluationInput[], results: CheckResult[]) {
  if (inputs.length !== results.length) throw new Error("Jumlah ground truth dan prediksi tidak sama.");
  const resultById = new Map(results.map((result) => [result.id, result]));
  if (resultById.size !== results.length || inputs.some((input) => !resultById.has(input.id))) throw new Error("ID ground truth dan prediksi harus unik serta berpasangan.");
  const matrix = Object.fromEntries(labels.map((actual) => [actual, Object.fromEntries(labels.map((predicted) => [predicted, 0]))])) as Record<Label, Record<Label, number>>;
  const perLabel: Record<string, { precision: number; recall: number; f1: number; support: number }> = {};
  for (const input of inputs) matrix[input.true_label][effectiveLabel(resultById.get(input.id)!)]++;
  for (const label of labels) {
    const tp = matrix[label][label];
    const predictedCount = labels.reduce((sum, actual) => sum + matrix[actual][label], 0);
    const actualCount = labels.reduce((sum, predicted) => sum + matrix[label][predicted], 0);
    const precision = divide(tp, predictedCount);
    const recall = divide(tp, actualCount);
    perLabel[label] = { precision, recall, f1: divide(2 * precision * recall, precision + recall), support: actualCount };
  }
  const realNonDoi = inputs.filter((input) => ["valid", "partial"].includes(input.true_label) && !/10\.\d{4,9}\//i.test(resultById.get(input.id)!.referenceText || input.reference_text));
  const falsePositives = realNonDoi.filter((input) => effectiveLabel(resultById.get(input.id)!) === "suspected").length;
  const elapsedMs = results.reduce((sum, result) => sum + result.elapsedMs, 0);
  const tokens = results.reduce((sum, result) => sum + result.tokens, 0);
  return {
    referenceCount: results.length,
    perLabel,
    macroF1: labels.reduce((sum, label) => sum + perLabel[label].f1, 0) / labels.length,
    confusionMatrix: matrix,
    falsePositiveRateRealNonDoi: { value: divide(falsePositives, realNonDoi.length), falsePositives, denominator: realNonDoi.length },
    totalElapsedMs: elapsedMs,
    totalTokens: tokens,
    averageTimeMsPerReference: divide(elapsedMs, results.length),
    averageTokensPerReference: divide(tokens, results.length),
  };
}
