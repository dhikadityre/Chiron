# Ticket 03: Client URL Parser & Hybrid Launcher Engine

**Map:** [Chiron Multi-IDE Deep Link & Local Workspace Opener](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/map-local-ide-integration.md)  
**Label:** `wayfinder:prototype`  
**Status:** Open (Blocked by 01, 02)  
**Blocked by:** [01: Local Repository Mapping Configuration & Daemon Path Resolution](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/01-repo-mapping-config-and-daemon-path-resolution.md), [02: Daemon IDE Launcher Endpoint & Xcode Bridge](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/02-daemon-ide-launcher-endpoint-and-xcode-bridge.md)  
**Blocks:** [04: Compact Action Bar UI & Dynamic DOM Auto-Injection](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/04-compact-action-bar-ui-and-auto-injection.md)  

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
