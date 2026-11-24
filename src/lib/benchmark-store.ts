import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { benchmarkRunSchema } from "./benchmark";

/**
 * Penyimpanan run benchmark di sisi server: data/benchmark-runs.json.
 * Dipakai bersama oleh leaderboard /benchmark dan endpoint impor/hasil uji.
 * Jalur berkas bisa di-inject untuk pengujian agar tidak menyentuh data/ asli.
 */

const DEFAULT_STORE_PATH = path.join(process.cwd(), "data", "benchmark-runs.json");
export const maxStoredBenchmarkRuns = 50;

const storedRunSchema = benchmarkRunSchema.extend({
  id: z.string().min(1),
  importedAt: z.string().min(1),
  isDemo: z.boolean().default(false),
});

export type StoredBenchmarkRun = z.infer<typeof storedRunSchema>;

function writeRuns(runs: StoredBenchmarkRun[], file: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(runs, null, 2), "utf8");
}

/** Baca semua run. Berkas hilang/rusak/isi tidak valid dikembalikan sebagai daftar kosong. */
export function listBenchmarkRuns(file: string = DEFAULT_STORE_PATH): StoredBenchmarkRun[] {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8"));
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => storedRunSchema.parse(entry));
  } catch {
    return [];
  }
}

/** Tambah run baru di urutan teratas dengan id dan waktu impor baru. */
export function addBenchmarkRun(run: Omit<StoredBenchmarkRun, "id" | "importedAt">, file: string = DEFAULT_STORE_PATH): StoredBenchmarkRun {
  const candidate: StoredBenchmarkRun = { ...run, id: randomUUID(), importedAt: new Date().toISOString() };
  const runs = [candidate, ...listBenchmarkRuns(file)].slice(0, maxStoredBenchmarkRuns);
  writeRuns(runs, file);
  return candidate;
}

/** Hapus satu run berdasarkan id, kembalikan daftar run tersisa. */
export function removeBenchmarkRun(runId: string, file: string = DEFAULT_STORE_PATH): StoredBenchmarkRun[] {
  const runs = listBenchmarkRuns(file).filter((run) => run.id !== runId);
  writeRuns(runs, file);
  return runs;
}

/** Urutan leaderboard: macro-F1 tertinggi dulu, seri dipecah rata-rata token terkecil. */
export function rankBenchmarkRuns(runs: StoredBenchmarkRun[]): StoredBenchmarkRun[] {
  return [...runs].sort((a, b) => b.macroF1 - a.macroF1 || a.averageTokensPerReference - b.averageTokensPerReference);
}
