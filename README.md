# CekSitasi

Aplikasi web untuk memeriksa keberadaan referensi dan kesesuaian metadatanya dengan Crossref. CekSitasi memberikan **dugaan yang disertai bukti, bukan vonis** bahwa suatu referensi pasti palsu. Sistem tidak menilai apakah isi kutipan mendukung argumen dalam naskah.

Panduan langkah demi langkah dari instalasi sampai LLM dan Crossref berfungsi tersedia di [PANDUAN_PENGGUNAAN.md](PANDUAN_PENGGUNAAN.md).

## Fitur

- Unggah PDF/DOCX maksimal 10 MB atau tempel daftar pustaka.
- Deteksi bagian Daftar Pustaka terakhir, pemisahan entri, dan editor sebelum pemeriksaan.
- Parsing referensi menjadi JSON melalui LLM; hanya teks referensi yang dikirim, bukan naskah lengkap. Ringkasan abstrak opsional hanya mengirim abstrak karya dari Crossref saat tombol ditekan.
- Pemeriksaan DOI, agency DOI, dan pencarian bibliografis penuh ke Crossref.
- Skor kemiripan judul, penulis, tahun, dan wadah publikasi; pembanding LLM hanya untuk kandidat ambigu.
- Label Valid, Sebagian valid, Dugaan halusinasi, dan Tidak terverifikasi beserta alasan dan bukti.
- Laporan dengan filter, pencarian, perbandingan metadata, koreksi manual, tautan Scholar/GARUDA, ekspor CSV, dan cetak/PDF browser.
- Ringkasan LLM on-demand maksimal dua kalimat dari abstrak Crossref untuk karya yang ditemukan, dengan batas keluaran 180 token.
- Riwayat di browser, mode terang/gelap, tampilan mobile, serta demo tanpa API key.
- CLI evaluasi dengan precision, recall, F1, macro-F1, confusion matrix, FPR, waktu, dan token.

## Menjalankan aplikasi

### Prasyarat

- Node.js 22 atau lebih baru dan npm.
- Untuk pemeriksaan nyata: email aktif untuk Crossref dan provider LLM dengan API kompatibel OpenAI Chat Completions.
- Mode demo tidak memerlukan email atau API key.

### Instalasi

```bash
npm install
cp .env.example .env       # Windows Command Prompt: copy .env.example .env
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Pilih **Lihat demo** untuk menjelajahi aplikasi tanpa konfigurasi. Isi `.env` dan mulai ulang server untuk pemeriksaan nyata.

## Konfigurasi `.env`

```dotenv
CROSSREF_MAILTO=nama@example.com
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=isi_api_key_anda
LLM_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_DEMO_MODE=true
```

- `CROSSREF_MAILTO`: email aktif yang dikirim pada parameter `mailto` dan User-Agent untuk Crossref polite pool.
- `LLM_BASE_URL`: URL dasar versi API, **tanpa** `/chat/completions`. Contoh Ollama lokal: `http://localhost:11434/v1`.
- `LLM_API_KEY`: rahasia provider. Boleh dikosongkan untuk server lokal seperti Ollama yang tidak memerlukan autentikasi.
- `LLM_MODEL`: nama model persis dari provider. Model harus mampu mengikuti instruksi dan menghasilkan JSON.
- `NEXT_PUBLIC_DEMO_MODE`: penanda opsional; demo lokal tetap tersedia melalui tombol demo.

Selalu verifikasi base URL, model, harga, dan dukungan `response_format` di dokumentasi resmi provider. Jika JSON mode ditolak dengan HTTP 400/422, adapter mengulang tanpa `response_format`, mengekstrak JSON dari teks, lalu memvalidasinya dengan zod. `.env` sudah diabaikan Git; jangan commit rahasia.

Halaman **Pengaturan** menyediakan tombol **Uji koneksi LLM** dan **Uji koneksi Crossref**. Pengaturan dibaca saat server berjalan; restart setelah mengubah `.env`.

## Alur pemeriksaan

1. **Ekstraksi** dilakukan lokal di route handler Node. PDF memakai `unpdf`; DOCX memakai `mammoth`. Bagian Daftar Pustaka/References terakhir diambil sampai Lampiran atau akhir dokumen.
2. **Segmentasi** menggunakan penomoran, baris kosong, dan pola penulis-tahun. Pengguna meninjau serta dapat mengubah, menambah, atau menghapus entri.
3. **Parsing LLM** dilakukan per entri dengan temperature 0. DOI juga diekstrak lebih dahulu dengan regex. Output divalidasi zod dan dicoba maksimal tiga kali total.
4. **Crossref** menjadi satu-satunya sumber fakta keberadaan karya. DOI diperiksa dengan `/works/{doi}`; 404 dilanjutkan ke `/works/{doi}/agency`. DOI yang merujuk karya lain memicu pencarian teks.
5. **Pencarian teks** memakai satu `query.bibliographic` berisi referensi lengkap, `rows=5`, dan field `select` yang diperlukan. Tidak ada filter terpisah.
6. **Matching** memakai normalized Levenshtein dan Jaro-Winkler. Kandidat berambang tinggi langsung ditemukan; kandidat ambigu dapat dibandingkan LLM; kandidat rendah tidak ditemukan.
7. **Pelabelan** membedakan metadata berbeda, sumber di luar cakupan Crossref, DOI agency lain, kegagalan parsing, dan referensi jurnal/konferensi yang tidak ditemukan.

Bobot serta `T_high`/`T_low` awal berada di `src/lib/config.ts`. Nilai tersebut adalah titik awal rekayasa, **belum dikalibrasi dengan dataset validasi penelitian**.

