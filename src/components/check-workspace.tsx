"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight, CheckCircle2, Clock3, FileText, FlaskConical, History, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveBrowserReport, getBrowserReports } from "@/lib/browser-reports";
import { createDemoReport } from "@/lib/demo";
import { extractBibliography, splitReferences } from "@/lib/extraction/segment";
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
      setReferences(data.references); setSource("upload"); setTitle(file.name.replace(/\.(pdf|docx)$/i, "")); setStage("ready");
      toast({ title: `${data.references.length} referensi dikenali`, description: "Periksa dan sunting pemisahan sebelum memulai." });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Berkas tidak dapat diproses."); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const recognizeText = () => {
    setError("");
    const found = splitReferences(extractBibliography(text));
    if (!found.length) { setError("Referensi belum dapat dikenali. Pisahkan dengan baris kosong atau penomoran."); return; }
    setReferences(found); setSource("paste"); setTitle("Daftar pustaka yang ditempel"); setStage("ready");
  };

  const startCheck = async () => {
    const clean = references.map((item) => item.trim()).filter(Boolean);
    if (!clean.length || clean.some((item) => item.length < 15)) { setError("Lengkapi referensi; setiap entri minimal 15 karakter."); return; }
    setBusy(true); setError(""); setStage("checking"); setProgress({ done: 0, total: clean.length });
    try {
      const response = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ references: clean, title, source }) });
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

  return <main>
    <section className="border-b bg-muted/40">
      <div className="page-container grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_360px] lg:items-end">
        <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-3.5 text-primary" />Bukti Crossref, bukan ingatan LLM</div><h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-[40px] sm:leading-[1.15]">Pastikan referensi Anda benar-benar ada.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Periksa keberadaan dan kesesuaian metadata referensi skripsi. Dapatkan alasan, bukti, dan koreksi yang transparan.</p></div>
        <div className="flex items-center gap-3 rounded-xl border bg-background p-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><FlaskConical className="size-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Belum punya API key?</p><p className="mt-0.5 text-xs text-muted-foreground">Jelajahi laporan dengan data contoh.</p></div><Button variant="secondary" size="sm" onClick={openDemo}>Lihat demo</Button></div>
      </div>
    </section>

    <div className="page-container py-8 sm:py-10">
      <div className="mb-6"><StepIndicator stage={stage} /></div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="card overflow-hidden" aria-labelledby="input-title">
            <div className="border-b p-5 sm:p-6"><h2 id="input-title" className="text-lg font-semibold tracking-tight">Tambahkan daftar pustaka</h2><p className="mt-1 text-sm text-muted-foreground">Unggah naskah atau tempel hanya bagian referensi.</p></div>
            <Tabs.Root value={tab} onValueChange={setTab}>
              <Tabs.List className="flex border-b px-5 sm:px-6" aria-label="Metode input"><Tabs.Trigger value="upload" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground">Unggah berkas</Tabs.Trigger><Tabs.Trigger value="paste" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground">Tempel teks</Tabs.Trigger></Tabs.List>
              <Tabs.Content value="upload" className="p-5 sm:p-6">
                <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); }} className={`relative flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "bg-muted/40"}`}>
                  <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="absolute inset-0 size-full cursor-pointer opacity-0" onChange={(event) => void handleFile(event.target.files?.[0])} disabled={busy} aria-label="Pilih atau jatuhkan berkas PDF atau DOCX" />
                  <div className="pointer-events-none flex flex-col items-center">{busy && stage === "input" ? <Loader2 className="size-8 animate-spin text-primary" /> : <UploadCloud className="size-8 text-muted-foreground" />}<p className="mt-4 text-sm font-semibold">{busy && stage === "input" ? "Mengekstrak daftar pustaka…" : fileName || "Jatuhkan naskah di sini"}</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">atau klik untuk memilih · PDF/DOCX · maksimum 10 MB</p><span className="mt-4 rounded-lg border bg-background px-3 py-2 text-xs font-medium">Pilih berkas</span></div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">PDF pindaian tanpa lapisan teks tidak didukung. Hanya teks referensi yang dikirim ke LLM.</p>
              </Tabs.Content>
              <Tabs.Content value="paste" className="p-5 sm:p-6"><label htmlFor="bibliography" className="mb-2 block text-sm font-medium">Teks daftar pustaka</label><Textarea id="bibliography" rows={9} value={text} onChange={(event) => setText(event.target.value)} placeholder={"Santoso, A. (2023). Judul artikel. Nama Jurnal, 10(2), 100–115.\n\nWijaya, B. (2022). Judul artikel lain. Nama Jurnal, 8(1), 1–12."} /><div className="mt-4 flex justify-end"><Button onClick={recognizeText} disabled={!text.trim() || busy}>Kenali referensi<ArrowRight /></Button></div></Tabs.Content>
            </Tabs.Root>
          </section>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}
          {references.length > 0 && <section className="card p-5 sm:p-6" aria-labelledby="editor-title"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="editor-title" className="text-lg font-semibold tracking-tight">Tinjau {references.length} referensi</h2><p className="mt-1 text-sm text-muted-foreground">Pastikan satu entri memuat satu referensi lengkap.</p></div><CheckCircle2 className="size-5 shrink-0 text-emerald-600" /></div><ReferenceEditor references={references} onChange={setReferences} disabled={busy} />
            {stage === "checking" || stage === "done" ? <div className="mt-6 rounded-xl bg-muted p-4" aria-live="polite"><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">Memeriksa referensi {Math.min(progress.done + 1, progress.total)} dari {progress.total}</span><span className="tabular-nums text-muted-foreground">{progress.total ? Math.round(progress.done / progress.total * 100) : 0}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress.total ? progress.done / progress.total * 100 : 0}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">LLM memparse; Crossref menyediakan bukti. Tetap buka halaman ini.</p></div> : <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Pemeriksaan dapat memakan waktu beberapa menit.</p><Button size="lg" onClick={() => void startCheck()} disabled={busy}>Mulai pemeriksaan<ArrowRight /></Button></div>}
          </section>}
        </div>

        <aside className="space-y-5" aria-label="Informasi dan riwayat"><div className="card p-5"><h2 className="text-sm font-semibold">Yang diperiksa</h2><ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground"><li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />Keberadaan karya di Crossref</li><li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />Judul, penulis, tahun, dan wadah publikasi</li><li className="flex gap-2.5"><FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />Bukan kebenaran isi kutipan di dalam naskah</li></ul></div>
          <div className="card p-5"><div className="flex items-center gap-2"><History className="size-4 text-muted-foreground" /><h2 className="text-sm font-semibold">Pemeriksaan terakhir</h2></div>{history.length ? <div className="mt-3 divide-y">{history.slice(0, 4).map((report) => <Link key={report.id} href={`/result/${report.id}`} className="group block rounded-md py-3"><p className="truncate text-xs font-medium group-hover:text-primary">{report.title}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock3 className="size-3" />{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.createdAt))} · {report.results.length} referensi</p></Link>)}</div> : <div className="mt-4 rounded-lg bg-muted p-4 text-xs leading-5 text-muted-foreground">Belum ada riwayat. Laporan tersimpan hanya di browser ini.</div>}</div>
        </aside>
      </div>
    </div>
  </main>;
}
