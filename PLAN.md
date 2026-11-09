# CekSitasi — Rencana Implementasi

## Prinsip tetap
Crossref adalah sumber fakta; LLM hanya parser dan pembanding. Hanya teks referensi yang dikirim ke LLM. Hasil adalah dugaan, bukan vonis. Tidak ada login, basis data server, pembayaran, OCR, atau fitur di luar ruang lingkup.

## Milestone
1. **Fondasi**: Next.js App Router + TypeScript + Tailwind, konfigurasi env, struktur domain, DESIGN.md, klien Crossref (queue, cache JSON/Map, timeout, retry), test mock. Commit setelah test lulus.
2. **Inti**: ekstraksi PDF/DOCX, deteksi dan segmentasi daftar pustaka, adapter LLM dengan validasi/retry, similarity dan matcher, aturan keputusan/label, unit test. Commit setelah test lulus.
3. **API dan evaluasi**: endpoint pemeriksaan dan uji koneksi, penyimpanan hasil sementara di memori, CLI evaluasi, sample CSV 20 entri, test API/pipeline. Commit setelah test lulus.
4. **UI**: halaman Check, editor referensi, progres live, hasil/filter/detail bukti/koreksi label, riwayat browser. Commit setelah typecheck dan test lulus.
5. **Fitur pendukung**: Settings, demo tanpa API key, CSV, cetak, About, tema dan responsive state. Commit setelah pemeriksaan lulus.
6. **Polish**: audit 360 px dan desktop, aksesibilitas, README, lint/typecheck/test/build, perbaikan akhir dan commit.

## Keputusan teknis awal
- Next.js route handlers berjalan di Node.js; data hasil pemeriksaan disimpan dalam memori server dan disalin ke localStorage browser.
- Cache Crossref berada di `.cache/crossref` (diabaikan git), TTL 30 hari.
- Antrean terpisah untuk pencarian (3/detik) dan DOI lookup (10/detik), concurrency rendah.
- Demo menggunakan fixture lokal yang eksplisit, tidak menyamar sebagai respons Crossref langsung.
- Bobot dan ambang awal berada di `src/lib/config.ts` dan didokumentasikan sebagai nilai yang perlu tuning.

## Verifikasi akhir
`npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, dan pengujian manual demo + ekspor. Tidak melanjutkan milestone jika pemeriksaan yang relevan gagal.
