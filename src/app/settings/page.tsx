import { Check, FlaskConical, KeyRound, Minus, Server, Settings2 } from "lucide-react";
import Link from "next/link";
import { ConnectionSettings } from "@/components/connection-settings";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";
function ConfigRow({ label, value, configured }: { label: string; value: string; configured: boolean }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="font-medium">{label}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{value}</p></div><span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${configured ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>{configured ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}{configured ? "Terisi" : "Belum diisi"}</span></div>;
}
export default function SettingsPage() {
  const config = {
    mailto: Boolean(process.env.CROSSREF_MAILTO),
    baseUrl: Boolean(process.env.LLM_BASE_URL),
    model: Boolean(process.env.LLM_MODEL),
    apiKey: Boolean(process.env.LLM_API_KEY),
  };
  return (
    <main className="page-container max-w-4xl py-10 sm:py-12">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-surface-subtle text-foreground shadow-subtle">
          <Settings2 className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Pengaturan & Integrasi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Periksa parameter koneksi API dan uji kelancaran komunikasi ke Crossref dan LLM lokal/cloud.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Server className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Parameter Environment (.env)
            </h2>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
            Konfigurasi berikut dibaca langsung dari server runtime saat inisialisasi aplikasi.
          </p>
          <div className="mt-4 divide-y divide-border/60">
            <ConfigRow label="Crossref Mailto (Polite Pool)" value="CROSSREF_MAILTO · untuk polite pool" configured={config.mailto} />
            <ConfigRow label="Base URL Provider LLM" value={process.env.LLM_BASE_URL || "LLM_BASE_URL"} configured={config.baseUrl} />
            <ConfigRow label="Model Spesifik LLM" value={process.env.LLM_MODEL || "LLM_MODEL"} configured={config.model} />
            <ConfigRow label="Kredensial API Key" value="LLM_API_KEY · dapat dikosongkan untuk Ollama lokal" configured={config.apiKey} />
          </div>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border/80 bg-surface-subtle p-3.5 text-xs text-muted-foreground">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-foreground" />
            <span>
              Untuk memperbarui variabel lingkungan, sesuaikan berkas <code className="font-mono text-foreground font-medium">.env</code> lalu restart dev server Next.js.
            </span>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Diagnostik Jaringan & Konektivitas
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Uji respons real-time endpoint LLM dan koneksi publik Crossref API.
            </p>
          </div>
          <div className="mt-5">
            <ConnectionSettings />
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-subtle border border-border/70 text-foreground">
              <FlaskConical className="size-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Dataset Contoh Demo</h2>
              <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
                Gunakan data simulasi jika Anda ingin menguji seluruh perilaku tampilan dan filter tanpa memerlukan koneksi model aktif.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild className="shrink-0">
            <Link href="/result/demo">Buka Laporan Demo</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
