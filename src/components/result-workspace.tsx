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
  {
    label: "valid" as const,
    icon: BadgeCheck,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  {
    label: "partial" as const,
    icon: TriangleAlert,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500",
  },
  {
    label: "suspected" as const,
    icon: CircleAlert,
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-500/10 border-rose-500/20",
    dot: "bg-rose-500",
  },
  {
    label: "unverified" as const,
    icon: CircleHelp,
    color: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-500/10 border-zinc-500/20",
    dot: "bg-zinc-400",
  },
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
  if (loading)
    return (
      <main className="page-container py-10">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-md" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map((item) => (
            <Skeleton key={item.label} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-12 rounded-xl" />
        <Skeleton className="mt-4 h-80 rounded-xl" />
        <span className="sr-only" aria-live="polite">
          Memuat laporan
        </span>
      </main>
    );
  if (error || !report)
    return (
      <main className="page-container flex min-h-[60vh] items-center justify-center py-16">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-surface-subtle text-muted-foreground">
            <FileSearch className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Laporan belum tersedia
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {error || "Laporan yang diminta tidak ditemukan atau telah kadaluarsa."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Buat pemeriksaan baru</Link>
          </Button>
        </div>
      </main>
    );
  return (
    <main className="page-container print-full py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="no-print mb-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Pemeriksaan
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">Laporan Audit</span>
          </div>
          <h1 className="max-w-2xl break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {report.title}
          </h1>
          <p className="mt-1.5 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(
                new Date(report.createdAt)
              )}
            </span>
            <span>·</span>
            <span className="font-medium text-foreground">{report.results.length} referensi dianalisis</span>
          </p>
        </div>
        <div className="no-print flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              downloadText(reportToCsv(report), `sitalis-${report.id}.csv`);
              toast({ title: "CSV berhasil diunduh" });
            }}
          >
            <Download className="size-3.5" />
            Ekspor CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {report.demo && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
          <FlaskConical className="size-4.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <strong className="font-semibold">Mode Sampel Demo:</strong> Hasil di bawah ini merupakan data contoh terkurasi yang mencakup 10 ragam tipe sitasi (valid, anomali judul/tahun, prosiding, hingga non-Crossref).
          </div>
        </div>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan label">
        {summary.map((item) => {
          const Icon = item.icon;
          const isSelected = filter === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setFilter(isSelected ? "all" : item.label)}
              className={cn(
                "group relative rounded-xl border p-4 text-left transition-all duration-150 sm:p-5",
                isSelected
                  ? "border-foreground/40 bg-card shadow-float ring-1 ring-foreground/20"
                  : "border-border/80 bg-card hover:border-border hover:shadow-subtle"
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg border text-xs",
                    item.bg,
                    item.color
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl text-foreground">
                  {counts[item.label]}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  {labelText[item.label]}
                </p>
                {isSelected && (
                  <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                    Aktif
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </section>

      <section className="card mt-6 overflow-hidden" aria-labelledby="results-title">
        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <h2 id="results-title" className="text-base font-semibold tracking-tight text-foreground">
              Daftar Hasil Verifikasi
            </h2>
            <p className="text-xs text-muted-foreground">
              Klik pada baris sitasi untuk memeriksa metadata mendalam, kandidat Crossref, serta saran perbaikan.
            </p>
          </div>
          <div className="no-print flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kata kunci judul, penulis, atau teks..."
                className="pl-9 h-9 text-xs sm:text-sm"
                aria-label="Cari hasil"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as Label | "all")}
                className="h-9 w-full appearance-none rounded-lg border border-border/80 bg-background pl-9 pr-8 text-xs sm:text-sm text-foreground shadow-subtle sm:w-auto"
                aria-label="Filter label"
              >
                <option value="all">Semua Kategori</option>
                {labels.map((label) => (
                  <option key={label} value={label}>
                    {labelText[label]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(0,1fr)_140px_80px_36px] gap-4 border-b border-border/60 bg-surface-subtle/60 px-5 py-2.5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground md:grid">
          <span>Referensi & Penulis</span>
          <span>Status Bukti</span>
          <span className="text-center">Skor</span>
          <span className="sr-only">Aksi</span>
        </div>

        <div className="divide-y divide-border/60">
          {filtered.map((result, index) => {
            const isExpanded = expanded.has(result.id);
            return (
              <article key={result.id} className="break-inside-avoid">
                <div
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_36px] gap-3 px-4 py-3.5 transition-colors sm:px-5 md:grid-cols-[minmax(0,1fr)_140px_80px_36px] md:items-center md:gap-4",
                    isExpanded ? "bg-surface-subtle/50" : "hover:bg-surface-subtle/30"
                  )}
                >
                  <button
                    className="col-start-1 row-start-1 flex min-w-0 items-start gap-3 rounded-md text-left md:col-span-1"
                    onClick={() => toggle(result.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`detail-${result.id}`}
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-surface-subtle text-[11px] font-mono text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-xs sm:text-sm font-medium leading-relaxed text-foreground">
                        {result.parsed?.title || result.referenceText}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        <span>
                          {result.parsed?.authors[0] || "Penulis tidak terstruktur"}
                          {result.parsed?.year ? ` · ${result.parsed.year}` : ""}
                        </span>
                        {result.indonesianSource?.isIndonesian && (
                          <span className="inline-flex items-center rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.2 text-[10px] font-medium text-sky-800 dark:text-sky-300">
                            ID: {result.indonesianSource.platform === "garuda"
                              ? "GARUDA/SINTA"
                              : result.indonesianSource.platform === "repository"
                              ? "Repositori Kampus"
                              : result.indonesianSource.platform === "peraturan"
                              ? "Regulasi RI"
                              : "Lokal"}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>

                  <div className="col-start-1 row-start-2 md:col-start-2 md:row-start-1">
                    <LabelBadge label={result.manualLabel ?? result.label} />
                  </div>

                  <div className="col-start-1 row-start-3 text-xs font-mono text-muted-foreground md:col-start-3 md:row-start-1 md:text-center">
                    <span className="md:hidden">Skor Cocok: </span>
                    {result.bestCandidate ? (
                      <span className="font-semibold text-foreground">
                        {(result.bestCandidate.score * 100).toFixed(0)}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-start-2 row-start-1 size-8 min-h-8 justify-self-end rounded-md md:col-start-4 md:justify-self-auto"
                    onClick={() => toggle(result.id)}
                    aria-label={isExpanded ? "Tutup detail" : "Buka detail"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div id={`detail-${result.id}`}>
                    <ResultDetails result={result} demo={report.demo} onUpdate={updateResult} />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!filtered.length && (
          <div className="p-12 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl border border-border/80 bg-surface-subtle text-muted-foreground">
              <Search className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Tidak ada hasil yang sesuai</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ubah kata kunci pencarian atau sesuaikan filter label di atas.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Atur ulang filter
            </Button>
          </div>
        )}
      </section>

      <div className="mt-6 rounded-xl border border-border/70 bg-surface-subtle/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Pedoman Integritas:</strong> Status “Dugaan halusinasi” mengindikasikan ketiadaan bukti pada indeks publik Crossref atau ketidakcocokan DOI yang fatal. Hal tersebut bukan vonis mutlak bahwa naskah palsu, karena penerbit lokal atau buku non-DOI mungkin memerlukan pencarian manual pada repositori institusi terkait.
      </div>
    </main>
  );
}
