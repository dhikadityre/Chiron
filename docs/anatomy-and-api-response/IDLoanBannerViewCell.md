# IDLoanBannerViewCell

> 💡 **Ringkasan Komponen:**
> Komponen korsel spanduk promosi (*auto-sliding banner carousel*) beranda yang didukung oleh pustaka `FSPagerView`, dilengkapi transisi geser otomatis (interval 5 detik), indikator halaman dinamis berbentuk pil oranye (`#FF7041`), serta pembukaan halaman web H5 berautentikasi saat spanduk disentuh.
> Endpoint terkait: `activity/queryNonCreditCardZoneForHomepage` (`IDLoanNonQuotaAreaModels.bannerInfo`).
> Dipilih pada `IDLoanService.swift` (`getCellListAry`) ketika properti `dataModel.bannerInfo?.list` tidak kosong (`list.isEmpty == false`).

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Multi-Banner Promosi | `activity/queryNonCreditCardZoneForHomepage` / `IDLoanBannerModel` | `bannerInfo != nil`; `list.count > 1` | Terdapat lebih dari 1 spanduk promosi aktif | **Cell Target:** Korsel spanduk bergeser otomatis tiap 5 detik, indikator titik di bawah (halaman aktif berbentuk pil panjang oranye `#FF7041`, lainnya titik abu `#CCCCCC`) | Tap spanduk membuka tautan `jumpUrl` via webview berautentikasi dan melaporkan analitik `Home_banner` / `click` | Pengesetan FSPagerView, reloadPageIndicators, dan tap handler terbukti source |
| **B** — Spanduk Tunggal (Single Banner) | Sama | `bannerInfo != nil`; `list.count == 1` | Tepat 1 spanduk aktif | **Cell Target:** Spanduk statis tampil penuh; `pageControlStackView.isHidden = true` (indikator disembunyikan) | Tap spanduk membuka tautan webview dan mengirim analitik | Kondisi `pageCount <= 1` pada `updateData` terbukti source |
| **C** — Spanduk Kosong / Nil | Sama | `bannerInfo == nil` atau `list.isEmpty == true` | Daftar spanduk tidak ada atau kosong | Cell spanduk **tidak dimuat** ke dalam beranda | Tidak ada | Guard `list.isEmpty == false` di `getCellListAry` terbukti source |
| **D** — Target URL Kosong | Sama | Kondisi A atau B; `jumpUrl == ""` atau `null` | Item banner tanpa tautan | **Cell Target** tetap menampilkan gambar; tap tidak memicu pembukaan webview | Analitik `Home_banner` / `click` tetap dilaporkan | Guard `if let jumpUrl = itemModel.jumpUrl, !jumpUrl.isEmpty` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari endpoint `activity/queryNonCreditCardZoneForHomepage` di bawah objek `bannerInfo`. Gambar diunduh secara asinkron menggunakan Kingfisher melalui URL pada atribut `bannerImgNew`.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 613-617: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 128: `register`, baris 298-308: `cellForRowAt`)
> - Cell Implementation: `IDLoanBannerViewCell.swift` (`initUI`, `commonUI`, `updateData`, `reloadPageIndicators`, `updatePageIndicators`, `FSPagerViewDataSource`, `FSPagerViewDelegate`)
> - Model: `IDLoanBannerModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌──────────────────────────────────────────────────┐ │  │  ← pagerView (FSPagerView)
│  │ │                                                  │ │  │    (tinggi 88 pt, corner 8)
│  │ │             [Banner Promotion Image]             │ │  │    (autoSlidingInterval = 5.0s)
│  │ │                                                  │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  │                        [══] • •                      │  │  ← pageControlStackView
│  │                   (aktif: 12x4, biasa: 4x4)          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Wrapper transparan berjarak `20 pt` dari tepi kiri dan kanan tabel beranda.
- **Tata Letak Elemen:**
  - `pagerView`: Komponen `FSPagerView` setinggi `88 pt` dengan sudut lengkung `radius: 8 pt`, latar putih, dan interval pergantian otomatis `5.0` detik.
  - `pageControlStackView`: Tumpukan horizontal di bagian bawah tengah (`centerX`, `bottom -4 pt`, tinggi `4 pt`) dengan jarak antar-indikator `4 pt`.
  - **Indikator Halaman:**
    - Indikator aktif (*current page*): Ukuran lebar `12 pt`, tinggi `4 pt`, sudut `2 pt`, warna oranye `#FF7041`.
    - Indikator tidak aktif (*normal page*): Ukuran `4 x 4 pt`, sudut `2 pt`, warna abu-abu `#CCCCCC`.
    - Otomatis disembunyikan (`isHidden = true`) bila spanduk berjumlah `<= 1`.

