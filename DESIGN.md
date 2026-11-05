# Sitalis — Design System

## Arah visual
Sitalis adalah alat riset yang tenang, presisi, dan dapat dipercaya. Antarmuka mengutamakan ruang kosong, hierarki tipografi, dan informasi yang dapat dipindai. Tidak ada gradien dekoratif, glow, atau ilustrasi AI generik. Bentuk utama: panel putih/charcoal, garis batas tipis, bayangan sangat halus, dan satu aksen indigo.

## Warna
Menggunakan semantic tokens HSL agar konsisten di mode terang dan gelap.

| Token | Terang | Gelap | Penggunaan |
|---|---|---|---|
| background | 0 0% 100% | 222 24% 7% | Latar halaman |
| foreground | 222 25% 12% | 210 20% 96% | Teks utama |
| muted | 220 20% 97% | 222 18% 11% | Latar sekunder |
| muted-foreground | 220 10% 42% | 215 14% 66% | Teks pendukung (AA) |
| border | 220 16% 89% | 220 14% 19% | Garis dan pemisah |
| primary | 239 72% 57% | 234 80% 70% | Aksi utama, fokus |
| success | 153 62% 29% | 151 48% 55% | Valid |
| warning | 35 88% 36% | 39 90% 62% | Sebagian valid |
| danger | 0 70% 46% | 0 72% 66% | Dugaan halusinasi |
| neutral | 220 10% 43% | 215 14% 68% | Tidak terverifikasi |

Label selalu menggabungkan warna, ikon lucide, dan teks. Warna tidak pernah menjadi satu-satunya pembawa makna.

## Tipografi
Geist melalui `next/font`, dengan fallback system sans-serif. Angka tabel memakai `tabular-nums`. Ukuran dasar 14–16 px; judul halaman 30–40 px dengan tracking ketat; judul kartu 16–18 px; metadata 12–13 px. Panjang teks baca maksimal 68 karakter. Naskah referensi memakai line-height 1.65 agar mudah dibandingkan.

## Spasi dan bentuk
Skala 4/8 px. Padding halaman mobile 16 px, tablet 24 px, desktop 32 px. Lebar konten maksimum 1200 px; halaman baca maksimum 800 px. Radius utama 12 px, kontrol 8–10 px, badge berbentuk pill. Tinggi kontrol minimum 40 px dan target sentuh minimum 44 px pada mobile.

## Komponen
- **App shell**: header ringkas, wordmark, navigasi, pengalih tema; konten responsif 360 px hingga desktop.
- **Button**: primary solid, secondary berbatas, ghost; state loading, disabled, dan focus ring jelas.
- **Card**: satu tingkat elevasi, border 1 px, tanpa tumpukan dekoratif.
- **Label badge**: ikon 14 px + teks Indonesia + warna semantik.
- **Dropzone**: border dashed, instruksi eksplisit, pemilih file tetap dapat diakses keyboard.
- **Stepper**: tiga tahap (Ekstraksi, Pemeriksaan, Laporan), progress aktual, bukan animasi palsu.
- **Reference editor**: textarea per entri, urutan dan jumlah terlihat, tambah/hapus tersedia.
- **Result table**: baris dapat diperluas; filter label dan pencarian; tampilan mobile berubah menjadi daftar kartu.
- **Evidence comparison**: dua kolom pada desktop (entri dan kandidat), satu kolom pada mobile; perbedaan diberi highlight amber dan keterangan teks.
- **Toast**: ringkas, dapat ditutup, menggunakan live region.
- **Empty/error/skeleton**: pesan spesifik, tindakan pemulihan, dan bentuk skeleton yang menyerupai konten akhir.

## Interaksi dan aksesibilitas
Transisi 150–200 ms untuk warna, border, opacity, dan transform kecil. Menghormati `prefers-reduced-motion`. Fokus keyboard berupa ring 2 px dengan offset. Dialog memakai focus trap dan Escape. Semua kontrol memiliki nama aksesibel; status proses memakai `aria-live`. Kontras minimum WCAG AA. Tidak ada informasi penting hanya saat hover.

## Halaman
- `/`: hero singkat, tab Unggah/Tempel, editor hasil segmentasi, proses bertahap, riwayat lokal.
- `/result/[id]`: empat kartu ringkasan, toolbar filter/pencarian/ekspor/cetak, tabel hasil, detail bukti dan koreksi manual.
- `/settings`: status konfigurasi, uji LLM/Crossref, mode demo, tanpa penyimpanan rahasia di browser.
- `/about`: alur kerja, arti label, batasan, privasi, dan sumber kebenaran Crossref.

## Cetak
Sembunyikan navigasi dan aksi. Latar putih, teks hitam, ringkasan dan seluruh baris terlihat. Hindari pemotongan kartu/baris bila memungkinkan; tautan DOI tetap terbaca.
