import { z } from "zod";
import { cleanAbstract } from "@/lib/abstract";
import type { LlmClient } from "./client";

const summarySchema = z.object({
  summary: z.string().trim().min(20).max(600),
});

const summarySystem = `Summarize the supplied Crossref abstract in Indonesian. Use only facts stated in the supplied title and abstract. Do not infer methods, results, quality, or relevance that are not stated. Write one or two concise sentences for a student who wants to know what the work is about. Never claim that the cited manuscript supports the work. Return JSON only with the key summary (string).`;

export const maxSummaryAbstractChars = 5_000;
export const maxSummaryTokens = 180;

export async function summarizeWork(title: string | null, abstract: string, llm: LlmClient) {
  const cleaned = cleanAbstract(abstract);
  if (!cleaned) throw new Error("Abstrak Crossref tidak berisi teks yang dapat diringkas.");
  const response = await llm.chat(
    summarySystem,
    JSON.stringify({ title, abstract: cleaned.slice(0, maxSummaryAbstractChars) }),
    summarySchema,
    true,
    maxSummaryTokens,
  );
  const data = summarySchema.parse(response.data);
  return { summary: data.summary, tokens: response.tokens };
}