### Kategori Komponen Data
- **Gambar Spanduk (`bannerImgNew`):** API (`list[index].bannerImgNew`), diunduh dan di-cache via Kingfisher.
- **Tautan Aksi (`jumpUrl`):** API (`list[index].jumpUrl`), string URL web H5 atau deeplink.
- **Metadata Kegiatan (`activityId`, `activityName`):** API (`list[index].activityId`, `list[index].activityName`), digunakan untuk parameter tracking klik.

### Logika Interaksi & Delegasi
- **Tap Spanduk (`didSelectItemAt`):**
  - Memicu pembukaan tautan menggunakan `IDBusinessWebViewController.loadUrlWithAuth(targetUrl: jumpUrl, canGoBack: true)`.
  - Mengirim event analitik tombol realtime:
    `IDCustomPointManager.reportRiskButtonRealtime(event: "Home_banner", "click", eventValue: ["activityId": activityId, "activityName": activityName])`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Multi-Banner Promosi dengan Indikator

- 🎯 **Trigger / Kondisi:** Endpoint `activity/queryNonCreditCardZoneForHomepage` mengembalikan 3 item banner promosi.
- 📱 **Expected Result:** Korsel menampilkan spanduk pertama, bergulir otomatis tiap 5 detik, dengan 3 titik indikator di bawah (indikator pertama memanjang oranye).
- 👆 **Interaksi:** Tap spanduk membuka halaman H5 promosi dan mengirim event analitik `Home_banner_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "bannerInfo": {
      "title": "Spanduk Kegiatan",
      "list": [
        {
          "bannerImgNew": "https://img.samir.co.id/banner/promo-ramadhan-2024.png",
          "jumpUrl": "https://h5.samir.co.id/activity/promo-ramadhan",
          "activityId": "ACT-20240401",
          "activityName": "Promo Berkah Ramadhan"
        },
        {
          "bannerImgNew": "https://img.samir.co.id/banner/cashback-kilat.png",
          "jumpUrl": "https://h5.samir.co.id/activity/cashback-kilat",
          "activityId": "ACT-20240402",
          "activityName": "Cashback Pelunasan Kilat"
        },
        {
          "bannerImgNew": "https://img.samir.co.id/banner/referral-teman.png",
          "jumpUrl": "https://h5.samir.co.id/activity/ajak-teman",
          "activityId": "ACT-20240403",
          "activityName": "Ajak Teman Dapat Komisi"
        }
      ]
    },
    "faqInfo": null
  }
}
```

- 🔄 **Yang diubah:** `bannerInfo.list` berisi 3 objek banner lengkap dengan gambar, URL, dan ID promosi.
- 🎯 **Alasan / Hasil yang diuji:** Menguji korsel bergerak otomatis, pembentukan indikator halaman multi-titik, dan pengiriman event tracking.

---

### 🟢 Kasus B — Spanduk Tunggal (Tanpa Indikator)

- 🎯 **Trigger / Kondisi:** Endpoint mengembalikan hanya 1 item banner.
- 📱 **Expected Result:** Banner tampil statis tanpa pergeseran; bar indikator `pageControlStackView` otomatis disembunyikan.
- 👆 **Interaksi:** Tap spanduk tetap membuka halaman tujuan dan mengirim analitik.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "bannerInfo": {
      "title": "Spanduk Tunggal",
      "list": [
        {
          "bannerImgNew": "https://img.samir.co.id/banner/single-announcement.png",
          "jumpUrl": "https://h5.samir.co.id/activity/pengumuman-resmi",
          "activityId": "ACT-SINGLE-01",
          "activityName": "Pengumuman Pemeliharaan Sistem"
        }
      ]
    },
    "faqInfo": null
  }
}
```

- 🔄 **Yang diubah:** `bannerInfo.list` hanya memiliki 1 elemen.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi penyembunyian indikator halaman ketika jumlah spanduk tidak memerlukan navigasi pagination.

---

## ✅ Verifikasi & Batasan

- [x] Selector `dataModel.bannerInfo?.list?.isEmpty == false` pada `getCellListAry` dan konfigurasi FSPagerView terkonfirmasi source Swift.
- [x] Integrasi pembukaan tautan `loadUrlWithAuth` dan analitik realtime `Home_banner_click` diverifikasi pada `didSelectItemAt`.

