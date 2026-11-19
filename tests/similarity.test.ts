import { describe, expect, it } from "vitest";
import { jaroWinklerSimilarity, levenshteinSimilarity, normalizeText, titleSimilarity } from "@/lib/matching/similarity";
import { matchCandidate } from "@/lib/matching/matcher";
import { parsedReferenceSchema } from "@/lib/types";

describe("metadata similarity", () => {
  it("normalizes case, accents, and punctuation", () => {
    expect(normalizeText("Analisis: Café!")).toBe("analisis cafe");
    expect(levenshteinSimilarity("Analisis Sistem", "analisis sistem")).toBe(1);
    expect(jaroWinklerSimilarity("Santoso", "Santosa")).toBeGreaterThan(0.9);
  });

  it("scores exact metadata above a different title", () => {
    const entry = parsedReferenceSchema.parse({ authors: ["Santoso, Andi"], year: 2023, title: "A valid title", container: "Journal of Testing", source_type: "journal" });
    const work = { DOI: "10.1/a", title: ["A valid title"], author: [{ family: "Santoso" }], issued: { "date-parts": [[2023]] }, "container-title": ["Journal of Testing"], type: "journal-article" };
    const different = { ...work, title: ["An unrelated work"] };
    expect(matchCandidate(entry, work).score).toBe(1);
    expect(matchCandidate(entry, work).differences).toHaveLength(0);
    expect(matchCandidate(entry, different).score).toBeLessThan(0.82);
    expect(matchCandidate(entry, different).score).toBeLessThan(matchCandidate(entry, work).score);
    expect(titleSimilarity(entry.title, work.title[0])).toBe(1);
  });
});
