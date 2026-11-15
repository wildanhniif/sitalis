import { afterEach, describe, expect, it, vi } from "vitest";
import { splitWithAiFallback } from "@/lib/extraction/smart-segment";

const blob = "No Format Sitasi Status DOI / Catatan 1 Hochreiter, S. (1997). Long short-term memory. Neural Computation, 9(8), 1735-1780. Aktif (10.1162/neco.1997.9.8.1735) 2 Breiman, L. (2001). Random forests. Machine Learning, 45(1), 5-32. Aktif (10.1023/A:1010933404324) 3 Cortes, C. (1995). Support-vector networks. Machine Learning, 20(3), 273-297. Aktif (Paper fundamental)";
const merged = [blob];

afterEach(() => vi.unstubAllGlobals());

describe("AI segmentation fallback", () => {
  it("skips the LLM entirely when heuristic segmentation looks sane", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const clean = ["Hochreiter, S. (1997). Long short-term memory. Neural Computation, 9(8), 1735-1780."];
    const result = await splitWithAiFallback(clean[0], clean);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({ references: clean, viaAi: false, tokens: 0 });
  });

  it("uses the LLM result when merged entries are recovered", async () => {
    const references = [
      "Hochreiter, S. (1997). Long short-term memory. Neural Computation, 9(8), 1735-1780. 10.1162/neco.1997.9.8.1735",
      "Breiman, L. (2001). Random forests. Machine Learning, 45(1), 5-32. 10.1023/A:1010933404324",
      "Cortes, C. (1995). Support-vector networks. Machine Learning, 20(3), 273-297.",
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ references, tokens: 4719 }))));
    const result = await splitWithAiFallback(blob, merged);
    expect(result.viaAi).toBe(true);
    expect(result.tokens).toBe(4719);
    expect(result.references).toHaveLength(3);
  });

  it("keeps the heuristic result when the AI call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await splitWithAiFallback(blob, merged);
    expect(result.viaAi).toBe(false);
    expect(result.references).toEqual(merged);
  });
});
