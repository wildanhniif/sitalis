import { describe, expect, it, vi } from "vitest";
import { checkReference } from "@/lib/pipeline/check";
import { notFoundLabel } from "@/lib/pipeline/label";
import { parsedReferenceSchema, type ParsedReference } from "@/lib/types";

const work = { DOI: "10.1234/example", title: ["A valid title"], author: [{ family: "Santoso" }], issued: { "date-parts": [[2023]] }, "container-title": ["Journal of Testing"], type: "journal-article" };
const entry: ParsedReference = { authors: ["Santoso, Andi"], year: 2023, title: "A valid title", container: "Journal of Testing", volume: null, issue: null, pages: null, doi: "10.1234/example", url: null, source_type: "journal" };

function llmMock(parsed: ParsedReference = entry, comparison = true) {
  return { chat: vi.fn(async (system: string) => ({ data: system.startsWith("Compare") ? { same_work: comparison, differing_fields: [], reason: "Metadata cocok." } : parsed, tokens: 10 })) };
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
});
