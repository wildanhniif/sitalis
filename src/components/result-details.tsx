"use client";
import { Check, ExternalLink, Pencil, Search } from "lucide-react";
import { useState } from "react";
import { labels, type CheckResult, type Difference, type Label } from "@/lib/types";
import { labelText } from "@/lib/pipeline/label";
import { Button } from "./ui/button";
import { LabelBadge } from "./label-badge";

const sourceNames = { journal: "Jurnal", conference: "Konferensi", book: "Buku", thesis: "Tesis", report: "Laporan", regulation: "Regulasi", web: "Web", other: "Lainnya" };

function EntryMetadata({ result }: { result: CheckResult }) {
  const parsed = result.parsed;
  if (!parsed) return <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">Metadata tidak tersedia. {result.parseError}</div>;
  const rows = [["Penulis", parsed.authors.join("; ") || "—"], ["Tahun", parsed.year ?? "—"], ["Judul", parsed.title ?? "—"], ["Wadah", parsed.container ?? "—"], ["Volume / nomor", `${parsed.volume ?? "—"} / ${parsed.issue ?? "—"}`], ["Halaman", parsed.pages ?? "—"], ["Jenis sumber", sourceNames[parsed.source_type]], ["DOI", parsed.doi ?? "—"]];
  return <dl className="space-y-3">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[100px_1fr] gap-3 text-xs leading-5"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-medium">{value}</dd></div>)}</dl>;
}

export function ResultDetails({ result, onUpdate }: { result: CheckResult; onUpdate: (result: CheckResult) => void }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const candidate = result.candidates[candidateIndex] ?? null;
  const work = candidate?.work;
  const differences = new Map<Difference["field"], Difference>(candidate?.differences.map((difference) => [difference.field, difference]) ?? []);
  const query = result.parsed?.title || result.referenceText;
  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
  const garudaUrl = `https://garuda.kemdiktisaintek.go.id/documents?search=${encodeURIComponent(query)}`;
  const changeLabel = (label: Label) => { onUpdate({ ...result, manualLabel: label, confirmed: true }); setEditing(false); };
  const workRows = [
    { key: "title", label: "Judul", value: work?.title[0] },
    { key: "first_author", label: "Penulis", value: work?.author.map((author) => [author.given, author.family].filter(Boolean).join(" ")).join("; ") },
    { key: "year", label: "Tahun", value: work?.issued?.["date-parts"]?.[0]?.[0] },
    { key: "container", label: "Wadah", value: work?.["container-title"]?.[0] },
    { key: "doi", label: "DOI", value: work?.DOI },
  ] as const;
  return <div className="border-t bg-muted/30 p-4 sm:p-6">
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border bg-background p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referensi dari naskah</p><blockquote className="mt-3 border-l-2 pl-3 text-sm leading-6">{result.referenceText}</blockquote><div className="my-5 border-t" /><h4 className="mb-4 text-sm font-semibold">Hasil parsing LLM</h4><EntryMetadata result={result} /></section>
      <section className="rounded-xl border bg-background p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bukti Crossref</p>{result.candidates.length > 1 && <select aria-label="Pilih kandidat Crossref" className="h-9 max-w-[170px] rounded-lg border bg-background px-2 text-xs" value={candidateIndex} onChange={(event) => setCandidateIndex(Number(event.target.value))}>{result.candidates.map((item, index) => <option key={item.work.DOI} value={index}>Kandidat {index + 1} · {(item.score * 100).toFixed(0)}%</option>)}</select>}</div>
        {candidate && work ? <><div className="mt-3 flex items-center gap-2"><span className="text-sm font-semibold">Skor kemiripan</span><span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold tabular-nums">{candidate.score.toFixed(2)} / 1,00</span></div><dl className="mt-4 space-y-3">{workRows.map((row) => { const difference = differences.get(row.key); return <div key={row.key} className={`grid grid-cols-[82px_1fr] gap-3 rounded-md p-1.5 text-xs leading-5 ${difference ? "bg-amber-50 dark:bg-amber-950/50" : ""}`}><dt className="text-muted-foreground">{row.label}</dt><dd className="min-w-0 break-words font-medium">{row.key === "doi" && work.DOI ? <a href={`https://doi.org/${work.DOI}`} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-indigo-700 underline decoration-indigo-300 underline-offset-2 dark:text-indigo-300">{row.value}<ExternalLink className="mt-0.5 size-3 shrink-0" /></a> : row.value || "—"}{difference && <span className="mt-1 block text-[11px] font-normal text-amber-800 dark:text-amber-300">Berbeda dari entri: {difference.entry ?? "tidak tercantum"}</span>}</dd></div>; })}</dl><div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center text-[11px] text-muted-foreground"><span>Judul<br /><strong className="text-foreground">{candidate.titleScore.toFixed(2)}</strong></span><span>Penulis<br /><strong className="text-foreground">{candidate.authorScore.toFixed(2)}</strong></span><span>Tahun<br /><strong className="text-foreground">{candidate.yearScore.toFixed(2)}</strong></span></div></> : <div className="mt-4 rounded-lg border border-dashed p-6 text-center"><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Tidak ada kandidat yang cocok</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Crossref tidak memberikan bukti yang cukup. Periksa manual sebelum mengambil kesimpulan.</p></div>}
      </section>
    </div>
    <div className="mt-4 rounded-xl border bg-background p-4"><p className="text-sm font-medium">{result.reason}</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{result.evidence}</p>{result.bestCandidate?.differences.length ? <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">Saran koreksi: samakan kolom yang disorot dengan metadata Crossref setelah memeriksa sumber asli.</p> : null}</div>
    <div className="no-print mt-4 flex flex-wrap items-center gap-2"><Button variant="secondary" size="sm" asChild><a href={scholarUrl} target="_blank" rel="noreferrer">Google Scholar<ExternalLink /></a></Button><Button variant="secondary" size="sm" asChild><a href={garudaUrl} target="_blank" rel="noreferrer">GARUDA<ExternalLink /></a></Button><span className="mx-1 hidden h-5 w-px bg-border sm:block" /><Button variant="ghost" size="sm" onClick={() => onUpdate({ ...result, confirmed: true })}><Check />{result.confirmed ? "Sudah dikonfirmasi" : "Konfirmasi label"}</Button><Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}><Pencil />Ubah label</Button>{editing && <select autoFocus aria-label="Label pengganti" className="h-9 rounded-lg border bg-background px-2 text-xs" value={result.manualLabel ?? result.label} onChange={(event) => changeLabel(event.target.value as Label)}>{labels.map((label) => <option key={label} value={label}>{labelText[label]}</option>)}</select>}<LabelBadge label={result.manualLabel ?? result.label} className="ml-auto" /></div>
  </div>;
}
