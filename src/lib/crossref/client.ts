import { z } from "zod";
import { appConfig } from "@/lib/config";
import { crossrefWorkSchema, type CrossrefWork } from "@/lib/types";
import { CrossrefCache } from "./cache";
import { RateQueue } from "./queue";

const agencySchema = z.object({ message: z.object({ agency: z.object({ id: z.string(), label: z.string() }) }) });
const workResponseSchema = z.object({ message: crossrefWorkSchema });
const searchResponseSchema = z.object({ message: z.object({ items: z.array(crossrefWorkSchema) }) });

export type Agency = z.infer<typeof agencySchema>["message"]["agency"];

export class CrossrefError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CrossrefError";
  }
}

type ClientOptions = {
  email: string;
  fetcher?: typeof fetch;
  cache?: CrossrefCache;
  timeoutMs?: number;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
};

export class CrossrefClient {
  private fetcher: typeof fetch;
  private cache: CrossrefCache;
  private searchQueue = new RateQueue(3);
  private doiQueue = new RateQueue(10);
  private timeoutMs: number;
  private retries: number;
  private sleep: (ms: number) => Promise<void>;

  constructor(private options: ClientOptions) {
    if (!options.email) throw new Error("CROSSREF_MAILTO belum diisi.");
    this.fetcher = options.fetcher ?? fetch;
    this.cache = options.cache ?? new CrossrefCache();
    this.timeoutMs = options.timeoutMs ?? appConfig.crossrefTimeoutMs;
    this.retries = options.retries ?? appConfig.crossrefRetries;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async getByDoi(doi: string): Promise<CrossrefWork | null> {
    const key = `doi:${doi.toLowerCase()}`;
    const cached = await this.cache.get<CrossrefWork | "not-found">(key);
    if (cached === "not-found") return null;
    if (cached) return cached;

    const result = await this.doiQueue.run(() =>
      this.request(`/works/${encodeURIComponent(doi)}`, workResponseSchema, true),
    );
    if (!result) {
      await this.cache.set(key, "not-found");
      return null;
    }
    await this.cache.set(key, result.message);
    return result.message;
  }

  async getAgency(doi: string): Promise<Agency | null> {
    const key = `agency:${doi.toLowerCase()}`;
    const cached = await this.cache.get<Agency | "not-found">(key);
    if (cached === "not-found") return null;
    if (cached) return cached;
    const result = await this.doiQueue.run(() =>
      this.request(`/works/${encodeURIComponent(doi)}/agency`, agencySchema, true),
    );
    await this.cache.set(key, result?.message.agency ?? "not-found");
    return result?.message.agency ?? null;
  }

  async search(referenceText: string): Promise<CrossrefWork[]> {
    const key = `search:${referenceText}`;
    const cached = await this.cache.get<CrossrefWork[]>(key);
    if (cached) return cached;
    const query = new URLSearchParams({
      "query.bibliographic": referenceText,
      rows: "5",
      select: "DOI,title,author,issued,container-title,type,volume,issue,page,abstract",
      mailto: this.options.email,
    });
    const result = await this.searchQueue.run(() =>
      this.request(`/works?${query.toString()}`, searchResponseSchema),
    );
    const items = result?.message.items ?? [];
    await this.cache.set(key, items);
    return items;
  }

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    allowNotFound = false,
  ): Promise<T | null> {
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const url = new URL(`https://api.crossref.org${path}`);
        url.searchParams.set("mailto", this.options.email);
        const response = await this.fetcher(url.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": `CekSitasi/1.0 (mailto:${this.options.email})`,
          },
          signal: controller.signal,
        });
        if (response.status === 404 && allowNotFound) return null;
        if (response.status === 429 || response.status >= 500) {
          if (attempt < this.retries) {
            const retryAfter = Number(response.headers.get("retry-after"));
            const delay = Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : 500 * 2 ** attempt;
            await this.sleep(delay);
            continue;
          }
        }
        if (!response.ok) throw new CrossrefError(`Crossref mengembalikan HTTP ${response.status}.`, response.status);
        return schema.parse(await response.json());
      } catch (error) {
        if (error instanceof CrossrefError) throw error;
        if (error instanceof z.ZodError) throw new CrossrefError("Format respons Crossref tidak dikenali.");
        if (attempt >= this.retries) {
          const message = error instanceof Error && error.name === "AbortError"
            ? "Crossref tidak merespons dalam 15 detik."
            : "Tidak dapat terhubung ke Crossref.";
          throw new CrossrefError(message);
        }
        await this.sleep(500 * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }
}

let sharedClient: CrossrefClient | null = null;
export function getCrossrefClient() {
  if (!sharedClient) sharedClient = new CrossrefClient({ email: process.env.CROSSREF_MAILTO ?? "" });
  return sharedClient;
}
