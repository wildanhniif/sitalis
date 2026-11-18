import { z } from "zod";
import { parsedReferenceSchema, type ParsedReference } from "@/lib/types";
import { extractJson, LlmClient, LlmResponseError } from "./client";

const parserSystem = `You extract bibliography metadata. Return JSON only with keys authors (array of full names as written), year, title, container, volume, issue, pages, doi, url, source_type. Allowed source_type: journal, conference, book, thesis, report, regulation, web, other. Use null when a value is not stated. Never guess, correct, complete, or use memory.`;
const comparatorSchema = z.object({ same_work: z.boolean(), differing_fields: z.array(z.string()), reason: z.string() });
const comparatorSystem = `Compare the supplied reference entry and Crossref record. Decide only whether they describe the same work from the supplied data. Never judge existence from memory. Return JSON only: same_work (boolean), differing_fields (string array), reason (brief string).`;

export function extractDoi(text: string): string | null {
  const match = text.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match?.[0].replace(/[.,;\])}]+$/g, "").toLowerCase() ?? null;
}

export type ParseOutcome = { parsed: ParsedReference | null; error?: string; tokens: number };

export async function parseReference(referenceText: string, llm: LlmClient): Promise<ParseOutcome> {
  let tokens = 0;
  let lastError = "";
  const doi = extractDoi(referenceText);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await llm.chat(parserSystem, referenceText, parsedReferenceSchema);
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

export async function compareWorks(entry: ParsedReference, candidate: unknown, llm: LlmClient) {
  const response = await llm.chat(comparatorSystem, JSON.stringify({ entry, crossref_candidate: candidate }), comparatorSchema);
  return { ...comparatorSchema.parse(response.data), tokens: response.tokens };
}

export async function testLlm(llm: LlmClient) {
  const schema = z.object({ status: z.literal("ok") });
  const result = await llm.chat("Return JSON only: {\"status\":\"ok\"}", "Connection test", schema);
  return result.data;
}

export { extractJson };
