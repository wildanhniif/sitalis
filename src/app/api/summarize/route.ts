import { z } from "zod";
import { getCrossrefClient } from "@/lib/crossref/client";
import { getLlmClient, LlmResponseError } from "@/lib/llm/client";
import { summarizeWork } from "@/lib/llm/summary";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  doi: z.string().trim().max(300).regex(/^10\.\d{4,9}\/\S+$/i, "Format DOI tidak valid."),
});

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let doi: string;
  try {
    doi = inputSchema.parse(await request.json()).doi;
  } catch {
    return Response.json({ error: "DOI yang diminta tidak valid." }, { status: 400, headers: noStore });
  }

  if (!process.env.CROSSREF_MAILTO || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    return Response.json({ error: "Konfigurasi LLM atau CROSSREF_MAILTO belum lengkap." }, { status: 503, headers: noStore });
  }

  try {
    const work = await getCrossrefClient().getByDoi(doi);
    if (!work) {
      return Response.json({ error: "Karya tidak ditemukan di Crossref." }, { status: 404, headers: noStore });
    }
    if (!work.abstract?.trim()) {
      return Response.json({ error: "Crossref tidak menyediakan abstrak untuk karya ini." }, { status: 422, headers: noStore });
    }
    const result = await summarizeWork(work.title[0] ?? null, work.abstract, getLlmClient());
    return Response.json(result, { headers: noStore });
  } catch (error) {
    const message = error instanceof LlmResponseError
      ? "LLM tidak mengembalikan ringkasan yang valid. Coba lagi atau gunakan abstrak asli."
      : error instanceof Error
        ? error.message
        : "Ringkasan AI tidak dapat dibuat.";
    return Response.json({ error: message }, { status: 502, headers: noStore });
  }
}
