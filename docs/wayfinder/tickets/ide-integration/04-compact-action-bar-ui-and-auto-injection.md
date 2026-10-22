# Ticket 04: Compact Action Bar UI & Dynamic DOM Auto-Injection

**Map:** [Chiron Multi-IDE Deep Link & Local Workspace Opener](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/map-local-ide-integration.md)  
**Label:** `wayfinder:prototype`  
**Status:** Open (Frontier)  
**Blocked by:** Resolved ([03: Client URL Parser & Hybrid Launcher Engine](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/03-client-url-parser-and-hybrid-launcher-engine.md))  

---

## Question

Bagaimana merancang styling visual Compact Action Bar di `.assets/style.css` (terdiri dari tombol pills berdampingan: `[🦊 GitLab] [🪐 Antigravity] [⚡ Cursor] [💻 VS Code] [🛠️ Xcode]`), serta mekanisme auto-injection DOM saat halaman pelajaran dimuat sehingga seluruh tautan `.gitlab-code-link` langsung ter-upgrade secara otomatis tanpa perlu mengubah berkas HTML pelajaran yang sudah ada?

---

## Scope & Deliverables

1. Styling CSS di `.assets/style.css`:
   - Kontainer flex horizontal yang rapi dan responsif di atas blok kode.
   - Badge/pill dengan ikon khas masing-masing platform:
     - 🦊 GitLab (Cloud web link)
     - 🪐 Antigravity (Local IDE)
     - ⚡ Cursor (Local IDE)
     - 💻 VS Code (Local IDE)
     - 🛠️ Xcode (Local IDE)
   - Micro-interaction: hover glow, active scale, tooltip informatif (menampilkan path lokal & baris).
   - Adaptif untuk mode desktop dan mobile/iPad view.
2. Auto-injection logic di lifecycle script `.assets/`:
   - Query semua elemen `.gitlab-code-link` saat DOM siap.
   - Menggantikan atau melengkapi elemen dengan wrapper `chiron-code-action-bar`.
   - Mengaitkan event handler klik ke engine launcher dari Ticket 03.
3. Verifikasi pada dokumen pelajaran nyata:
   - `courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html`.
