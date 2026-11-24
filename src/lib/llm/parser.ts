import { z } from "zod";
import { parsedReferenceSchema, type ParsedReference } from "@/lib/types";
import { extractJson, LlmClient, LlmResponseError } from "./client";
import { buildSkillPrompt, type StoredSkill } from "./skill";

const comparatorSchema = z.object({ same_work: z.boolean(), plausibly_real: z.boolean().default(false), differing_fields: z.array(z.string()), reason: z.string() });

export function extractDoi(text: string): string | null {
  const match = text.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match?.[0].replace(/[.,;\])}]+$/g, "").toLowerCase() ?? null;
}

export type ParseOutcome = { parsed: ParsedReference | null; error?: string; tokens: number };

export async function parseReference(referenceText: string, llm: LlmClient, skill?: StoredSkill): Promise<ParseOutcome> {
  let tokens = 0;
  let lastError = "";
  const doi = extractDoi(referenceText);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await llm.chat(buildSkillPrompt("parser", skill), referenceText, parsedReferenceSchema);
      tokens += response.tokens;
      const parsed = parsedReferenceSchema.parse(response.data);
      if (doi) parsed.doi = doi;
      return { parsed, tokens };
    } catch (error) {
      if (error instanceof LlmResponseError) tokens += error.tokens;
      lastError = error instanceof Error ? error.message : "Respons LLM tidak valid.";
    }
  }
  return { parsed: null, error: `Gagal memparse setelah 3 percobaan: ${lastError}`, tokens };
}

export async function compareWorks(entry: ParsedReference, candidate: unknown, llm: LlmClient, skill?: StoredSkill) {
  const response = await llm.chat(buildSkillPrompt("comparator", skill), JSON.stringify({ entry, crossref_candidate: candidate }), comparatorSchema);
  return { ...comparatorSchema.parse(response.data), tokens: response.tokens };
}

export async function testLlm(llm: LlmClient) {
  const schema = z.object({
    status: z.string().transform((val) => val.replace(/^[#\s]+/, "").toLowerCase()),
  }).refine((data) => data.status === "ok", {
    message: "Field status harus bernilai 'ok'",
  });
  const result = await llm.chat(
    "You are a connection test assistant. Output valid JSON only: {\"status\": \"ok\"}. Do not include markdown, comments, or extra symbols.",
    "ping",
    schema
  );
  return result.data;
}

export { extractJson };
