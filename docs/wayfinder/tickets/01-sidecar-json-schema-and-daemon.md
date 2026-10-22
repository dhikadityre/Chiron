# Ticket 01: Sidecar JSON Schema & Background Sync Daemon

**Map:** [Wayfinder Map](../map.md)  
**Type:** `wayfinder:task`  
**Blocked by:** None *(Unblocked / Frontier)*  
**Assignee:** Antigravity  
**Status:** Closed  

---

## Question

Bagaimana spesifikasi skema data JSON sidecar (`<lesson>.notes.json`) serta implementasi script background sync daemon Python/Node yang ringan agar web browser dapat membaca dan menyimpan anotasi secara otomatis (auto-save) dengan aman di disk lokal?

---

## Context & Requirements

1. **Schema Sidecar JSON:**
   - Menyimpan array objek anotasi dengan atribut:
     - `id`: UUID unik (misal `anno-1730000000-xxxx`).
     - `type`: `"note"` (Catatan pribadi permanen) | `"ai_question"` (Antrean pertanyaan AI).
     - `created_at`: ISO 8601 timestamp.
     - `anchor`: Objek berisi `exact` (teks yang dipilih), `prefix` (konteks sebelum), `suffix` (konteks sesudah), dan `selector` (CSS selector elemen terdekat).
     - `content`: Teks catatan atau pertanyaan yang ditulis pengguna.
     - `status`: `"active"` | `"resolved"` (khusus untuk AI question sebelum dibersihkan).
2. **Local Sync Daemon:**
   - Script mandiri tanpa dependensi berat (misal `python3 .assets/chiron_sync.py` menggunakan modul bawaan `http.server`).
   - Menyajikan file statis dari root `Chiron/`.
   - Menyediakan REST API:
     - `GET /api/annotations?file=<relative-path>`: Membaca file `.notes.json`.
     - `POST /api/annotations`: Menulis/memperbarui file `.notes.json` secara atomic di samping file HTML terkait.
3. **Graceful Fallback:**
   - Jika daemon tidak aktif (misal file dibuka via `file:///...`), script di web otomatis beralih menggunakan `localStorage` agar tidak terjadi error.

---

## Resolution

- **Delivered Assets:**
  1. [`.assets/chiron_sync.py`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron_sync.py): Python 3 standard library daemon dengan static HTTP server, CORS, dan REST endpoints:
     - `GET /api/health`: Health status.
     - `GET /api/annotations?file=<path>`: Membaca file sidecar `<lesson>.notes.json`.
     - `POST /api/annotations`: Atomic write payload ke file sidecar di disk.
     - `GET /api/queue`: Memindai seluruh modul untuk antrean pertanyaan AI aktif.
  2. [`.assets/chiron-client.js`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron-client.js): Client sync adapter dengan probing berkala status daemon dan fallback mulus ke `localStorage`.
  3. [`.assets/test_sync.py`](file:///Users/samir/Documents/Workspace/Chiron/.assets/test_sync.py): Integration test suite yang memverifikasi flow end-to-end (100% Passed).
  4. Contoh file sidecar kanonikal yang terverifikasi di disk: [`0001-startup-sequence-and-initial-routing.notes.json`](file:///Users/samir/Documents/Workspace/Chiron/courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.notes.json).
- **Unblocked Tickets:**
  - [Ticket 02: Text Selection & Gutter Highlighting Engine](./02-text-selection-and-gutter-highlighting-engine.md) kini menjadi **Unblocked (Frontier)**.
  - [Ticket 04: AI Agent Resolution & Auto-Cleanup Workflow](./04-ai-agent-resolution-and-autoclean.md) kini menjadi **Unblocked (Frontier)**.
