# 🏹 Chiron — Interactive Codebase Mastery & Learning Academy

Selamat datang di **Chiron**. Direktori ini adalah platform mandiri (*independent repository & learning engine*) untuk seluruh sesi belajar interaktif, pembedahan arsitektur *real-world code* di workspace, audit prinsip SOLID & Clean Architecture, penandaan materi (*Wayfinder annotations*), integrasi multi-IDE, serta kuis retensi kognitif.

---

## 🌟 Fitur Unggulan

| Fitur | Deskripsi |
| :--- | :--- |
| **📚 80+ Modul Interaktif** | Materi HTML mandiri (*self-contained*) dengan styling Tufte, TOC ScrollSpy, Sticky Topbar Tabs, dan Fullscreen Mermaid Diagram Lightbox. |
| **⚡ 5-IDE Hybrid Launcher** | Lompat langsung dari cuplikan kode di web reader ke baris spesifik di editor lokal Anda (**Antigravity IDE**, **Xcode**, **Cursor**, **VS Code**, atau **GitLab**). |
| **🖍️ Wayfinder Annotations** | Sorot teks (*highlight*), buat Catatan Pribadi, atau tandai Pertanyaan AI dengan persistensi *sidecar JSON* tanpa memodifikasi dokumen sumber. |
| **🤖 AI QnA Loop & Auto-Cleanup** | Terhubung langsung dengan AI Agent (via `/chiron-qna` atau CLI). Pertanyaan otomatis terjawab dan stabilo di browser langsung lenyap seketika. |
| **🎯 Interactive Retention Quiz** | Uji pemahaman konsep arsitektur di setiap akhir bab dengan umpan balik dan evaluasi langsung di browser. |
| **🔌 100% Offline-Ready** | Dapat dibaca secara mandiri tanpa dependensi internet atau server eksternal. Daemon lokal hanya menggunakan Python 3 Standard Library. |

---

## 📚 Katalog Kursus Aktif

| Scope / Namespace | Topik Kursus | Modul | Status | Misi & Roadmaps |
| :--- | :--- | :---: | :---: | :--- |
| `samir-mobile-ios` | **SAMIR Mobile iOS Full Architecture Curriculum** | 40 Materi | 🟢 Siap | [MISSION.md](courses/samir-mobile-ios/MISSION.md) • [00-learning-roadmap.html](courses/samir-mobile-ios/00-learning-roadmap.html) |
| `samir-mobile-flutter` | **SAMIR Mobile Flutter Add-to-App Curriculum** | 40 Materi | 🟢 Siap | [MISSION.md](courses/samir-mobile-flutter/MISSION.md) • [00-learning-roadmap.html](courses/samir-mobile-flutter/00-learning-roadmap.html) |
| `samir-mobile` | **iOS App Startup Sequence & Initial Routing (Deep Dive)** | 1 Modul | 🟡 Sesi Khusus | [MISSION.md](courses/samir-mobile/app-startup-sequence/MISSION.md) • [0001-startup-sequence.html](courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html) |

---

## 🛠️ Integrasi 5-IDE (Action Bar)

Setiap blok kode dan referensi file pada materi dilengkapi dengan *Action Bar* interaktif untuk membuka berkas secara instan di editor pilihan:

| Editor | Protokol / Bridge | Mekanisme Pembukaan |
| :--- | :--- | :--- |
| **🪐 Google Antigravity IDE** | Daemon REST API `/api/open` | `antigravity-ide://file/{path}:{line}` / CLI fallback |
| **🛠️ Apple Xcode** | Daemon Bridge via `/usr/bin/xed` | Membuka project `.xcworkspace` dan loncat ke baris `{line}` presisi |
| **⚡ Cursor** | Native URL Scheme / REST | `cursor://file/{path}:{line}` |
| **💻 VS Code** | Native URL Scheme / REST | `vscode://file/{path}:{line}` |
| **🦊 GitLab Remote** | Browser Direct Link | Navigasi ke GitLab commit / blob dengan penanda baris `#L{line}` |

> [!NOTE]
> Pemetaan path berkas remote GitLab ke direktori repositori lokal dikonfigurasi melalui [chiron_config.json](chiron_config.json) dengan proteksi anti-*path traversal*.

---

## 🖍️ Wayfinder: Sistem Catatan & Kolaborasi AI

Wayfinder memungkinkan Anda belajar secara aktif layaknya membaca buku fisik:

1. **Highlight & Notes:** Blok teks apapun di web reader Chiron untuk memunculkan popover menu:
   - 🟡 **Highlight:** Menandai poin penting.
   - 📝 **Catatan Pribadi:** Menyimpan refleksi atau ringkasan pribadi.
   - 🤖 **Pertanyaan AI:** Menandai bagian kode yang membingungkan untuk dijawab oleh AI Agent.
2. **Penyimpanan Sidecar JSON:** Seluruh anotasi disimpan di berkas pendamping `<modul>.notes.json`. Dokumen HTML sumber dan repositori Git tetap bersih tanpa *dirty diff*.
3. **Fuzzy Anchoring:** Algoritma pencocokan teks toleran terhadap sedikit perubahan baris atau spasi pada materi.
4. **Alur Tanya-Jawab AI (`/chiron-qna`):**
   - Tandai pertanyaan di browser.
   - Di IDE Antigravity / Cursor, panggil skill `/chiron-qna`.
   - AI Agent membaca konteks kode asli di workspace, menyajikan jawaban komprehensif, dan secara otomatis membersihkan stabilo pertanyaan dari sidecar JSON.