## Mode demo

Buka `/result/demo` atau klik **Lihat demo** di beranda. Demo berisi empat hasil tersimpan yang memperlihatkan semua label dan perbandingan bukti. Demo tidak memanggil LLM maupun Crossref dan selalu ditandai sebagai data contoh.

## Ekspor dan riwayat

- **Ekspor CSV** menghasilkan UTF-8 dengan BOM agar mudah dibuka di Excel.
- **Cetak** membuka dialog browser; pilih “Save as PDF” untuk menyimpan laporan.
- Maksimal 10 laporan terakhir disimpan di `localStorage` browser. Perubahan label/konfirmasi juga disimpan di sana.
- Server menyimpan maksimal 50 laporan terakhir di memori agar tautan dapat dibuka kembali selama proses berjalan. Data ini hilang saat restart dan tidak dibagikan antar-instance.
- Cache respons Crossref memakai in-memory Map dan JSON di `.cache/crossref`, berlaku 30 hari. Folder cache tidak masuk Git.

## Evaluasi penelitian

Siapkan CSV dengan kolom wajib `id,reference_text,true_label,source_type`. `true_label` harus salah satu dari `valid`, `partial`, `suspected`, atau `unverified`; setiap `id` harus unik. Kolom `source_type` adalah metadata dataset; pipeline menentukan jenis sumber dari teks referensi.

```bash
npm run eval -- data/test.csv
```

Perintah membaca `.env`, menjalankan pipeline yang sama dengan aplikasi, lalu menulis (dan menimpa):

- `predictions.csv`: label prediksi, skor, waktu, dan token per referensi.
- `metrics.json`: precision/recall/F1 per label, macro-F1, confusion matrix, FPR, total dan rata-rata waktu/token.

FPR dihitung pada ground truth `valid`/`partial` tanpa pola DOI yang diprediksi sebagai `suspected`. Token bergantung pada field `usage.total_tokens` provider; nilainya 0 jika provider tidak memberikan usage. `data/sample.csv` berisi 20 contoh untuk menguji CLI, **bukan dataset benchmark yang telah divalidasi**. Jangan melaporkan metrik sampel sebagai hasil penelitian tanpa validasi ground truth.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Unit test menggunakan mock untuk Crossref dan LLM sehingga tidak membutuhkan API key. Test mencakup cache, retry, query, segmentasi, parser/retry/token, similarity, DOI salah, keputusan pipeline, metrik berdasarkan ID, dan CSV.

## Struktur penting

```text
src/app/                 Halaman dan route handlers API
src/components/          UI pemeriksaan, laporan, dan komponen bersama
src/lib/crossref/        Client, antrean laju, cache
src/lib/extraction/      Ekstraksi dokumen dan segmentasi
src/lib/llm/             Adapter OpenAI-compatible, parser, comparator
src/lib/matching/        Similarity dan ranking kandidat
src/lib/pipeline/        Orkestrasi dan aturan label
scripts/evaluate.ts      CLI evaluasi
tests/                   Unit test Vitest
DESIGN.md                Sistem desain
PLAN.md / PROGRESS.md    Rencana dan riwayat milestone
```

## Asumsi implementasi

- Pengguna menjalankan satu instance lokal untuk penggunaan pribadi; tidak ada kebutuhan multi-user atau persistensi server.
- Manuskrip memiliki heading Daftar Pustaka/References yang dapat dikenali. Untuk tempel teks, heading tidak wajib.
- Satu entri yang sudah dipisahkan mewakili satu referensi; pengguna bertanggung jawab meninjau pemisahan.
- Metadata yang tidak tercantum pada entri tidak dianggap berbeda dan tidak boleh dilengkapi LLM.
- Perbedaan tahun satu tahun tetap membantu kandidat ditemukan, tetapi tetap ditampilkan sebagai perbedaan (Sebagian valid).
- Jika comparator gagal pada kandidat ambigu, hasil menjadi Tidak terverifikasi agar kegagalan layanan tidak berubah menjadi tuduhan.
- DOI di agency selain Crossref (misalnya DataCite) tidak divalidasi lebih lanjut dan diberi label Tidak terverifikasi.
- Provider LLM kompatibel dengan endpoint `/chat/completions`; API key boleh kosong hanya jika provider mengizinkannya.
- Pengguna memiliki hak untuk memproses dokumen dan memahami kebijakan privasi provider LLM yang dipilih.

## Batasan yang diketahui

- Tidak ada OCR. PDF pindaian tanpa lapisan teks harus ditempel manual.
- Ekstraksi PDF dibatasi 500 halaman dan 30 detik; unggahan 10 MB; maksimal 200 referensi per pemeriksaan dan 30.000 karakter per entri.
- Segmentasi dokumen dengan format kompleks, kolom, footnote, atau heading tidak biasa dapat keliru.
- Crossref tidak lengkap untuk semua terbitan, terutama buku, tesis, laporan, regulasi, web, jurnal lokal, dan karya yang sangat baru.
- Ketidakcocokan metadata dapat berasal dari perbedaan versi, koreksi penerbit, atau metadata Crossref itu sendiri.
- “Dugaan halusinasi” berarti bukti yang memadai tidak ditemukan, bukan bukti kesengajaan atau kepalsuan. Periksa DOI, penerbit, Scholar, GARUDA, dan sumber asli.
- Riwayat browser tidak tersinkron antarperangkat dan dapat hilang jika data situs dibersihkan. Laporan memori server hilang saat restart.
- Aplikasi tidak memeriksa kebenaran isi, konteks kutipan, plagiarisme, atau kualitas penelitian.
