# IDTKPDisclosureView

> 💡 **Ringkasan Komponen:**
> Komponen kapsul informasi regulasi OJK terkait Tingkat Kualitas Pendanaan (TKB90 / TWP90) yang menampilkan status kelancaran pengembalian pinjaman secara bergantian (*auto-rotating carousel* tiap 3 detik). Komponen ini dilengkapi tombol ikon info `ℹ️` yang ketika ditekan membuka popover tooltip rincian klasifikasi (Lancar, Dalam Perhatian Khusus / DPK, Kurang Lancar / KL, Diragukan, Macet).
> Komponen ini hadir dalam 2 mode tampilan:
> 1. **Header Mode:** Kapsul oranye cerah di atas `tableView` beranda, tepat di sebelah kanan logo Samir.
> 2. **Sticky Navbar Mode:** Kapsul oranye muda pada floating navbar (`HomeStatusView`) yang muncul saat beranda di-scroll ke bawah.
> Endpoint terkait: `POST /api/getTKPDisclosureInfo` (`IDLoanInterfacePath.HomeRequestTKBRouter`).
> Model data: `IDLoanTKBModel(tkbRateTips: [String]?, tkbRateShortTips: [String]?)`.

---

## 📊 Matriks Pemilihan & Kondisi UI

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Normal Multi-Rate Carousel | `getTKPDisclosureInfo` / `IDLoanTKBModel` | `tkbRateShortTips.count >= 2`; `tkbRateTips != nil` | Array tips lengkap 5 status pinjaman | **Komponen Target:** Kapsul berganti teks vertikal otomatis tiap 3 detik ("Lancar", "DPK", "KL", "Diragukan", "Macet") | Tap membuka tooltip popover `tkbDetailView` berisi rincian teks panjang; tap luar menutup popover | Timer `startTKBAutoChange`, animasi transform/alpha, dan toggle popover terbukti source |
| **B** — Single Rate (Statis) | `getTKPDisclosureInfo` / `IDLoanTKBModel` | `tkbRateShortTips.count == 1` | Hanya 1 status (misal agregat TKB90 saja) | Teks kapsul statis tanpa animasi transisi vertikal | Membuka popover yang menampilkan 1 baris teks | Modulo `currentIndex` dan guard list terbukti source |
| **C** — Data Kosong / Suppressed | `getTKPDisclosureInfo` / `IDLoanTKBModel` | `tkbRateTips == nil` atau `tkbRateTips.isEmpty == true` | Nilai tips kosong dari response API | Kapsul tetap ada tetapi `tkbButton.isEnabled = false` | Tidak merespons sentuhan (popover tidak muncul) | Guard `datas.tkbInfo?.tkbRateTips?.isEmpty` di `IDLoanViews:879` terbukti source |
| **D** — Sticky Mode (Scroll Transisi) | `getTKPDisclosureInfo` / `IDLoanTKBModel` | Halaman di-scroll ke bawah (`offsetY > 0`) | Transisi scroll offset | Kapsul header utama disembunyikan; kapsul pada navbar putih (`HomeStatusView`) muncul bertahap (*fade in*) | Efek tap sama (memicu popover yang sama via closure `onTKBTap`) | Handler `scrollViewDidScroll` dan delegate binding terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari endpoint independen `getTKPDisclosureInfo` yang dipanggil paralel dengan query kuota beranda. Properti `tkbRateShortTips` khusus dikonsumsi oleh label tombol kapsul berputar, sedangkan `tkbRateTips` dikonsumsi oleh label popover tooltip `tkbDetailView`.

