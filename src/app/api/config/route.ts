import {
  clearRuntimeConfig,
  getEffectiveConfig,
  maskApiKey,
  readRuntimeConfig,
  runtimeConfigSchema,
  writeRuntimeConfig,
} from "@/lib/runtime-config";

export const runtime = "nodejs";

const updateSchema = runtimeConfigSchema.partial();

function publicConfig() {
  const config = getEffectiveConfig();
  return {
    crossrefMailto: config.crossrefMailto,
    llmBaseUrl: config.llmBaseUrl,
    llmModel: config.llmModel,
    llmApiKeyMasked: maskApiKey(config.llmApiKey),
    hasApiKey: Boolean(config.llmApiKey),
    source: readRuntimeConfig() ? "runtime" : "env",
  };
}

export async function GET() {
  return Response.json(publicConfig());
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const pesan = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return Response.json({ error: pesan || "Data tidak valid." }, { status: 400 });
    }
    const current = readRuntimeConfig() ?? { crossrefMailto: "", llmBaseUrl: "", llmApiKey: "", llmModel: "" };
    const next = { ...current, ...parsed.data };
    // API key kosong berarti tetap pakai yang lama (jangan menimpa dengan kosong)
    if (!parsed.data.llmApiKey) next.llmApiKey = current.llmApiKey;
    writeRuntimeConfig(runtimeConfigSchema.parse(next));
    return Response.json(publicConfig());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gagal menyimpan konfigurasi." }, { status: 500 });
  }
}

export async function DELETE() {
  clearRuntimeConfig();
  return Response.json(publicConfig());
}
