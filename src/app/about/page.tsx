import { BookOpenCheck, CircleAlert, Crosshair, Database, FileText, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LabelBadge } from "@/components/label-badge";

export const metadata = { title: "Tentang dan batasan" };
const steps = [
  { icon: FileText, title: "Pisahkan referensi", text: "Sistem mengambil bagian Daftar Pustaka terakhir, berhenti sebelum Lampiran, lalu memisahkan setiap entri. Anda dapat menyunting hasilnya." },
  { icon: ScanSearch, title: "Strukturkan metadata", text: "LLM menerima teks referensi untuk mengubahnya menjadi JSON. Abstrak karya hanya dikirim saat Anda meminta ringkasan. Naskah lengkap tidak pernah dikirim." },
  { icon: Database, title: "Cari bukti Crossref", text: "DOI diperiksa langsung. Jika tidak ada atau salah, pencarian memakai teks referensi lengkap dan mengambil lima kandidat." },
  { icon: Crosshair, title: "Bandingkan dan jelaskan", text: "Skor kemiripan menentukan karya ditemukan, ambigu, atau tidak ditemukan. Laporan memperlihatkan bukti dan perbedaan metadata." },
];
export default function AboutPage() {
  return (
    <main className="pb-16">
      <section className="relative border-b border-border/80 bg-surface-subtle/40 subtle-grid">
        <div className="page-container max-w-4xl py-12 sm:py-16">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-card text-foreground shadow-subtle">
            <BookOpenCheck className="size-5" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Transparansi pembuktian sitasi, bukan vonis otomatis.
          </h1>
          <p className="mt-3.5 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            Sitalis dirancang untuk mendeteksi potensi anomali, disonansi metadata, atau dugaan karya fiktif dengan mencocokkannya ke repositori publik Crossref. Keputusan keabsahan tetap berada di tangan penelaah naskah.
          </p>
        </div>
      </section>

      <div className="page-container max-w-4xl py-10 sm:py-12">
        <section aria-labelledby="how-title">
          <h2 id="how-title" className="text-xl font-semibold tracking-tight text-foreground">
            Alur Pemeriksaan Sistem
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="card p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-surface-subtle border border-border/70 text-foreground">
                      <Icon className="size-4.5" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="labels-title">
          <h2 id="labels-title" className="text-xl font-semibold tracking-tight text-foreground">
            Taksonomi & Arti Label
          </h2>
          <div className="mt-5 space-y-3">
            <div className="card p-5">
              <LabelBadge label="valid" />
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Karya ditemukan pada basis data dengan tingkat kecocokan tinggi. Metadata yang tercantum (judul, penulis utama, tahun, wadah publikasi) bersesuaian dengan catatan penerbit.
              </p>
            </div>
            <div className="card p-5">
              <LabelBadge label="partial" />
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Karya terlacak di Crossref, namun terdapat satu atau beberapa atribut yang menyimpang (misal salah tahun terbit, penulisan nama jurnal berbeda). Buka rincian untuk melihat saran koreksi.
              </p>
            </div>
            <div className="card p-5 border-rose-500/25 bg-rose-500/5">
              <LabelBadge label="suspected" />
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Dugaan kuat referensi tidak terdaftar:</strong> Tidak ditemukan bukti yang bersesuaian pada indeks Crossref atau DOI yang dicantumkan invalid. Tetap verifikasi secara manual bila artikel berasal dari jurnal lokal non-DOI.
              </p>
            </div>
            <div className="card p-5">
              <LabelBadge label="unverified" />
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Format referensi di luar cakupan primer Crossref (buku konvensional tanpa DOI, skripsi/tesis kampus, peraturan perundangan) atau proses parsing mengalami ambiguitas.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-5 sm:grid-cols-2">
          <div className="card p-5">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="mt-3.5 text-sm font-semibold text-foreground">Privasi & Penyimpanan Data</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Aplikasi ini beroperasi tanpa database terpusat pihak ketiga. Seluruh riwayat pengujian hanya tersimpan di localStorage browser Anda. Naskah lengkap Anda tidak pernah diunggah ke pihak luar.
            </p>
          </div>
          <div className="card p-5">
            <CircleAlert className="size-5 text-amber-600 dark:text-amber-400" />
            <h2 className="mt-3.5 text-sm font-semibold text-foreground">Batasan dan Ruang Lingkup</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>• Tidak memvalidasi kesesuaian argumen naskah dengan konten naskah asli</li>
              <li>• Tesis internal perguruan tinggi seringkali belum terindeks DOI</li>
              <li>• Naskah pindaian raster tanpa lapisan teks OCR memerlukan pengetikan manual</li>
            </ul>
          </div>
        </section>

        <div className="mt-10 rounded-2xl border border-border/80 bg-surface-subtle/50 p-6 sm:p-8 text-center">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Mulai Audit Sitasi Anda</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Buktikan keaslian sitasi naskah ilmiah Anda sekarang secara instan dan transparan.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">Buka Pemeriksa Sitasi</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/result/demo">Eksplorasi Contoh Data Demo</Link>
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Metadata karya ilmiah difasilitasi oleh API publik <a href="https://www.crossref.org/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">Crossref</a>. Sitalis tidak berafiliasi resmi dengan Crossref.
        </p>
      </div>
    </main>
  );
}
