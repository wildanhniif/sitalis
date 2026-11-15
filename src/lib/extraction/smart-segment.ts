import { needsAiSegmentation } from "./segment";

export type SegmentationResult = { references: string[]; viaAi: boolean; tokens: number };

/** Pakai hasil AI hanya jika pemisahan heuristik dianggap meragukan dan AI menghasilkan lebih banyak entri. */
export async function splitWithAiFallback(section: string, heuristic: string[]): Promise<SegmentationResult> {
  if (!needsAiSegmentation(section, heuristic)) return { references: heuristic, viaAi: false, tokens: 0 };
  try {
    const response = await fetch("/api/segment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: section.slice(0, 20_000) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Perapian otomatis gagal.");
    const references: string[] = Array.isArray(data.references) ? data.references.filter((item: unknown): item is string => typeof item === "string") : [];
    if (references.length > heuristic.length) return { references, viaAi: true, tokens: Number(data.tokens ?? 0) };
    return { references: heuristic, viaAi: false, tokens: 0 };
  } catch {
    return { references: heuristic, viaAi: false, tokens: 0 };
  }
}
