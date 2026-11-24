import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getCrossrefClient } from "@/lib/crossref/client";
import { parseCsv } from "@/lib/csv";
import { calculateMetrics, type EvaluationInput } from "@/lib/evaluation";
import { LlmClient } from "@/lib/llm/client";
import { checkReference } from "@/lib/pipeline/check";
import { addBenchmarkRun } from "@/lib/benchmark-store";
import { labels, type CheckResult, type Label } from "@/lib/types";

export const runtime = "nodejs";

const runSchema = z.object({
  baseUrl: z.string().url("Base URL harus URL valid (contoh: https://lucif.ai/v1)."),
  apiKey: z.string().default(""),
  model: z.string().trim().min(1, "Model wajib diisi."),
  dataset: z.enum(["benchmark_60.csv", "sample.csv"]).default("benchmark_60.csv"),
});

const rowSchema = z.object({ id: z.string().min(1), reference_text: z.string().min(15), true_label: z.enum(labels), source_type: z.string() });

type JobState = {
  id: string;
  status: "running" | "done" | "error";
  done: number;
  total: number;
  current: string;
  startedAt: number;
  elapsedMs: number;
  error?: string;
  run?: unknown;
};

/** Satu benchmark berjalan pada satu waktu: melindungi kuota LLM dan Crossref. */
const jobs = new Map<string, JobState>();
let running = false;

/** Mulai benchmark di server: langsung balas jobId, progres dipantau lewat GET. */
export async function POST(request: Request) {
  const parsed = runSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") || "Data tidak valid." }, { status: 400 });
  }
  if (running) {
    return Response.json({ error: "Masih ada benchmark yang berjalan. Tunggu sampai selesai." }, { status: 409 });
  }
  running = true;
  const job: JobState = { id: randomUUID(), status: "running", done: 0, total: 0, current: "", startedAt: Date.now(), elapsedMs: 0 };
  jobs.set(job.id, job);
  if (jobs.size > 20) {
    const oldest = jobs.keys().next().value;
    if (oldest !== undefined) jobs.delete(oldest);
  }
  void runBenchmark(job, parsed.data).finally(() => {
    running = false;
    job.elapsedMs = Date.now() - job.startedAt;
  });
  return Response.json({ jobId: job.id }, { status: 202 });
}

/** Pantau progres: kirim jobId dari POST, balasan berisi status, progres, dan hasil akhir. */
export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  const job = jobId ? jobs.get(jobId) : undefined;
  if (!job) return Response.json({ error: "Job tidak ditemukan atau server baru dimulai ulang." }, { status: 404 });
  job.elapsedMs = Date.now() - job.startedAt;
  return Response.json(job);
}

async function runBenchmark(job: JobState, config: z.infer<typeof runSchema>): Promise<void> {
  try {
    const rows = parseCsv(await readFile(path.join(process.cwd(), "data", config.dataset), "utf8"));
    const headers = rows[0];
    const inputs: EvaluationInput[] = rows.slice(1).filter((row) => row.some(Boolean)).map((row) => {
      const value = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
      return rowSchema.parse(value);
    });
    job.total = inputs.length;
    const llm = new LlmClient({ baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model });
    const crossref = getCrossrefClient();
    const results: CheckResult[] = [];
    for (let index = 0; index < inputs.length; index++) {
      job.current = inputs[index].id;
      results.push(await checkReference(inputs[index].reference_text, { crossref, llm }, inputs[index].id));
      job.done = index + 1;
    }
    const metrics = {
      generatedAt: new Date().toISOString(),
      model: config.model,
      llmBaseUrl: config.baseUrl,
      datasetFile: config.dataset,
      labelCounts: Object.fromEntries(labels.map((label) => [label, inputs.filter((input) => input.true_label === label).length])) as Record<Label, number>,
      comparatorUsedCount: results.filter((result) => result.comparatorUsed).length,
      comparatorUsedPercentage: inputs.length ? (results.filter((result) => result.comparatorUsed).length / inputs.length) * 100 : 0,
      ...calculateMetrics(inputs, results),
    };
    job.run = addBenchmarkRun({ ...metrics, isDemo: false });
    job.status = "done";
  } catch (error) {
    job.status = "error";
    job.error = error instanceof Error ? error.message : "Benchmark gagal dijalankan.";
  }
}
