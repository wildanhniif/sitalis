import { z } from "zod";

export type ChatResponse = { content: string; tokens: number };

export class LlmResponseError extends Error {
  constructor(message: string, public tokens: number, options?: ErrorOptions) {
    super(message, options);
    this.name = "LlmResponseError";
  }
}

type LlmOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetcher?: typeof fetch;
};

export function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[{[]/);
    if (start < 0) throw new Error("Respons LLM tidak berisi JSON.");
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (end <= start) throw new Error("JSON dari LLM tidak lengkap.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export class LlmClient {
  private fetcher: typeof fetch;

  constructor(private options: LlmOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async chat(system: string, user: string, schema: z.ZodType, jsonMode = true, maxTokens?: number): Promise<{ data: unknown; tokens: number }> {
    const base = this.options.baseUrl.replace(/\/$/, "");
    if (!base || !this.options.model) throw new Error("Konfigurasi LLM belum lengkap.");
    const response = await this.fetcher(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature: 0,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      if (jsonMode && (response.status === 400 || response.status === 422)) return this.chat(system, user, schema, false, maxTokens);
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`LLM mengembalikan HTTP ${response.status}. ${detail}`);
    }
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Respons LLM tidak berisi konten teks.");
    const tokens = Number(payload.usage?.total_tokens ?? 0);
    try {
      return { data: schema.parse(extractJson(content)), tokens };
    } catch (error) {
      throw new LlmResponseError("Respons LLM tidak berisi JSON yang sesuai skema.", tokens, { cause: error });
    }
  }
}

let shared: LlmClient | null = null;
export function getLlmClient() {
  if (!shared) {
    shared = new LlmClient({
      baseUrl: process.env.LLM_BASE_URL ?? "",
      apiKey: process.env.LLM_API_KEY ?? "",
      model: process.env.LLM_MODEL ?? "",
    });
  }
  return shared;
}
