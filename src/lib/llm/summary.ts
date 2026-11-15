import { z } from "zod";
import { cleanAbstract } from "@/lib/abstract";
import type { LlmClient } from "./client";
import { buildSkillPrompt, type StoredSkill } from "./skill";

const summarySchema = z.object({
  summary: z.string().trim().min(20).max(600),
});


export const maxSummaryAbstractChars = 5_000;
export const maxSummaryTokens = 180;

export async function summarizeWork(title: string | null, abstract: string, llm: LlmClient, skill?: StoredSkill) {
  const cleaned = cleanAbstract(abstract);
  if (!cleaned) throw new Error("Abstrak Crossref tidak berisi teks yang dapat diringkas.");
  const response = await llm.chat(
    buildSkillPrompt("summarizer", skill),
    JSON.stringify({ title, abstract: cleaned.slice(0, maxSummaryAbstractChars) }),
    summarySchema,
    true,
    maxSummaryTokens,
  );
  const data = summarySchema.parse(response.data);
  return { summary: data.summary, tokens: response.tokens };
}
