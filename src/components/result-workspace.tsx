"use client";
import { BadgeCheck, ChevronDown, ChevronRight, CircleAlert, CircleHelp, Download, FileSearch, Filter, FlaskConical, Printer, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrowserReport, saveBrowserReport } from "@/lib/browser-reports";
import { reportToCsv } from "@/lib/csv";
import { createDemoReport } from "@/lib/demo";
import { labelText } from "@/lib/pipeline/label";
import { labels, type CheckResult, type Label, type Report } from "@/lib/types";
import { cn, downloadText } from "@/lib/utils";
import { LabelBadge } from "./label-badge";
import { ResultDetails } from "./result-details";
import { useToast } from "./toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const summary = [
  { label: "valid" as const, icon: BadgeCheck, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
  { label: "partial" as const, icon: TriangleAlert, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
  { label: "suspected" as const, icon: CircleAlert, color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950" },
  { label: "unverified" as const, icon: CircleHelp, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-900" },
];

export function ResultWorkspace({ id }: { id: string }) {
  const toast = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Label | "all">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const local = getBrowserReport(id) ?? (id === "demo" ? createDemoReport() : null);
      if (local) { if (active) { setReport(local); setLoading(false); } return; }
      fetch(`/api/results/${id}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); if (active) setReport(data); saveBrowserReport(data); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Laporan tidak dapat dimuat."); }).finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [id]);
  const counts = useMemo(() => Object.fromEntries(labels.map((label) => [label, report?.results.filter((result) => (result.manualLabel ?? result.label) === label).length ?? 0])), [report]);
  const filtered = useMemo(() => report?.results.filter((result) => (filter === "all" || (result.manualLabel ?? result.label) === filter) && `${result.referenceText} ${result.parsed?.title ?? ""}`.toLowerCase().includes(query.toLowerCase())) ?? [], [report, filter, query]);
  const updateResult = (updated: CheckResult) => {
    setReport((current) => {
      if (!current) return current;
      const next = { ...current, results: current.results.map((result) => result.id === updated.id ? updated : result) };
      saveBrowserReport(next); return next;
    });
    toast({ title: "Peninjauan disimpan di browser" });
  };
  const toggle = (resultId: string) => setExpanded((current) => { const next = new Set(current); if (next.has(resultId)) next.delete(resultId); else next.add(resultId); return next; });
  if (loading) return <main className="page-container py-10"><Skeleton className="h-8 w-64" /><Skeleton className="mt-3 h-4 w-96 max-w-full" /><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{summary.map((item) => <Skeleton key={item.label} className="h-28" />)}</div><Skeleton className="mt-6 h-12" /><Skeleton className="mt-4 h-80" /><span className="sr-only" aria-live="polite">Memuat laporan</span></main>;
  if (error || !report) return <main className="page-container flex min-h-[60vh] items-center justify-center py-16"><div className="max-w-md text-center"><FileSearch className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-5 text-2xl font-semibold">Laporan belum tersedia</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{error || "Laporan tidak ditemukan."}</p><Button asChild className="mt-6"><Link href="/">Buat pemeriksaan baru</Link></Button></div></main>;
  return <main className="page-container print-full py-8 sm:py-10">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="no-print mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/" className="rounded-sm hover:text-foreground">Pemeriksaan</Link><ChevronRight className="size-3" /><span>Laporan</span></div><h1 className="max-w-2xl break-words text-2xl font-semibold tracking-tight sm:text-3xl">{report.title}</h1><p className="mt-2 text-xs text-muted-foreground sm:text-sm">{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(report.createdAt))} · {report.results.length} referensi</p></div><div className="no-print flex gap-2"><Button variant="secondary" onClick={() => { downloadText(reportToCsv(report), `ceksitasi-${report.id}.csv`); toast({ title: "CSV berhasil disiapkan" }); }}><Download />Ekspor CSV</Button><Button variant="secondary" onClick={() => window.print()}><Printer />Cetak</Button></div></div>
    {report.demo && <div className="mt-6 flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-xs leading-5 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"><FlaskConical className="size-4 shrink-0" /><p><strong>Mode demo.</strong> Ini data contoh tersimpan, bukan hasil pemeriksaan Crossref secara langsung.</p></div>}
    <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan label">{summary.map((item) => { const Icon = item.icon; return <button key={item.label} onClick={() => setFilter(filter === item.label ? "all" : item.label)} className={cn("card p-4 text-left transition-colors hover:border-primary/50 sm:p-5", filter === item.label && "border-primary ring-1 ring-primary")} aria-pressed={filter === item.label}><div className="flex items-center justify-between gap-2"><span className={cn("flex size-8 items-center justify-center rounded-lg", item.bg, item.color)}><Icon className="size-4" /></span><span className="text-2xl font-semibold tabular-nums sm:text-3xl">{counts[item.label]}</span></div><p className="mt-3 text-xs font-medium text-muted-foreground sm:text-sm">{labelText[item.label]}</p></button>; })}</section>
    <section className="card mt-6 overflow-hidden" aria-labelledby="results-title"><div className="flex flex-col gap-4 border-b p-4 sm:p-5"><div><h2 id="results-title" className="text-base font-semibold">Hasil pemeriksaan</h2><p className="mt-1 text-xs text-muted-foreground">Pilih referensi untuk melihat parsing, bukti, dan tindakan manual.</p></div><div className="no-print flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau referensi…" className="pl-9" aria-label="Cari hasil" /></div><div className="relative"><Filter className="absolute left-3 top-3 size-4 text-muted-foreground" /><select value={filter} onChange={(event) => setFilter(event.target.value as Label | "all")} className="h-10 w-full appearance-none rounded-lg border bg-background pl-9 pr-8 text-sm sm:w-auto" aria-label="Filter label"><option value="all">Semua label</option>{labels.map((label) => <option key={label} value={label}>{labelText[label]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div></div>
      <div className="hidden grid-cols-[minmax(0,1fr)_150px_72px_36px] gap-4 border-b bg-muted/50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid"><span>Referensi</span><span>Label</span><span>Skor</span><span className="sr-only">Detail</span></div>
      <div className="divide-y">{filtered.map((result, index) => { const isExpanded = expanded.has(result.id); return <article key={result.id} className="break-inside-avoid"><div className="grid grid-cols-[minmax(0,1fr)_36px] gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5 md:grid-cols-[minmax(0,1fr)_150px_72px_36px] md:items-center md:gap-4"><button className="col-start-1 row-start-1 flex min-w-0 items-start gap-3 rounded-md text-left md:col-span-1" onClick={() => toggle(result.id)} aria-expanded={isExpanded} aria-controls={`detail-${result.id}`}><span className="mt-0.5 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span><span className="min-w-0"><span className="line-clamp-2 text-sm font-medium leading-5">{result.parsed?.title || result.referenceText}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{result.parsed?.authors[0] || "Penulis tidak dikenali"}{result.parsed?.year ? ` · ${result.parsed.year}` : ""}</span></span></button><div className="col-start-1 row-start-2 md:col-start-2 md:row-start-1"><LabelBadge label={result.manualLabel ?? result.label} /></div><div className="col-start-1 row-start-3 text-xs tabular-nums text-muted-foreground md:col-start-3 md:row-start-1"><span className="md:hidden">Skor: </span>{result.bestCandidate ? result.bestCandidate.score.toFixed(2) : "—"}</div><Button variant="ghost" size="icon" className="col-start-2 row-start-1 justify-self-end md:col-start-4 md:justify-self-auto" onClick={() => toggle(result.id)} aria-label={isExpanded ? "Tutup detail" : "Buka detail"} aria-expanded={isExpanded}>{isExpanded ? <ChevronDown /> : <ChevronRight />}</Button></div>{isExpanded && <div id={`detail-${result.id}`}><ResultDetails key={result.id} result={result} demo={report.demo} onUpdate={updateResult} /></div>}</article>; })}</div>
      {!filtered.length && <div className="p-10 text-center"><Search className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Tidak ada hasil yang sesuai</p><p className="mt-1 text-xs text-muted-foreground">Ubah kata kunci atau filter label.</p><Button variant="ghost" size="sm" className="mt-3" onClick={() => { setFilter("all"); setQuery(""); }}>Atur ulang filter</Button></div>}
    </section>
    <p className="mt-5 max-w-3xl text-xs leading-5 text-muted-foreground"><strong>Catatan:</strong> “Dugaan halusinasi” berarti sistem tidak menemukan bukti yang memadai di Crossref. Bukan vonis bahwa referensi pasti palsu. Selalu periksa sumber asli.</p>
  </main>;
}
