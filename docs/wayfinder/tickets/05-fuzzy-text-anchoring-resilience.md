# Ticket 05: W3C Fuzzy Text-Quote Anchoring & Drift Resilience

**Map:** [Wayfinder Map](../map.md)  
**Type:** `wayfinder:prototype`  
**Blocked by:** [02: Text Selection & Gutter Highlighting Engine](./02-text-selection-and-gutter-highlighting-engine.md) *(Resolved)*  
**Assignee:** Antigravity  
**Status:** Closed  

---

## Question

Bagaimana algoritma penambatan teks (*text anchoring*) berbasis standar W3C Web Annotation bekerja agar saat isi file HTML berubah (misalnya kalimat di atasnya diedit atau ditambahkan oleh AI Agent saat refactoring), stabilo catatan tetap dapat menemukan posisinya secara akurat menggunakan fuzzy text matching?

---

## Context & Requirements

1. **W3C TextQuoteSelector Anchor Structure:**
   - Menyimpan 3 komponen teks utama:
     - `exact`: Teks kalimat atau kode asli yang dipilih.
     - `prefix`: 30–50 karakter teks persis sebelum kalimat yang dipilih.
     - `suffix`: 30–50 karakter teks persis setelah kalimat yang dipilih.
2. **Reconciliation / Fuzzy Matching Algorithm:**
   - Saat halaman dimuat, sistem pertama kali mencari kecocokan persis (`prefix + exact + suffix`).
   - Jika tidak ditemukan (karena teks bergeser/diedit), sistem melakukan pencarian berbobot (fuzzy match berbasis Levenshtein distance atau substring scoring pada elemen terdekat).
   - Menempelkan kembali elemen `<mark>` ke teks hasil pencocokan terbaik.
3. **Agent Self-Healing:**
   - Memberikan panduan bagi AI Agent saat melakukan update besar pada dokumen HTML untuk merekonsiliasi posisi anchor di file `.notes.json` jika ada perubahan struktur DOM besar.

---

## Resolution

- **Delivered Assets:**
  1. [`.assets/chiron-annotations.js`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron-annotations.js): Engine rehydrasi 4-tier berbasis W3C TextQuoteSelector:
     - **Tier 1:** Single exact match (100% confidence).
     - **Tier 2:** Disambiguasi konteks menggunakan kesamaan prefix & suffix saat terdapat beberapa kemunculan kata yang sama.
     - **Tier 3:** Approximate / Fuzzy matching berbasis Levenshtein similarity (threshold >= 75%) untuk menangani pergeseran typo atau refactoring minor.
     - **Tier 4 (Graceful Orphan Handling):** Jika teks dihapus total dari materi, catatan tetap 100% tersimpan aman dan diberi penanda `⚠️ Teks Bergeser / Diedit` di Recap Drawer.
  2. [`.assets/test_fuzzy.js`](file:///Users/samir/Documents/Workspace/Chiron/.assets/test_fuzzy.js): Test suite otomatis Node.js memvalidasi keempat skenario drift dan lulus 100%.
  3. [`.assets/style.css`](file:///Users/samir/Documents/Workspace/Chiron/.assets/style.css): Styling badge `.recap-badge-orphaned` untuk peringatan teks bergeser di panel rekapitulasi.
