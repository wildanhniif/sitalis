import type { CheckResult, Report } from "./types";

const work = {
  DOI: "10.1038/nature14236",
  title: ["Human-level control through deep reinforcement learning"],
  author: [{ given: "Volodymyr", family: "Mnih" }, { given: "Koray", family: "Kavukcuoglu" }],
  issued: { "date-parts": [[2015]] },
  "container-title": ["Nature"],
  type: "journal-article",
  volume: "518",
  issue: "7540",
  page: "529-533",
};

export const demoReferenceTexts = [
  "Mnih, V., Kavukcuoglu, K., Silver, D., et al. (2015). Human-level control through deep reinforcement learning. Nature, 518(7540), 529–533. https://doi.org/10.1038/nature14236",
  "Mnih, V., et al. (2014). Human-level control through deep reinforcement learning. Nature, 518(7540), 529–533. https://doi.org/10.1038/nature14236",
  "Ramadhan, F. (2023). Self-healing neural networks for autonomous citation repair. International Journal of Synthetic Intelligence, 9(2), 41–59.",
  "Kementerian Pendidikan dan Kebudayaan. (2020). Panduan penyusunan kurikulum pendidikan tinggi. Jakarta: Ditjen Dikti.",
];

function baseResult(index: number): Omit<CheckResult, "label" | "reason" | "evidence" | "parsed" | "bestCandidate"> {
  return { id: `demo-${index + 1}`, referenceText: demoReferenceTexts[index], candidates: [], comparatorUsed: false, elapsedMs: 820 + index * 170, tokens: 0 };
}

export function createDemoReport(): Report {
  const candidate = { work, score: 1, titleScore: 1, authorScore: 1, yearScore: 1, containerScore: 1, differences: [] };
  const partialCandidate = { ...candidate, score: 0.97, yearScore: 1, differences: [{ field: "year" as const, entry: "2014", crossref: "2015" }] };
  const results: CheckResult[] = [
    { ...baseResult(0), parsed: { authors: ["Volodymyr Mnih", "Koray Kavukcuoglu"], year: 2015, title: work.title[0], container: "Nature", volume: "518", issue: "7540", pages: "529-533", doi: work.DOI, url: null, source_type: "journal" }, label: "valid", reason: "DOI terdaftar dan metadata yang tersedia cocok.", evidence: "Data demo: DOI ditemukan di Crossref. Skor 1,00.", candidates: [candidate], bestCandidate: candidate },
    { ...baseResult(1), parsed: { authors: ["Volodymyr Mnih"], year: 2014, title: work.title[0], container: "Nature", volume: "518", issue: "7540", pages: "529-533", doi: work.DOI, url: null, source_type: "journal" }, label: "partial", reason: "Karya ditemukan, tetapi tahun publikasi berbeda.", evidence: "Data demo: DOI ditemukan; tahun perlu dikoreksi.", candidates: [partialCandidate], bestCandidate: partialCandidate },
    { ...baseResult(2), parsed: { authors: ["Fajar Ramadhan"], year: 2023, title: "Self-healing neural networks for autonomous citation repair", container: "International Journal of Synthetic Intelligence", volume: "9", issue: "2", pages: "41-59", doi: null, url: null, source_type: "journal" }, label: "suspected", reason: "Tidak ditemukan karya yang cukup cocok di Crossref. Ini dugaan, bukan bukti halusinasi.", evidence: "Data demo: tidak ada kandidat dengan skor yang memadai.", bestCandidate: null },
    { ...baseResult(3), parsed: { authors: ["Kementerian Pendidikan dan Kebudayaan"], year: 2020, title: "Panduan penyusunan kurikulum pendidikan tinggi", container: "Ditjen Dikti", volume: null, issue: null, pages: null, doi: null, url: null, source_type: "report" }, label: "unverified", reason: "Laporan tidak selalu terindeks di Crossref; periksa sumber resmi.", evidence: "Data demo: sumber berada di luar cakupan utama Crossref.", bestCandidate: null },
  ];
  return { id: "demo", title: "Contoh pemeriksaan referensi", createdAt: new Date().toISOString(), source: "demo", results, demo: true };
}
