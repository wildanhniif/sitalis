import { describe, expect, it } from "vitest";
import { cleanAbstract, summarizeAbstract } from "@/lib/abstract";

describe("abstract summaries", () => {
  it("removes JATS markup and decodes entities without rendering HTML", () => {
    expect(cleanAbstract("<jats:p>Deep learning &amp; reasoning &#8212; a study.</jats:p>"))
      .toBe("Deep learning & reasoning — a study.");
  });

  it("uses at most two sentences from the available abstract", () => {
    const abstract = "First finding. Second finding. Third finding.";
    expect(summarizeAbstract(abstract)).toBe("First finding. Second finding. …");
  });

  it("bounds long summaries and handles missing abstracts", () => {
    expect(summarizeAbstract(`A ${"very ".repeat(150)}long study.`, 80)?.length).toBeLessThanOrEqual(84);
    expect(summarizeAbstract(undefined)).toBeNull();
    expect(summarizeAbstract("<jats:p> </jats:p>")).toBeNull();
  });
});
