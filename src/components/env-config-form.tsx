"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PublicConfig = {
  crossrefMailto: string;
  llmBaseUrl: string;
  llmModel: string;
  llmApiKeyMasked: string;
  hasApiKey: boolean;
  source: "runtime" | "env";
};

type FormState = {
  crossrefMailto: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
};

const initialForm: FormState = { crossrefMailto: "", llmBaseUrl: "", llmApiKey: "", llmModel: "" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EnvConfigForm() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message?: string }>({ state: "idle" });
  const [hasRuntime, setHasRuntime] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/config", { cache: "no-store" });
    const data: PublicConfig = await response.json();
    setConfig(data);
    setHasRuntime(data.source === "runtime");
    setForm({
      crossrefMailto: data.crossrefMailto,
      llmBaseUrl: data.llmBaseUrl,
      llmModel: data.llmModel,
      llmApiKey: "",
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const set = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus({ state: "idle" });
  };

  const save = async () => {
    setStatus({ state: "loading" });
    try {
      const payload: Record<string, string> = {
        crossrefMailto: form.crossrefMailto.trim(),
        llmBaseUrl: form.llmBaseUrl.trim(),
        llmModel: form.llmModel.trim(),
      };
      if (form.llmApiKey.trim()) payload.llmApiKey = form.llmApiKey.trim();
      const response = await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConfig(data);
      setHasRuntime(true);
      setForm((current) => ({ ...current, llmApiKey: "" }));
      setStatus({ state: "success", message: "Konfigurasi tersimpan dan langsung berlaku tanpa restart." });
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Gagal menyimpan." });
    }
  };

  const reset = async () => {
    setStatus({ state: "loading" });
    try {
      const response = await fetch("/api/config", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConfig(data);
      setHasRuntime(false);
      setForm({
        crossrefMailto: data.crossrefMailto,
        llmBaseUrl: data.llmBaseUrl,
        llmModel: data.llmModel,
        llmApiKey: "",
      });
      setStatus({ state: "success", message: "Konfigurasi web dihapus; kembali membaca berkas .env." });
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Gagal menghapus." });
    }
  };

  if (!config) {
    return <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />Memuat konfigurasi…</div>;
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Crossref Mailto (Polite Pool)" hint="Email aktif untuk polite pool Crossref.">
          <Input value={form.crossrefMailto} onChange={(e) => set("crossrefMailto", e.target.value)} placeholder="nama@example.com" type="email" autoComplete="off" />
        </Field>
        <Field label="Base URL Provider LLM" hint="Endpoint kompatibel OpenAI, tanpa /chat/completions.">
          <Input value={form.llmBaseUrl} onChange={(e) => set("llmBaseUrl", e.target.value)} placeholder="https://api.groq.com/openai/v1" autoComplete="off" />
        </Field>
        <Field label="Kredensial API Key" hint={config.hasApiKey ? `Terisi (${config.llmApiKeyMasked}). Kosongkan untuk memakai yang sekarang.` : "Dapat dikosongkan untuk Ollama lokal."}>
          <Input value={form.llmApiKey} onChange={(e) => set("llmApiKey", e.target.value)} placeholder={config.hasApiKey ? "•••• (tidak berubah)" : "isi_api_key_anda"} type="password" autoComplete="new-password" />
        </Field>
        <Field label="Model Spesifik LLM" hint="Nama model sesuai dokumentasi provider.">
          <Input value={form.llmModel} onChange={(e) => set("llmModel", e.target.value)} placeholder="llama-3.3-70b-versatile" autoComplete="off" />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button onClick={() => void save()} disabled={status.state === "loading"}>
          {status.state === "loading" ? <Loader2 className="animate-spin" /> : <Save />}Simpan Konfigurasi
        </Button>
        {hasRuntime && (
          <Button variant="secondary" onClick={() => void reset()} disabled={status.state === "loading"}>
            <RotateCcw />Kembali ke .env
          </Button>
        )}
        <span className="text-[11px] text-muted-foreground">
          Sumber aktif: {hasRuntime ? "konfigurasi web (data/runtime-config.json)" : "berkas .env"}
        </span>
      </div>
      <div className="mt-3 min-h-5 text-xs leading-5" aria-live="polite">
        {status.state === "success" && <p className="text-emerald-700 dark:text-emerald-400">{status.message}</p>}
        {status.state === "error" && <p className="text-red-700 dark:text-red-400">{status.message}</p>}
      </div>
    </div>
  );
}
