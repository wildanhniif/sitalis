import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseCsv } from "@/lib/csv";
import { labels, type Label } from "@/lib/types";

describe("benchmark_60 dataset integrity", () => {
  it("has valid structure and balanced distribution", () => {
    const content = readFileSync("data/benchmark_60.csv", "utf8");
    const rows = parseCsv(content);
    const headers = rows[0];
    expect(headers).toEqual(["id", "reference_text", "true_label", "source_type"]);

    const data = rows.slice(1).filter((r) => r.some(Boolean));
    expect(data.length).toBe(60);

    const counts: Record<string, number> = {};
    const ids = new Set<string>();

    for (const r of data) {
      const id = r[0];
      const text = r[1];
      const label = r[2] as Label;
      const sourceType = r[3];

      expect(ids.has(id)).toBe(false);
      ids.add(id);
      expect(text.length).toBeGreaterThan(15);
      expect(labels).toContain(label);
      expect(sourceType).toBeTruthy();

      counts[label] = (counts[label] || 0) + 1;
    }

    // Perfectly balanced 15 entries per class for rigorous multi-class F1 evaluation
    expect(counts.valid).toBe(15);
    expect(counts.partial).toBe(15);
    expect(counts.suspected).toBe(15);
    expect(counts.unverified).toBe(15);
  });
});
