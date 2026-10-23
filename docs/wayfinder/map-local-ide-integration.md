# Wayfinder Map: Chiron Multi-IDE Deep Link & Local Workspace Opener

**Status:** Completed / Fully Resolved  
**Label:** `wayfinder:map`  
**Tracker:** local-markdown  
**Completed At:** 2026-10-22  

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
- [02: Daemon IDE Launcher Endpoint & Xcode Bridge](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/02-daemon-ide-launcher-endpoint-and-xcode-bridge.md): Selesai & terverifikasi. Endpoint POST /api/open di chiron_sync.py, CLI bridge /usr/bin/xed untuk Xcode, URI Schemes untuk Antigravity/Cursor/VSCode, proteksi keamanan repository boundary, dan test suite lulus 100%.
- [03: Client URL Parser & Hybrid Launcher Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/03-client-url-parser-and-hybrid-launcher-engine.md): Selesai & terverifikasi. Modul klien chiron-ide-launcher.js, parser GitLab URL dengan multi-segment branch, hybrid execution dengan fallback URI schemes, dan toast notification system.
- [04: Compact Action Bar UI & Dynamic DOM Auto-Injection](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/04-compact-action-bar-ui-and-auto-injection.md): Selesai & terverifikasi. Styling visual Compact Action Bar di style.css, dynamic DOM auto-injection di chiron-ide-launcher.js dan chiron-client.js, serta test DOM lulus 100%.
- [05: Responsive Smart Popover Dialog, IDE Filter Preferences & Visual Affordance](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/05-responsive-smart-popover-and-ide-filters.md): Selesai & terverifikasi. Dialog popover melayang modern yang responsif (adaptasi bottom sheet di mobile < 520px), panel pengaturan preferensi IDE & mode tampilan (Smart Popover vs Full Bar cara lama tersimpan di localStorage), deteksi konteks kalimat inline vs block, dan pembedaan visual jelas antara kode statis netral vs kode navigabel interaktif.

---

## Child Tickets (All Resolved)
1. [01: Local Repository Mapping Configuration & Daemon Path Resolution](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/01-repo-mapping-config-and-daemon-path-resolution.md) — `wayfinder:task` *(Closed / Resolved)*
2. [02: Daemon IDE Launcher Endpoint & Xcode Bridge](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/02-daemon-ide-launcher-endpoint-and-xcode-bridge.md) — `wayfinder:task` *(Closed / Resolved)*
3. [03: Client URL Parser & Hybrid Launcher Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/03-client-url-parser-and-hybrid-launcher-engine.md) — `wayfinder:prototype` *(Closed / Resolved)*
4. [04: Compact Action Bar UI & Dynamic DOM Auto-Injection](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/04-compact-action-bar-ui-and-auto-injection.md) — `wayfinder:prototype` *(Closed / Resolved)*
5. [05: Responsive Smart Popover Dialog, IDE Filter Preferences & Visual Affordance](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/05-responsive-smart-popover-and-ide-filters.md) — `wayfinder:prototype` *(Closed / Resolved)*

---

## Frontier Status
*(Seluruh tiket pada map ini telah tuntas diselesaikan & terverifikasi! Rute menuju Destination sudah 100% jelas dan berfungsi).*

---

## Not yet specified

- **Auto-Discovery Repo Path:** Algoritma deteksi otomatis jika folder repositori dipindahkan pengguna ke luar path default.
- **Default IDE Memory:** Pilihan satu klik utama ke IDE favorit dengan dropdown alternatif.
- **Line Bookmark to Personal Notes:** Tombol cepat untuk mengutip baris kode yang dibuka langsung menjadi draft catatan pribadi Chiron.

---

## Out of scope

- Eksekusi kompilasi kode (Build/Run project) langsung dari browser Chiron.
- Modifikasi atau penulisan kode kembali dari Chiron ke dalam repositori lokal (read-only navigation).
