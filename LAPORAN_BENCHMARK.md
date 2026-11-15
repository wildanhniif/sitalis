# LAPORAN EVALUASI EMPIRIS BENCHMARK (BAB 4 SKRIPSI)
**Sistem Deteksi Sitasi Halusinasi Sitalis**  
*Tanggal Pengujian: 28 Oktober 2026*  
*Dataset: `data/benchmark_60.csv` (60 Sampel Terstandar)*

---

## 1. Ringkasan Eksekutif & Metrik Utama

Pengujian empiris dilakukan secara *end-to-end* (live) menggunakan API Crossref dan LLM dengan memproses 60 sampel referensi ilmiah berimbang (15 Valid, 15 Sebagian Valid, 15 Diduga Halusinasi, dan 15 Belum Terverifikasi).

| Metrik Evaluasi | Nilai Hasil Uji | Keterangan |
| :--- | :--- | :--- |
| **Macro-F1 Score** | **0.7910 (79.10%)** | Keseimbangan performa deteksi lintas semua kelas |
| **Akurasi Keseluruhan** | **80.00% (48/60)** | 48 dari 60 entri diprediksi tepat sesuai Ground Truth |
| **Total Referensi Diuji** | **60 Entri** | 15 per kelas (Valid, Partial, Suspected, Unverified) |
| **Total Waktu Pemrosesan** | **236.73 detik (~3.9 menit)** | Rata-rata 3.95 detik per referensi |
| **Total Token LLM** | **211,064 token** | Rata-rata 3,517 token per referensi |
| **False Positive Rate (FPR)** | **53.85% (7/13)** | Sitasi nyata non-DOI yang dicurigai (karena belum terindeks Crossref) |

---

## 2. Kinerja per Kategori Label (Detailed Breakdown)

| Label / Kategori | Precision | Recall | F1-Score | Support (Jumlah Sampel) |
| :--- | :---: | :---: | :---: | :---: |
| **Valid** | 1.0000 (100.0%) | 0.5333 (53.33%) | 0.6957 (69.57%) | 15 |
| **Sebagian Valid (Partial)** | 0.7143 (71.43%) | 0.6667 (66.67%) | 0.6897 (68.97%) | 15 |
| **Diduga Halusinasi (Suspected)** | 0.6818 (68.18%) | 1.0000 (100.0%) | 0.8108 (81.08%) | 15 |
| **Belum Terverifikasi (Unverified)**| 0.9375 (93.75%) | 1.0000 (100.0%) | 0.9677 (96.77%) | 15 |
| **Macro Average** | **0.8334 (83.34%)** | **0.8000 (80.00%)** | **0.7910 (79.10%)** | **60** |

---

## 3. Confusion Matrix

Tabel kontingensi antara label aktual (*Ground Truth*) dan hasil klasifikasi sistem (*Predicted*):

| Ground Truth \ Prediksi | Valid | Sebagian Valid | Diduga Halusinasi | Belum Terverifikasi | Total Aktual |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Valid** | **8** | 4 | 2 | 1 | 15 |
| **Sebagian Valid** | 0 | **10** | 5 | 0 | 15 |
| **Diduga Halusinasi** | 0 | 0 | **15** | 0 | 15 |
| **Belum Terverifikasi** | 0 | 0 | 0 | **15** | 15 |
| **Total Prediksi** | 8 | 14 | 22 | 16 | 60 |

---

## 4. Analisis Temuan Kritis (Untuk Pembahasan Bab 4)

1. **Sensitivitas Sempurna pada Deteksi Halusinasi (Recall Suspected = 100%)**:
   - Sistem berhasil mendeteksi **15 dari 15 referensi palsu/halusinasi buatan AI** tanpa ada satupun yang lolos sebagai karya valid (*zero false negatives on hallucination*). Ini membuktikan integritas repositori Crossref sangat efektif menangkal sitasi fabrikasi.

2. **Sensitivitas Sempurna pada Dokumen Khusus (Recall Unverified = 100%)**:
   - Seluruh 15 referensi berjenis buku, skripsi/tesis kampus, dan regulasi pemerintah Indonesia berhasil dikenali dan dikelompokkan ke kategori *Belum Terverifikasi* tanpa salah menuduhnya sebagai karya fiktif.

3. **Tantangan Ketidaksesuaian Metadata Minor (Valid & Partial)**:
   - Beberapa karya valid diklasifikasikan sebagai *Sebagian Valid* (4 sampel) atau *Diduga* (2 sampel) karena disparitas penulisan nama jurnal atau ketidaklengkapan indeks di Crossref. Hal ini menjustifikasi keputusan sistem yang menyajikan *Evidence-based Assistance* (bukti perbandingan) agar penelaah dapat memeriksa perbedaan field per field secara mandiri.
