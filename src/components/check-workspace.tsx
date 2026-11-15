"use client";
import { getStoredSkill } from "@/lib/llm/skill";

import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight, CheckCircle2, Clock3, FileText, FlaskConical, History, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveBrowserReport, getBrowserReports } from "@/lib/browser-reports";
import { createDemoReport } from "@/lib/demo";
import { extractBibliography, splitReferences } from "@/lib/extraction/segment";
import { splitWithAiFallback } from "@/lib/extraction/smart-segment";
import type { Report } from "@/lib/types";
import { ReferenceEditor } from "./reference-editor";
import { StepIndicator, type CheckStage } from "./step-indicator";
import { useToast } from "./toast";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";

export function CheckWorkspace() {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("upload");
  const [text, setText] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [source, setSource] = useState<"upload" | "paste">("upload");
  const [title, setTitle] = useState("Pemeriksaan referensi");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<CheckStage>("input");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Report[]>([]);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setHistory(getBrowserReports()), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(""); setFileName(file.name);
    if (file.size > 10 * 1024 * 1024) { setError("Ukuran berkas melebihi 10 MB."); return; }
    if (!/\.(pdf|docx)$/i.test(file.name)) { setError("Format tidak didukung. Gunakan PDF atau DOCX."); return; }
    setBusy(true); setStage("input");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/extract", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const refined = await splitWithAiFallback(String(data.bibliography ?? ""), data.references as string[]);
      setReferences(refined.references); setSource("upload"); setTitle(file.name.replace(/\.(pdf|docx)$/i, "")); setStage("ready");
      toast({
        title: `${refined.references.length} referensi dikenali`,
        description: refined.viaAi ? "Pemisahan tabel dirapikan otomatis oleh AI; periksa kembali sebelum diperiksa." : "Periksa dan sunting pemisahan sebelum memulai.",
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Berkas tidak dapat diproses."); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const recognizeText = async () => {
    setError("");
    const section = extractBibliography(text);
    const found = splitReferences(section);
    setBusy(true);
    try {
      const refined = await splitWithAiFallback(section, found);
      if (!refined.references.length) { setError("Referensi belum dapat dikenali. Pisahkan dengan baris kosong atau penomoran."); return; }
      setReferences(refined.references); setSource("paste"); setTitle("Daftar pustaka yang ditempel"); setStage("ready");
      if (refined.viaAi) {
        toast({
          title: `AI merapikan ${refined.references.length} entri`,
          description: `Pemisahan otomatis memakai ${refined.tokens.toLocaleString("id-ID")} token. Periksa kembali isinya.`,
        });
      }
    } finally { setBusy(false); }
  };

  const startCheck = async () => {
    const clean = references.map((item) => item.trim()).filter(Boolean);
    if (!clean.length || clean.some((item) => item.length < 15)) { setError("Lengkapi referensi; setiap entri minimal 15 karakter."); return; }
    setBusy(true); setError(""); setStage("checking"); setProgress({ done: 0, total: clean.length });
    try {
      const response = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ references: clean, title, source, skill: getStoredSkill() }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      if (!response.body) throw new Error("Browser tidak menerima aliran progres.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      const handleEvent = (event: { type: string; total?: number; report?: Report; error?: string }) => {
        if (event.type === "started") setProgress({ done: 0, total: event.total ?? clean.length });
        if (event.type === "result") setProgress((current) => ({ ...current, done: current.done + 1 }));
        if (event.type === "error") throw new Error(event.error);
        if (event.type === "done" && event.report) {
          if (!saveBrowserReport(event.report)) toast({ title: "Laporan hanya tersimpan sementara", description: "Penyimpanan browser penuh; segera ekspor CSV.", variant: "error" });
          setStage("done"); router.push(`/result/${event.report.id}`);
        }
      };
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handleEvent(JSON.parse(line));
      }
      if (buffer.trim()) handleEvent(JSON.parse(buffer));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Pemeriksaan gagal. Coba lagi."); setStage("ready"); }
    finally { setBusy(false); }
  };

  const openDemo = () => { const report = createDemoReport(); saveBrowserReport(report); router.push("/result/demo"); };

  return (
    <main className="pb-16">
      {/* Hero Header */}
      <section className="relative border-b border-border/80 bg-surface-subtle/40 subtle-grid">
        <div className="page-container py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1 text-xs font-medium text-foreground/80 shadow-subtle backdrop-blur-sm">
                <span className="flex size-1.5 rounded-full bg-emerald-500" />
                <ShieldCheck className="size-3.5 text-foreground/70" />
                <span>Basis Bukti Resmi Crossref & Sumber Akademik</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[42px] lg:leading-[1.18]">
                Audit keabsahan referensi ilmiah naskah skripsi Anda.
              </h1>
              <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Verifikasi eksistensi sitasi, bandingkan judul, penulis, tahun, serta wadah publikasi dengan metadata resmi penerbit. Transparan tanpa vonis gelap.
              </p>
            </div>

            <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-card transition-shadow hover:shadow-float">
              <div className="flex items-start gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-subtle border border-border/70 text-foreground">
                  <FlaskConical className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Eksplorasi Mode Demo</p>
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">instan</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Coba laporan komprehensif 10 kasus sitasi tanpa memerlukan API key atau file naskah.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-border/60 flex justify-end">
                <Button variant="secondary" size="sm" onClick={openDemo} className="w-full sm:w-auto">
                  Buka laporan demo
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="page-container mt-8 sm:mt-10">
        <div className="mb-8">
          <StepIndicator stage={stage} />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left Column: Input Form & Progress */}
          <div className="space-y-6">
            <section className="card overflow-hidden" aria-labelledby="input-title">
              <div className="border-b border-border/70 p-5 sm:px-6">
                <h2 id="input-title" className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                  Input Daftar Pustaka
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Unggah file skripsi (PDF/DOCX) atau tempelkan teks daftar pustaka secara langsung.
                </p>
              </div>

              <Tabs.Root value={tab} onValueChange={setTab}>
                <Tabs.List className="flex border-b border-border/70 px-5 sm:px-6 bg-surface-subtle/40" aria-label="Metode input">
                  <Tabs.Trigger
                    value="upload"
                    className="relative border-b-2 border-transparent px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
                  >
                    Unggah Berkas
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="paste"
                    className="relative border-b-2 border-transparent px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
                  >
                    Tempel Teks Manual
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="upload" className="p-5 sm:p-6">
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      void handleFile(event.dataTransfer.files[0]);
                    }}
                    className={`relative flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all ${
                      dragging
                        ? "border-foreground/60 bg-foreground/5 shadow-subtle"
                        : "border-border/90 bg-surface-subtle/30 hover:border-border hover:bg-surface-subtle/50"
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                      onChange={(event) => void handleFile(event.target.files?.[0])}
                      disabled={busy}
                      aria-label="Pilih atau jatuhkan berkas PDF atau DOCX"
                    />
                    <div className="pointer-events-none flex flex-col items-center">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-subtle">
                        {busy && stage === "input" ? (
                          <Loader2 className="size-6 animate-spin text-foreground" />
                        ) : (
                          <UploadCloud className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <p className="mt-3.5 text-sm font-semibold text-foreground">
                        {busy && stage === "input"
                          ? "Mengekstrak daftar pustaka dari berkas…"
                          : fileName || "Seret & jatuhkan berkas naskah di sini"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Format PDF atau DOCX · batas ukuran 10 MB
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium shadow-subtle">
                        Pilih dari komputer
                      </span>
                    </div>
                  </div>
                  <div className="mt-3.5 flex items-start gap-2 text-xs text-muted-foreground/90">
                    <span className="font-semibold text-foreground">Catatan:</span>
                    <span>Hanya segmen daftar pustaka yang diekstrak. File pindaian gambar tanpa teks OCR tidak didukung.</span>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="paste" className="p-5 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="bibliography" className="text-xs font-semibold text-foreground">
                        Teks Daftar Pustaka
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        Pisahkan tiap entri dengan enter ganda atau nomor
                      </span>
                    </div>
                    <Textarea
                      id="bibliography"
                      rows={10}
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder={"Santoso, A. (2023). Judul artikel ilmiah. Nama Jurnal, 10(2), 100–115.\n\nWijaya, B., & Kusuma, D. (2022). Buku referensi metodologi. Jakarta: Penerbit Akademik."}
                    />
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => void recognizeText()} disabled={!text.trim() || busy}>
                        {busy ? "Memproses entri..." : "Kenali entri referensi"}
                        <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            </section>

            {error && (
              <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm leading-relaxed text-red-800 dark:text-red-300">
                {error}
              </div>
            )}

            {references.length > 0 && (
              <section className="card p-5 sm:p-6" aria-labelledby="editor-title">
                <div className="mb-5 flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                  <div>
                    <h2 id="editor-title" className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                      Tinjau {references.length} Entri Referensi
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                      Periksa apakah pemisahan entri sudah pas sebelum dikirim ke mesin pencari Crossref.
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                    Siap diperiksa
                  </span>
                </div>

                <ReferenceEditor references={references} onChange={setReferences} disabled={busy} />

                {stage === "checking" || stage === "done" ? (
                  <div className="mt-6 rounded-xl border border-border/80 bg-surface-subtle p-5" aria-live="polite">
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
                      <span className="text-foreground">
                        Memeriksa entri {Math.min(progress.done + 1, progress.total)} dari {progress.total}...
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/80">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-300"
                        style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      Proses pencarian Crossref sedang berlangsung via polite pool. Tetap biarkan jendela tab ini terbuka.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Pencocokan metadata membutuhkan waktu beberapa detik per entri.
                    </p>
                    <Button size="lg" onClick={() => void startCheck()} disabled={busy} className="font-medium">
                      Mulai pemeriksaan menyeluruh
                      <ArrowRight className="size-4 ml-1.5" />
                    </Button>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Sidebar Specs & History */}
          <aside className="space-y-6" aria-label="Informasi dan riwayat">
            <div className="card p-5">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Cakupan Verifikasi
              </h2>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <span>Verifikasi DOI dan judul di katalog resmi Crossref</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <span>Perbandingan fuzzy kecocokan nama penulis, wadah jurnal & tahun</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileText className="size-3.5" />
                  </span>
                  <span>Tidak memvalidasi substansi isi kutipan/klaim bab naskah</span>
                </li>
              </ul>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Riwayat Sesi
                  </h2>
                </div>
                {history.length > 0 && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {history.length} laporan
                  </span>
                )}
              </div>

              {history.length ? (
                <div className="mt-3 divide-y divide-border/60">
                  {history.slice(0, 4).map((report) => (
                    <Link
                      key={report.id}
                      href={`/result/${report.id}`}
                      className="group block py-3 transition-colors hover:text-foreground"
                    >
                      <p className="truncate text-xs font-medium text-foreground/90 group-hover:underline">
                        {report.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock3 className="size-3" />
                        {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                          new Date(report.createdAt)
                        )}{" "}
                        · {report.results.length} entri
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-surface-subtle/40 p-4 text-center text-xs leading-relaxed text-muted-foreground">
                  Belum ada riwayat pengujian. Laporan disimpan secara lokal di peramban Anda.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
