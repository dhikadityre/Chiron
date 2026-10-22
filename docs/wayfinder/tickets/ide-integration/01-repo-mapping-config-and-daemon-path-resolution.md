# Ticket 01: Local Repository Mapping Configuration & Daemon Path Resolution

**Map:** [Chiron Multi-IDE Deep Link & Local Workspace Opener](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/map-local-ide-integration.md)  
**Label:** `wayfinder:task`  
**Status:** Closed / Resolved  
**Blocks:** [02: Daemon IDE Launcher Endpoint & Xcode Bridge](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/02-daemon-ide-launcher-endpoint-and-xcode-bridge.md), [03: Client URL Parser & Hybrid Launcher Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/03-client-url-parser-and-hybrid-launcher-engine.md)  
**Resolved At:** 2026-10-22  

---

## Resolution

1. **Berkas Konfigurasi Terpusat (`chiron_config.json`):**
   - Berhasil dibuat di root direktori Chiron.
   - Memetakan repositori GitLab `samir_it/samir-mobile` ke folder absolut lokal `/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus`.
   - Mendukung multi-branch mapping (`learn/iOS-Arch` dan `develop`).
   - Menyimpan konfigurasi 4 IDE target: Antigravity, Cursor, VS Code, dan Xcode.

2. **Daemon Path Resolution & API (`chiron_sync.py`):**
   - Menambahkan fungsi helper `load_chiron_config()` dan `resolve_local_file_path()`.
   - Memiliki penjaga keamanan (*path traversal guard*) yang mencegah akses di luar root repositori.
   - Endpoint `GET /api/config` menyediakan data mapping runtime untuk klien browser (lengkap dengan CORS).
   - Endpoint `GET /api/resolve` memvalidasi keberadaan file lokal secara instan.

3. **Verifikasi & Testing:**
   - Unit & integration test otomatis (`.assets/test_config_resolution.py`) lulus 100%.
   - Regresi sync daemon (`.assets/test_sync.py`) tetap lulus 100%.
   - Daemon live di port 8765 telah direstart dan terverifikasi merespon `file_exists: true` untuk file `IDSamirMainModule.swift`.

---

## Question

Bagaimana merancang struktur konfigurasi terpusat `chiron_config.json` di root Chiron yang memetakan namespace repositori GitLab (seperti `samir_it/samir-mobile`) ke path absolut folder lokal di macOS (`/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus`), serta menambahkan endpoint `/api/config` pada daemon `chiron_sync.py` untuk menyediakan data konfigurasi ini ke sisi klien browser?

---

## Scope & Deliverables

1. Berkas konfigurasi kanonikal `chiron_config.json` di root workspace Chiron dengan skema:
   ```json
   {
     "version": "1.0",
     "repositories": {
       "samir-mobile": {
         "gitlab_project": "samir_it/samir-mobile",
         "local_path": "/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus",
         "default_branch": "learn/iOS-Arch",
         "xcode_project_path": "ios/IDSamirLoan/IDSamirLoan.xcworkspace"
       }
     },
     "ides": {
       "antigravity": { "name": "Antigravity", "enabled": true },
       "cursor": { "name": "Cursor", "enabled": true },
       "vscode": { "name": "VS Code", "enabled": true },
       "xcode": { "name": "Xcode", "enabled": true }
     }
   }
   ```
2. Endpoint `GET /api/config` pada `.assets/chiron_sync.py` dengan CORS aktif agar klien browser dapat membaca mapping secara runtime.
3. Fungsi helper di daemon Python untuk memverifikasi apakah folder repositori dan file target benar-benar ada di filesystem lokal sebelum dieksekusi.
