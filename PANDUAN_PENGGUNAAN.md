# Panduan Menjalankan Sitalis sampai Berfungsi

Dokumen ini ditujukan untuk penggunaan lokal di Windows. Ikuti urutannya dari awal jika baru pertama kali menjalankan proyek. Jika dependensi dan `.env` sudah siap, langsung lihat bagian **Menjalankan aplikasi**.

## 1. Hasil akhir yang diharapkan

Setelah semua langkah berhasil, Anda dapat:

- membuka Sitalis di browser;
- menguji koneksi LLM dan Crossref dari halaman Pengaturan;
- menempel referensi atau mengunggah PDF/DOCX;
- meninjau pemisahan referensi sebelum pemeriksaan;
- memperoleh label, skor, bukti metadata, dan tautan DOI;
- membuat ringkasan AI singkat dari abstrak Crossref jika abstrak tersedia;
- mengoreksi label, mengonfirmasi hasil, mengekspor CSV, dan mencetak laporan.

Mode demo dapat dibuka tanpa konfigurasi, tetapi demo **bukan** bukti bahwa LLM atau Crossref sudah terhubung.

## 2. Prasyarat

Pasang:

- Node.js versi 22 atau lebih baru;
- npm, yang biasanya ikut terpasang bersama Node.js;
- browser modern seperti Chrome, Edge, atau Firefox.

Periksa versi melalui Command Prompt atau PowerShell:

```bash
node --version
npm --version
```

Untuk pemeriksaan nyata, siapkan juga:

- alamat email aktif untuk Crossref polite pool;
- salah satu: akun provider LLM dengan API kompatibel OpenAI Chat Completions, atau Ollama lokal.

## 3. Buka terminal di folder proyek

Folder proyek ini adalah `D:\Skripsi`.

Command Prompt:

```bat
cd /d D:\Skripsi
```

PowerShell:

```powershell
cd D:\Skripsi
```

Pastikan perintah berikut dijalankan dari folder tersebut, bukan dari folder instalasi Qoder atau folder lain.

## 4. Instal dependensi

```bash
npm install
```

Perintah ini perlu diulang jika `package.json` atau `package-lock.json` berubah. Jangan menghapus `node_modules` atau lockfile hanya karena instalasi memerlukan waktu.

## 5. Buat file konfigurasi rahasia

Command Prompt:

```bat
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

File `.env` berada di root proyek, sejajar dengan `package.json`. File ini sudah diabaikan Git. Jangan mengirim atau meng-commit API key.

Buka file dengan:

```bat
notepad .env
```

Pastikan nama file benar-benar `.env`, bukan `.env.txt`.

## 6A. Konfigurasi dengan provider LLM seperti Groq

Contoh isi `.env`:

```dotenv
CROSSREF_MAILTO=email_aktif_anda@example.com
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=api_key_asli_anda
LLM_MODEL=nama_model_yang_tersedia
NEXT_PUBLIC_DEMO_MODE=true
```

Langkah provider:

1. Buat API key melalui dashboard resmi provider.
2. Salin base URL versi API yang kompatibel dengan OpenAI Chat Completions.
3. Pilih model yang tersedia di akun Anda dan mampu mengikuti instruksi JSON.
4. Salin nama model persis seperti yang tercantum di dashboard/dokumentasi provider.
5. Simpan `.env`.

`LLM_BASE_URL` tidak diakhiri `/chat/completions`, karena path tersebut ditambahkan oleh aplikasi. Nama model dan ketersediaan layanan dapat berubah; contoh di `.env.example` bukan jaminan model masih aktif. Periksa dashboard resmi provider jika mendapat error model.

Token API dapat memiliki biaya atau kuota. Sitalis memanggil LLM satu kali atau lebih per referensi untuk parsing, dan dapat memanggil comparator pada kandidat ambigu. Ringkasan abstrak tidak otomatis; satu permintaan tambahan hanya terjadi jika Anda menekan **Ringkas dengan AI**, dengan keluaran dibatasi 180 token.

## 6B. Alternatif: Ollama lokal

Jika Ollama dan model sudah terpasang, konfigurasinya misalnya:

```dotenv
CROSSREF_MAILTO=email_aktif_anda@example.com
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=
LLM_MODEL=nama_model_yang_sudah_terpasang
NEXT_PUBLIC_DEMO_MODE=true
```

Pastikan:

- Ollama sedang berjalan sebelum pengujian;
- nama model sama dengan hasil `ollama list`;
- model mampu mengikuti format JSON;
- perangkat memiliki memori yang cukup untuk model tersebut.

`LLM_API_KEY` boleh kosong hanya untuk server lokal yang memang tidak memerlukan autentikasi. Jangan mengosongkannya untuk provider berbayar atau provider yang mewajibkan API key.

## 7. Menjalankan aplikasi

Setelah `.env` disimpan:

```bash
npm run dev
```

Biarkan terminal tetap terbuka. Buka:

```text
http://localhost:3000
```

Jika port 3000 sedang digunakan, jalankan:

```bash
npm run dev -- -p 3001
```

Kemudian buka `http://localhost:3001`.

