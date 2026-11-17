# IDSocialMediaViewCell

> 💡 **Ringkasan Komponen:**
> Komponen saluran kontak dan media sosial resmi (*official customer contact & social media channels*) yang menyediakan tautan komunikasi cepat ke kanal resmi Samir (Instagram, Facebook, Telepon 1500966, dan Email Customer Service), dilengkapi bar peringatan anti-penipuan (*fraud warning banner*) di bagian bawah.
> Model data: `IDSocialMediaModel(title: String?, list: [IDSocialMediaItemModel]?)`.
> Sumber: Dibentuk pada `IDLoanService.swift` (`requstQueryProduct`) jika konfigurasi aplikasi mengaktifkannya (`needAppSocialMedia() -> appSocialMedia == "1"`), dan dimasukkan ke dalam daftar cell melalui `getCellListAry`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Kontak Resmi Aktif (4 Kanal) | Client Default / `IDSocialMediaModel` | `dataModel.socialMediaInfo != nil`; `appSocialMedia == "1"` | Konfigurasi switch aplikasi mengaktifkan menu kontak | **Cell Target:** Judul "Hubungi Samir", 4 ikon kontak (Instagram, Facebook, Telepon, Email), bar peringatan penipuan di bawah | Tap Telepon membuka dialer `tel://1500966`. Tap medsos membuka browser/aplikasi. Tap email membuka mail composer | Gate `needAppSocialMedia()`, layout grid, dan tap handler terbukti source |
| **B** — Tap Kanal Email | Sama | Pengguna mengetuk item ke-4 (`customerservice@samir.co.id`) | String URL cocok dengan regex email `isValidEmail` | **Cell Target:** Tampilan sama | Sistem mengeksekusi `interactiveDelegate?.sendEmail(to: jumpUrl)` | Regex validator `isValidEmail` dan protokol delegate terbukti source |
| **C** — Tap Kanal URL Medsos / Telepon | Sama | Pengguna mengetuk item ke-1, 2, atau 3 | String berupa skema URL web (`https://...`) atau tel (`tel://...`) | **Cell Target:** Tampilan sama | Sistem mengeksekusi `interactiveDelegate?.openSocialMedia(url: url)` | Routing URL eksternal terbukti source |
| **D** — Fitur Dinonaktifkan (Switch OFF) | Client Default / `IDSocialMediaModel` | `appSocialMedia != "1"` atau `socialMediaInfo == nil` | Konfigurasi server mematikan blok sosial media | Cell kontak media sosial **tidak dimuat** ke dalam beranda | Tidak ada | Guard `needAppSocialMedia()` di baris 102 terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model `IDSocialMediaModel` dibentuk menggunakan factory method `IDSocialMediaItemModel.generateListAry()`. Nilai tautan tujuan kanal telah disematkan secara client-side: Instagram (`https://www.instagram.com/samir_fintek`), Facebook (`https://www.facebook.com/SahabatSamir`), Telepon (`tel://1500966`), dan Email (`customerservice@samir.co.id`).

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 101-105: pembentukan model, baris 117-122: `needAppSocialMedia`, baris 620-624: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 131: `register`, baris 330-339: `cellForRowAt`)
> - Cell Implementation: `IDSocialMediaViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `UICollectionViewDelegate`, `isValidEmail`)
> - Sub-Cell: `IDSocialMediaItemCell.swift`
> - Model: `IDSocialMediaModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Hubungi Samir                                        │  │  ← titleLabel (font 12 pt)
│  │                                                      │  │
│  │   ┌──────┐       ┌──────┐       ┌──────┐       ┌──────┐  │  ← collectionView
│  │   │ [IG] │       │ [FB] │       │[Tel] │       │[Mail]│  │    (4 item horizontal)
│  │   │ Insta│       │ Face-│       │ Tele-│       │Email │  │    (tinggi 56 pt)
│  │   │ gram │       │ book │       │ pon  │       │      │  │
│  │   └──────┘       └──────┘       └──────┘       └──────┘  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │  ← warningBgView (tinggi 20 pt)
│  │  │Waspada penipuan! Segera hubungi CS di kontak...│  │  │    (warna SecondaryColor_OrangeLight)
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar putih (`bgLabel.backgroundColor = .white`) dengan sudut melengkung `corner(8)` dan margin atas `20 pt`, kiri `20 pt`, kanan `-20 pt`.
- **Tata Letak Elemen:**
  - `titleLabel`: Berada di kiri atas kartu (`offset 20 pt`), menggunakan font PingFangSC Regular Auxiliary (karena `isHomeVC == true`) dengan warna `#222222` (`TextColor_Important`).
  - `collectionView`: Berada di bawah judul dengan jarak `16 pt`, tinggi `56 pt`, tanpa scroll (`isScrollEnabled = false`). Membagi 4 item secara proporsional dengan jarak antar-item `25 pt`.
  - `warningBgView`: Bar peringatan di bawah koleksi ikon dengan jarak `8 pt`, tinggi `20 pt`, sudut melengkung `corner(8)`, berlatar oranye muda (`SecondaryColor_OrangeLight`).
  - `warningLabel`: Berada di tengah bar peringatan, menampilkan copy: `"Waspada penipuan! Segera hubungi CS Samir di kontak resmi."`, font PingFangSC Medium Secondary, warna `#222222`.

