# Wayfinder Map: Chiron Web Annotation & AI Follow-up System

**Status:** Active  
**Label:** `wayfinder:map`  
**Tracker:** local-markdown  

---

## Destination

Sistem anotasi web Chiron (Interactive Highlighting, Personal Notes, & AI Follow-up Queue) yang beroperasi secara *local-first*:
Pengguna dapat menandai teks atau baris kode (melalui floating toolbar desktop atau gutter icon iPad), memilih antara Catatan Pribadi (permanen) atau Pertanyaan AI (antrean sementara); stabilo memiliki filter visibilitas; seluruh perubahan tersimpan secara hening (*silent auto-save*) ke berkas sidecar JSON (`<lesson>.notes.json`) melalui sync daemon lokal; dan AI Agent di IDE dapat membaca antrean pertanyaan, menjawabnya, serta otomatis menghapusnya dari dokumen web.

---

## Notes

- **Domain:** Chiron Learning Platform (`Chiron/courses/**/lessons/*.html` dan shared `.assets/`).
- **Skills Terkait:** `teach`, `wayfinder`, `to-spec`, `to-tickets`.
- **Standing Preferences:**
  - *Local-First & Git-Friendly:* Data tersimpan dalam berkas teks/JSON lokal, tanpa dependensi akun cloud pihak ketiga.
  - *Cross-Device Ergonomics:* Sangat nyaman diakses langsung di desktop (mouse selection) maupun saat remote dari iPad (touch gutter tap).
  - *Shared Decoupled Engine:* Seluruh stylesheet dan logic ditempatkan di `.assets/chiron-annotations.js` dan `.assets/style.css` sehingga otomatis aktif di semua modul modul Chiron tanpa duplikasi kode.

---

## Decisions so far

- [01: Sidecar JSON Schema & Background Sync Daemon](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/01-sidecar-json-schema-and-daemon.md): Selesai & terverifikasi. Skema JSON sidecar kanonikal (`<lesson>.notes.json`), script background daemon Python bawaan (`chiron_sync.py`), client sync adapter (`chiron-client.js`), serta test integrasi otomatis lulus 100%.
- [02: Text Selection & Gutter Highlighting Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/02-text-selection-and-gutter-highlighting-engine.md): Selesai & terverifikasi. Engine seleksi teks hybrid (`.assets/chiron-annotations.js`), floating toolbar, gutter trigger icon di margin paragraf/kode, dialog input (Cmd+Enter), render `<mark>` DOM, dan hover/tap card popover.
- [03: Visibility Filter Controls & Recap Drawer UI](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/03-visibility-filter-and-recap-drawer.md): Selesai & terverifikasi. Segmented control filter (Semua, Hanya Catatan, Hanya Tanya AI, Sembunyikan Semua), Slide-out Recap Drawer dengan kartu ringkasan, smooth scroll jump-to dengan animasi pulse, dan export/copy prompt.
- [04: AI Agent Resolution & Auto-Cleanup Workflow](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/04-ai-agent-resolution-and-autoclean.md): Selesai & terverifikasi. CLI manager (`.assets/chiron_ai_qna.py`), Antigravity skill (`chiron-qna`), serta window focus auto-reload di browser untuk pembersihan instan pertanyaan yang telah dijawab.
- [05: W3C Fuzzy Text-Quote Anchoring & Drift Resilience](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/05-fuzzy-text-anchoring-resilience.md): Selesai & terverifikasi. Engine rehidrasi teks 4-tier berbasis standar W3C TextQuoteSelector dengan fuzzy string similarity Levenshtein dan graceful orphan handling saat materi diedit.

---

## Child Tickets (All Resolved)

1. [01: Sidecar JSON Schema & Background Sync Daemon](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/01-sidecar-json-schema-and-daemon.md) — `wayfinder:task` *(Closed / Resolved)*
2. [02: Text Selection & Gutter Highlighting Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/02-text-selection-and-gutter-highlighting-engine.md) — `wayfinder:prototype` *(Closed / Resolved)*
3. [03: Visibility Filter Controls & Recap Drawer UI](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/03-visibility-filter-and-recap-drawer.md) — `wayfinder:prototype` *(Closed / Resolved)*
4. [04: AI Agent Resolution & Auto-Cleanup Workflow](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/04-ai-agent-resolution-and-autoclean.md) — `wayfinder:task` *(Closed / Resolved)*
5. [05: W3C Fuzzy Text-Quote Anchoring & Drift Resilience](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/05-fuzzy-text-anchoring-resilience.md) — `wayfinder:prototype` *(Closed / Resolved)*

---

## Not yet specified

- Pintasan keyboard (*Hotkeys*, misal `Alt+N` untuk Note baru, `Alt+Q` untuk AI Question baru).
- Status pill di topbar yang menampilkan status koneksi sync (*Sync Active* / *Local Storage Only*).
- Cross-course global dashboard untuk melihat rekap pertanyaan AI yang belum terjawab di seluruh kursus Chiron.

---

## Out of scope

- Chatbot AI *embedded* langsung di dalam browser menggunakan API key eksternal (seluruh pemrosesan AI diserahkan ke AI Agent di IDE).
- Sistem kolaborasi multi-user online realtime (Chiron adalah repositori belajar mandiri perorangan).
