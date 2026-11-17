# IDAmountEmptyDataViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu kuota cadangan (*pocket card* / *fallback offline card*) yang ditampilkan di Area Kuota (Section 1) saat terjadi kegagalan jaringan, ketika respons API kuota tidak tersedia (`quotaInfo == nil`), saat akun dalam status verifikasi kelengkapan data BNC (`EXECUTING_REPLENISH` atau `EXECUTING_REPLENISH_DONE`), ataupun sebagai *safety fallback* terhadap status yang tidak dikenali sistem.
> Endpoint terkait: `product/V4/mergeOrigin` (`IDLoanQuotaAreaModels`).

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Jaringan Terputus / API Gagal | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `dataModel.quotaInfo == nil` | Tidak ada payload kuota yang berhasil di-decode | **Cell Target:** Kartu putih berbayang oranye, ilustrasi no-network di tengah, pesan loading ulang | Tidak ada handler tap terpasang | Routing fallback `else` pada `getCellListAry` terbukti source |
| **B** — Menunggu Verifikasi BNC | Sama | `quotaInfo.status == "EXECUTING_REPLENISH"`; `circularCreditResp == null` | Status instruksi verifikasi BNC lanjutan | **Cell Target:** Tampilan sama dengan kasus A | Tidak ada handler tap terpasang | Switch case `EXECUTING_REPLENISH` terbukti source |
| **C** — Selesai Verifikasi BNC | Sama | `quotaInfo.status == "EXECUTING_REPLENISH_DONE"`; `circularCreditResp == null` | Status verifikasi BNC selesai diproses | **Cell Target:** Tampilan sama dengan kasus A | Tidak ada handler tap terpasang | Switch case `EXECUTING_REPLENISH_DONE` terbukti source |
| **D** — Status Tak Dikenali (Fallback) | Sama | `quotaInfo.status == "UNKNOWN_STATUS_XYZ"`; `circularCreditResp == null` | String status tidak terdaftar dalam kamus switch-case | **Cell Target:** Tampilan sama dengan kasus A | Tidak ada handler tap terpasang | Switch `default` case terbukti source |
| **E** — Circular Override | Sama | Kondisi B, C, atau D; `circularCreditResp != null` | Model limit virtual circular tersedia | `IDAmountCycleLoanViewCell`, bukan target | Bukan target empty cell | Override circular terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> `IDAmountEmptyDataViewCell` tidak mengimplementasikan metode `updateData`. Seluruh teks dan ikon diatur secara statis pada fase inisialisasi view (`updateTheme`). Ketika terjadi error jaringan, `IDLoanService` melewatkan `model: dataModel.quotaInfo as Any` bernilai `nil` ke dalam dictionary konfigurasi cell.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 569-575, 585-590: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 114: `register`, baris 248: `createAmountEmptyDataCell`)
> - Cell Implementation: `IDAmountEmptyDataViewCell.swift` (`initUI`, `commonUI`, `updateTheme`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │             ┌──────────────┐         │  │
│  │             │   [icon]     │         │  │  ← iconImageView
│  │             │ (no network) │         │  │    (198 x 106 pt)
│  │             └──────────────┘         │  │
│  │                                      │  │
│  │    Silahkan tekan untuk loading ulang│  │  ← descLabel
│  │                                      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar belakang putih (`bgLabel.backgroundColor = .white`) dengan margin atas `20 pt`, kiri/kanan `20 pt`, dan sudut melengkung `radius: 8.0 pt` serta bayangan oranye halus (`ShadowOrangeColor`, radius 20, opacity 0.8).
- **Tata Letak Elemen:**
  - `iconImageView`: Posisi tengah horizontal (`centerX`), offset atas `32 pt`, ukuran lebar `198 pt` dan tinggi `106 pt`, memuat asset `R.image.loan_amount_icon_nonetwork()`.
  - `descLabel`: Posisi di bawah icon dengan jarak `16 pt`, margin kiri/kanan `32 pt`, jarak dari bawah kartu `-52 pt`, teks rata tengah.

### Kategori Komponen Data
- **Ilustrasi Status (`iconImageView`):** Statis asset aplikasi (`R.image.loan_amount_icon_nonetwork()`).
- **Keterangan Loading (`descLabel`):** Teks statis `"Silahkan tekan untuk loading ulang"`, font PingFangSC Medium General, warna `#222222` (`IDThemeColor.TextColor_Important`).

### Logika Interaksi & Delegasi
- Cell ini bertindak sebagai tampilan status netral/kosong tanpa tombol aksi CTA (`UIButton`). Pengguna umumnya me-refresh beranda menggunakan gestur *pull-to-refresh* pada `UITableView` utama.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Jaringan Terputus / API Gagal (`quotaInfo == null`)

- 🎯 **Trigger / Kondisi:** Permintaan HTTP ke endpoint `product/V4/mergeOrigin` mengalami timeout, error 500, atau decode failure sehingga `dataModel.quotaInfo == nil`.
- 📱 **Expected Result:** Cell target tampil di Section 1 dengan ikon offline dan instruksi memuat ulang.
- 👆 **Interaksi:** Tidak ada aksi tap pada cell; gestur pull-to-refresh beranda memicu query ulang.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": null,
    "repayInfo": null,
    "circularCreditResp": null,
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo` bernilai `null`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji jalur percabangan `else` pada `getCellListAry` baris 585 saat data kuota gagal dimuat.

---

### 🟢 Kasus B — Menunggu Verifikasi Lanjutan BNC (`EXECUTING_REPLENISH`)

- 🎯 **Trigger / Kondisi:** API mengembalikan `quotaInfo.status == "EXECUTING_REPLENISH"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Area kuota menampilkan kartu placeholder cadangan (`IDAmountEmptyDataViewCell`) dengan tampilan identik Kasus A untuk menunggu pembaruan/kelengkapan berkas BNC.
- 👆 **Interaksi:** Tidak ada handler tap terpasang; gestur pull-to-refresh beranda memicu query ulang.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_REPLENISH",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-replenish-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": null
    },
    "repayInfo": null,
    "circularCreditResp": null,
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `"EXECUTING_REPLENISH"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi percabangan switch-case `EXECUTING_REPLENISH` pada `IDLoanService.swift` (baris 569) yang memilih pocket card cadangan saat menunggu berkas verifikasi BNC.

---

### 🟢 Kasus C — Selesai Verifikasi BNC (`EXECUTING_REPLENISH_DONE`)

- 🎯 **Trigger / Kondisi:** API mengembalikan `quotaInfo.status == "EXECUTING_REPLENISH_DONE"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Area kuota menampilkan kartu placeholder cadangan (`IDAmountEmptyDataViewCell`) dengan tampilan identik Kasus A saat dokumen verifikasi BNC telah selesai di-submit/diproses.
- 👆 **Interaksi:** Tidak ada handler tap terpasang; gestur pull-to-refresh beranda memicu query ulang.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_REPLENISH_DONE",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-replenish-done-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": null
    },
    "repayInfo": null,
    "circularCreditResp": null,
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `"EXECUTING_REPLENISH_DONE"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi percabangan switch-case `EXECUTING_REPLENISH_DONE` pada `IDLoanService.swift` (baris 570) yang memilih pocket card cadangan saat verifikasi data BNC telah dikirimkan.

---

### 🟢 Kasus D — Status Tak Dikenali / Fallback Default (`UNKNOWN_STATUS_XYZ`)

- 🎯 **Trigger / Kondisi:** API mengembalikan status baru dari backend yang belum didefinisikan pada kode client Swift (`quotaInfo.status == "UNKNOWN_STATUS_XYZ"` atau kode acak) dan `circularCreditResp == null`.
- 📱 **Expected Result:** Jalur `default:` pada switch-case memilih `IDAmountEmptyDataViewCell` untuk mencegah crash atau tampilan rusak (tampilan identik Kasus A).
- 👆 **Interaksi:** Tidak ada handler tap terpasang.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UNKNOWN_STATUS_XYZ",
      "title": "Status Baru",
      "amount": "1000000",
      "buttonText": "Detail",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-unknown-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": null
    },
    "repayInfo": null,
    "circularCreditResp": null,
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke nilai tak dikenal `"UNKNOWN_STATUS_XYZ"`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji ketahanan fallback sistem (*graceful degradation*) saat backend meluncurkan status baru tanpa update aplikasi.

---

## ✅ Verifikasi & Batasan

- [x] Percabangan switch-case `EXECUTING_REPLENISH`, `EXECUTING_REPLENISH_DONE`, fallback `default`, dan kondisi `quotaInfo == nil` diverifikasi langsung pada `IDLoanService.swift`.
- [x] Komponen UI terbukti statis tanpa dependensi ke properti model dinamis di `updateData`.

