import { z } from "zod";
import { getLlmClient } from "@/lib/llm/client";
import { segmentWithLlm } from "@/lib/llm/segmenter";

export const runtime = "nodejs";
export const maxDuration = 120;

const inputSchema = z.object({ text: z.string().trim().min(20).max(20_000) });
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let text: string;
  try {
    text = inputSchema.parse(await request.json()).text;
  } catch {
    return Response.json({ error: "Teks terlalu panjang (maksimum 20.000 karakter) atau tidak valid untuk dirapikan otomatis." }, { status: 400, headers: noStore });
  }
  if (!process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    return Response.json({ error: "Konfigurasi LLM belum lengkap." }, { status: 503, headers: noStore });
  }
  try {
    const result = await segmentWithLlm(text, getLlmClient());
    if (!result.references.length) {
      return Response.json({ error: "AI tidak menemukan entri referensi pada teks ini. Pisahkan entri secara manual." }, { status: 422, headers: noStore });
    }
    return Response.json(result, { headers: noStore });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Perapian otomatis gagal." }, { status: 502, headers: noStore });
  }
}
