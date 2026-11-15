export type IndonesianSourceMatch = {
  isIndonesian: boolean;
  platform?: "garuda" | "sinta" | "neliti" | "repository" | "peraturan" | "other";
  platformName?: string;
  searchUrl?: string;
  notes?: string;
};

const INDONESIAN_REGULATION_KEYWORDS = [
  "undang-undang",
  "peraturan pemerintah",
  "peraturan menteri",
  "peraturan presiden",
  "keputusan presiden",
  "lembaran negara",
  "uu no",
  "permen",
  "kemendikbud",
  "kemendiktisaintek",
  "kemenkes",
  "kemenkeu",
];

const INDONESIAN_THESIS_KEYWORDS = [
  "skripsi",
  "tesis",
  "disertasi",
  "tugas akhir",
  "laporan penelitian",
  "repository.",
  "eprints.",
  "digilib.",
  "etd.",
  "uin-",
  "ugm.ac.id",
  "ui.ac.id",
  "itb.ac.id",
  "undip.ac.id",
  "unair.ac.id",
  "its.ac.id",
  "ipb.ac.id",
  "unhas.ac.id",
  "unpad.ac.id",
  "upi.edu",
  "uny.ac.id",
];

const INDONESIAN_JOURNAL_CONTAINER_KEYWORDS = [
  "jurnal",
  "prosiding",
  "berkala",
  "wacana",
  "bina darma",
  "informatika",
  "sains dan teknologi",
  "sistem informasi",
  "ilmu komputer",
  "rekayasa",
];

export function detectIndonesianSource(params: {
  referenceText: string;
  title?: string | null;
  container?: string | null;
  url?: string | null;
  sourceType?: string | null;
}): IndonesianSourceMatch {
  const fullText = [params.referenceText, params.title, params.container, params.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const rawTitle = params.title?.trim() || params.referenceText;
  const garudaSearchUrl = `https://garuda.kemdiktisaintek.go.id/documents?search=${encodeURIComponent(rawTitle)}`;

  // 1. Regulasi / Dokumen Hukum Indonesia
  if (INDONESIAN_REGULATION_KEYWORDS.some((kw) => fullText.includes(kw))) {
    return {
      isIndonesian: true,
      platform: "peraturan",
      platformName: "Regulasi / Dokumen Pemerintah RI",
      notes: "Dokumen hukum/regulasi Indonesia umumnya tidak memiliki DOI internasional di Crossref.",
    };
  }

  // 2. Repositori Tugas Akhir / Skripsi / Tesis Kampus Indonesia
  if (
    params.sourceType === "thesis" ||
    INDONESIAN_THESIS_KEYWORDS.some((kw) => fullText.includes(kw))
  ) {
    return {
      isIndonesian: true,
      platform: "repository",
      platformName: "Repositori Perguruan Tinggi Indonesia",
      searchUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(rawTitle)}`,
      notes: "Tugas akhir/skripsi pada repositori kampus seringkali hanya terindeks secara institusional atau Google Scholar.",
    };
  }

  // 3. Platform Neliti
  if (fullText.includes("neliti.com") || fullText.includes("neliti")) {
    return {
      isIndonesian: true,
      platform: "neliti",
      platformName: "Neliti Indonesia",
      searchUrl: `https://www.neliti.com/id/search?q=${encodeURIComponent(rawTitle)}`,
      notes: "Karya terindikasi berada di repositori Neliti Indonesia.",
    };
  }

  // 4. Jurnal / Prosiding Nasional Indonesia (GARUDA / SINTA)
  const hasIndoContainer = INDONESIAN_JOURNAL_CONTAINER_KEYWORDS.some((kw) =>
    (params.container?.toLowerCase() ?? "").includes(kw),
  );
  const mentionsGarudaOrSinta = fullText.includes("garuda") || fullText.includes("sinta");

  if (mentionsGarudaOrSinta || hasIndoContainer || fullText.includes(".ac.id")) {
    return {
      isIndonesian: true,
      platform: "garuda",
      platformName: "Portal GARUDA / SINTA",
      searchUrl: garudaSearchUrl,
      notes: "Terdeteksi karakteristik publikasi nasional Indonesia. Sebagian jurnal nasional belum mendaftarkan DOI Crossref berbayar; disarankan verifikasi via Portal GARUDA / SINTA.",
    };
  }

  return { isIndonesian: false };
}
