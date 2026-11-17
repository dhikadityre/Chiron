# IDLoanRepaidViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu jadwal pembayaran pinjaman (*repayment schedule card*) yang menampilkan informasi tanggal jatuh tempo pembayaran (`dueDate`), total tagihan pinjaman berjalan (`dueAmount`), tombol aksi pembayaran (`buttonText`), serta bar promosi keuntungan/kupon VIP (*benefit promotion bar*) opsional di bagian bawah kartu.
> Endpoint terkait: `product/V4/mergeOrigin` (`repayInfo: IDLoanRepaidModel?`).
> Dipilih pada `IDLoanService.swift` (`getCellListAry`) ketika properti `dataModel.repayInfo != nil`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Jadwal Bayar Standar (Tanpa Promosi) | `product/V4/mergeOrigin` / `IDLoanRepaidModel` | `dataModel.repayInfo != nil`; `benefitPromotionText == null` | Rincian tagihan pinjaman aktif tanpa promosi tambahan | **Cell Target:** Tanggal jatuh tempo, nominal tagihan, tombol "Bayar". Banner promosi tersembunyi (`height = 0`) | Tap tombol CTA memanggil `interactiveDelegate?.jumpWithUrl(jumpUrl)` | Selector di `getCellListAry`, data binding, dan tap handler terbukti source |
| **B** — Jadwal Bayar dengan Bar Kupon VIP | Sama | Kondisi A; `benefitPromotionText` & `benefitPromotionTarget` tidak kosong | Terdapat teks promosi dan target URL kupon/benefit | **Cell Target:** Di bawah baris tagihan muncul bar promosi (`height = 46`) dengan background kupon, badge VIP, dan panah. Exposure `homeEquityEntryExposure` tercatat saat sel muncul | Tap CTA memanggil router bayar. Tap bar promosi mengirim analitik `homeEquityEntryClick` lalu membuka H5 dengan autentikasi | AutoLayout dinamis, exposure di `willDisplay`, dan tap handler terbukti source |
| **C** — Penanganan Siklus Kredit Circular | Sama | Kondisi A atau B; `cycleModel != null` | Terdapat konteks kredit circular | **Cell Target:** Tampilan sama; saat tombol bayar diklik, sistem mengirim analitik spesifik status circular (misal: `home_cycle_over_orig_repay` atau `home_Cycle_Crig_Repay`) | Analitik circular terkirim sebelum navigasi `jumpWithUrl` | Percabangan tracking `repayAmountAction` terbukti source |
| **D** — Target URL Relatif Promosi | Sama | Kondisi B; `benefitPromotionTarget` berawalan `"/samir/"` | URL target menggunakan path relatif | **Cell Target:** Sama dengan Kasus B | Tap bar promosi menggabungkan `webBaseUrl` dengan target path lalu memuat webview | Resolusi prefix URL di `openBenefitPromotion` terbukti source |
| **E** — Section Suppressed | Sama | `dataModel.repayInfo == nil` | Model pengembalian pinjaman bernilai null | Cell jadwal pembayaran tidak dimuat ke dalam tabel | Tidak ada interaksi | Guard `if (dataModel.repayInfo != nil)` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari endpoint `product/V4/mergeOrigin` di bawah atribut `repayInfo`. Exposure analitik untuk bar promosi keuntungan dilaporkan melalui delegate `reportBenefitPromotionExposure()` saat baris tabel akan ditampilkan (`willDisplay cell`).

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 599-603: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 126: `register`, baris 273-284: `cellForRowAt`, baris 353-356: `willDisplay`)
> - Cell Implementation: `IDLoanRepaidViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `reportBenefitPromotionExposure`, `openBenefitPromotion`, `repayAmountAction`)
> - Model: `IDLoanRepaidModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ▌ titleLabel (Jatuh tempo: 2024-05-10) ┌───────────┐ │  │  ← verticalLine (Orange)
│  │ ▌                                      │   Bayar   │ │  │  ← repayButton (106 x 36 pt)
│  │ ▌ contentLabel (Rp 1.500.000)          └───────────┘ │  │
│  │                                                      │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │  ← benefitPromotionView
│  │ │ [coupon] Dapatkan Kupon Diskon Pelunasan [VIP] > │ │  │    (opsional, tinggi 46 pt)
│  │ └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar putih dengan sudut membulat `radius: 8.0 pt` dan bayangan oranye (`ShadowOrangeColor`, radius 5, opacity 0.5). Inset atas, kiri, dan kanan bernilai `20 pt`.
- **Baris Tagihan Atas:**
  - `verticalLine`: Garis vertikal oranye (`MajorOrangeColor`) di sisi kiri dengan lebar `2 pt` dan tinggi `42 pt`.
  - `titleLabel`: Berada di sebelah kanan garis vertikal dengan jarak `8 pt`, font 12 semibold, warna `#3D3835`. Menampilkan tanggal jatuh tempo (`dueDate`).
  - `contentLabel`: Berada di bawah judul sejajar dengan batas bawah garis vertikal, font 14 medium, warna `#9E9894`. Menampilkan nominal tagihan (`dueAmount`).
  - `repayButton`: Tombol oranye (`UIButton.idn.createButtonOrange`) berukuran `106 x 36 pt` di sisi kanan kartu (`offset -20 pt`), menampilkan teks tombol dari API (`buttonText`).
- **Baris Promosi Bawah (`benefitPromotionView`):**
  - Bersifat dinamis: tinggi `46 pt` dan margin atas `6 pt` bila aktif; tinggi `0 pt` bila tidak tersedia.
  - Memuat background `home_repay_benefit_background`, ikon kupon di kiri (`24 x 24 pt`), label teks promosi font 12 pt warna cokelat emas `#9D570E`, badge VIP (`21 x 14 pt`), dan panah navigasi di kanan (`14 x 14 pt`).

