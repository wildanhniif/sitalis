# Progres Sitalis

- [x] M1 — Fondasi dan desain (5 test dan typecheck lulus)
- [x] M2 — Pipeline inti (18 test dan typecheck lulus; import ekstraksi terverifikasi)
- [x] M3 — API dan CLI evaluasi (21 test, typecheck, dan CSV lulus)
- [x] M4 — Antarmuka utama dan laporan (production build, typecheck, 21 test lulus)
- [x] M5 — Pengaturan, demo, ekspor, Tentang (build, typecheck, 21 test lulus)
- [x] M6 — Polish, dokumentasi, verifikasi akhir (lint, typecheck, 23 test, production build, dan audit dependency lulus)
- [x] M7 — Ringkasan LLM on-demand dari abstrak Crossref dan panduan penggunaan lengkap (lint, typecheck, 27 test, production build, API guard, dan tampilan demo lulus)
- [x] M8 — Deteksi heuristik sumber akademik Indonesia (GARUDA, SINTA, Neliti, repositori PTN/PTS, regulasi RI) pada pipeline matcher & UI badge, serta kurasi dataset benchmark 60 entri seimbang (`data/benchmark_60.csv`) dengan validasi otomatis untuk Bab 4 (32 test, lint, typecheck, production build lulus)
- [x] M9 — Segmentasi referensi cerdas: pembersihan otomatis tabel Word/header/kolom status tanpa token LLM, serta fallback pemisahan via LLM (`src/lib/llm/segmenter.ts` + `/api/segment`) bila teks menempel/tidak terstruktur (41 test, lint, typecheck, production build lulus)

## Catatan
- [x] M10 — Perbandingan benchmark antar-model LLM: metadata run pada metrics.json (model, host, dataset, jumlah entri per label, % pembanding), halaman /benchmark dengan impor metrics.json, tabel perbandingan berdampingan dengan sorotan nilai terbaik, hapus run, dan run data contoh bertanda jelas (47 test, lint, typecheck, production build lulus)

## Catatan
2026-10-25: Workspace awal hanya berisi dokumen penelitian pengguna. Node 24, npm 12, dan Git tersedia; repository Git belum diinisialisasi.

2026-10-25: Audit viewport 360 px memastikan tidak ada overflow horizontal; demo, detail bukti, koreksi label, pemisahan referensi, serta ekstraksi PDF/DOCX diuji secara manual. Audit dependency penuh dan produksi melaporkan 0 kerentanan. Pemeriksaan langsung dengan kredensial LLM/Crossref belum dilakukan karena API key tidak tersedia.

2026-10-28: Menambahkan modul deteksi sumber akademik Indonesia (`src/lib/pipeline/indonesian-sources.ts`) yang memberikan pengayaan alasan, badge UI ("GARUDA/SINTA", "Repositori PT", "Regulasi RI"), dan tautan pencarian instan pada entri unverified. Menambahkan dataset benchmark 60 sampel terstandar (`data/benchmark_60.csv`) dengan sebaran 15 valid, 15 partial, 15 suspected, dan 15 unverified untuk evaluasi Bab 4 skripsi, didukung validator `scripts/validate-dataset.ts` dan test otomatis (`tests/dataset.test.ts`).

2026-10-28: Peningkatan segmentasi referensi: pembersihan deterministik teks salinan tabel Word/PDF (membuang header baris/kolom, memangkas kolom status seperti "Aktif (DOI...)" dengan tetap menjaga DOI asli, mendeteksi penomoran spasi tunggal). Menambahkan endpoint dan fallback AI (`/api/segment` & `src/lib/llm/segmenter.ts`) untuk memecah daftar referensi yang menempel jadi satu blok panjang tanpa membuang token jika segmentasi heuristik sudah berhasil.

- [x] Skill Agen: profil instruksi parser/comparator/summarizer dengan kontrak terkunci, editor Pengaturan, penyimpanan browser, dan penerusan skill per request tanpa state global server. Prompt default identik dengan sebelumnya; 52 test, lint, typecheck, dan build lulus. Smoke HTTP /settings 200; interaksi browser belum diverifikasi secara visual.

2026-11-24: Leaderboard benchmark antar-model di /benchmark: jalankan evaluasi 60 sampel langsung dari web (`POST /api/benchmark/run` + polling status, satu job pada satu waktu, dataset benchmark_60.csv/sample.csv), hasil dan impor metrics.json tersimpan di server (`data/benchmark-runs.json`, maks 50) dan diurutkan dari macro-F1 terbaik dengan sorotan nilai terbaik per metrik dan tombol hapus. Modul `benchmark.ts` menjadi modul murni (directive "use client" dihapus karena menggagalkan build), penyimpanan localStorage diganti store server (`benchmark-store.ts`). Run awal terisi: lucif (macro-F1 0,7918, akurasi 48/60, 8.052 token/ref, 6,12s/ref) dan deepseek-v4.1-flash (0,7910, 48/60, 3.518 token/ref, 3,95s/ref), keduanya 32/60 kasus ambigu. 55 test, lint, typecheck, production build lulus; uji E2E API (GET/POST/DELETE run, job 20/20 sample.csv) lulus.

2026-11-24: Perbaikan sistem deteksi: bobot 0,40/0,30/0,20/0,10 + decay linier tahun 0,2/tahun + ambang atas per jenis sumber (0,82 umum, 0,70 untuk preprint/web); OpenAlex sebagai indeks pelengkap saat Crossref tidak menemukan kandidat memadai; comparator menilai plausibly_real (hanya untuk karya yang dikenali spesifik) sehingga karya nyata belum terindeks menjadi unverified bukan suspected; partial hanya untuk perbedaan material (variasi nama wadah tetap valid). Hasil benchmark ulang lucif: macro-F1 0,8125 (naik dari 0,7918), akurasi 49/60, 8.169 token/ref, 7,99s/ref, comparator 34/60. 59 test, lint, typecheck lulus.
