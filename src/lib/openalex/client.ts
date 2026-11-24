import { getEffectiveConfig } from "@/lib/runtime-config";
import { z } from "zod";
import { crossrefWorkSchema, type CrossrefWork } from "@/lib/types";

/**
 * Klien OpenAlex sebagai indeks pelengkap: hanya dipanggil ketika Crossref tidak
 * menemukan kandidat yang memadai, khususnya untuk preprint dan karya klasik yang
 * tidak terdeposit di Crossref. Hasil dipetakan ke bentuk CrossrefWork agar bisa
 * dinilai oleh matcher yang sama.
 */

const openalexWorkSchema = z.object({
  id: z.string(),
  doi: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
  publication_year: z.number().nullable().default(null),
  authorships: z.array(z.object({ author: z.object({ display_name: z.string().default("") }).default({ display_name: "" }) })).default([]),
  primary_location: z.object({ source: z.object({ display_name: z.string().nullable().default(null) }).nullable().default(null) }).nullable().default(null),
});

const openalexResponseSchema = z.object({ results: z.array(z.unknown()).default([]) });

export class OpenAlexError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OpenAlexError";
  }
}

type OpenAlexOptions = {
  email: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
};

function mapWork(raw: unknown): CrossrefWork | null {
  const parsed = openalexWorkSchema.safeParse(raw);
  if (!parsed.success) return null;
  const work = parsed.data;
  const authors = work.authorships
    .map((authorship) => authorship.author.display_name.trim())
    .filter(Boolean)
    .map((name) => {
      const parts = name.split(/\s+/);
      const family = parts.pop() ?? "";
      return { family, given: parts.join(" ") };
    });
  const doi = work.doi?.replace(/^https:\/\/doi\.org\//i, "").toLowerCase() ?? null;
  return crossrefWorkSchema.parse({
    DOI: doi ?? `openalex/${work.id.split("/").pop()}`,
    title: work.title ? [work.title] : [],
    author: authors,
    issued: work.publication_year ? { "date-parts": [[work.publication_year]] } : undefined,
    "container-title": work.primary_location?.source?.display_name ? [work.primary_location.source.display_name] : undefined,
  });
}

export class OpenAlexClient {
  private fetcher: typeof fetch;
  private timeoutMs: number;
  private retries: number;
  private sleep: (ms: number) => Promise<void>;

  constructor(private options: OpenAlexOptions) {
    if (!options.email) throw new Error("CROSSREF_MAILTO belum diisi (dipakai untuk polite pool OpenAlex).");
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.retries = options.retries ?? 2;
    this.options.sleep ??= (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    this.sleep = this.options.sleep;
  }

  async search(referenceText: string): Promise<CrossrefWork[]> {
    const query = new URLSearchParams({
      search: referenceText.slice(0, 500),
      per_page: "5",
      mailto: this.options.email,
    });
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetcher(`https://api.openalex.org/works?${query.toString()}`, {
          headers: { "User-Agent": `Sitalis/1.0 (mailto:${this.options.email})` },
          signal: controller.signal,
        });
        if (response.status === 429 || response.status >= 500) {
          if (attempt < this.retries) {
            await this.sleep(500 * 2 ** attempt);
            continue;
          }
        }
        if (!response.ok) throw new OpenAlexError(`OpenAlex mengembalikan HTTP ${response.status}.`, response.status);
        const parsed = openalexResponseSchema.parse(await response.json());
        return parsed.results.map(mapWork).flatMap((work) => (work ? [work] : []));
      } catch {
        if (attempt >= this.retries) return [];
        await this.sleep(500 * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    return [];
  }
}

let sharedClient: OpenAlexClient | null = null;
let sharedEmail: string | null = null;
export function getOpenAlexClient() {
  const email = getEffectiveConfig().crossrefMailto;
  if (!sharedClient || sharedEmail !== email) {
    sharedClient = new OpenAlexClient({ email });
    sharedEmail = email;
  }
  return sharedClient;
}
