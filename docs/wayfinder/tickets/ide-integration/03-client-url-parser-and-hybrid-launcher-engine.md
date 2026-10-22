# Ticket 03: Client URL Parser & Hybrid Launcher Engine

**Map:** [Chiron Multi-IDE Deep Link & Local Workspace Opener](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/map-local-ide-integration.md)  
**Label:** `wayfinder:prototype`  
**Status:** Closed / Resolved  
**Blocked by:** Resolved ([01: Local Repository Mapping Configuration & Daemon Path Resolution](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/01-repo-mapping-config-and-daemon-path-resolution.md), [02: Daemon IDE Launcher Endpoint & Xcode Bridge](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/02-daemon-ide-launcher-endpoint-and-xcode-bridge.md))  
**Blocks:** [04: Compact Action Bar UI & Dynamic DOM Auto-Injection](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/04-compact-action-bar-ui-and-auto-injection.md)  
**Resolved At:** 2026-10-22  

---

## Resolution

1. **Modul Klien Modular (`.assets/chiron-ide-launcher.js`):**
   - Mendukung lingkungan Browser (global `window.ChironIdeLauncher`) dan Node.js (`module.exports`).
   - `parseGitLabUrl(url, config)`: mengekstrak namespace project, branch (termasuk multi-segment seperti `learn/iOS-Arch`), path relatif file, serta nomor baris awal dan akhir (#L54-L75).
   - `resolveLocalPath(parsed, config)`: memetakan project dan branch ke path absolut di macOS via `chiron_config.json`.
   - `buildIdeUri(ide, path, line)`: menyusun skema URI untuk `antigravity://`, `cursor://`, dan `vscode://`.

2. **Hybrid Execution Engine (`openInIde`):**
   - Memprioritaskan pengiriman payload ke REST endpoint daemon `http://localhost:8765/api/open` untuk akurasi maksimal (termasuk pembukaan Xcode via CLI `xed`).
   - Jika daemon offline, engine secara otomatis melakukan graceful fallback:
     - Untuk Antigravity, Cursor, dan VS Code: mengeksekusi browser URI scheme langsung (`window.location.href = uri`).
     - Untuk Xcode: menampilkan instruksi bahwa daemon diperlukan untuk bridge Xcode.

3. **Toast Notification System:**
   - Komponen notifikasi modern di pojok kanan bawah dengan micro-animation slide-in/out, styling 4 status (`success`, `info`, `warning`, `error`), auto-dismiss 3.5 detik, dan tombol tutup manual.
   - Telah ditambahkan ke `.assets/style.css`.

4. **Testing Suite:**
   - Unit test Node.js `.assets/test_ide_launcher_client.js` memvalidasi URL parser, local path resolver, dan pembuatan URI scheme — lulus 100%.

---

## Question

Bagaimana merancang modul JavaScript klien (`.assets/chiron-ide-launcher.js`) yang mampu mengekstraksi path relatif dan baris kode dari link GitLab (misal `samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/...#L54-L75`), memetakan ke path lokal via config, mengeksekusi aksi pembukaan melalui REST API daemon (`/api/open`) dengan fallback otomatis ke URI Schemes browser (`antigravity://`, `cursor://`, `vscode://`), serta memunculkan toast notifikasi umpan balik ke pengguna?

---

## Scope & Deliverables

1. Parser URL GitLab yang mengekstrak:
   - `project`: `samir_it/samir-mobile`
   - `branch`: `learn/iOS-Arch`
   - `filePath`: `ios/IDSamirLoan/.../IDSamirMainModule.swift`
   - `startLine`: `54`
   - `endLine`: `75`
2. Hybrid Dispatcher:
   - Mencoba `fetch('http://localhost:8765/api/open', { method: 'POST', ... })`.
   - Jika daemon merespon sukses, tampilkan toast "Membuka di [IDE] (L[line])...".
   - Jika daemon tidak aktif / offline:
     - Untuk `antigravity`, `cursor`, `vscode`: fallback langsung membuka link URI scheme `window.location.href = schemeUrl`.
     - Untuk `xcode`: tampilkan toast instruksi bahwa daemon perlu dijalankan untuk bridge Xcode.
3. Toast Notification UI: komponen toast ringkas, elegan, dan non-intrusif di pojok bawah layar.