Setiap mengubah `.env`, hentikan server dengan `Ctrl+C`, lalu jalankan `npm run dev` kembali.

## 8. Wajib: uji koneksi sebelum pemeriksaan nyata

1. Buka **Pengaturan** melalui navigasi atas atau `http://localhost:3000/settings`.
2. Klik **Uji koneksi LLM**.
3. Tunggu sampai muncul pesan `LLM terhubung`.
4. Klik **Uji koneksi Crossref**.
5. Tunggu sampai muncul judul karya DOI uji dan pesan Crossref terhubung.

Jika salah satu gagal, jangan lanjutkan pemeriksaan besar. Perbaiki konfigurasi berdasarkan bagian troubleshooting terlebih dahulu.

## 9. Pemeriksaan paling sederhana dengan tempel referensi

Gunakan satu referensi dengan DOI yang diketahui untuk memastikan seluruh alur bekerja:

```text
Mnih, V., Kavukcuoglu, K., Silver, D., et al. (2015). Human-level control through deep reinforcement learning. Nature, 518(7540), 529–533. https://doi.org/10.1038/nature14236
```

Langkah:

1. Buka beranda atau halaman **Periksa**.
2. Pilih tab **Tempel referensi**.
3. Tempel teks di atas.
4. Lanjutkan ke editor dan pastikan hanya ada satu entri.
5. Mulai pemeriksaan dan tunggu progres selesai.
6. Buka detail hasil.
7. Periksa DOI, judul, penulis, tahun, skor, alasan label, dan ringkasan karya jika tersedia.

Untuk referensi ini, DOI dan metadata seharusnya cocok jika layanan serta parsing berjalan normal. Namun perubahan metadata sumber atau hasil parsing tetap harus dibaca dari bukti, bukan diasumsikan.

## 10. Pemeriksaan PDF atau DOCX

1. Pilih tab unggah dokumen.
2. Pilih PDF atau DOCX maksimal 10 MB.
3. Pastikan dokumen memiliki bagian **Daftar Pustaka** atau **References**.
4. Setelah ekstraksi, tinjau semua entri pada editor.
5. Gabungkan entri yang terpotong atau hapus entri yang bukan referensi melalui editor.
6. Mulai pemeriksaan setelah segmentasi benar.

Batas penting:

- PDF pindaian tanpa text layer ditolak karena OCR tidak tersedia;
- PDF dibatasi 500 halaman dan ekstraksi 30 detik;
- maksimal 200 referensi per pemeriksaan;
- maksimal 30.000 karakter per referensi;
- format multi-kolom, footnote, dan heading tidak biasa dapat mengganggu segmentasi.

## 11. Membaca laporan

Arti label:

- **Valid**: karya ditemukan dan metadata yang tersedia cocok.
- **Sebagian valid**: karya ditemukan, tetapi ada metadata yang berbeda.
- **Dugaan halusinasi**: bukti yang memadai tidak ditemukan untuk jenis sumber yang diharapkan terindeks; ini bukan vonis kepalsuan.
- **Tidak terverifikasi**: sistem tidak dapat menyimpulkan karena jenis sumber, layanan, parsing, agency DOI, atau cakupan data.