### Kategori Komponen Data
- **Judul Bagian (`titleLabel`):** Statis client `"Hubungi Samir"`.
- **Item 1 (Instagram):** Ikon asset `R.image.loan_instagram_icon()` + URL `"https://www.instagram.com/samir_fintek"`.
- **Item 2 (Facebook):** Ikon asset `R.image.loan_facebook_icon()` + URL `"https://www.facebook.com/SahabatSamir"`.
- **Item 3 (Telepon):** Ikon asset `R.image.loan_phone_icon()` + skema `"tel://1500966"`.
- **Item 4 (Email):** Ikon asset `R.image.loan_email_icon()` + alamat `"customerservice@samir.co.id"`.
- **Teks Peringatan (`warningLabel`):** Statis client `"Waspada penipuan! Segera hubungi CS Samir di kontak resmi."`.

### Logika Interaksi & Delegasi
- **Tap Saluran Kontak (`didSelectItemAt`):**
  - Mengambil nilai `itemModel.jumpUrl`.
  - Jika `jumpUrl` lolos validasi regex email (`isValidEmail`):
    - Memanggil `interactiveDelegate?.sendEmail(to: jumpUrl)` untuk membuka aplikasi email bawaan.
  - Jika berupa URL umum:
    - Memanggil `interactiveDelegate?.openSocialMedia(url: url)` untuk membuka aplikasi media sosial atau panggilan telepon melalui sistem operasi iOS.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Kontak Media Sosial Aktif Lengkap (4 Kanal)

- 🎯 **Trigger / Kondisi:** Konfigurasi `appSocialMedia == "1"`; `socialMediaInfo` terbentuk sempurna.
- 📱 **Expected Result:** Kartu "Hubungi Samir" tampil dengan 4 ikon media sosial/kontak resmi dan bar peringatan anti-penipuan di bawahnya.
- 👆 **Interaksi:** Tap ikon telepon memicu pemanggilan dialer sistem `tel://1500966`; tap ikon email memicu pembukaan email client ke `customerservice@samir.co.id`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "socialMediaInfo": {
      "title": "Hubungi Samir",
      "list": [
        {
          "jumpUrl": "https://www.instagram.com/samir_fintek"
        },
        {
          "jumpUrl": "https://www.facebook.com/SahabatSamir"
        },
        {
          "jumpUrl": "tel://1500966"
        },
        {
          "jumpUrl": "customerservice@samir.co.id"
        }
      ]
    }
  }
}
```

- 🔄 **Yang diubah:** Inisialisasi default array kontak resmi `socialMediaInfo`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penyajian 4 tombol kontak terverifikasi dan pembagian event delegasi telepon vs email vs browser.

---

### 🟢 Kasus B — Fitur Dinonaktifkan oleh Konfigurasi Server

- 🎯 **Trigger / Kondisi:** Konfigurasi server mengembalikan `appSocialMedia: "0"`.
- 📱 **Expected Result:** `needAppSocialMedia()` mengembalikan `false`; objek `socialMediaInfo` bernilai `nil`. Seluruh kartu kontak media sosial disembunyikan dari beranda.
- 👆 **Interaksi:** Tidak ada.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "socialMediaInfo": null
  }
}
```

- 🔄 **Yang diubah:** `socialMediaInfo` bernilai `null`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi penonaktifan dinamis modul kontak dari backend config.

---

## ✅ Verifikasi & Batasan

- [x] Syarat pemunculan `needAppSocialMedia() == true` dan 4 default channel (Instagram, Facebook, Telepon, Email) terkonfirmasi source Swift.
- [x] Pemisahan aksi tap `sendEmail` (via regex validator) dan `openSocialMedia` diverifikasi langsung pada `didSelectItemAt`.

