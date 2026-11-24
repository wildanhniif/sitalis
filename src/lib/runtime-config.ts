import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * Konfigurasi runtime yang bisa diubah dari halaman Pengaturan tanpa mengedit
 * .env atau me-restart server. Disimpan di data/runtime-config.json (gitignored).
 * Prioritas: runtime-config.json > process.env (.env).
 */

export const runtimeConfigSchema = z.object({
  crossrefMailto: z.string().email("Email tidak valid.").or(z.literal("")),
  llmBaseUrl: z.string().url("Base URL harus URL valid (contoh: https://api.groq.com/openai/v1).").or(z.literal("")),
  llmApiKey: z.string(),
  llmModel: z.string(),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

const CONFIG_PATH = path.join(process.cwd(), "data", "runtime-config.json");

export const EMPTY_RUNTIME_CONFIG: RuntimeConfig = {
  crossrefMailto: "",
  llmBaseUrl: "",
  llmApiKey: "",
  llmModel: "",
};

/** Baca konfigurasi runtime dari berkas. Return null jika berkas tidak ada atau rusak. */
export function readRuntimeConfig(): RuntimeConfig | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = runtimeConfigSchema.parse(JSON.parse(raw));
    return parsed;
  } catch {
    return null;
  }
}

/** Tulis konfigurasi runtime ke berkas. */
export function writeRuntimeConfig(config: RuntimeConfig): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
}

/** Hapus berkas konfigurasi runtime (kembali ke .env). */
export function clearRuntimeConfig(): void {
  try {
    fs.rmSync(CONFIG_PATH, { force: true });
  } catch {
    // berkas mungkin sudah tidak ada
  }
}

/** Nilai efektif: runtime config jika ada, kalau tidak process.env. */
export function getEffectiveConfig(): {
  crossrefMailto: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
} {
  const rt = readRuntimeConfig();
  return {
    crossrefMailto: rt?.crossrefMailto || process.env.CROSSREF_MAILTO || "",
    llmBaseUrl: rt?.llmBaseUrl || process.env.LLM_BASE_URL || "",
    llmApiKey: rt?.llmApiKey || process.env.LLM_API_KEY || "",
    llmModel: rt?.llmModel || process.env.LLM_MODEL || "",
  };
}

/** Sembunyikan API key untuk ditampilkan di UI: hanya 4 karakter terakhir. */
export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return "•".repeat(Math.max(4, key.length - 8)) + key.slice(-4);
}
