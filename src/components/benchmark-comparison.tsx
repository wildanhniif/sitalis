"use client";
import { FileUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  computeBestRuns,
  getBenchmarkRuns,
  labelCount,
  parseMetricsJson,
  removeBenchmarkRun,
  saveBenchmarkRun,
  demoBenchmarkRun,
  type BenchmarkRun,
  type ComparisonMetricKey,
} from "@/lib/benchmark";
import { labels, type Label } from "@/lib/types";
import { labelText } from "@/lib/pipeline/label";
import { Button } from "@/components/ui/button";

const f1MetricKey: Record<Label, ComparisonMetricKey> = { valid: "f1Valid", partial: "f1Partial", suspected: "f1Suspected", unverified: "f1Unverified" };

const num = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function RunName({ run }: { run: BenchmarkRun }) {
  return (
    <div className="min-w-48">
      <p className="font-medium text-foreground">{run.model}</p>
      <p className="text-[11px] text-muted-foreground">
        {new Date(run.generatedAt).toLocaleString("id-ID")} · {run.referenceCount} entri
      </p>
    </div>
  );
}

export function BenchmarkComparison() {
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setRuns(getBenchmarkRuns()), 0);
    return () => clearTimeout(timer);
  }, []);
  // Run demo selalu tampil sebagai pembanding visual, tidak pernah disorot sebagai hasil terbaik.
  const tableRuns = [...runs, demoBenchmarkRun];
  const best = computeBestRuns(tableRuns);

  const handleImport = async (file: File) => {
    setError("");
    try {
      const metrics = parseMetricsJson(await file.text());
      setRuns(saveBenchmarkRun(metrics));
    } catch {
      setError("File metrics.json tidak valid. Pastikan file dihasilkan oleh npm run eval.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Perbandingan Antar-Run</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Impor metrics.json dari CLI evaluasi untuk membandingkan hasil antar-model LLM (maksimal 10 run disimpan di browser).
          </p>
        </div>
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
      </div>

      {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-700 dark:text-red-300">{error}</p>}

      {tableRuns.length === 0 ? (
        <p className="mt-5 text-xs text-muted-foreground">Belum ada run. Impor metrics.json untuk mulai membandingkan model.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-3">Run</th>
                <th className="pb-3">Dataset</th>
                <th className="pb-3">Macro-F1</th>
                {labels.map((label) => (<th key={label} className="pb-3">F1 {labelText[label]}</th>))}
                <th className="pb-3">Rata-rata Token</th>
                <th className="pb-3">Rata-rata Waktu</th>
                <th className="pb-3">% Pembanding</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tableRuns.map((run) => (
                <tr key={run.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-3.5"><RunName run={run} /></td>
                  <td className="py-3.5 text-muted-foreground">
                    {run.datasetFile}
                    <span className="block text-[11px]">
                      {labels.map((label) => `${labelText[label]}: ${labelCount(run, label)}`).join(" · ")}
                    </span>
                  </td>
                  <HighlightCell value={run.macroF1.toFixed(4)} isBest={best.macroF1.has(run.id)} />
                  {labels.map((label) => (
                    <HighlightCell
                      key={label}
                      value={run.perLabel?.[label]?.f1 !== undefined ? run.perLabel[label].f1.toFixed(4) : "-"}
                      isBest={best[f1MetricKey[label]].has(run.id)}
                    />
                  ))}
                  <HighlightCell value={num(run.averageTokensPerReference)} isBest={best.averageTokensPerReference.has(run.id)} />
                  <HighlightCell value={`${(run.averageTimeMsPerReference / 1000).toFixed(2)}s`} isBest={best.averageTimeMsPerReference.has(run.id)} />
                  <HighlightCell value={`${run.comparatorUsedPercentage.toFixed(1)}%`} isBest={best.comparatorUsedPercentage.has(run.id)} />
                  <td className="py-3.5 text-right">
                    {run.isDemo ? (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Data contoh</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Hapus run ${run.model}`}
                        onClick={() => setRuns(removeBenchmarkRun(run.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
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
    <td className={`py-3.5 font-mono font-medium ${isBest ? "font-bold text-emerald-700 dark:text-emerald-300" : ""}`}>
      {value}{isBest ? " ★" : ""}
    </td>
  );
}