---

## 🏛️ Struktur Direktori

```text
Chiron/
├── .assets/                          <-- Runtime Engine, Styling & Diagnostic Scripts
│   ├── style.css                     <-- Tufte CSS, Topbar, Popover & Action Bar UI
│   ├── chiron-ide-launcher.js        <-- Client-side DOM Injection & IDE Launcher
│   ├── chiron-annotations.js         <-- Wayfinder Text Selection & Highlight Engine
│   ├── chiron-client.js              <-- Toast & Client-Side Communication
│   ├── chiron_sync.py                <-- Local REST Daemon (Port 8765)
│   ├── chiron_ai_qna.py              <-- AI QnA Queue Processor & Auto-clean CLI
│   ├── chiron_curriculum_compiler.py <-- Generator Modul Interaktif (/teach)
│   └── test_*.py / test_*.js         <-- Unit Test Suites (IDE Bridge, DOM, Fuzzy)
├── chiron_config.json                <-- Konfigurasi Mapping GitLab ke Workspace Lokal
├── courses/                          <-- Materi Kurikulum Interaktif
│   ├── samir-mobile-ios/             <-- 40 Modul Lengkap Native iOS
│   ├── samir-mobile-flutter/         <-- 40 Modul Lengkap Flutter Add-to-App
│   └── samir-mobile/                 <-- Deep Dive Topik Khusus (App Startup, dll)
├── docs/                             <-- Dokumentasi Arsitektur & Wayfinder Tickets
│   └── wayfinder/                    <-- Spesifikasi Map Local, Sidecar Schema & Tickets
└── README.md                         <-- Dokumentasi Utama
```

---

## 🚀 Panduan Memulai Cepat

### 1. Membaca Mandiri di Browser (Offline)
Anda dapat langsung membuka berkas materi HTML tanpa menjalankan daemon:
```bash
# Buka Roadmap iOS
open courses/samir-mobile-ios/00-learning-roadmap.html

# Buka Roadmap Flutter
open courses/samir-mobile-flutter/00-learning-roadmap.html

# Buka Modul Startup Sequence
open courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html
```

### 2. Menjalankan Chiron Background Sync Daemon
Untuk mengaktifkan integrasi lompat ke 5 IDE dan sinkronisasi anotasi Wayfinder:
```bash
python3 .assets/chiron_sync.py
```
*Daemon akan berjalan di `http://localhost:8765` tanpa dependensi eksternal (100% Python Standard Library).*

### 3. Memeriksa Kesehatan & Kesiapan Lingkungan (Diagnostik)
Jalankan runbook diagnostik untuk memastikan seluruh path repositori dan IDE lokal terhubung:
```bash
python3 /Users/samir/Documents/Workspace/Athena/common/skills/sophia-chiron-setup/scripts/setup_chiron.py
```

### 4. Mengelola Antrean Pertanyaan AI
```bash
# Melihat daftar pertanyaan yang ditandai di modul:
python3 .assets/chiron_ai_qna.py --list

# Menyelesaikan/membersihkan pertanyaan setelah dijawab:
python3 .assets/chiron_ai_qna.py --resolve <ANNO_ID>
```

### 5. Mengompilasi Ulang Kurikulum
Jika ada pembaruan dokumen markdown pada dokumentasi kurikulum:
```bash
python3 .assets/chiron_curriculum_compiler.py
```

---

## 🧪 Pengujian & Validasi (Test Suites)

Chiron dilengkapi dengan rangkaian pengujian unit komprehensif:

| Komponen yang Diuji | Perintah Test | Keterangan |
| :--- | :--- | :--- |
| **Multi-IDE Launcher Engine** | `python3 .assets/test_ide_launcher.py` | Menguji URI generator, bridging `/usr/bin/xed`, dan REST dispatch. |
| **DOM Injection & Popover** | `node .assets/test_dom_action_bar.js` | Menguji pembuatan elemen Action Bar 5 IDE pada HTML blok kode. |
| **Fuzzy Text Anchoring** | `node .assets/test_fuzzy.js` | Menguji ketahanan pencocokan teks highlight saat konten berubah. |
| **Daemon & Path Resolution** | `python3 .assets/test_sync.py` | Menguji REST endpoints (`/api/open`, `/api/health`, `/api/resolve`). |
| **Config Resolution** | `python3 .assets/test_config_resolution.py` | Menguji resolusi repositori lokal dari GitLab identifier. |

---

## 🛡️ Prinsip Keamanan & Desain

1. **Anti-Path Traversal:** Daemon `/api/open` memvalidasi target file terhadap daftar repositori yang diizinkan pada `chiron_config.json`. Permintaan di luar direktori aman akan otomatis ditolak (*HTTP 403 Forbidden*).
2. **Preserve Personal Notes:** Skrip pembersih otomatis AI hanya menyentuh `type: "ai_question"`. Seluruh catatan pribadi (`type: "note"`) dan stabilo (`type: "highlight"`) dijamin tidak akan pernah terhapus.
3. **Zero Mutation on Source Code:** Integrasi materi dan catatan tidak pernah menyisipkan tag atau atribut aneh ke file markdown asli maupun source code aplikasi.
