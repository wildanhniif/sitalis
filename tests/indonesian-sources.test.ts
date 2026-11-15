import { describe, expect, it } from "vitest";
import { detectIndonesianSource } from "@/lib/pipeline/indonesian-sources";

describe("detectIndonesianSource", () => {
  it("detects Indonesian regulations", () => {
    const res = detectIndonesianSource({
      referenceText: "Republik Indonesia. (2003). Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.",
      sourceType: "regulation",
    });
    expect(res.isIndonesian).toBe(true);
    expect(res.platform).toBe("peraturan");
  });

  it("detects university thesis / skripsi repository", () => {
    const res = detectIndonesianSource({
      referenceText: "Santoso, A. (2021). Analisis sistem. Skripsi sarjana, repository.ugm.ac.id.",
      title: "Analisis sistem",
      sourceType: "thesis",
    });
    expect(res.isIndonesian).toBe(true);
    expect(res.platform).toBe("repository");
    expect(res.searchUrl).toBeDefined();
  });

  it("detects Indonesian journal containers or GARUDA / SINTA mentions", () => {
    const res = detectIndonesianSource({
      referenceText: "Pratama, B. (2022). Klasifikasi teks berita. Jurnal Rekayasa Sistem dan Teknologi Informasi, 6(1), 12-19.",
      container: "Jurnal Rekayasa Sistem dan Teknologi Informasi",
      sourceType: "journal",
    });
    expect(res.isIndonesian).toBe(true);
    expect(res.platform).toBe("garuda");
    expect(res.searchUrl).toContain("garuda.kemdiktisaintek.go.id");
  });

  it("returns isIndonesian=false for standard international references", () => {
    const res = detectIndonesianSource({
      referenceText: "Vaswani, A., et al. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30.",
      container: "Advances in Neural Information Processing Systems",
      sourceType: "conference",
    });
    expect(res.isIndonesian).toBe(false);
  });
});
