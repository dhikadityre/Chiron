# 🏹 Chiron — Interactive Codebase Mastery & Learning Academy

Selamat datang di **Chiron**. Direktori ini adalah wadah mandiri (independent repository) untuk seluruh sesi belajar interaktif, pembedahan *existing code* di workspace, audit arsitektur (SOLID & Clean Architecture), serta kuis retensi kognitif.

---

## 📚 Katalog Kursus Aktif

| Namespace | Topik Kursus | Status | File Misi | Lesson Terakhir |
| :--- | :--- | :--- | :--- | :--- |
| *(Belum ada kursus aktif)* | - | - | - | - |

> **Catatan:** Jalankan perintah `/teach <topik>` dari AI Agent untuk memulai kursus baru atau melanjutkan materi yang sudah ada.

---

## 🏛️ Struktur Direktori

```text
Chiron/
├── .assets/                    <-- Shared CSS & layout Tufte/Dark Mode
│   └── style.css
├── courses/                    <-- Seluruh kurikulum & lesson
│   ├── <nama-project>/         <-- Pembedahan kode proyek spesifik
│   └── general/                <-- Pembelajaran konsep teknologi umum
└── README.md                   <-- Katalog ini
```

---

## 🚀 Portabilitas & Sinkronisasi Antar-PC

1. **Commit & Push di PC 1:**
   ```bash
   git add .
   git commit -m "feat(lesson): update progress belajar"
   git push
   ```
2. **Pull & Baca Mandiri di PC 2 (Tanpa AI):**
   ```bash
   git pull
   open courses/<namespace>/<topik>/lessons/0001-xxx.html
   ```
   *Anda dapat membaca materi, memeriksa diagram alur, dan mengerjakan kuis langsung di browser tanpa menyalakan AI.*
