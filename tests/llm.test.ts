import { describe, expect, it, vi } from "vitest";
import { extractJson, LlmClient } from "@/lib/llm/client";
import { extractDoi, parseReference } from "@/lib/llm/parser";

const parsed = { authors: ["Santoso, Andi"], year: 2023, title: "A valid title", container: "Journal", volume: null, issue: null, pages: null, doi: null, url: null, source_type: "journal" };

describe("LLM adapter and parser", () => {
  it("extracts fenced JSON and DOI without guessing", () => {
    expect(extractJson("```json\n{\"status\":\"ok\"}\n```")).toEqual({ status: "ok" });
    expect(extractDoi("https://doi.org/10.1234/ABC.1, accessed 2024")).toBe("10.1234/abc.1");
  });

  it("retries invalid structured output and uses regex DOI", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }], usage: { total_tokens: 7 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(parsed) } }], usage: { total_tokens: 12 } })));
    const llm = new LlmClient({ baseUrl: "https://llm.test/v1", apiKey: "secret", model: "model", fetcher });
    const result = await parseReference("Santoso. A valid title. https://doi.org/10.1234/ABC.1", llm);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.parsed?.doi).toBe("10.1234/abc.1");
    expect(result.tokens).toBe(19);
    expect(JSON.parse(fetcher.mock.calls[0][1].body).messages[1].content).toContain("Santoso");
  });

  it("falls back when a provider rejects JSON response format", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("unsupported", { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(parsed) } }] })));
    const llm = new LlmClient({ baseUrl: "https://llm.test/v1/", apiKey: "", model: "model", fetcher });
    const result = await parseReference("Santoso. A valid title.", llm);
    expect(result.parsed?.title).toBe("A valid title");
    expect(JSON.parse(fetcher.mock.calls[1][1].body).response_format).toBeUndefined();
  });
});
