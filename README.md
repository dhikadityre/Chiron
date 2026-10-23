# 🏹 Chiron — Interactive Codebase Mastery & Learning Academy

Selamat datang di **Chiron**. Direktori ini adalah wadah mandiri (independent repository) untuk seluruh sesi belajar interaktif, pembedahan *existing code* di workspace, audit arsitektur (SOLID & Clean Architecture), serta kuis retensi kognitif.

---

## 📚 Katalog Kursus Aktif

| Scope / Namespace | Topik Kursus | Modul | Status | File Misi | Lesson Masuk / Index |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `samir-mobile-ios` | **SAMIR Mobile iOS Full Architecture Curriculum** | 40 Materi | 🟢 Siap Dipelajari | [MISSION.md](courses/samir-mobile-ios/MISSION.md) | [00-learning-roadmap.html](courses/samir-mobile-ios/00-learning-roadmap.html) |
| `samir-mobile-flutter` | **SAMIR Mobile Flutter Add-to-App Curriculum** | 40 Materi | 🟢 Siap Dipelajari | [MISSION.md](courses/samir-mobile-flutter/MISSION.md) | [00-learning-roadmap.html](courses/samir-mobile-flutter/00-learning-roadmap.html) |
| `samir-mobile` | **iOS App Startup Sequence & Initial Routing (Deep Dive)** | 1 Modul | 🟡 Sesi Khusus | [MISSION.md](courses/samir-mobile/app-startup-sequence/MISSION.md) | [0001-startup-sequence.html](courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html) |

> **Catatan Pedagogi:** Seluruh materi berformat HTML mandiri yang diperkaya dengan **Tufte styling**, **Sticky Topbar Tabs** (Crossnote/VS Code style), **Table of Contents ScrollSpy**, **Fullscreen Mermaid Diagram Lightbox**, **Compact Action Bar 5 IDE** (GitLab, Antigravity IDE, Cursor, VS Code, Xcode), serta **Interactive Retention Quiz** dengan evaluasi instan.

---

## 🏛️ Struktur Direktori

```text
Chiron/
├── .assets/                    <-- Shared CSS, Multi-IDE Launch Engine & Compiler
│   ├── style.css
│   ├── chiron-ide-launcher.js
│   ├── chiron-client.js
│   ├── chiron-annotations.js
│   ├── chiron_sync.py
│   └── chiron_curriculum_compiler.py
├── chiron_config.json          <-- Konfigurasi mapping GitLab repo ke local workspace
├── courses/
│   ├── samir-mobile-ios/       <-- Kurikulum Lengkap iOS Native (Level 0 - 8 & Diagrams)
│   ├── samir-mobile-flutter/   <-- Kurikulum Lengkap Flutter Add-to-App (Level 0 - 8 & Diagrams)
│   └── samir-mobile/           <-- Topik spesifik & learning-records mendalam
└── README.md                   <-- Katalog ini
```

---

## 🚀 Cara Membaca & Menjalankan Interaktivitas

### 1. Membaca Mandiri di Browser (Offline Tanpa AI)
Anda dapat langsung membuka berkas materi di browser Chrome, Safari, atau Firefox:
```bash
# Buka Roadmap iOS
open courses/samir-mobile-ios/00-learning-roadmap.html

# Buka Roadmap Flutter
open courses/samir-mobile-flutter/00-learning-roadmap.html

# Atau buka modul Foundation pertama
open courses/samir-mobile-ios/01-project-foundation/01-application-overview.html
```

### 2. Menjalankan Integrasi 5 IDE (Klik Buka Kode di Local Editor)
Untuk mengaktifkan tombol pill `[🪐 Antigravity IDE] [⚡ Cursor] [💻 VS Code] [🛠️ Xcode]` agar dapat langsung melompat ke file dan baris kode di workspace lokal Anda:
```bash
python3 .assets/chiron_sync.py
```
*Daemon akan mendengarkan di `http://localhost:8765` dan melayani permintaan navigasi berkas secara instan.*

---

## 🔄 Mengompilasi Ulang Kurikulum (/teach)
Jika ada pembaruan dokumen markdown pada `SAMIR/Documentation/docs-learning-curve/`, jalankan compiler otomatis:
```bash
python3 .assets/chiron_curriculum_compiler.py
```
Kompiler akan memperbarui seluruh 80 berkas materi HTML tanpa mengubah repositori sumber kode.
