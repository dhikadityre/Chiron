# IDHeaderViewCell

> 💡 **Ringkasan Komponen:**
> Komponen header utama beranda aplikasi Samir yang memuat logo resmi aplikasi, tombol akses cepat Pusat Bantuan / Layanan Pelanggan (*Customer Service*), tombol Pusat Pesan (*Message Center*) beserta indikator notifikasi belum dibaca (*green dot badge*), serta dua label tag promosi dan nilai layanan di bawah logo.
> Model data: `IDLoanHeaderModel(tagText1: String?, tagText2: String?)`.
> Sumber: **Hardcoded Client-Side** pada `IDLoanService.swift` (`requstQueryProduct`) dan dikonfigurasi melalui Section 0 pada `IDLoanViews.swift`. Komponen ini **murni client-side dan tidak mengambil data dari endpoint API/jaringan backend**.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Sumber Data / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Header Standar (Ada Notif) | Client Hardcoded / `IDLoanHeaderModel` | `dataModel.headInfo != nil`; `showMsgAlert() == true` | Teks tag hardcoded default, ada pesan belum dibaca | **Cell Target:** Logo Samir, tombol CS, tombol Pesan dengan green dot badge (`#18EA00`), 2 tag info di bawah | Tap CS memanggil `jumpWithUrl("customerAction")`. Tap Pesan memanggil `jumpWithUrl("messageAction")` | Selector, observer notifikasi, dan action handler terbukti source |
| **B** — Header Bersih (Tanpa Notif) | Client Hardcoded / `IDLoanHeaderModel` | `dataModel.headInfo != nil`; `showMsgAlert() == false` | Green dot badge disembunyikan | **Cell Target:** Layout sama; `msgAlert.isHidden = true` | Efek tap sama dengan kasus A | Notification observer dan helper terbukti source |
| **C** — Tag Promosi Kosong / Nil | Client Hardcoded / `IDLoanHeaderModel` | `tagText1 == nil`; `tagText2 == nil` | Teks tag kosong atau nil | **Cell Target:** Teks label tag kosong, logo dan tombol navigasi atas tetap tampil utuh | Efek tap sama | Binding property terbukti source |
| **D** — Section Suppressed | Client Hardcoded / `IDLoanHeaderModel` | `dataModel.headInfo == nil` | Header model bernilai null | Cell header tidak dimasukkan ke dalam array section `IDLoanViews` | Tidak ada interaksi | Guard `if (dataModel.headInfo != nil)` terbukti source |

