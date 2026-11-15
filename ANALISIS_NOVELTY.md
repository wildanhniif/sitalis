# Kajian Novelty, Batasan Masalah, dan Posisi Riset: Sitalis vs. CiteCheck (arXiv:2605.27700)

Dokumen ini disusun sebagai dokumentasi bukti riset independen, analisis orisinalitas/novelty, serta acuan batasan masalah untuk naskah skripsi/tugas akhir sistem **Sitalis**.

---

## 1. Status Hak Cipta & Orisinalitas (Copyright & Independent Discovery)

- **Doktrin Idea-Expression**: Berdasarkan hukum hak cipta ilmiah internasional, hak cipta melindungi bentuk ekspresi konkret (teks kalimat persis, gambar, diagram, dan baris kode spesifik), bukan ide, konsep, metodologi abstrak, atau algoritma (*idea-expression distinction*).
- **Penemuan Bersamaan (*Independent / Concurrent Discovery*)**: Ide pembuatan Sitalis digagas secara mandiri sebelum meninjau publikasi arXiv:2605.27700. Dalam dunia akademik, dua pihak yang menemukan solusi terhadap masalah yang sama secara bersamaan adalah bukti validitas bahwa topik tersebut krusial dan mutakhir (*state-of-the-art*).
- **Strategi Akademis**: Keberadaan paper arXiv:2605.27700 (`CiteCheck: Retrieval-Grounded Detection of LLM Citation Hallucinations in Scientific Text`, Mei 2026) tidak dihindari, melainkan **dijadikan rujukan komparasi utama** di Bab 2 (Tinjauan Pustaka) untuk mempertegas posisi kebaruan (*novelty*) dan kontribusi penelitian Sitalis.

---

## 2. Ringkasan Paper Pembanding: CiteCheck (arXiv:2605.27700)

- **Judul**: *CiteCheck: Retrieval-Grounded Detection of LLM Citation Hallucinations in Scientific Text* (Mei 2026)
- **Fokus**: Kerangka kerja hybrid deteksi halusinasi sitasi pada naskah ilmiah berbasis luaran LLM.
- **Mekanisme**: Mengambil publikasi kandidat dari sumber eksternal, membandingkan metadata sitasi dengan hasil retrieval menggunakan *structured LLM verifier*, lalu memetakan skor ke dalam 3 kelas label (*Exact*, *Minor*, *Major*).
- **Evaluasi**: Diuji pada dataset benchmark khusus bidang fisika (982 sitasi) dengan korupsi sintetis terkontrol.

---

## 3. Matriks Perbedaan & Novelty (Sitalis vs. CiteCheck)

| Dimensi Komparasi | CiteCheck (arXiv:2605.27700) | Sitalis (Skripsi Ini) | Keunggulan / Gap yang Diisi Sitalis |
| :--- | :--- | :--- | :--- |
| **Metode Pencocokan (Matching Architecture)** | Sangat bergantung pada *Structured LLM Verifier* untuk mengevaluasi tiap kandidat sitasi. | **Pendekatan Hierarkis Deterministik-Selektif**: String similarity (Normalized Levenshtein + Jaro-Winkler) berbobot dan berambang ($T_{high}$, $T_{low}$). LLM hanya dipanggil untuk *parsing* awal dan *tie-breaker/fallback* kandidat ambigu. | Efisiensi komputasi dan biaya token jauh lebih hemat, latensi verifikasi lebih terukur dan deterministik. |
| **Integrasi Sumber Verifikasi** | Retrieval umum dari scholarly sources (fokus korpus fisika). | Integrasi langsung dengan **Crossref REST API (Polite Pool)** via endpoint `/works` & deteksi registri luar via `/works/{doi}/agency` (DataCite, mEDRA, JaLC, dll.). | Cakupan komprehensif untuk publikasi ber-DOI global lintas disiplin ilmu dengan mekanisme antrean polite pool. |
| **Pipeline Input Dokumen** | Fokus pada verifikasi teks sitasi dalam dataset benchmark eksperimental. | **End-to-End File Ingestion**: Ekstraksi lokal langsung dari berkas asli pengguna (PDF via `unpdf` & DOCX via `mammoth`), deteksi blok referensi, dan segmentasi otomatis. | Dapat langsung dipakai pada manuskrip karya ilmiah nyata tanpa perlu menyiapkan format dataset khusus. |
| **Prinsip & Taksonomi Label** | 3 Label kategoris: *Exact*, *Minor*, *Major*. | **4 Label Berorientasi Audit**: *Valid*, *Sebagian valid* (metadata drift), *Dugaan halusinasi*, dan *Tidak terverifikasi* (out of scope). | Membedakan dengan tegas antara sitasi palsu vs sumber yang sah namun berada di luar jangkauan indeks Crossref. |
| **Filosofi Output** | Otomasi deteksi berbasis vonis model. | **Dugaan Berbasis Bukti (*Evidence-based Assistance*)**: Menyajikan bukti perbandingan field-by-field, tautan eksternal (Scholar/GARUDA), koreksi manual, dan riwayat lokal. | Menghindari overconfidence AI; memposisikan sistem sebagai asisten penunjang keputusan bagi akademisi/editor. |
| **Privasi Pengguna** | Bergantung pada API inferensi komparasi menyeluruh. | **Prinsip Minimalisasi Data**: Hanya teks referensi yang diproses; naskah utuh tidak pernah dikirim ke LLM. Fitur ringkasan abstrak bersifat on-demand. | Aman untuk pra-publikasi naskah skripsi/makalah yang bersifat konfidensial. |

