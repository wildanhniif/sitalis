import { z } from "zod";
import { LlmClient } from "./client";

export const segmentedReferencesSchema = z.object({
  references: z.array(z.string().trim().min(10).max(4000)).max(300),
});

const segmenterSystem = [
  "You split a messy bibliography (pasted from a document or a table) into individual reference entries.",
  "Rules:",
  "1. Output one entry per cited work, preserving the original order.",
  "2. Copy the bibliographic text of each entry verbatim. Never translate, correct, complete, merge, or invent content.",
  "3. Drop document furniture: table headers, column labels (No, Format, Status, Catatan, Keterangan), page numbers, and numbering such as '1.' or '[1]'.",
  "4. If a status column carries a DOI or URL that belongs to the entry, keep it at the end of that entry.",
  "5. If the text is not a bibliography, return an empty array.",
  '6. Return JSON only, shaped exactly like {"references": ["entry one", "entry two"]}.',
].join("\n");

export async function segmentWithLlm(text: string, llm: LlmClient) {
  const response = await llm.chat(segmenterSystem, text, segmentedReferencesSchema, true, 4000);
  const references = segmentedReferencesSchema
    .parse(response.data)
    .references.map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 15);
  return { references, tokens: response.tokens };
}
