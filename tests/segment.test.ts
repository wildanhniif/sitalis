import { describe, expect, it } from "vitest";
import { extractBibliography, needsAiSegmentation, splitReferences } from "@/lib/extraction/segment";

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

  it("splits a pasted table, drops its header, and keeps DOIs from the status column", () => {
    const section = [
      "No Format Sitasi (APA 7th) Status DOI / Catatan",
      "1 Hochreiter, S., & Schmidhuber, J. (1997). Long short-term memory. Neural Computation, 9(8), 1735-1780. Aktif (10.1162/neco.1997.9.8.1735)",
      "2 Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012). ImageNet classification with deep convolutional neural networks. Advances in Neural Information Processing Systems, 25, 1097-1105. Aktif (Paper fundamental AlexNet)",
      "3 Breiman, L. (2001). Random forests. Machine Learning, 45(1), 5-32. Aktif (10.1023/A:1010933404324)",
    ].join("\n");
    const result = splitReferences(section);
    expect(result).toHaveLength(3);
    expect(result[0]).not.toContain("Format Sitasi");
    expect(result[0]).not.toMatch(/^1\s/);
    expect(result[0]).toContain("10.1162/neco.1997.9.8.1735");
    expect(result[1]).not.toContain("Paper fundamental AlexNet");
    expect(result[2]).toContain("10.1023/A:1010933404324");
  });

  it("keeps a real trailing word 'aktif' when the text is not a table", () => {
    const section = "Santoso, A. (2022). Penggunaan karbon aktif untuk penjernihan air. Jurnal Kimia, 3(1), 1-9.";
    expect(splitReferences(section)[0]).toContain("karbon aktif");
  });

  it("flags suspicious segmentation when entries stay merged", () => {
    const merged = "1 Hochreiter, S., & Schmidhuber, J. (1997). Long short-term memory. Neural Computation, 9(8), 1735-1780. 2 Krizhevsky, A. (2012). ImageNet classification. Advances in Neural Information Processing Systems, 25, 1097-1105. 3 Breiman, L. (2001). Random forests. Machine Learning, 45(1), 5-32.";
    expect(needsAiSegmentation(merged, splitReferences(merged))).toBe(true);
    const clean = "1. Santoso, A. (2022). Judul pertama. Jurnal A, 2(1), 1-9.\n2. Wijaya, B. (2023). Judul kedua. Jurnal B, 3(2), 10-19.";
    expect(needsAiSegmentation(clean, splitReferences(clean))).toBe(false);
  });
});
