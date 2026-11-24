import { SkillEditor } from "@/components/skill-editor";
import { FlaskConical, Server, Settings2 } from "lucide-react";
import Link from "next/link";
import { ConnectionSettings } from "@/components/connection-settings";
import { EnvConfigForm } from "@/components/env-config-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
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
        <SkillEditor />
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Server className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Parameter Environment
            </h2>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
            Isi parameter koneksi langsung di sini tanpa mengedit berkas .env atau me-restart server. Perubahan tersimpan di server dan langsung dipakai pemeriksaan berikutnya.
          </p>
          <div className="mt-4">
            <EnvConfigForm />
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
