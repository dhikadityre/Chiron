# Ticket 04: AI Agent Resolution & Auto-Cleanup Workflow

**Map:** [Wayfinder Map](../map.md)  
**Type:** `wayfinder:task`  
**Blocked by:** [01: Sidecar JSON Schema & Background Sync Daemon](./01-sidecar-json-schema-and-daemon.md) *(Resolved)*  
**Assignee:** Antigravity  
**Status:** Closed  

---

## Question

Bagaimana protokol kerja dan instruksi AI Agent di IDE agar agen dapat secara otonom mendeteksi file sidecar JSON, merespons seluruh antrean pertanyaan AI pengguna di chat, dan secara aman menghapus pertanyaan yang telah dijawab dari file JSON tanpa mengganggu catatan pribadi (note)?

---

## Context & Requirements

1. **AI Invocation Protocol:**
   - Pengguna dapat memicu proses melalui percakapan di IDE, misalnya:  
     `"Jawab pertanyaan yang saya tandai di modul 0001"` atau slash command `/ask-annotations`.
   - Agen mencari file `<lesson>.notes.json` pada modul aktif.
2. **Autonomous Processing & Response:**
   - Memfilter item bertipe `type: "ai_question"`.
   - Mengambil konteks kutipan (`anchor.exact`) dan pertanyaan pengguna (`content`).
   - Menyajikan jawaban mendalam, solutif, dan mengaitkannya dengan kode sumber di workspace.
3. **Safe Auto-Cleanup:**
   - Setelah jawaban selesai dituliskan, agen memperbarui file `<lesson>.notes.json`.
   - Seluruh item `ai_question` yang sudah selesai dijawab dihapus dari array JSON (atau diarsipkan).
   - Seluruh item `note` (catatan permanen pengguna) dipertahankan 100% tanpa perubahan.
   - Hasilnya, saat web di-refresh atau menerima sinyal live-reload, highlight pertanyaan AI otomatis hilang dari pandangan pengguna.

---

## Resolution

- **Delivered Assets:**
  1. [`.assets/chiron_ai_qna.py`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron_ai_qna.py): CLI tool untuk listing antrean pertanyaan AI (`--list`), output JSON (`--json`), dan pembersihan otomatis pertanyaan yang telah terjawab (`--resolve <id>` atau `--resolve-all`), dengan garansi integritas 100% catatan pribadi (`type: "note"`).
  2. [`/Users/samir/.gemini/config/skills/chiron-qna/SKILL.md`](file:///Users/samir/.gemini/config/skills/chiron-qna/SKILL.md): Antigravity Skill resmi yang memandu AI Agent membaca, menganalisis, menjawab, dan membersihkan pertanyaan pengguna secara mandiri.
  3. Window Focus Live Reload di [`.assets/chiron-annotations.js`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron-annotations.js) sehingga saat pengguna kembali ke browser dari IDE, stabilo pertanyaan yang telah dijawab langsung otomatis hilang tanpa perlu reload manual.
