"use client";
import { Check, CircleAlert, ExternalLink, Loader2, Pencil, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { summarizeAbstract } from "@/lib/abstract";
import { labels, type CheckResult, type CrossrefWork, type Difference, type Label } from "@/lib/types";
import { labelText } from "@/lib/pipeline/label";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { LabelBadge } from "./label-badge";

const sourceNames = { journal: "Jurnal", conference: "Konferensi", book: "Buku", thesis: "Tesis", report: "Laporan", regulation: "Regulasi", web: "Web", other: "Lainnya" };

function EntryMetadata({ result }: { result: CheckResult }) {
  const parsed = result.parsed;
  if (!parsed)
    return (
      <div className="rounded-xl border border-border/80 bg-surface-subtle p-4 text-xs leading-relaxed text-muted-foreground">
        Metadata terstruktur tidak tersedia. {result.parseError}
      </div>
    );
  const rows = [
    ["Penulis", parsed.authors.join("; ") || "—"],
    ["Tahun", parsed.year ?? "—"],
    ["Judul", parsed.title ?? "—"],
    ["Wadah", parsed.container ?? "—"],
    ["Volume / no", `${parsed.volume ?? "—"} / ${parsed.issue ?? "—"}`],
    ["Halaman", parsed.pages ?? "—"],
    ["Jenis sumber", sourceNames[parsed.source_type]],
    ["DOI", parsed.doi ?? "—"],
  ];
  return (
    <dl className="grid gap-2 text-xs">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[100px_1fr] items-start gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-subtle/50"
        >
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words font-sans text-foreground/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkSummary({
  result,
  work,
  demo,
  onUpdate,
}: {
  result: CheckResult;
  work: CrossrefWork;
  demo?: boolean;
  onUpdate: (result: CheckResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const demoSummary = demo ? summarizeAbstract(work.abstract) : null;
  const requestSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: work.DOI }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ringkasan AI tidak dapat dibuat.");
      if (typeof data.summary !== "string") throw new Error("LLM tidak mengembalikan ringkasan.");
      onUpdate({ ...result, aiSummary: { text: data.summary, tokens: Number(data.tokens) || 0, doi: work.DOI } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ringkasan AI tidak dapat dibuat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby={`abstract-${result.id}`}
      aria-busy={loading}
      className="mt-4 rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-subtle"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-foreground/80" />
        <h4 id={`abstract-${result.id}`} className="text-xs sm:text-sm font-semibold tracking-tight text-foreground">
          Ringkasan Abstrak Karya Ilmiah
        </h4>
      </div>
      {result.aiSummary && result.aiSummary.doi === work.DOI ? (
        <>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground/90 font-serif sm:font-sans">
            {result.aiSummary.text}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Disarikan dari abstrak resmi penerbit Crossref
            {result.aiSummary.tokens > 0 ? ` · ${result.aiSummary.tokens} token` : ""}. Tidak merefleksikan evaluasi manual isi skripsi.
          </p>
        </>
      ) : demo && demoSummary ? (
        <>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground/90 font-serif sm:font-sans">
            {demoSummary}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Sampel abstrak data terkurasi demo. Pada pengujian riil, abstrak di-fetch langsung via DOI.
          </p>
        </>
      ) : work.abstract?.trim() ? (
        <>
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Abstrak tersedia di Crossref ({work.abstract.length} karakter). Buat ringkasan ringkas untuk memahami konteks karya ini secara cepat.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 font-medium text-xs"
            onClick={() => void requestSummary()}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {loading ? "Meringkas abstrak…" : "Hasilkan ringkasan via AI"}
          </Button>
          <p className="mt-2 text-[11px] text-muted-foreground/80">
            Panggilan LLM dibatasi 180 token ke endpoint yang dikonfigurasi pada .env.
          </p>
        </>
      ) : (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Penerbit tidak menyertakan abstrak publik pada catatan DOI karya ini. Silakan kunjungi tautan DOI untuk mengakses naskah penuh.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 flex gap-2 text-xs leading-relaxed text-rose-700 dark:text-rose-400">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </section>
  );
}

export function ResultDetails({
  result,
  demo,
  onUpdate,
}: {
  result: CheckResult;
  demo?: boolean;
  onUpdate: (result: CheckResult) => void;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const candidate = result.candidates[candidateIndex] ?? null;
  const work = candidate?.work;
  const differences = new Map<Difference["field"], Difference>(
    candidate?.differences.map((difference) => [difference.field, difference]) ?? []
  );
  const query = result.parsed?.title || result.referenceText;
  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
  const garudaUrl = `https://garuda.kemdiktisaintek.go.id/documents?search=${encodeURIComponent(query)}`;
  const changeLabel = (label: Label) => {
    onUpdate({ ...result, manualLabel: label, confirmed: true });
    setEditing(false);
  };
  const isFoundWork =
    (result.label === "valid" || result.label === "partial") && result.bestCandidate?.work.DOI === work?.DOI;
  const workRows = [
    { key: "title", label: "Judul", value: work?.title[0] },
    {
      key: "first_author",
      label: "Penulis",
      value: work?.author.map((author) => [author.given, author.family].filter(Boolean).join(" ")).join("; "),
    },
    { key: "year", label: "Tahun", value: work?.issued?.["date-parts"]?.[0]?.[0] },
    { key: "container", label: "Wadah", value: work?.["container-title"]?.[0] },
    { key: "doi", label: "DOI", value: work?.DOI },
  ] as const;

  return (
    <div className="border-t border-border/70 bg-surface-subtle/40 p-4 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Source citation parsed */}
        <section className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-subtle">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sitasi Asli Naskah
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">
              {result.referenceText.length} karakter
            </span>
          </div>
          <blockquote className="mt-3 rounded-lg border-l-2 border-foreground/30 bg-surface-subtle/50 p-3 text-xs sm:text-sm leading-relaxed text-foreground">
            {result.referenceText}
          </blockquote>
          <div className="my-4 border-t border-border/60" />
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Struktur Ekstraksi Komponen
          </h4>
          <EntryMetadata result={result} />
        </section>

        {/* Crossref evidence */}
        <section className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-subtle">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bukti Terdaftar di Crossref
            </p>
            {result.candidates.length > 1 && (
              <select
                aria-label="Pilih kandidat Crossref"
                className="h-8 max-w-[170px] rounded-lg border border-border/80 bg-background px-2 text-xs font-medium text-foreground shadow-subtle"
                value={candidateIndex}
                onChange={(event) => setCandidateIndex(Number(event.target.value))}
              >
                {result.candidates.map((item, index) => (
                  <option key={item.work.DOI} value={index}>
                    Kandidat #{index + 1} · {(item.score * 100).toFixed(0)}%
                  </option>
                ))}
              </select>
            )}
          </div>

          {candidate && work ? (
            <>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-subtle/70 px-3 py-2 text-xs">
                <span className="font-medium text-muted-foreground">Tingkat Kecocokan Keseluruhan</span>
                <span className="font-mono font-semibold text-foreground">
                  {(candidate.score * 100).toFixed(1)}% ({candidate.score.toFixed(2)}/1.00)
                </span>
              </div>

              <dl className="mt-3.5 space-y-2">
                {workRows.map((row) => {
                  const difference = differences.get(row.key);
                  return (
                    <div
                      key={row.key}
                      className={cn(
                        "grid grid-cols-[82px_1fr] gap-2 rounded-lg p-2 text-xs leading-relaxed transition-colors",
                        difference
                          ? "border border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                          : "hover:bg-surface-subtle/40"
                      )}
                    >
                      <dt className="font-medium text-muted-foreground">{row.label}</dt>
                      <dd className="min-w-0 break-words font-sans">
                        {row.key === "doi" && work.DOI ? (
                          <a
                            href={`https://doi.org/${work.DOI}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                          >
                            {row.value}
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        ) : (
                          row.value || "—"
                        )}
                        {difference && (
                          <span className="mt-1 block text-[11px] font-medium text-amber-800 dark:text-amber-300">
                            Ketidaksesuaian: naskah tertulis “{difference.entry ?? "tidak tercantum"}”
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center text-[11px] text-muted-foreground">
                <div className="rounded-md bg-surface-subtle/50 py-1.5">
                  <span className="text-[10px] uppercase tracking-wider">Judul</span>
                  <p className="font-mono font-semibold text-foreground">{(candidate.titleScore * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-md bg-surface-subtle/50 py-1.5">
                  <span className="text-[10px] uppercase tracking-wider">Penulis</span>
                  <p className="font-mono font-semibold text-foreground">{(candidate.authorScore * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-md bg-surface-subtle/50 py-1.5">
                  <span className="text-[10px] uppercase tracking-wider">Tahun</span>
                  <p className="font-mono font-semibold text-foreground">{(candidate.yearScore * 100).toFixed(0)}%</p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border/90 p-8 text-center">
              <Search className="mx-auto size-6 text-muted-foreground/60" />
              <p className="mt-2.5 text-xs font-semibold text-foreground">Tidak Ditemukan Kecocokan di Crossref</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Katalog Crossref tidak memiliki catatan yang bersesuaian dengan judul atau DOI di atas. Lakukan pengecekan manual pada mesin pencari ilmiah.
              </p>
            </div>
          )}
        </section>
      </div>

      {isFoundWork && work && <WorkSummary result={result} work={work} demo={demo} onUpdate={onUpdate} />}

      {result.indonesianSource?.isIndonesian && (
        <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4 text-xs leading-relaxed text-sky-950 dark:text-sky-200">
          <div className="flex items-center gap-2 font-semibold">
            <span className="inline-flex size-2 rounded-full bg-sky-500" />
            <span>{result.indonesianSource.platformName ?? "Sumber Akademik Terindeks Nasional (Indonesia)"}</span>
          </div>
          <p className="mt-1">{result.indonesianSource.notes}</p>
          {result.indonesianSource.searchUrl && (
            <div className="mt-2.5">
              <a
                href={result.indonesianSource.searchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-sky-800 underline decoration-sky-400 underline-offset-2 hover:text-sky-900 dark:text-sky-300"
              >
                Buka penelusuran di {result.indonesianSource.platformName}
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Rationale & Suggestions */}
      <div className="mt-4 rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
        <p className="text-xs sm:text-sm font-medium text-foreground">{result.reason}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.evidence}</p>
        {result.bestCandidate?.differences.length ? (
          <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">
            Saran Perbaikan: Sesuaikan rincian metadata yang disorot dengan catatan resmi penerbit di atas.
          </p>
        ) : null}
      </div>

      {/* Bottom Manual Actions */}
      <div className="no-print mt-4 flex flex-wrap items-center gap-2 pt-1">
        <Button variant="secondary" size="sm" asChild>
          <a href={scholarUrl} target="_blank" rel="noreferrer">
            Google Scholar
            <ExternalLink className="size-3 ml-0.5" />
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <a href={garudaUrl} target="_blank" rel="noreferrer">
            GARUDA
            <ExternalLink className="size-3 ml-0.5" />
          </a>
        </Button>
        <span className="mx-1 hidden h-4 w-px bg-border/80 sm:block" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ ...result, confirmed: true })}
          className={result.confirmed ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300" : ""}
        >
          <Check className="size-3.5" />
          {result.confirmed ? "Telah Dikonfirmasi" : "Konfirmasi Kebenaran"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
          <Pencil className="size-3.5" />
          Ubah label manual
        </Button>
        {editing && (
          <select
            autoFocus
            aria-label="Label pengganti"
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground shadow-subtle"
            value={result.manualLabel ?? result.label}
            onChange={(event) => changeLabel(event.target.value as Label)}
          >
            {labels.map((label) => (
              <option key={label} value={label}>
                {labelText[label]}
              </option>
            ))}
          </select>
        )}
        <LabelBadge label={result.manualLabel ?? result.label} className="ml-auto" />
      </div>
    </div>
  );
}
