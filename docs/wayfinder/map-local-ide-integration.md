# Wayfinder Map: Chiron Multi-IDE Deep Link & Local Workspace Opener

**Status:** Active  
**Label:** `wayfinder:map`  
**Tracker:** local-markdown  
**Created:** 2026-10-22  

---

## Destination

Menghadirkan fitur pembuka kode lokal multi-IDE (Antigravity IDE, Cursor IDE, VS Code, dan Xcode) berdampingan dengan link GitLab di setiap snippet kode pelajaran Chiron:
Pengguna dapat membuka file kode target secara instan (langsung lompat ke baris yang tepat) melalui Compact Action Bar (`[🦊 GitLab] [🪐 Antigravity] [⚡ Cursor] [💻 VS Code] [🛠️ Xcode]`), dengan sistem pemetaan repositori terpusat (`chiron_config.json`), mekanisme eksekusi hybrid cerdas (endpoint daemon `/api/open` dengan presisi `xed` untuk Xcode dan fallback ke URI Scheme browser), serta injeksi DOM otomatis ke seluruh modul pelajaran Chiron.

---

## Notes

- **Domain:** Chiron Learning Platform (`Chiron/courses/**/lessons/*.html`, `.assets/chiron_sync.py`, `.assets/style.css`, `.assets/chiron-client.js`).
- **Skills Terkait:** `wayfinder`, `teach`, `chiron-qna`.
- **Standing Preferences (Aligned via /grill-me):**
  - *Compact Action Bar:* Deretan tombol ikon ringkas di header snippet kode untuk akses 1-klik instan.
  - *Centralized Config:* Mapping `samir_it/samir-mobile` -> path lokal diatur di `chiron_config.json`.
  - *Hybrid Execution:* Daemon `/api/open` memprioritaskan kontrol presisi macOS (`xed` untuk Xcode dan remote trigger dari iPad), dengan graceful fallback ke browser URI schemes (`antigravity://`, `cursor://`, `vscode://`).
  - *Dynamic DOM Injection:* Injeksi otomatis via JavaScript di `.assets/` agar semua materi lama dan baru otomatis menikmati fitur ini tanpa edit manual markup HTML.
  - *Visual Feedback:* Toast ringkas interaktif saat tombol diklik.

---

## Decisions so far
- [01: Local Repository Mapping Configuration & Daemon Path Resolution](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/01-repo-mapping-config-and-daemon-path-resolution.md): Selesai & terverifikasi. Berkas chiron_config.json terpusat di root Chiron, endpoint GET /api/config & GET /api/resolve di chiron_sync.py, pengamanan path traversal, serta test suite lulus 100%.

---

## Tickets & Frontier

### Frontier (Open & Unblocked)
- [02: Daemon IDE Launcher Endpoint & Xcode Bridge](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/02-daemon-ide-launcher-endpoint-and-xcode-bridge.md) — `wayfinder:task`

### Blocked Tickets
- [03: Client URL Parser & Hybrid Launcher Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/03-client-url-parser-and-hybrid-launcher-engine.md) — `wayfinder:prototype` *(Blocked by: 02)*
- [04: Compact Action Bar UI & Dynamic DOM Auto-Injection](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/04-compact-action-bar-ui-and-auto-injection.md) — `wayfinder:prototype` *(Blocked by: 03)*

---

### Resolved Tickets
- [01: Local Repository Mapping Configuration & Daemon Path Resolution](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/01-repo-mapping-config-and-daemon-path-resolution.md) — `wayfinder:task` *(Closed / Resolved)*

---

## Not yet specified

- **Auto-Discovery Repo Path:** Algoritma deteksi otomatis jika folder repositori dipindahkan pengguna ke luar path default.
- **Default IDE Memory:** Pilihan satu klik utama ke IDE favorit dengan dropdown alternatif.
- **Line Bookmark to Personal Notes:** Tombol cepat untuk mengutip baris kode yang dibuka langsung menjadi draft catatan pribadi Chiron.

---

## Out of scope

- Eksekusi kompilasi kode (Build/Run project) langsung dari browser Chiron.
- Modifikasi atau penulisan kode kembali dari Chiron ke dalam repositori lokal (read-only navigation).