> ℹ️ **Arsitektur Data — Pure Client Hardcoded (Non-API):**
> Komponen ini **tidak mengonsumsi atau terikat dengan response endpoint API apapun** (bukan bagian dari payload JSON network `HomeRequstQuotaZone` maupun `HomeRequstNonQuotaZone`). Seluruh string teks tag di-hardcode langsung pada kode Swift client (`IDLoanService.swift`), asset gambar dimuat dari bundle lokal, dan status badge notifikasi dikendalikan oleh broadcast `NSNotification` internal. Mocking via Proxyman / Map Local **tidak berpengaruh** pada cell ini.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 21: inisialisasi hardcoded data; baris 511: `getCellListAry`)
> - Views: `IDLoanViews.swift` (`tableView(_:cellForRowAt:)` Section 0)
> - Cell Implementation: `IDHeaderViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `customerAction`, `messageAction`)
> - Model: `IDLoanHeaderModel.swift`
> - Observer Badge: `MessageCenterManager.msgAlertDidChangeNotification` & `MessageCenterManager.showMsgAlert()`

---

## 🏷️ Detail Data Hardcoded & Asset Lokal

Berikut adalah inventaris seluruh data teks dan asset yang dikonsumsi oleh `IDHeaderViewCell`:

| Elemen UI | Jenis Data | Nilai Hardcoded / Asset Asli | Sumber di Kode Produksi |
|---|---|---|---|
| **Logo Aplikasi** (`logo`) | Asset Gambar | `R.image.smair_logo()` | `IDHeaderViewCell.swift:162` |
| **Layanan Pelanggan** (`customerService`) | Asset Icon | `R.image.loan_customer_service()` | `IDHeaderViewCell.swift:164` |
| **Pusat Pesan** (`messageCenter`) | Asset Icon | `R.image.loan_message_center()` | `IDHeaderViewCell.swift:166` |
| **Badge Notifikasi** (`msgAlert`) | State Dinamis Lokal | Warna `#18EA00`, radius 4 pt (visibilitas via `showMsgAlert()`) | `IDHeaderViewCell.swift:40, 80` |
| **Icon Tag 1** (`tagImage1`) | Asset Gambar | `loan_tag_icon` (Bundle: `SamirLoanModule`) | `IDHeaderViewCell.swift:169` |
| **Teks Tag 1** (`tagLabel1`) | **Hardcoded String** | `"Pinjaman lebih cepat"` | `IDLoanService.swift:21` |
| **Icon Tag 2** (`tagImage2`) | Asset Gambar | `loan_tag_icon` (Bundle: `SamirLoanModule`) | `IDHeaderViewCell.swift:173` |
| **Teks Tag 2** (`tagLabel2`) | **Hardcoded String** | `"Mudah dan transparan"` | `IDLoanService.swift:21` |

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────┐                  ┌─────┐  ┌─────┐•(alert)│
│  │  logo (Samir)│                  │ CS  │  │ Msg │        │
│  └──────────────┘                  └─────┘  └─────┘        │
│                                                            │
│  [*] tagLabel1          [*] tagLabel2                      │
│  (Pinjaman lebih cepat) (Mudah dan transparan)             │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Menempati bagian paling atas layar beranda dengan latar belakang transparan (`bgLabel.backgroundColor = .clear`).
- **Baris Atas:**
  - `logo`: Berjarak `cz_kStatusBarFrameH + 12` dari batas atas, margin kiri `20`, ukuran `80 x 20`, menampilkan asset `R.image.smair_logo()`.
  - `messageCenter`: Tombol berukuran `20 x 20` di sisi kanan (`offset -20`), menampilkan icon `R.image.loan_message_center()`.
  - `msgAlert`: Lingkaran hijau kecil (`width: 8, height: 8`, `cornerRadius: 4`, `#18EA00`) menempel di pojok kanan atas tombol pesan (`right +2`, `top +1`).
  - `customerService`: Tombol berukuran `20 x 20` berjarak `16` di sebelah kiri tombol pesan, menampilkan icon `R.image.loan_customer_service()`.
- **Baris Bawah (Tag Promosi):**
  - `tagImage1` + `tagLabel1`: Berada `14` point di bawah logo, icon centang (`loan_tag_icon`) ukuran `12 x 12` diikuti teks font PingFang Regular 11 pt warna putih.
  - `tagImage2` + `tagLabel2`: Berjarak `8` point di sebelah kanan tag 1 dengan icon dan gaya font yang identik.

### Kategori Komponen Data
- **Logo Aplikasi (`logo`):** Statis asset aplikasi (`R.image.smair_logo()`).
- **Pusat Bantuan (`customerService`):** Asset statis (`R.image.loan_customer_service()`) dengan area sentuh yang diperluas (`touchExtendInset: 10 pt`).
- **Pusat Pesan (`messageCenter`):** Asset statis (`R.image.loan_message_center()`).
- **Badge Pesan Baru (`msgAlert`):** Status dinamis via observer notification `MessageCenterManager.msgAlertDidChangeNotification`.
- **Label Tag 1 & 2 (`tagLabel1`, `tagLabel2`):** Client Model (`data.tagText1`, `data.tagText2`), teks putih font 11 pt.

### Logika Interaksi & Delegasi
- **Tap Layanan Pelanggan (`customerAction`):** Memanggil protokol delegasi `interactiveDelegate?.jumpWithUrl("customerAction")` untuk membuka live chat CS / pusat bantuan.
- **Tap Pesan (`messageAction`):** Memanggil protokol delegasi `interactiveDelegate?.jumpWithUrl("messageAction")` untuk membuka halaman kotak masuk pesan.

---

## 🧪 Skenario Uji & Representasi State Data

> ⚠️ **Catatan Pengujian:** Karena data tidak berasal dari network API, pengujian cell ini tidak dilakukan melalui Proxyman / Map Local, melainkan melalui **Unit Testing / UI Testing / Modifikasi Kode Client** atau pengiriman broadcast notifikasi `NotificationCenter`.

