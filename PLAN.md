# Sitalis — Rencana Implementasi

## Prinsip tetap
Crossref adalah sumber fakta; LLM menjadi parser, pembanding, dan pembuat ringkasan abstrak opsional. Hanya teks referensi serta abstrak Crossref yang dipilih pengguna yang dapat dikirim ke LLM; naskah lengkap tidak pernah dikirim. Hasil adalah dugaan, bukan vonis. Tidak ada login, basis data server, pembayaran, OCR, atau fitur di luar ruang lingkup.

## Milestone
1. **Fondasi**: Next.js App Router + TypeScript + Tailwind, konfigurasi env, struktur domain, DESIGN.md, klien Crossref (queue, cache JSON/Map, timeout, retry), test mock. Commit setelah test lulus.
2. **Inti**: ekstraksi PDF/DOCX, deteksi dan segmentasi daftar pustaka, adapter LLM dengan validasi/retry, similarity dan matcher, aturan keputusan/label, unit test. Commit setelah test lulus.
3. **API dan evaluasi**: endpoint pemeriksaan dan uji koneksi, penyimpanan hasil sementara di memori, CLI evaluasi, sample CSV 20 entri, test API/pipeline. Commit setelah test lulus.
4. **UI**: halaman Check, editor referensi, progres live, hasil/filter/detail bukti/koreksi label, riwayat browser. Commit setelah typecheck dan test lulus.
5. **Fitur pendukung**: Settings, demo tanpa API key, CSV, cetak, About, tema dan responsive state. Commit setelah pemeriksaan lulus.
6. **Polish**: audit 360 px dan desktop, aksesibilitas, README, lint/typecheck/test/build, perbaikan akhir dan commit.
7. **Ringkasan dan panduan**: tambahkan ringkasan LLM on-demand dengan keluaran 180 token dari abstrak Crossref, serta panduan lokal dari instalasi sampai pemeriksaan nyata. Commit setelah pemeriksaan lulus.
8. **Pengayaan Sumber Lokal & Dataset Benchmark Bab 4**: tambahkan heuristik pengenalan karya akademik Indonesia (GARUDA/SINTA/repositori kampus/regulasi RI) pada pipeline matcher, badge informatif pada UI, serta siapkan dataset benchmark seimbang 60 entri (`data/benchmark_60.csv`) dengan validasi otomatis untuk kebutuhan evaluasi empiris naskah skripsi Bab 4. Commit setelah pemeriksaan lulus.

## Keputusan teknis awal
- Next.js route handlers berjalan di Node.js; data hasil pemeriksaan disimpan dalam memori server dan disalin ke localStorage browser.
- Cache Crossref berada di `.cache/crossref` (diabaikan git), TTL 30 hari.
- Antrean terpisah untuk pencarian (3/detik) dan DOI lookup (10/detik), concurrency rendah.
- Demo menggunakan fixture lokal yang eksplisit, tidak menyamar sebagai respons Crossref langsung.
- Bobot dan ambang awal berada di `src/lib/config.ts` dan didokumentasikan sebagai nilai yang perlu tuning.

## Verifikasi akhir
`npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, dan pengujian manual demo + ekspor. Tidak melanjutkan milestone jika pemeriksaan yang relevan gagal.
