import { Award, BarChart3, CheckCircle2, Clock, FileSpreadsheet, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BenchmarkLeaderboard } from "@/components/benchmark-leaderboard";

export const metadata = {
  title: "Hasil Benchmark Empiris (60 Entri)",
  description: "Hasil evaluasi empiris sistem Sitalis pada 60 sampel referensi uji terstandar Bab 4.",
};

const perLabelData = [
  {
    label: "Valid",
    desc: "Karya nyata terdaftar dengan metadata cocok",
    precision: "100.0%",
    recall: "53.3%",
    f1: "0.6957",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/25",
  },
  {
    label: "Sebagian Valid",
    desc: "Karya terdaftar namun ada perbedaan atribut metadata",
    precision: "71.4%",
    recall: "66.7%",
    f1: "0.6897",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/25",
  },
  {
    label: "Diduga Halusinasi",
    desc: "Sitasi palsu / tidak terdaftar di indeks ilmiah",
    precision: "68.2%",
    recall: "100.0%",
    f1: "0.8108",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-500/10 border-rose-500/25",
  },
  {
    label: "Belum Terverifikasi",
    desc: "Karya di luar indeks primer (buku, tesis lokal, regulasi RI)",
    precision: "93.8%",
    recall: "100.0%",
    f1: "0.9677",
    color: "text-zinc-700 dark:text-zinc-300",
    bg: "bg-zinc-500/10 border-zinc-500/25",
  },
];

export default function BenchmarkPage() {
  return (
    <main className="pb-16">
      <section className="relative border-b border-border/80 bg-surface-subtle/40 subtle-grid">
        <div className="page-container max-w-5xl py-10 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-subtle">
                <BarChart3 className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                    Hasil Benchmark Empiris
                  </h1>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Live Verified
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Uji performa 60 referensi seimbang (Bab 4 Skripsi) via live API LLM dan Crossref.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/settings">Pengaturan API</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/">Uji Referensi Baru</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container max-w-5xl py-10 space-y-10">
        <BenchmarkLeaderboard />

        {/* Metrik Utama 4 Kotak */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Macro-F1 Score</span>
              <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">79.10%</p>
            <p className="mt-1 text-[11px] text-muted-foreground">0.7910 lintas 4 kategori</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Akurasi Sistem</span>
              <CheckCircle2 className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">80.00%</p>
            <p className="mt-1 text-[11px] text-muted-foreground">48 dari 60 entri tepat</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Recall Halusinasi</span>
              <ShieldAlert className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-rose-700 dark:text-rose-400">100%</p>
            <p className="mt-1 text-[11px] text-muted-foreground">15/15 karya fiktif tertangkap</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Waktu & Komputasi</span>
              <Clock className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">3.95s</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Rata-rata per referensi</p>
          </div>
        </div>

        {/* Tabel Kinerja per Kelas */}
        <section className="card p-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Kinerja per Kategori Klasifikasi
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rincian nilai Precision, Recall, dan F1-Score dari dataset benchmark 60 sampel.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Precision</th>
                  <th className="pb-3">Recall</th>
                  <th className="pb-3">F1-Score</th>
                  <th className="pb-3 text-right">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {perLabelData.map((row) => (
                  <tr key={row.label} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${row.bg} ${row.color}`}>
                        {row.label}
                      </span>
                      <span className="block mt-1 text-[11px] text-muted-foreground">{row.desc}</span>
                    </td>
                    <td className="py-3.5 font-mono font-medium">{row.precision}</td>
                    <td className="py-3.5 font-mono font-medium">{row.recall}</td>
                    <td className="py-3.5 font-mono font-semibold text-foreground">{row.f1}</td>
                    <td className="py-3.5 text-right font-mono text-muted-foreground">15 sampel</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Confusion Matrix */}
        <section className="card p-6">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Confusion Matrix (4x4)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Menunjukkan distribusi kecocokan antara label aktual (Ground Truth) dan prediksi model Sitalis.
          </p>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-5 text-center text-xs font-semibold pb-2 border-b border-border text-muted-foreground">
                <div className="text-left font-medium">Ground Truth \ Prediksi</div>
                <div>Valid</div>
                <div>Sebagian</div>
                <div>Diduga</div>
                <div>Unverified</div>
              </div>

              <div className="divide-y divide-border/50 text-xs">
                <div className="grid grid-cols-5 items-center text-center py-3">
                  <div className="text-left font-medium text-foreground">Valid (15)</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded py-1">8</div>
                  <div className="text-muted-foreground">4</div>
                  <div className="text-muted-foreground">2</div>
                  <div className="text-muted-foreground">1</div>
                </div>

                <div className="grid grid-cols-5 items-center text-center py-3">
                  <div className="text-left font-medium text-foreground">Sebagian Valid (15)</div>
                  <div className="text-muted-foreground">0</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded py-1">10</div>
                  <div className="text-muted-foreground">5</div>
                  <div className="text-muted-foreground">0</div>
                </div>

                <div className="grid grid-cols-5 items-center text-center py-3">
                  <div className="text-left font-medium text-foreground">Diduga Halusinasi (15)</div>
                  <div className="text-muted-foreground">0</div>
                  <div className="text-muted-foreground">0</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded py-1">15</div>
                  <div className="text-muted-foreground">0</div>
                </div>

                <div className="grid grid-cols-5 items-center text-center py-3">
                  <div className="text-left font-medium text-foreground">Belum Terverifikasi (15)</div>
                  <div className="text-muted-foreground">0</div>
                  <div className="text-muted-foreground">0</div>
                  <div className="text-muted-foreground">0</div>
                  <div className="font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-500/15 rounded py-1">15</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informasi Berkas Sumber */}
        <div className="rounded-xl border border-border/80 bg-surface-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-muted-foreground shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-foreground">Data Lengkap Tersimpan Lokal</p>
              <p className="text-muted-foreground">Berkas hasil prediksi baris-demi-baris: <code className="font-mono text-foreground">predictions.csv</code> & <code className="font-mono text-foreground">LAPORAN_BENCHMARK.md</code></p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">Total Komputasi: 211.064 Token</span>
        </div>
      </div>
    </main>
  );
}
