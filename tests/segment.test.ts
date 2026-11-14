import { describe, expect, it } from "vitest";
import { extractBibliography, splitReferences } from "@/lib/extraction/segment";

describe("bibliography segmentation", () => {
  it("uses the last bibliography heading and stops at appendix", () => {
    const text = "DAFTAR PUSTAKA\nold entry\nBAB IX\nDaftar Pustaka\nSantoso, A. (2022). Judul penelitian. Jurnal.\nLampiran\nSantoso, A. (2022). Appendix.";
    expect(extractBibliography(text, true)).toContain("Judul penelitian");
    expect(extractBibliography(text, true)).not.toContain("old entry");
    expect(extractBibliography(text, true)).not.toContain("Appendix");
  });

  it("splits numbered references and joins wrapped lines", () => {
    const section = "[1] Santoso, A. (2022). First title. Journal A, 2(1), 1-9.\ncontinued here\n[2] Wijaya, B. (2023). Second title. Journal B.";
    const result = splitReferences(section);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain("continued here");
    expect(result[1]).not.toMatch(/^\[2\]/);
  });

  it("splits blank-line and author-year entries", () => {
    const section = "Santoso, A. (2022). First title. Journal A.\n\nWijaya, B. (2023). Second title. Journal B.";
    expect(splitReferences(section)).toHaveLength(2);
  });

  it("allows pasted references without a heading", () => {
    expect(extractBibliography("Santoso, A. (2022). A reference title.")).toContain("A reference");
  });
});
