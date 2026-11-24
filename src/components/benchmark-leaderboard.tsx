"use client";
import { FileUp, Loader2, Play, Trash2, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { computeBestRuns, demoBenchmarkRun, parseMetricsJson, type BenchmarkRun, type ComparisonMetricKey } from "@/lib/benchmark";
import { labels } from "@/lib/types";
import { labelText } from "@/lib/pipeline/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const f1MetricKey: Record<string, ComparisonMetricKey> = { valid: "f1Valid", partial: "f1Partial", suspected: "f1Suspected", unverified: "f1Unverified" };

const num = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function accuracyOf(run: BenchmarkRun): number {
  let correct = 0;
  for (const label of Object.keys(run.confusionMatrix)) correct += run.confusionMatrix[label]?.[label] ?? 0;
  return run.referenceCount ? correct / run.referenceCount : 0;
}

type JobState = {
  id: string;
  status: "running" | "done" | "error";
  done: number;
  total: number;
  current: string;
  startedAt: number;
  elapsedMs: number;
  error?: string;
  run?: BenchmarkRun;
};

export function BenchmarkLeaderboard() {
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://lucif.ai/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("lucif");
  const [job, setJob] = useState<JobState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/benchmark/runs");
        const data = await response.json();
        if (response.ok) setRuns(data.runs);
      } catch {
        // leaderboard tetap kosong; tombol coba lagi memunculkan pesan
      }
    })();
    void (async () => {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();
        if (response.ok && data.llmBaseUrl) setBaseUrl(data.llmBaseUrl);
        if (response.ok && data.llmModel) setModel(data.llmModel);
      } catch {
        // biarkan nilai default
      }
    })();
  }, []);

  // Pantau progres job benchmark; hasil akhir langsung masuk leaderboard.
  useEffect(() => {
    if (!job || job.status !== "running") return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/benchmark/run?jobId=${job.id}`);
        if (!response.ok) return;
        const data: JobState = await response.json();
        if (data.status === "running") {
          setJob(data);
        } else if (data.status === "done" && data.run) {
          setRuns((previous) => [data.run as BenchmarkRun, ...previous]);
          setJob(null);
        } else {
          setError(data.error ?? "Benchmark gagal dijalankan.");
          setJob(null);
        }
      } catch {
        // jaringan sebentar gagal: coba lagi pada siklus berikutnya
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [job]);

  const startRun = async () => {
    setError("");
    const response = await fetch("/api/benchmark/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl, apiKey, model, dataset: "benchmark_60.csv" }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Gagal memulai benchmark.");
      return;
    }
    setJob({ id: data.jobId, status: "running", done: 0, total: 60, current: "", startedAt: Date.now(), elapsedMs: 0 });
  };

  const handleImport = async (file: File) => {
    setError("");
    try {
      const run = parseMetricsJson(await file.text());
      const response = await fetch("/api/benchmark/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(run),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impor gagal.");
      setRuns((previous) => [data.run, ...previous]);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "metrics.json tidak valid.");
    }
  };

  const removeRun = async (runId: string) => {
    const response = await fetch(`/api/benchmark/runs/${runId}`, { method: "DELETE" });
    const data = await response.json();
    if (response.ok) setRuns(data.runs);
  };

  const sorted = [...runs].sort((a, b) => b.macroF1 - a.macroF1 || a.averageTokensPerReference - b.averageTokensPerReference);
  const tableRuns = [...sorted, demoBenchmarkRun];
  const best = computeBestRuns(tableRuns);
  const progressPercent = job && job.total ? Math.round((job.done / job.total) * 100) : 0;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
            <Trophy className="size-4 text-amber-500" /> Leaderboard Antar-Model
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Jalankan benchmark 60 sampel dengan model LLM berbeda langsung dari web, hasil tersimpan di server dan diurutkan dari macro-F1 terbaik.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file); }}
            />
            <Button variant="secondary" size="sm" asChild>
              <span className="flex items-center gap-1.5"><FileUp className="size-3.5" />Impor metrics.json</span>
            </Button>
          </label>
          <Button variant="secondary" size="sm" onClick={() => setPanelOpen((open) => !open)}>
            <Play className="size-3.5" />Jalankan Benchmark
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-700 dark:text-red-300">{error}</p>}

      {panelOpen && (
        <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-surface-subtle/40 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-muted-foreground">
              Nama model
              <Input className="mt-1" value={model} onChange={(event) => setModel(event.target.value)} placeholder="lucif" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Base URL
              <Input className="mt-1" list="llm-base-presets" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://lucif.ai/v1" />
              <datalist id="llm-base-presets">
                <option value="https://lucif.ai/v1" />
                <option value="https://api.deepseek.com/v1" />
                <option value="https://api.groq.com/openai/v1" />
                <option value="https://openrouter.ai/api/v1" />
              </datalist>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              API key
              <Input className="mt-1" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Tidak tersimpan" />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Endpoint harus kompatibel OpenAI (memiliki /chat/completions). Dataset: benchmark_60.csv (60 sampel, 15 per label). Satu benchmark berjalan ±5-10 menit di server; jangan tutup halaman ini.
          </p>
          {job ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Menilai referensi {job.current}…</span>
                <span className="font-mono">{job.done}/{job.total} ({progressPercent}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground">{Math.round(job.elapsedMs / 1000)}s berjalan</p>
            </div>
          ) : (
            <Button size="sm" onClick={() => void startRun()} disabled={!model || !baseUrl}>
              <Play className="size-3.5" />Mulai Uji
            </Button>
          )}
        </div>
      )}

      {tableRuns.length === 0 ? (
        <p className="mt-5 text-xs text-muted-foreground">Belum ada run. Jalankan benchmark atau impor metrics.json untuk mengisi leaderboard.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-3">#</th>
                <th className="pb-3">Model</th>
                <th className="pb-3">Macro-F1</th>
                <th className="pb-3">Akurasi</th>
                {labels.map((label) => (<th key={label} className="pb-3">F1 {labelText[label]}</th>))}
                <th className="pb-3">Rata-rata Token</th>
                <th className="pb-3">Rata-rata Waktu</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tableRuns.map((run, index) => {
                const rank = run.isDemo ? null : index + 1;
                return (
                  <tr key={run.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 font-mono">
                      {rank === 1 ? <Trophy className="size-4 text-amber-500" /> : rank ? <span className="text-muted-foreground">#{rank}</span> : null}
                    </td>
                    <td className="py-3.5">
                      <div className="min-w-40">
                        <span className="font-medium text-foreground">{run.model}</span>
                        <span className="block text-[11px] text-muted-foreground">{run.datasetFile}</span>
                      </div>
                    </td>
                    <HighlightCell value={run.macroF1.toFixed(4)} isBest={best.macroF1.has(run.id)} />
                    <HighlightCell value={`${(accuracyOf(run) * 100).toFixed(1)}%`} isBest={false} />
                    {labels.map((label) => (
                      <HighlightCell
                        key={label}
                        value={run.perLabel?.[label]?.f1 !== undefined ? run.perLabel[label].f1.toFixed(4) : "-"}
                        isBest={best[f1MetricKey[label]].has(run.id)}
                      />
                    ))}
                    <HighlightCell value={num(run.averageTokensPerReference)} isBest={best.averageTokensPerReference.has(run.id)} />
                    <HighlightCell value={`${(run.averageTimeMsPerReference / 1000).toFixed(2)}s`} isBest={best.averageTimeMsPerReference.has(run.id)} />
                    <td className="py-3.5 text-right">
                      {run.isDemo ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Data contoh</span>
                      ) : (
                        <Button variant="ghost" size="sm" aria-label={`Hapus run ${run.model}`} onClick={() => void removeRun(run.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Nilai terbaik tiap metrik disorot dan hanya dihitung dari run evaluasi nyata; baris “Data contoh” adalah ilustrasi format, bukan hasil pengujian.
      </p>
    </section>
  );
}

function HighlightCell({ value, isBest }: { value: string; isBest: boolean }) {
  return (
    <td className={`py-3.5 font-mono ${isBest ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
      {value}
    </td>
  );
}
