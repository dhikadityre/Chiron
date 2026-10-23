# Ticket 05: Responsive Smart Popover Dialog, IDE Filter Preferences & Visual Affordance for Navigable Code

**Map:** [Chiron Multi-IDE Deep Link & Local Workspace Opener](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/map-local-ide-integration.md)  
**Label:** `wayfinder:prototype`  
**Status:** Closed / Resolved  
**Blocked by:** Resolved ([04: Compact Action Bar UI & Dynamic DOM Auto-Injection](file:///Users/samir/Documents/Workspace/Chiron/docs/wayfinder/tickets/ide-integration/04-compact-action-bar-ui-and-auto-injection.md))  
**Resolved At:** 2026-10-23  

---

## Resolution

1. **Responsive Smart Popover Dialog (`.assets/chiron-ide-launcher.js` & `.assets/style.css`):**
   - Menghadirkan popover melayang modern ber-glassmorphism untuk menggantikan baris tombol IDE yang memakan tempat di layar sempit / mobile view.
   - Pemicu interaksi hybrid:
     - **Desktop:** Kursor hover membuka popover dengan delay aman (120ms debounce) dan grace-period buffer (250ms) agar kursor leluasa masuk ke dialog tanpa tertutup. Klik juga berfungsi membuka dan mem-pin dialog.
     - **Mobile / Touch Screen:** Tap membuka popover secara instan, tap di luar menutup popover.
     - **Adaptasi Bottom Sheet Mobile (< 520px):** Di layar ponsel, dialog otomatis beradaptasi menjadi bottom sheet yang meluncur dari bawah layar dengan backdrop blur yang nyaman dioperasikan oleh jempol.

2. **Panel Pengaturan Preferensi IDE & Mode Tampilan:**
   - Ikon gerigi (⚙️) kecil di pojok header dialog popover dan action bar.
   - Mengizinkan pengguna memilih mode tampilan:
     - `⚡ Smart Popover` (default baru yang ringkas & ramah responsive).
     - `🖥️ Full Bar` (cara lama dengan tombol berdampingan langsung).
   - Checkbox filter pilihan IDE aktif: Pengguna bebas memilih IDE apa saja yang ingin ditampilkan (misalnya hanya mencentang `[x] GitLab` dan `[x] Antigravity IDE`, serta menonaktifkan IDE yang tidak dipakai).
   - Preferensi tersimpan otomatis dan persisten di `localStorage`. Setiap perubahan preferensi langsung meng-update seluruh elemen navigasi di halaman tanpa reload.

3. **Context-Aware DOM Injection:**
   - Deteksi pintar `isInlineContext`:
     - Tautan kode di dalam paragraf kalimat (`<p>Jika foo, buka <a>...</a></p>`) otomatis diubah menjadi kapsul ringkas (`.chiron-nav-pill`) tanpa mematahkan aliran kalimat teks.
     - Tautan kode yang berdiri sendiri (standalone block) diubah menjadi compact bar dengan tombol pemicu `[🚀 Buka di IDE ▾]` dan tombol ⚙️.

4. **Pembedaan Visual Navigable vs Static Code (Visual Affordance):**
   - **Kode Statis Biasa (`code:not(pre code)`):** Tampil tenang dan netral (Slate-muted dark theme) tanpa aksen mencolok atau ikon navigasi.
   - **Kode Navigabel (`.chiron-nav-pill`, `.chiron-nav-code`, `a.gitlab-code-link`):** Memiliki aksen interaktif terang (Cyan / Emerald Glow), border garis putus-putus (*dashed border*), ikon affordance `📂` di awal dan panah dropdown `▾` di akhir, kursor pointer, serta hover glow interaktif.

5. **Verifikasi & Test Suite:**
   - Berkas uji DOM komprehensif `.assets/test_dom_action_bar.js` berhasil menguji kelima skenario (Smart Popover default, Full Bar backward-compatible, IDE filter preferences, Inline sentence capsule pill, dan navigable affordance) dengan kelulusan 100%.

---

## Question

Bagaimana merevisi navigasi ke GitLab, Antigravity IDE, Cursor, VS Code, dan Xcode di web reader Chiron agar ramah responsive view (tidak menumpuk tombol di layar sempit), menampilkan dialog/popover saat kursor diarahkan atau disentuh, mempertahankan cara lama via pilihan pengaturan, serta membedakan secara visual antara kode yang bisa dinavigasikan vs kode statis biasa?

---

## Scope & Deliverables

1. Pilihan Mode Tampilan & Preferensi:
   - Default: `Smart Popover` (ramah ponsel dan layar sempit).
   - Opsi: `Full Action Bar` (cara lama).
   - Filter IDE: Pengguna dapat mencentang IDE yang diinginkan.
   - Persistensi `localStorage`.
2. Smart Popover UI & Responsive Bottom Sheet:
   - Glassmorphism dark obsidian styling di `.assets/style.css`.
   - Desktop hover (120ms debounce) & Mobile tap toggle.
   - Mobile bottom sheet modal untuk lebar layar `< 520px`.
3. Context-Aware Pill Badge:
   - Inline sentence capsule pill: `.chiron-nav-pill.chiron-nav-code`.
   - Standalone compact bar: `.chiron-cab-compact` dengan tombol `[🚀 Buka di IDE ▾]`.
4. Pembedaan Visual Kode Statis vs Navigabel:
   - Kode statis: Muted Slate neutral.
   - Kode navigabel: Glowing Cyan/Emerald, dashed border, ikon affordance `📂` dan `▾`.
5. Testing:
   - Unit test di `.assets/test_dom_action_bar.js` lulus 100%.