---

## 4. Batasan Masalah (Scope & Limitations) untuk Naskah Skripsi

Poin-poin batasan ini dirancang untuk dicantumkan pada **Bab 1 (Batasan Masalah)** guna menjaga lingkup pengujian tetap fokus dan terukur:

1. **Sumber Kebenaran Eksternal (*External Ground Truth*)**:
   Verifikasi keberadaan karya ilmiah dan metadata valid dibatasi pada basis data **Crossref** serta status DOI agency terkait (seperti DataCite, mEDRA, JaLC). Dokumen seperti buku teks fisik tanpa DOI, dokumen regulasi lokal, undang-undang, skripsi/tesis repositori internal universitas, atau artikel web non-DOI masuk dalam klasifikasi *Tidak terverifikasi* (*unverified*), bukan langsung divonis halusinasi.
2. **Kesesuaian Konteks Semantik (*Citation Context / Support Claim*)**:
   Sistem hanya memvalidasi eksistensi fisik karya dan kesesuaian metadata bibliografis (judul, penulis, tahun, publikasi, DOI). Sistem **tidak menilai kesesuaian semantik**, yaitu apakah isi teks argumen di naskah benar-benar didukung oleh konten substansi di dalam paper yang dirujuk.
3. **Format Dokumen Masukan**:
   Pemeriksaan otomatis berkas didukung untuk format `.pdf` dan `.docx` dengan ukuran maksimum 10 MB yang memuat bagian Daftar Pustaka (References) berbasis teks digital (bukan hasil pemindaian/scan murni yang memerlukan OCR).
4. **Sifat Keputusan (*Decision Support Nature*)**:
   Hasil luaran sistem merupakan **rekomendasi dan dugaan berdasar bukti audit (*evidence-based suggestions*)**, bukan putusan mutlak (*absolute verdict*). Tanggung jawab akhir verifikasi tetap berada pada penulis atau penelaah naskah.

---

## 5. Draf Narasi untuk Bab 2 (Tinjauan Pustaka / Penelitian Terkait)

Berikut contoh redaksi formal akademis yang dapat langsung diadopsi ke dalam naskah laporan tugas akhir/skripsi:

> *"Penelitian mengenai deteksi halusinasi referensi ilmiah berkembang pesat seiring meluasnya penggunaan Large Language Models (LLM) dalam penulisan akademis. Salah satu penelitian mutakhir dilakukan oleh [Penulis CiteCheck] (2026) melalui kerangka kerja CiteCheck (arXiv:2605.27700), yang mengombinasikan retrieval karya ilmiah dengan structured LLM verifier untuk mendeteksi fabrikasi sitasi pada dataset benchmark fisika. Pendekatan tersebut berhasil menunjukkan efektivitas pemanfaatan model bahasa terstruktur dalam mengenali pergeseran metadata.*
>
> *Kendati demikian, penggunaan LLM verifier untuk seluruh komparasi kandidat sitasi membutuhkan biaya komputasi yang tinggi dan latensi inferensi yang signifikan. Selain itu, framework tersebut difokuskan pada pengujian dataset sitasi teks terisolasi dan belum mengintegrasikan alur pemrosesan dokumen utuh. Menjawab celah tersebut, penelitian ini (Sitalis) menghadirkan pendekatan verifikasi hierarkis yang lebih efisien dengan memanfaatkan metrik string matching deterministik (kombinasi normalized Levenshtein dan Jaro-Winkler) sebagai lapisan filter utama terhadap basis data Crossref API, serta hanya mendelegasikan kasus ambiguitas tinggi kepada LLM. Selain efisiensi komputasi, sistem ini dirancang secara end-to-end dengan kemampuan ekstraksi dokumen lokal (PDF/DOCX), preservasi privasi naskah, serta penyajian bukti komparasi transparan sebagai sistem pendukung keputusan (decision support system) bagi pengguna."*

---

*Dokumen ini dibuat secara otomatis pada workspace penelitian Sitalis sebagai arsip kajian orisinalitas riset.*
