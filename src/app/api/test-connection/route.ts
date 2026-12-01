import { z } from "zod";
import { getCrossrefClient } from "@/lib/crossref/client";
import { getLlmClient } from "@/lib/llm/client";
import { testLlm } from "@/lib/llm/parser";

export const runtime = "nodejs";
const schema = z.object({ target: z.enum(["llm", "crossref"]) });

export async function POST(request: Request) {
  try {
    const { target } = schema.parse(await request.json());
    const started = Date.now();
    if (target === "llm") {
      if (!process.env.LLM_BASE_URL || !process.env.LLM_MODEL) throw new Error("LLM_BASE_URL dan LLM_MODEL belum diisi.");
      await testLlm(getLlmClient());
      return Response.json({ message: `LLM terhubung (${Date.now() - started} ms).` });
    }
    if (!process.env.CROSSREF_MAILTO) throw new Error("CROSSREF_MAILTO belum diisi.");
    const work = await getCrossrefClient().getByDoi("10.1038/nature14539");
    if (!work) throw new Error("Crossref dapat dihubungi, tetapi DOI uji tidak ditemukan.");
    return Response.json({ message: `Crossref terhubung: ${work.title[0]} (${Date.now() - started} ms).` });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Pengujian koneksi gagal." }, { status: 400 });
  }
}
