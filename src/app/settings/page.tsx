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
  return <main className="page-container max-w-4xl py-10 sm:py-12"><div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Settings2 className="size-5" /></span><div><h1 className="text-3xl font-semibold tracking-tight">Pengaturan</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Periksa konfigurasi layanan tanpa menampilkan atau menyimpan rahasia di browser.</p></div></div>
    <div className="mt-8 space-y-6"><section className="card p-5 sm:p-6"><div className="flex items-center gap-2"><Server className="size-4 text-muted-foreground" /><h2 className="text-base font-semibold">Status konfigurasi</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Nilai dibaca dari <code className="rounded bg-muted px-1 py-0.5">.env</code> saat server berjalan. Mulai ulang server setelah mengubahnya.</p><div className="mt-4 divide-y"><ConfigRow label="Email Crossref" value="CROSSREF_MAILTO · untuk polite pool" configured={config.mailto} /><ConfigRow label="URL dasar LLM" value={process.env.LLM_BASE_URL || "LLM_BASE_URL"} configured={config.baseUrl} /><ConfigRow label="Model LLM" value={process.env.LLM_MODEL || "LLM_MODEL"} configured={config.model} /><ConfigRow label="API key LLM" value="LLM_API_KEY · dapat dikosongkan untuk Ollama lokal" configured={config.apiKey} /></div><div className="mt-5 rounded-lg bg-muted p-4 text-xs leading-5 text-muted-foreground"><KeyRound className="mr-2 inline size-4" />Salin <code>.env.example</code> menjadi <code>.env</code>. Verifikasi endpoint dan model pada dokumentasi resmi provider Anda.</div></section>
      <section className="card p-5 sm:p-6"><h2 className="text-base font-semibold">Uji layanan</h2><p className="mb-5 mt-1 text-xs leading-5 text-muted-foreground">LLM diminta menghasilkan status JSON sederhana. Crossref diuji dengan satu DOI yang diketahui.</p><ConnectionSettings /></section>
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex gap-3"><FlaskConical className="mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400" /><div><h2 className="text-sm font-semibold">Mode demo</h2><p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">Lihat seluruh label dan bukti contoh tanpa API key. Demo tidak memanggil Crossref atau LLM.</p></div></div><Button variant="secondary" asChild className="shrink-0"><Link href="/result/demo">Buka laporan demo</Link></Button></section>
    </div>
  </main>;
}
