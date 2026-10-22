# Ticket 02: Text Selection & Gutter Highlighting Engine

**Map:** [Wayfinder Map](../map.md)  
**Type:** `wayfinder:prototype`  
**Blocked by:** [01: Sidecar JSON Schema & Background Sync Daemon](./01-sidecar-json-schema-and-daemon.md) *(Resolved)*  
**Assignee:** Antigravity  
**Status:** Closed  

---

## Question

Bagaimana cara mengimplementasikan antarmuka seleksi teks hybrid di browser (Floating Toolbar untuk desktop mouse dan Gutter Action Icons untuk layar sentuh iPad) serta rendering visual highlight stabilo yang rapi di DOM tanpa merusak struktur HTML konten?

---

## Context & Requirements

1. **Desktop Selection (Floating Toolbar):**
   - Mendeteksi event `selectionchange` / `mouseup`.
   - Menampilkan mini toolbar melayang di atas area yang diblok dengan 2 tombol:
     - `📝 Catatan` (Warna aksen Amber/Kuning).
     - `🤖 Tanya AI` (Warna aksen Cyan/Luminous).
   - Membuka kotak popover input ringkas saat salah satu tombol ditekan.
2. **Touch/iPad Ergonomics (Gutter Action Icons):**
   - Setiap elemen paragraf (`<p>`), list item (`<li>`), callout box, dan blok kode (`<pre>`) memiliki tombol trigger halus (`+` atau `💬`) di gutter margin kiri yang mudah ditap dengan jari/Apple Pencil.
   - Men-tap ikon gutter langsung menandai seluruh blok terkait dan menampilkan popover pilihan Catatan atau Tanya AI.
3. **DOM Highlighting:**
   - Membungkus teks terseleksi dengan elemen `<mark class="chiron-highlight highlight-note" data-id="...">` atau `<mark class="chiron-highlight highlight-ai" data-id="...">`.
   - Tidak merusak syntax highlighting Prism.js pada tag `<pre><code>`.

---

## Resolution

- **Delivered Assets:**
  1. [`.assets/chiron-annotations.js`](file:///Users/samir/Documents/Workspace/Chiron/.assets/chiron-annotations.js): Engine hybrid selection (desktop mouse range selection + touch iPad gutter triggers), input popover dialog dengan keyboard shortcut (`Cmd+Enter`), DOM `<mark>` renderer, hover/click detail card, serta integrasi auto-save dengan `ChironSync`.
  2. [`.assets/style.css`](file:///Users/samir/Documents/Workspace/Chiron/.assets/style.css): Aturan CSS lengkap untuk highlight stabilo (Amber untuk Note & Cyan untuk AI), floating toolbar melayang, gutter trigger icon, popover input dialog, detail card, dan toast feedback.
  3. Modul aktif terintegrasi: [`0001-startup-sequence-and-initial-routing.html`](file:///Users/samir/Documents/Workspace/Chiron/courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html).
  4. Sandboxing prototype di Second Brain Vault: [`01_Projects/prototypes/chiron/annotations-prototype/index.html`](file:///Users/samir/Documents/Workspace/Obsidian-Vault/second-brain-vault/01_Projects/prototypes/chiron/annotations-prototype/index.html).
- **Unblocked Tickets:**
  - [Ticket 03: Visibility Filter Controls & Recap Drawer UI](./03-visibility-filter-and-recap-drawer.md) kini menjadi **Unblocked (Frontier)**.
  - [Ticket 05: W3C Fuzzy Text-Quote Anchoring & Drift Resilience](./05-fuzzy-text-anchoring-resilience.md) kini menjadi **Unblocked (Frontier)**.
