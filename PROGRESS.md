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
2026-10-25: Workspace awal hanya berisi dokumen penelitian pengguna. Node 24, npm 12, dan Git tersedia; repository Git belum diinisialisasi.

2026-10-25: Audit viewport 360 px memastikan tidak ada overflow horizontal; demo, detail bukti, koreksi label, pemisahan referensi, serta ekstraksi PDF/DOCX diuji secara manual. Audit dependency penuh dan produksi melaporkan 0 kerentanan. Pemeriksaan langsung dengan kredensial LLM/Crossref belum dilakukan karena API key tidak tersedia.

2026-10-28: Menambahkan modul deteksi sumber akademik Indonesia (`src/lib/pipeline/indonesian-sources.ts`) yang memberikan pengayaan alasan, badge UI ("GARUDA/SINTA", "Repositori PT", "Regulasi RI"), dan tautan pencarian instan pada entri unverified. Menambahkan dataset benchmark 60 sampel terstandar (`data/benchmark_60.csv`) dengan sebaran 15 valid, 15 partial, 15 suspected, dan 15 unverified untuk evaluasi Bab 4 skripsi, didukung validator `scripts/validate-dataset.ts` dan test otomatis (`tests/dataset.test.ts`).

2026-10-28: Peningkatan segmentasi referensi: pembersihan deterministik teks salinan tabel Word/PDF (membuang header baris/kolom, memangkas kolom status seperti "Aktif (DOI...)" dengan tetap menjaga DOI asli, mendeteksi penomoran spasi tunggal). Menambahkan endpoint dan fallback AI (`/api/segment` & `src/lib/llm/segmenter.ts`) untuk memecah daftar referensi yang menempel jadi satu blok panjang tanpa membuang token jika segmentasi heuristik sudah berhasil.
