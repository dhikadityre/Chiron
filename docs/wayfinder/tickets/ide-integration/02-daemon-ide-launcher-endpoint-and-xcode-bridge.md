# Ticket 02: Daemon IDE Launcher Endpoint & Xcode Bridge

**Map:** [Chiron Multi-IDE Deep Link & Local Workspace Opener](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/map-local-ide-integration.md)  
**Label:** `wayfinder:task`  
**Status:** Closed / Resolved  
**Blocked by:** Resolved ([01: Local Repository Mapping Configuration & Daemon Path Resolution](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/01-repo-mapping-config-and-daemon-path-resolution.md))  
**Blocks:** [03: Client URL Parser & Hybrid Launcher Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/03-client-url-parser-and-hybrid-launcher-engine.md)  
**Resolved At:** 2026-10-22  

---

## Resolution

1. **Endpoint `POST /api/open`:**
   - Berhasil diimplementasikan di `.assets/chiron_sync.py`.
   - Menerima payload JSON fleksibel: dapat menggunakan `file_path` absolut langsung atau kombinasi `project`, `branch`, dan relative `file`.
   - Mendukung parameter `line` untuk lompat baris presisi, serta flag `dry_run` untuk testing dan validasi aman.

2. **Eksekusi Subprocess Multi-IDE di macOS:**
   - **Xcode Bridge:** Menggunakan `/usr/bin/xed -line <line> <file_path>` native macOS dengan fallback ke `open -a Xcode`.
   - **Antigravity IDE:** Membuka `open antigravity://file/<file_path>:<line>`.
   - **Cursor IDE:** Membuka `open cursor://file/<file_path>:<line>`.
   - **VS Code IDE:** Membuka `open vscode://file/<file_path>:<line>`.
   - Seluruh subprocess dijalankan dengan `shell=False` dan argument array untuk mencegah command injection.

3. **Keamanan & Validasi:**
   - Fungsi `validate_file_in_allowed_repositories()` memastikan file benar-benar ada dan berada di dalam workspace repositori resmi yang terdaftar di `chiron_config.json`. File di luar workspace langsung ditolak dengan status HTTP 403 Forbidden.

4. **Testing & Verifikasi:**
   - Test suite baru `.assets/test_ide_launcher.py` lulus 100% (Unit command generation, Security guard, Dry-run API, dan HTTP POST integration).
   - Daemon live di port 8765 telah direstart dan terverifikasi via cURL untuk Xcode dan Antigravity.

---

## Question

Bagaimana mengimplementasikan endpoint REST `POST /api/open` pada `chiron_sync.py` yang mengeksekusi pembukaan file lokal ke IDE yang dipilih di macOS, dengan penanganan khusus Xcode melalui CLI native macOS `/usr/bin/xed -line <L> <file>` dan penjagaan keamanan (path traversal guard)?

---

## Scope & Deliverables

1. Endpoint `POST /api/open` menerima payload JSON:
   ```json
   {
     "ide": "xcode" | "antigravity" | "cursor" | "vscode",
     "file_path": "/Users/samir/.../IDSamirMainModule.swift",
     "line": 54
   }
   ```
2. Logika eksekusi subprocess di macOS:
   - **Xcode:** Menjalankan `/usr/bin/xed -line <line> <file_path>` (atau fallback `open -a Xcode <file_path>`).
   - **Antigravity:** Menjalankan `open antigravity://file/<file_path>:<line>` atau `/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity -g <file_path>:<line>`.
   - **Cursor:** Menjalankan `open cursor://file/<file_path>:<line>`.
   - **VS Code:** Menjalankan `open vscode://file/<file_path>:<line>`.
3. Keamanan:
   - Memastikan `file_path` berada di bawah salah satu folder `local_path` repositori yang terdaftar di `chiron_config.json`.
   - Mencegah *command injection* dengan validasi tipe data parameter dan passing argument terpisah di `subprocess.run(..., shell=False)`.
