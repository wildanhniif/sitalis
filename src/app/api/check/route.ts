import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCrossrefClient } from "@/lib/crossref/client";
import { getLlmClient } from "@/lib/llm/client";
import { checkReference } from "@/lib/pipeline/check";
import { saveReport } from "@/lib/server/reports";
import type { CheckResult, Report } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const inputSchema = z.object({
  references: z.array(z.string().trim().min(15).max(30_000)).min(1).max(200),
  title: z.string().trim().max(200).default("Pemeriksaan referensi"),
  source: z.enum(["upload", "paste"]).default("paste"),
});

export async function POST(request: Request) {
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Daftar referensi tidak valid. Periksa entri kosong atau batas 200 referensi." }, { status: 400 });
  }
  if (!process.env.CROSSREF_MAILTO || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    return Response.json({ error: "Konfigurasi LLM atau CROSSREF_MAILTO belum lengkap. Isi .env atau buka mode demo." }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const results: CheckResult[] = [];
      const report: Report = { id: randomUUID(), title: input.title || "Pemeriksaan referensi", createdAt: new Date().toISOString(), source: input.source, results };
      send({ type: "started", total: input.references.length, reportId: report.id });
      try {
        for (let index = 0; index < input.references.length; index++) {
          let result: CheckResult;
          try {
            result = await checkReference(input.references[index], { crossref: getCrossrefClient(), llm: getLlmClient() });
          } catch (error) {
            result = { id: randomUUID(), referenceText: input.references[index], parsed: null, label: "unverified", reason: "Pemeriksaan terhenti karena layanan tidak tersedia.", evidence: error instanceof Error ? error.message : "Kesalahan layanan.", candidates: [], bestCandidate: null, comparatorUsed: false, elapsedMs: 0, tokens: 0 };
          }
          results.push(result);
          send({ type: "result", index, result });
        }
        saveReport(report);
        send({ type: "done", report });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "Pemeriksaan gagal." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" } });
}