> 📌 **Referensi Source Code:**
> - Router: `IDLoanInterfacePath.swift` (baris 20: `HomeRequestTKBRouter = "getTKPDisclosureInfo"`)
> - Service: `IDLoanService.swift` (baris 89-94: dispatch group call, baris 171-188: `requestTKB`)
> - Model: `IDLoanModels.swift` (baris 22: `var tkbInfo: IDLoanTKBModel?`, baris 82-85: `struct IDLoanTKBModel`)
> - Views (Header & Popover): `IDLoanViews.swift` (baris 34-80: inisialisasi elemen UI; baris 603-635: layouting SnapKit; baris 642-692: timer carousel & popup toggle; baris 861-885: binding data di `onHandleLoanData`)
> - Views (Sticky Bar): `HomeStatusView.swift` (baris 44-67: inisialisasi elemen kapsul sticky; baris 171-184: animasi `setTKBTitle`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

### 1. Tampilan Header Default (Di samping Logo Samir)
```text
┌────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐   ┌───────────────────────────┐      ┌─────┐ ┌─────┐ │
│  │  logo Samir  │   │ Diragukan : 7,45%      ℹ️ │      │ CS  │ │ Msg │ │
│  └──────────────┘   └───────────────────────────┘      └─────┘ └─────┘ │
│     (w: 80 pt)        ▲ (tkbBackgroud: w:142, h:20)                    │
│                       │  ├── tkbButton (teks carousel)                 │
│                       └── tkbIconButton (ikon info putih)              │
│                                                                        │
│  [*] Pinjaman lebih cepat   [*] Mudah dan transparan                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Tampilan Saat Kapsul Di-tap (Popover Detail Terbuka)
```text
                      ┌───────────────────────────┐
                      │ Diragukan : 7,45%      ℹ️ │
                      └─────────────┬─────────────┘
                                    │ (membuka popover di bawahnya)
                      ┌─────────────▼─────────────────────────┐
                      │  Lancar : 69.26%                      │ ← tkbDetailView
                      │  Dalam Perhatian Khusus : 11.87%      │   (w: 200 pt,
                      │  Kurang Lancar : 8.6%                 │    bg: putih,
                      │  Diragukan : 7.45%                    │    shadow: 0.5)
                      │  Macet : 2.83%                        │
                      └───────────────────────────────────────┘
```

### 3. Tampilan Sticky Bar Saat Di-scroll (`HomeStatusView`)
```text
┌────────────────────────────────────────────────────────────────────────┐
│ [←]   ┌───────────────────────────┐                    ┌─────┐ ┌─────┐ │
│       │ Diragukan : 7,45%      ℹ️ │                    │ CS  │ │ Msg │ │
│       └───────────────────────────┘                    └─────┘ └─────┘ │
│       (bg: #FFF1EC, teks: #FF7041, icon: tkb_icon_orange)              │
└────────────────────────────────────────────────────────────────────────┘
```

- **Layout Container (`tkbBackgroud`):**
  - Posisi: Berada `cz_kStatusBarFrameH + 12` dari batas atas, margin kiri `110 pt` (10 pt di sebelah kanan logo Samir), ukuran tetap `142 x 20 pt`.
  - Warna: `#FF906B` dengan sudut membulat `cornerRadius = 4 pt`.
- **Tombol Teks (`tkbButton`):**
  - Mengisi penuh container dengan insets `top: 4, left: 4, bottom: 4, right: 4`.
  - Font: PingFang SC Regular Auxiliary (10 pt), warna teks putih (`#FFFFFF`).
  - Title insets: `right: 12 pt` untuk memberi ruang ikon `ℹ️`.
- **Tombol Ikon Info (`tkbIconButton`):**
  - Memuat asset `R.image.tkb_icon_white()`, menempel di sisi kanan (`trailing = 4 pt`).
- **Popover Tooltip (`tkbDetailView`):**
  - Posisi: Mengambang di bawah kapsul pada `cz_kStatusBarFrameH + 46`, margin kiri `110 pt`, lebar `200 pt`.
  - Latar Belakang: Putih (`#FFFFFF`) dengan bayangan tajam (`shadowColor: .black, shadowOpacity: 0.5, shadowRadius: 5, shadowOffset: (3, 3)`).
  - Label: `tkbValueLabel` (font PingFang SC Auxiliary, warna `#71584D`, `numberOfLines = 0`).

### Kategori Komponen Data
- **Teks Ringkas Kapsul (`tkbRateShortTips`):** Berasal dari array API, dirotasi oleh timer internal setiap 3.0 detik.
- **Teks Rincian Tooltip (`tkbRateTips`):** Berasal dari array API, digabungkan dengan baris baru (`joined(separator: "\n")`).
- **Ikon Info:** Asset statis lokal (`R.image.tkb_icon_white()` dan `R.image.tkb_icon_orange()`).

### Logika Interaksi & Delegasi
- **Tap Kapsul / Ikon Info (`showTKBPopUp`):** Melakukan toggle state `isExpanded`, menampilkan/menyembunyikan `tkbDetailView`.
- **Tap di Luar Popover (`handleTapOutside`):** Mendeteksi koordinat sentuhan di luar area `tkbDetailView` dan `tkbButton` untuk menutup popover secara otomatis serta menyalakan kembali auto-rotate timer.
- **Scroll Transition (`scrollViewDidScroll`):** Ketika `offsetY > 0`, kapsul header disembunyikan (`isHidden = true`), dan navbar sticky `homeStatusView` menampilkan teks TKB yang sama secara sinkron.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Standar 5 Kategori OJK (Default Production)

- 🎯 **Trigger / Kondisi:** Endpoint `/api/getTKPDisclosureInfo` mengembalikan data lengkap 5 klasifikasi kualitas pendanaan.
- 📱 **Expected Result:** Kapsul menampilkan teks berjalan bergantian tiap 3 detik. Saat ditekan, tooltip popover terbuka dengan 5 baris penjelasan lengkap.
- 👆 **Interaksi:** Tap kapsul untuk membuka popover; tap area di luar popover untuk menutup kembali.
- 🏷️ **Provenance:** `OBSERVED REFERENCE — Production OpenAPI Contract` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "3644a684f98ea8fe223c713b77189a77",
  "result": {
    "tkbRateShortTips": [
      "Lancar : 69.26%",
      "DPK : 11.87%",
      "KL : 8.6%",
      "Diragukan : 7.45%",
      "Macet : 2.83%"
    ],
    "tkbRateTips": [
      "Lancar : 69.26%",
      "Dalam Perhatian Khusus : 11.87%",
      "Kurang Lancar : 8.6%",
      "Diragukan : 7.45%",
      "Macet : 2.83%"
    ]
  }
}
```

- 🔄 **Yang diubah:** Payload standar default regulasi OJK.
- 🎯 **Alasan / Hasil yang diuji:** Menguji siklus carousel timer 3 detik dan render formatting popover tooltip 5 baris.

---

### 🟢 Kasus B — Single Rate (Agregat TKB90 Global Saja)

- 🎯 **Trigger / Kondisi:** Backend hanya mengirimkan persentase agregat TKB90 tanpa rincian status pinjaman.
- 📱 **Expected Result:** Kapsul menampilkan "TKB90 : 97.17%" secara statis tanpa animasi transisi vertikal. Popover menampilkan 1 baris teks yang sama.
- 👆 **Interaksi:** Tap kapsul tetap memunculkan tooltip popover dengan 1 baris.
- 🏷️ **Provenance:** `MOCK UI TEST — Boundary Scenario` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "3644a684f98ea8fe223c713b77189a77",
  "result": {
    "tkbRateShortTips": [
      "TKB90 : 97.17%"
    ],
    "tkbRateTips": [
      "Tingkat Keberhasilan Bayar 90 Hari (TKB90) : 97.17%"
    ]
  }
}
```

- 🔄 **Yang diubah:** Kedua array hanya berisi 1 elemen string tunggal.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi ketahanan kalkulasi modulo `currentIndex = (currentIndex + 1) % count` agar tidak menyebabkan flicker saat elemen tunggal.

---

### 🟢 Kasus C — Data Kosong / Null (Fallback Safety)

- 🎯 **Trigger / Kondisi:** Respon jaringan mengembalikan array kosong atau `null` pada data TKB.
- 📱 **Expected Result:** Kapsul TKB berada dalam status `isEnabled = false`, teks kosong, dan popover tidak dapat dibuka.
- 👆 **Interaksi:** Tap pada kapsul tidak memberikan reaksi apapun.
- 🏷️ **Provenance:** `MOCK UI TEST — Negative Scenario` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "3644a684f98ea8fe223c713b77189a77",
  "result": {
    "tkbRateShortTips": [],
    "tkbRateTips": []
  }
}
```

- 🔄 **Yang diubah:** `tkbRateShortTips` dan `tkbRateTips` disetel ke array kosong `[]`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi guard `datas.tkbInfo?.tkbRateTips?.isEmpty` di `IDLoanViews.swift:879` agar tidak crash atau membuka popover kosong.

---

## ✅ Verifikasi & Batasan

- [x] Endpoint `POST /api/getTKPDisclosureInfo` diverifikasi langsung dari `IDLoanInterfacePath.HomeRequestTKBRouter` dan `openapi.yaml`.
- [x] Mekanisme timer interval 3.0 detik dan animasi transform/alpha diverifikasi langsung dari kode Swift `IDLoanViews.swift`.
- [x] Sinkronisasi state teks antara header view dan sticky navbar `HomeStatusView` diverifikasi melalui `homeStatusView.setTKBTitle`.
- [x] Formatter pemisah baris baru (`\n`) untuk popover tooltip dikonfirmasi dari pemanggilan `.joined(separator: "\n")`.