Gunakan filter dan pencarian untuk meninjau laporan. Buka detail untuk melihat referensi asli, hasil parsing, kandidat Crossref, perbedaan metadata, skor, dan bukti.

### Ringkasan karya dengan AI

Untuk karya yang ditemukan dengan label Valid atau Sebagian valid, detail laporan menampilkan **Ringkasan karya** jika Crossref menyediakan abstrak. Ringkasan tidak dibuat otomatis. Tekan **Ringkas dengan AI** untuk mengirim abstrak karya tersebut ke LLM dan membuat satu atau dua kalimat berbahasa Indonesia.

Pembatasan biaya dan privasi:

- hanya abstrak karya dari Crossref yang dikirim, bukan naskah Anda;
- satu klik berarti satu permintaan LLM;
- keluaran dibatasi 180 token;
- ringkasan dan jumlah token disimpan dalam laporan browser;
- abstrak tidak dikirim saat pemeriksaan utama atau saat detail dibuka.

Jika tombol tidak muncul karena abstrak tidak tersedia, itu keterbatasan metadata Crossref, bukan kegagalan pemeriksaan. Gunakan tautan DOI atau sumber penerbit untuk membaca karya. Ringkasan AI dapat salah, hanya menjelaskan karya kandidat, dan tidak menilai apakah isi kutipan mendukung argumen naskah.

### Tindakan manual

- **Konfirmasi label** menandai bahwa Anda sudah meninjaunya.
- **Ubah label** menyimpan koreksi manual pada laporan.
- **Google Scholar**, **GARUDA**, dan DOI membantu pemeriksaan sumber lanjutan.
- **Ekspor CSV** menyimpan hasil dalam UTF-8 dengan BOM.
- **Cetak** membuka dialog browser; pilih Save as PDF jika ingin file PDF.

## 12. Menjalankan evaluasi CLI

Siapkan CSV dengan header:

```text
id,reference_text,true_label,source_type
```

`id` harus unik. `true_label` berisi `valid`, `partial`, `suspected`, atau `unverified`. `source_type` adalah metadata dataset; pipeline tetap menentukan jenis sumber dari teks referensi.

Jalankan evaluasi menggunakan dataset benchmark 60 entri:

```bash
npm run eval -- data/benchmark_60.csv
```

Validasi integritas dataset dapat dilakukan kapan saja tanpa memanggil API:

```bash
npx tsx scripts/validate-dataset.ts data/benchmark_60.csv
```

Output:

- `predictions.csv`;
- `metrics.json`.

Evaluasi memakai pipeline dan kredensial yang sama sehingga dapat menghabiskan kuota LLM. Gunakan `data/benchmark_60.csv` yang sudah memiliki ground truth seimbang 4 kelas untuk pelaporan performa Bab 4 skripsi.

## 13. Menjalankan mode produksi lokal

Untuk penggunaan sehari-hari, `npm run dev` sudah cukup. Untuk memeriksa build produksi:

```bash
npm run build
npm start
```

Buka `http://localhost:3000`. Hentikan server lama sebelum menjalankan perintah pada port yang sama.

## 14. Checklist bahwa aplikasi benar-benar berfungsi

Centang secara berurutan:

- [ ] `node --version` menunjukkan versi 22 atau lebih baru.
- [ ] `npm install` selesai tanpa error.
- [ ] `.env` berada di root proyek dan tidak bernama `.env.txt`.
- [ ] `npm run dev` berjalan tanpa error.
- [ ] Beranda terbuka di browser.
- [ ] Uji koneksi LLM berhasil.
- [ ] Uji koneksi Crossref berhasil.
- [ ] Satu referensi DOI berhasil diperiksa sampai laporan terbuka.
- [ ] Detail menampilkan metadata dan bukti Crossref.
- [ ] Ekspor CSV dapat dibuka.
- [ ] Jika menggunakan dokumen, ekstraksi dan editor referensi telah diperiksa manual.

Jika hanya demo yang terbuka tetapi dua uji koneksi belum berhasil, aplikasi antarmuka berfungsi, tetapi pemeriksaan nyata belum siap.