---

### 🟢 Kasus A — Header Standar dengan Notifikasi Aktif (Default Production)

- 🎯 **Trigger / Kondisi:** Inisialisasi default beranda; `MessageCenterManager.showMsgAlert() == true`.
- 📱 **Expected Result:** Header tampil lengkap dengan logo Samir, tombol CS, tombol Pesan dengan green dot badge (`#18EA00`), serta 2 tag hardcoded: `"Pinjaman lebih cepat"` dan `"Mudah dan transparan"`.
- 👆 **Interaksi:** Tap tombol CS memicu route `"customerAction"`; tap tombol pesan memicu route `"messageAction"`.
- 🏷️ **Provenance:** `PRODUCTION CLIENT HARDCODED — Verified in Source Code (Non-API)`

```swift
// State default di IDLoanService.swift (baris 21)
let headerModel = IDLoanHeaderModel(
    tagText1: "Pinjaman lebih cepat",
    tagText2: "Mudah dan transparan"
)

// State notifikasi badge aktif
// MessageCenterManager.showMsgAlert() == true
```

- 🔄 **Data yang digunakan:** String statis default dan state badge aktif.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi render default header beranda saat pertama kali dibuka dengan notifikasi baru.

---

### 🟢 Kasus B — Header Bersih Tanpa Pesan Baru

- 🎯 **Trigger / Kondisi:** Pengguna telah membaca seluruh pesan; `MessageCenterManager.showMsgAlert() == false`.
- 📱 **Expected Result:** Header tampil persis seperti Kasus A, namun green dot badge (`msgAlert`) tersembunyi (`isHidden = true`).
- 👆 **Interaksi:** Sama dengan Kasus A.
- 🏷️ **Provenance:** `PRODUCTION CLIENT LOGIC — Reactive Notification Observer`

```swift
// State data model tetap sama
let headerModel = IDLoanHeaderModel(
    tagText1: "Pinjaman lebih cepat",
    tagText2: "Mudah dan transparan"
)

// Simulasi perubahan state notifikasi via NotificationCenter
NotificationCenter.default.post(
    name: MessageCenterManager.msgAlertDidChangeNotification,
    object: nil
)
// Hasil evaluasi: MessageCenterManager.showMsgAlert() == false -> msgAlert.isHidden = true
```

- 🔄 **Yang diubah:** State notifikasi internal `MessageCenterManager`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi mekanisme reaktif observer pada `msgAlertDidChangeNotification` tanpa merusak tata letak elemen header lainnya.

---

### 🟢 Kasus C — Tag Promosi Kosong / Nil

- 🎯 **Trigger / Kondisi:** Model `headInfo` memiliki nilai tag `nil` atau string kosong (misal saat pengujian boundary).
- 📱 **Expected Result:** Logo dan kedua tombol navigasi tetap berada pada posisinya secara presisi; label tag tidak menampilkan teks apapun tanpa menyebabkan visual glitch atau crash AutoLayout.
- 👆 **Interaksi:** Tombol navigasi tetap responsif.
- 🏷️ **Provenance:** `CLIENT COMPONENT UNIT TEST — Boundary Condition`

```swift
// State untuk pengujian boundary / nil safety
let headerModel = IDLoanHeaderModel(
    tagText1: nil,
    tagText2: nil
)
```

- 🔄 **Yang diubah:** `tagText1` dan `tagText2` disetel ke `nil`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi ketahanan AutoLayout terhadap string teks kosong/nil tanpa merusak hierarki tampilan.

---

## ✅ Verifikasi & Batasan

- [x] Sumber data dikonfirmasi 100% hardcoded client-side pada `IDLoanService.swift:21` (`IDLoanHeaderModel`).
- [x] Tidak ada endpoint jaringan (API) yang menyuplai `headInfo`; mocking melalui Proxyman / Map Local tidak berlaku.
- [x] Observer `MessageCenterManager.msgAlertDidChangeNotification` dikonfirmasi sebagai pengontrol visibilitas green dot badge.
- [x] Delegasi interaksi tombol CS (`customerAction`) dan Pesan (`messageAction`) diverifikasi langsung dari kode Swift production.
