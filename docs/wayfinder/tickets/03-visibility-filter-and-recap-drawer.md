# Ticket 03: Visibility Filter Controls & Recap Drawer UI

**Map:** [Wayfinder Map](../map.md)  
**Type:** `wayfinder:prototype`  
**Blocked by:** [02: Text Selection & Gutter Highlighting Engine](./02-text-selection-and-gutter-highlighting-engine.md) *(Resolved)*  
**Assignee:** Antigravity  
**Status:** Closed  

---

## Question

Bagaimana merancang antarmuka filter visibilitas stabilo (Show All, Notes Only, AI Questions Only, Hide All) serta Drawer Rekapitulasi Catatan yang responsif dan terintegrasi mulus dengan layout Chiron saat ini?

---

## Context & Requirements

1. **Segmented Control Filter di Topbar / Floating Pill:**
   - Menyediakan 4 mode visibilitas:
     - `👁️ Semua` (Semua stabilo terlihat).
     - `📝 Catatan Saja` (Hanya stabilo Amber/Kuning terlihat, stabilo AI disembunyikan).
     - `🤖 Tanya AI Saja` (Hanya stabilo Cyan terlihat, stabilo Note disembunyikan).
     - `🙈 Sembunyikan Semua` (Tampilan bersih polos tanpa stabilo untuk membaca fokus).
   - Pengaturan diterapkan via class pada `<body>` (misal `body.filter-notes-only`, `body.filter-none`).
2. **Hover & Tap Card Popover:**
   - Mengarahkan kursor mouse (hover) atau men-tap teks stabilo akan memunculkan kartu popover yang menampilkan:
     - Tipe badge (`📝 Catatan` atau `🤖 Antrean Tanya AI`).
     - Isi teks catatan/pertanyaan.
     - Tombol aksi: Edit, Hapus, atau Salin.
3. **Slide-Out Recap Drawer (Panel Rekapitulasi):**
   - Panel drawer samping (atau tab tambahan pada sidebar Daftar Isi) yang menampilkan daftar seluruh catatan dan pertanyaan aktif di modul tersebut.
   - Mengklik salah satu item pada rekapitulasi akan melakukan smooth scroll langsung menuju teks yang bersangkutan di halaman.

---

## Resolution

- **Delivered Assets:**
  1. [`.assets/chiron-annotations.js`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron-annotations.js):
     - Filter dropdown controller (`applyVisibilityFilter`) dengan 4 mode: Semua, Hanya Catatan, Hanya Tanya AI, dan Sembunyikan Semua.
     - Floating quick-filter pill widget (`#chironFloatingFilterPill`) dengan badge penghitung catatan & pertanyaan.
     - Slide-Out Recap Drawer (`#chironRecapDrawer`) dengan tab penyaring, kartu catatan interaktif, smooth scrolling jump-to dengan animasi luminous pulse (`chiron-pulse-highlight`), tombol hapus, dan tombol `📋 Salin Antrean AI ke Prompt`.
  2. [`.assets/style.css`](file:///Users/samir/Documents/Workspace/Chiron/.assets/style.css): Styling lengkap untuk class visibilitas filter pada `<body>`, dropdown topbar, slide-out drawer, kartu rekapitulasi, pulse animation, dan floating widget.
  3. Modul aktif terintegrasi: [`0001-startup-sequence-and-initial-routing.html`](file:///Users/samir/Documents/Workspace/Chiron/courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html).
  4. Sandboxing prototype di Second Brain Vault: [`01_Projects/prototypes/chiron/annotations-prototype/index.html`](file:///Users/samir/Documents/Workspace/Obsidian-Vault/second-brain-vault/01_Projects/prototypes/chiron/annotations-prototype/index.html).