## 15. Troubleshooting

### Pesan konfigurasi LLM atau CROSSREF_MAILTO belum lengkap

Periksa nama dan isi `.env`, pastikan file berada di `D:\Skripsi`, lalu restart server. `LLM_BASE_URL`, `LLM_MODEL`, dan `CROSSREF_MAILTO` wajib. API key wajib jika provider menggunakannya.

### HTTP 401 atau 403 dari LLM

API key salah, kedaluwarsa, tidak memiliki akses model, atau akun tidak memiliki kuota. Buat key baru melalui dashboard resmi jika diperlukan dan restart server.

### HTTP 404 dari LLM

Periksa base URL dan nama model. Base URL tidak perlu memakai `/chat/completions`. Pastikan model tersedia pada provider dan akun Anda.

### LLM terhubung tetapi parsing sering gagal

Model mungkin kurang mampu mengikuti instruksi JSON. Gunakan model instruction-following yang lebih baik. Adapter sudah mencoba JSON mode, fallback tanpa `response_format`, ekstraksi JSON, validasi zod, dan maksimal tiga percobaan parsing.

### Ollama tidak dapat dihubungi

Pastikan Ollama aktif, base URL `http://localhost:11434/v1` benar, dan model sudah terpasang. Periksa nama model dengan `ollama list`.

### Crossref lambat, timeout, atau HTTP 429

Aplikasi memiliki antrean rate limit, timeout, retry, backoff, dan cache 30 hari. Coba lagi dengan jumlah referensi lebih kecil. Jangan menghapus rate limit karena dapat membebani layanan.

### PDF ditolak sebagai hasil pindaian

PDF tidak memiliki text layer yang cukup. OCR tidak termasuk cakupan aplikasi. Gunakan versi PDF berbasis teks atau tempel daftar pustaka manual.

### Referensi terpotong atau tergabung

Perbaiki pada editor sebelum pemeriksaan. Segmentasi otomatis adalah heuristic dan memang perlu ditinjau.

### Abstrak tidak muncul

Tidak semua work Crossref memiliki field abstrak. Ini normal, sehingga tombol **Ringkas dengan AI** tidak muncul. Ringkasan juga hanya ditampilkan untuk kandidat yang ditemukan dengan label Valid atau Sebagian valid, bukan untuk kandidat lemah. Jika ringkasan gagal, periksa koneksi LLM dan ulangi; tidak ada percobaan otomatis berulang yang menghabiskan token.

### Laporan lama tidak dapat dibuka

Laporan memori server hilang saat restart. Riwayat `localStorage` hanya tersedia pada browser dan perangkat yang sama serta dapat hilang jika data situs dibersihkan. Ekspor laporan penting ke CSV.

### Perintah npm tidak ditemukan

Node.js/npm belum terpasang atau terminal belum dibuka ulang setelah instalasi. Pasang Node.js 22+, tutup terminal, buka kembali, lalu ulangi `node --version`.

## 16. Privasi dan batas interpretasi

- Naskah lengkap diekstrak lokal oleh route handler dan tidak dikirim utuh ke LLM.
- Hanya teks referensi yang dikirim untuk parsing; comparator menerima entry dan satu kandidat ambigu.
- Crossref menerima DOI atau teks bibliografis untuk pencarian.
- Abstrak tidak ikut pada pemeriksaan utama. Abstrak karya dari Crossref baru dikirim ke LLM jika Anda menekan **Ringkas dengan AI**; naskah lengkap tidak dikirim.
- Sitalis memeriksa keberadaan referensi dan kesesuaian metadata, bukan kebenaran isi, konteks kutipan, plagiarisme, atau kualitas penelitian.
- Crossref tidak lengkap untuk semua buku, tesis, laporan, regulasi, web, jurnal lokal, dan karya baru. Selalu periksa sumber asli sebelum menyimpulkan.

## 17. Pemeriksaan teknis untuk pengembang

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Semua perintah harus lulus sebelum perubahan dianggap selesai. Unit test menggunakan mock sehingga tidak menggantikan uji koneksi nyata pada bagian 8.