### Kategori Komponen Data
- **Tanggal Jatuh Tempo (`titleLabel`):** API (`repayInfo.dueDate`), font 12 semibold, warna `#3D3835`.
- **Nominal Tagihan (`contentLabel`):** API (`repayInfo.dueAmount`), font 14 medium, warna `#9E9894`.
- **Tombol Bayar (`repayButton`):** API (`repayInfo.buttonText`), tombol oranye teks putih 12 pt semibold.
- **Teks Promosi Keuntungan (`benefitPromotionLabel`):** API (`repayInfo.benefitPromotionText`), font 12 pt, warna `#9D570E`.
- **Target URL Promosi:** API (`repayInfo.benefitPromotionTarget`), string path URL atau deeplink.
- **Tautan Bayar Pinjaman:** API (`repayInfo.jumpUrl`), string routing halaman pelunasan.

### Logika Exposure & Tap
- **Exposure Event:** Ketika cell ditampilkan pada tabel (`tableView:willDisplay:forRowAt:`), sistem memanggil `reportBenefitPromotionExposure()` yang mengirimkan event analitik realtime `homeEquityEntryExposure` jika bar promosi terlihat.
- **Tap Bar Promosi (`openBenefitPromotion`):**
  - Mengirim event analitik `homeEquityEntryClick`.
  - Jika target diawali dengan `"/samir/"`, URL digabungkan dengan `CZEnvironmentManager.stringValueForKey("webBaseUrl")`.
  - Membuka halaman menggunakan `IDBusinessWebViewController.loadUrlWithAuth(targetUrl: targetUrl, canGoBack: true)`.
- **Tap Tombol Bayar (`repayAmountAction`):**
  - Mengecek model `cycleModel` untuk mengirim event analitik tracking status circular (misal dialog `noQuota`, `overdue`, `orderLimit`, atau `creditState` 1 vs 2).
  - Mengeksekusi navigasi pelunasan melalui `interactiveDelegate?.jumpWithUrl(dataModel.jumpUrl)`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Jadwal Bayar Standar Tanpa Promosi

- 🎯 **Trigger / Kondisi:** Akun memiliki tagihan pinjaman aktif; `repayInfo != nil` tanpa teks promosi kupon.
- 📱 **Expected Result:** Baris tagihan tampil dengan tanggal jatuh tempo "Jatuh tempo: 20 Mei 2024", nominal tagihan "Rp 1.500.000", tombol "Bayar Pinjaman". Bar promosi kupon tersembunyi.
- 👆 **Interaksi:** Tap tombol bayar memanggil `jumpWithUrl("samir://repay?orderId=ORD-101")`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": null,
    "repayInfo": {
      "title": "Jadwal Pelunasan",
      "payableText": "Total yang harus dibayar",
      "payableAmount": "1500000",
      "buttonText": "Bayar Pinjaman",
      "benefitPromotionText": null,
      "benefitPromotionTarget": null,
      "jumpUrl": "samir://repay?orderId=ORD-101",
      "orderId": "ORD-101",
      "dueAmount": "Rp 1.500.000",
      "dueDate": "Jatuh tempo: 20 Mei 2024"
    },
    "circularCreditResp": null,
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": null,
    "oneClickLoan": null
  }
}
```

- 🔄 **Yang diubah:** `repayInfo.dueAmount`, `repayInfo.dueDate`, `repayInfo.buttonText`, `repayInfo.jumpUrl`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penyajian kartu pembayaran standar tanpa komponen promosi tambahan.

---

### 🟢 Kasus B — Jadwal Bayar dengan Promosi Kupon VIP

- 🎯 **Trigger / Kondisi:** Tagihan pinjaman disertai insentif kupon pelunasan; `benefitPromotionText` dan `benefitPromotionTarget` terisi.
- 📱 **Expected Result:** Di bawah informasi tagihan muncul bar promosi kupon VIP setinggi 46 pt dengan copy "Dapatkan kupon diskon pelunasan hingga 50rb!". Event `homeEquityEntryExposure` dilaporkan otomatis.
- 👆 **Interaksi:** Tap pada bar promosi mencatat event `homeEquityEntryClick` dan membuka URL webview yang ditentukan.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": null,
    "repayInfo": {
      "title": "Jadwal Pelunasan",
      "payableText": "Total yang harus dibayar",
      "payableAmount": "2000000",
      "buttonText": "Bayar Sekarang",
      "benefitPromotionText": "Dapatkan kupon diskon pelunasan hingga 50rb!",
      "benefitPromotionTarget": "/samir/equity/voucher-center?activityId=ACT-VIP-01",
      "jumpUrl": "samir://repay?orderId=ORD-102",
      "orderId": "ORD-102",
      "dueAmount": "Rp 2.000.000",
      "dueDate": "Jatuh tempo: 28 Mei 2024"
    },
    "circularCreditResp": null,
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": null,
    "oneClickLoan": null
  }
}
```

- 🔄 **Yang diubah:** `benefitPromotionText` dan `benefitPromotionTarget` (path relatif `/samir/...`).
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi ekspansi AutoLayout dinamis bar promosi keuntungan, exposure event, dan resolusi URL relatif.

---

## ✅ Verifikasi & Batasan

- [x] Selector `dataModel.repayInfo != nil` pada `getCellListAry` dan penanganan `willDisplay` untuk exposure promosi terkonfirmasi source Swift.
- [x] Mekanisme resolusi target URL relatif dengan `webBaseUrl` dan routing `loadUrlWithAuth` diverifikasi langsung pada `openBenefitPromotion`.

