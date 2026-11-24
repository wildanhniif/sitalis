import { describe, expect, it, vi } from "vitest";
import { checkReference } from "@/lib/pipeline/check";
import { notFoundLabel } from "@/lib/pipeline/label";
import { parsedReferenceSchema, type ParsedReference } from "@/lib/types";

const work = { DOI: "10.1234/example", title: ["A valid title"], author: [{ family: "Santoso" }], issued: { "date-parts": [[2023]] }, "container-title": ["Journal of Testing"], type: "journal-article" };
const entry: ParsedReference = { authors: ["Santoso, Andi"], year: 2023, title: "A valid title", container: "Journal of Testing", volume: null, issue: null, pages: null, doi: "10.1234/example", url: null, source_type: "journal" };

function llmMock(parsed: ParsedReference = entry, comparison: boolean | Record<string, unknown> = true) {
  const comparisonData = typeof comparison === "object" ? { same_work: false, differing_fields: [], reason: "Metadata cocok.", ...comparison } : { same_work: comparison, differing_fields: [], reason: "Metadata cocok." };
  return { chat: vi.fn(async (system: string) => ({ data: system.startsWith("Compare") ? comparisonData : parsed, tokens: 10 })) };
}
function crossrefMock(direct: unknown = work, search: unknown[] = []) {
  return { getByDoi: vi.fn(async () => direct), getAgency: vi.fn(async () => null), search: vi.fn(async () => search) };
}

describe("check pipeline decisions", () => {
  it("trusts a registered DOI with matching metadata", async () => {
    const crossref = crossrefMock();
    const result = await checkReference("Santoso. A valid title. 10.1234/example", { llm: llmMock() as never, crossref: crossref as never });
    expect(result.label).toBe("valid");
    expect(result.tokens).toBe(10);
    expect(crossref.search).not.toHaveBeenCalled();
  });

  it("rejects a DOI belonging to another work and searches text", async () => {
    const crossref = crossrefMock({ ...work, title: ["Completely unrelated"] }, [work]);
    const result = await checkReference("Santoso. A valid title. 10.1234/example", { llm: llmMock() as never, crossref: crossref as never });
    expect(crossref.search).toHaveBeenCalledOnce();
    expect(result.label).toBe("valid");
    expect(result.evidence).toContain("karya lain");
  });

  it("falls back to text search for contradictory DOI metadata without a title", async () => {
    const parsed = { ...entry, title: null, year: 2014 };
    const crossref = crossrefMock(work, [work]);
    const result = await checkReference("Santoso. (2014). 10.1234/example", { llm: llmMock(parsed) as never, crossref: crossref as never });
    expect(crossref.search).toHaveBeenCalledOnce();
    expect(result.evidence).toContain("karya lain");
  });

  it("uses the comparator for an ambiguous candidate", async () => {
    const parsed = { ...entry, doi: null, container: "Jurnal Testing" };
    const crossref = crossrefMock(null, [{ ...work, author: [], issued: { "date-parts": [[2020]] } }]);
    const result = await checkReference("Santoso. A valid title", { llm: llmMock(parsed) as never, crossref: crossref as never });
    expect(result.comparatorUsed).toBe(true);
    expect(result.label).toBe("partial");
  });

  it("marks parse failures unverified and applies source scope", () => {
    expect(notFoundLabel("book")).toBe("unverified");
    expect(notFoundLabel("journal")).toBe("suspected");
    expect(notFoundLabel("book", true)).toBe("suspected");
    expect(parsedReferenceSchema.safeParse({ source_type: "invalid" }).success).toBe(false);
  });

  it("accepts a 0.79-score candidate for preprint but not for journal", async () => {
    const parsedPreprint = { ...entry, doi: null, container: null, year: 2023, source_type: "preprint" as const };
    const candidate = { ...work, issued: { "date-parts": [[2019]] } };
    const preprint = await checkReference("Santoso. A valid title", { llm: llmMock(parsedPreprint) as never, crossref: crossrefMock(null, [candidate]) as never });
    expect(preprint.label).toBe("partial");
    expect(preprint.comparatorUsed).toBe(false);

    const parsedJournal = { ...parsedPreprint, source_type: "journal" as const };
    const journal = await checkReference("Santoso. A valid title", { llm: llmMock(parsedJournal, { same_work: false, plausibly_real: false }) as never, crossref: crossrefMock(null, [candidate]) as never });
    expect(journal.comparatorUsed).toBe(true);
    expect(journal.label).toBe("suspected");
  });

  it("merges OpenAlex candidates only when Crossref misses", async () => {
    const parsed = { ...entry, doi: null, container: null, year: 2023, source_type: "preprint" as const };
    const openalex = { search: vi.fn(async () => [{ ...work, DOI: "10.5678/openalex", issued: { "date-parts": [[2019]] } }]) };
    const result = await checkReference("Santoso. A valid title", { llm: llmMock(parsed) as never, crossref: crossrefMock(null, []) as never, openalex: openalex as never });
    expect(openalex.search).toHaveBeenCalledOnce();
    expect(result.label).toBe("partial");
    expect(result.bestCandidate?.work.DOI).toBe("10.5678/openalex");

    const hit = await checkReference("Santoso. A valid title", { llm: llmMock(parsed) as never, crossref: crossrefMock(null, [work]) as never, openalex: openalex as never });
    expect(hit.label).toBe("valid");
    expect(openalex.search).toHaveBeenCalledOnce();
  });

  it("labels a plausible real work unverified instead of suspected", async () => {
    const parsed = { ...entry, doi: null, container: null, year: 2023 };
    const candidate = { ...work, issued: { "date-parts": [[2019]] } };
    const result = await checkReference("Santoso. A valid title", { llm: llmMock(parsed, { same_work: false, plausibly_real: true }) as never, crossref: crossrefMock(null, [candidate]) as never });
    expect(result.label).toBe("unverified");
    expect(result.reason).toContain("karya nyata");
  });

  it("treats container-only differences as valid", async () => {
    const parsed = { ...entry, doi: null, container: "J. Test.", source_type: "preprint" as const };
    const result = await checkReference("Santoso. A valid title", { llm: llmMock(parsed) as never, crossref: crossrefMock(null, [work]) as never });
    expect(result.label).toBe("valid");
  });
});
