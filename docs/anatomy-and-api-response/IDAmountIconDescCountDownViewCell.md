# IDAmountIconDescCountDownViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode menjadi `IDLoanQuotaAreaModels`.
> Pada status `EXECUTING_MACHINE`, `mergeOrigin` secara otomatis melakukan *sub-chaining* ke sub-endpoint `POST tinyFlowRecord/checkRaiseApplyAmount` untuk mengevaluasi kelayakan penawaran kenaikan limit kilat (*tiny flow readdition*).
> Cell ini bertugas menampilkan status peninjauan (baik peninjauan standar maupun peninjauan dengan penawaran limit instan), proses pencairan dana, pembatalan, penolakan, serta periode *cooling-down* dengan penanda hitung mundur (*countdown badge*). Cell ini tidak memiliki tombol CTA konfirmasi pinjaman standar di bagian bawah. Jika `circularCredit != nil`, pilihan cell ditimpa menjadi `IDAmountCycleLoanViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap / Event | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Hitung Mundur Penolakan | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "REFUSE_COUNTDOWN"`; `countDownTimeStamp == "86400"`; circular null | Status penolakan dengan masa tunggu | **Cell Target:** Ikon penolakan (`loan_amount_icon_reject`), teks keterangan, badge hijau hitung mundur di kanan atas. Exposure `Scene: "normal"`, `Credit: "disable"` | Saat timer habis, otomatis memicu `countDownFinish()` | Selector, binding, timer, dan delegate call terbukti source |
| **B** — Pencairan Berjalan (*Disbursement*) | Sama | `status == "TRANSACTION"`; `extraStatus != "TRANSACTION_FAIL_CHANGE_BANK_CARD"`; circular null | Pencairan transfer dana sedang berlangsung | **Cell Target:** Ikon pencairan (`loan_amount_icon_makeloan`), teks deskripsi, tanpa badge hitung mundur pojok | Tidak ada aksi tap utama | Selector dan binding terbukti source |
| **C** — Pencairan + Banner Akselerasi | Sama | Kondisi B; `benefitSpeedUpSign == "Pencairan Prioritas VIP"` | Banner benefit akselerasi tersedia | **Cell Target:** Banner gradient cokelat bertuliskan benefit muncul di bagian paling atas kartu | Tampilan visual banner aktif | Binding dan layout terbukti source |
| **D.1** — Peninjauan Sistem Standar | Sama | `status == "EXECUTING_MACHINE"` / `EXECUTING_PERSONAL`; circular null; readdition null/ineligible | Tahap verifikasi otomatis mesin atau analis manual | **Cell Target:** Ikon menunggu review (`loan_amount_icon_waiting_toolong` / `loan_amount_icon_personal`), teks keterangan | Tidak ada aksi tap | Selector dan binding terbukti source |
| **D.2** — Peninjauan Sistem + Readdition Limit | `product/V4/mergeOrigin` + `tinyFlowRecord/checkRaiseApplyAmount` | `status == "EXECUTING_MACHINE"`; `bizId` valid; `businessResult == 0` & `expireSeconds > 0` | Verifikasi mesin dengan penawaran kenaikan limit kilat (*tiny flow*) | **Cell Target:** Ikon review + badge tombol penawaran (`actionButton`), label countdown (`additionCountDownLabel`), dan animasi telunjuk (`fingerImageView`). Popup `LoanAdditionPopView` muncul otomatis saat load | Tap tombol penawaran membuka kembali popup `LoanAdditionPopView`. Timer habis memicu `additionCountDownFinish()` | Sub-chaining, layout constraint, timer, dan delegate terbukti source |
| **E** — Transaksi Gagal Rekening Bank | Sama | `status == "TRANSACTION"`; `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"` | Rekening bank tujuan pencairan gagal | `AmountChangeCardViewCell`, bukan target | Bukan handler cell target | Percabangan sub-status terbukti source |
| **F** — Circular Override | Sama | Kondisi A; `circularCreditResp != null` | Object circular terisi | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler cell target | Override terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Source membuktikan bahwa `countDownLabel` hanya diaktifkan secara eksplisit pada status `CANCEL_COUNTDOWN` dan `REFUSE_COUNTDOWN` ketika `countDownTimeStamp` berupa string digit numerik. Banner benefit `benefitSpeedUpSign` disalin service dari model luar, bukan field internal `quotaInfo`.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`getCellListAry`)
> - Views: `IDLoanViews.swift` (`createAmountIconDesCountDownCell`)
> - Cell Implementation: `IDAmountIconDescCountDownViewCell.swift` (`updateData`, `startCountDown`, `setupGradientBackground`)

---

## 📐 Preview & Anatomi Tampilan

### 1. Anatomi Standar (Refuse / Cancel / Transaction / Review Murni)
*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ ┌──────────────────────────────────┐ │  │  ← titleBackgroundView (Banner benefit)
│  │ │ [icon] titleLabel                │ │  │
│  │ └──────────────────────────────────┘ │  │
│  │               ┌─────────┐    ┌─────┐ │  │  ← countDownLabel (Badge hijau)
│  │               │ [icon]  │    │01:23│ │  │
│  │               └─────────┘    └─────┘ │  │  ← iconImageView (Ikon status)
│  │                                      │  │
│  │           descLabel (Teks            │  │  ← descLabel
│  │             Keterangan)              │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### 2. Anatomi Khusus `EXECUTING_MACHINE` + Readdition Penawaran Limit
*Muncul ketika chaining `tinyFlowRecord/checkRaiseApplyAmount` mengembalikan `businessResult == 0` dan `expireSeconds > 0`:*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │                      ┌─────────────┐ │  │  ← actionButton (readdition_cell_btn, 105 x 30)
│  │                      │Berakhir05:00│ │  │    + additionCountDownLabel ("Berakhir MM:SS")
│  │                      └─────────────┘ │  │
│  │               ┌─────────┐      👆    │  │  ← fingerImageView (readdition_finger, 40 x 44)
│  │               │ [icon]  │            │  │    (Animasi pantul vertikal ke arah tombol)
│  │               └─────────┘            │  │  ← iconImageView (loan_amount_icon_waiting_toolong)
│  │                                      │  │
│  │           descLabel (Teks            │  │  ← descLabel
│  │     "Data pengajuan Anda sedang      │  │
│  │      diverifikasi oleh sistem..."    │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar belakang putih dengan sudut membulat `radius: 8.0` dan bayangan oranye halus. Margin atas, kiri, dan kanan bernilai `20`.
- **Tata Letak Elemen:**
  - `titleBackgroundView`: Banner akselerasi opsional di posisi teratas kartu (tinggi 22) dengan background gradient cokelat.
  - `countDownLabel`: Badge hijau (`#26BD8B`) di sudut kanan atas kartu (offset top 16, offset right 16, tinggi 15).
  - `iconImageView`: Ikon status utama di tengah atas dengan ukuran `198 x 106`.
  - `descLabel`: Teks penjelasan status di bawah ikon dengan margin samping `32` dan bawah `32`, teks rata tengah.
  - `actionButton`: Tombol melayang di kanan atas kartu (`width: 105, height: 30, top: 26, right: 1`) dengan aset `readdition_cell_btn`.
  - `additionCountDownLabel`: Label countdown di dalam `actionButton` (`left: 15, centerY: actionButton`), format `"Berakhir MM:SS"`.
  - `fingerImageView`: Ikon jari telunjuk di bawah tombol (`size: 40 x 44, top: actionButton.bottom - 4, right: actionButton.right + 4`), aset `readdition_finger`.

### Kategori Komponen Data
- **Banner Benefit (`titleLabel`):** API luar (`benefitSpeedUpSign`), font 12 semibold warna `#FFF5F2`. Hanya tampil pada status `TRANSACTION`.
- **Ikon Status (`iconImageView`):** Statis/Logic (pemetaan berdasarkan `status`):
  - `REFUSE_COUNTDOWN` → `R.image.loan_amount_icon_reject()`
  - `CANCEL_COUNTDOWN` → `R.image.loan_amount_icon_cancle()`
  - `TRANSACTION` → `R.image.loan_amount_icon_makeloan()`
  - `EXECUTING_MACHINE` → `R.image.loan_amount_icon_waiting_toolong()`
  - `EXECUTING_PERSONAL` → `R.image.loan_amount_icon_personal()`
  - `WAIT_LEND` → `R.image.loan_amount_icon_waiting()`
  - `FINISH_RELOAN_REFUSE` → `R.image.loan_amount_icon_reloan_reject()`
  - `NEW_WRITE_OFF` → `R.image.loan_amount_icon_overdue()`
- **Teks Status (`descLabel`):** API (`quotaInfo.descContent`), font Medium General warna `#222222`.
- **Badge Hitung Mundur (`countDownLabel`):** API + Timer lokal (`quotaInfo.countDownTimeStamp`), latar hijau `#26BD8B`, teks putih format `JJ:MM:DD` atau `MM:DD`.
- **Badge Penawaran Readdition (`actionButton` + `additionCountDownLabel` + `fingerImageView`):** API Chained `POST tinyFlowRecord/checkRaiseApplyAmount` (`ReadditonCheckModel`). Aktif hanya saat `businessResult == 0` dan `expireSeconds > 0`.

### Logika Exposure & Interaksi
- **Exposure Event:** Selalu melaporkan event `home_apply` / `show` di `updateData` dengan nilai tetap `["status": status, "Scene": "normal", "Credit": "disable"]`.
- **Aksi Tombol CTA:** Cell ini tidak memiliki tombol CTA konfirmasi pinjaman standar.
- **Interaksi Tombol Penawaran Readdition (`actionButton`):** Saat diketuk, menjalankan `onAction()` → memicu delegate `showAdditionPop(model:)` untuk menampilkan kembali modal dialog **`LoanAdditionPopView`**.
- **Timer Countdown Selesai:**
  - Status penolakan / pembatalan: saat hitungan mundur `countDownTimeStamp` mencapai 0, memicu `interactiveDelegate.countDownFinish()`.
  - Penawaran readdition: saat timer `additionTime` mencapai 0, elemen penawaran disembunyikan dan memicu `interactiveDelegate.additionCountDownFinish()`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Hitung Mundur Penolakan (`REFUSE_COUNTDOWN`)

- 🎯 **Trigger / Kondisi:** `status == "REFUSE_COUNTDOWN"` dan `countDownTimeStamp == "86400"`.
- 📱 **Expected Result:** Ikon `loan_amount_icon_reject`, teks penjelasan penolakan, dan badge hijau di sudut kanan atas yang menghitung mundur 24 jam.
- 👆 **Interaksi:** Ketika timer selesai (0 detik), callback `countDownFinish()` dijalankan.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "REFUSE_COUNTDOWN",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pengajuan pinjaman Anda belum dapat disetujui saat ini. Silakan coba kembali setelah waktu tunggu berakhir.",
      "countDownTimeStamp": "86400",
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-refuse-cd-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.descContent`, `quotaInfo.countDownTimeStamp`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penanganan badge countdown sudut kanan atas dan trigger `countDownFinish` pada status penolakan berkala.

---

### 🟢 Kasus B — Pencairan Berjalan (`TRANSACTION`)

- 🎯 **Trigger / Kondisi:** `status == "TRANSACTION"` dan `extraStatus == null`.
- 📱 **Expected Result:** Ikon `loan_amount_icon_makeloan` dan teks proses pengiriman dana. Badge countdown pojok disembunyikan.
- 👆 **Interaksi:** Tidak ada interaksi tombol.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "TRANSACTION",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pencairan pinjaman sedang diproses ke rekening Anda.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-tx-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `TRANSACTION`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi pemilihan cell pada alur pencairan dana standar.

---

### 🟢 Kasus C — Pencairan dengan Banner Akselerasi VIP

- 🎯 **Trigger / Kondisi:** Kondisi Kasus B dengan nilai `benefitSpeedUpSign == "Pencairan Prioritas VIP Aktif"`.
- 📱 **Expected Result:** Banner gradient cokelat muncul di bagian paling atas kartu dengan teks keterangan benefit.
- 👆 **Interaksi:** Tidak ada interaksi tombol.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "TRANSACTION",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pencairan pinjaman sedang diproses ke rekening Anda.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-tx-vip-001",
      "benefitSpeedUpSign": "Pencairan Prioritas VIP Aktif",
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
    "benefitSpeedUpSign": "Pencairan Prioritas VIP Aktif",
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `benefitSpeedUpSign` diisi string non-empty.
- 🎯 **Alasan / Hasil yang diuji:** Menguji aktivasi `titleBackgroundView` dan pengaturan gradient layer.

---

### 🟢 Kasus D.1 — Peninjauan Sistem Standar (`EXECUTING_MACHINE` Tanpa Readdition / Ineligible)

- 🎯 **Trigger / Kondisi:** 
  1. `POST product/V4/mergeOrigin`: `quotaInfo.status == "EXECUTING_MACHINE"`, `circularCreditResp == null`, dan `bizId == "biz-mock-machine-001"`.
  2. *Sub-Chaining API* `POST tinyFlowRecord/checkRaiseApplyAmount`: Mengembalikan `businessResult != 0` (tidak eligible) atau `expireSeconds == 0` (kadaluwarsa).
- 📱 **Expected Result:** Ikon `loan_amount_icon_waiting_toolong` dan teks pengajuan dalam review otomatis sistem. Tombol penawaran, timer countdown, dan animasi telunjuk disembunyikan (`isHidden = true`).
- 👆 **Interaksi:** Tidak ada interaksi tombol (kartu statis informatif).
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

#### 1. Fixture `POST product/V4/mergeOrigin`
```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_MACHINE",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Data pengajuan Anda sedang diverifikasi secara otomatis oleh sistem kami. Mohon menunggu.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-machine-001",
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

#### 2. Fixture Sub-Chained `POST tinyFlowRecord/checkRaiseApplyAmount` (Ineligible / Expired)
```json
{
  "code": "200",
  "msg": "",
  "sign": "26f9a8e8a31ccb994d79baa525c10098",
  "result": {
    "bizId": "biz-mock-machine-001",
    "businessResult": 1,
    "applyAmount": 2000000,
    "raiseAmount": 0,
    "raiseAmountExpireTime": null,
    "expireSeconds": 0,
    "benefitPackageId": null,
    "raiseAmountTips": null,
    "serviceAmount": null,
    "serviceProtocol": null,
    "serviceProtocolText": null
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `EXECUTING_MACHINE` dan `businessResult` disetel non-nol.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi pemetaan status review mesin ke ikon dan layout tanpa penawaran limit tambahan.

---

### 🟢 Kasus D.2 — Peninjauan Sistem + Readdition Limit Instan (`EXECUTING_MACHINE` + Tiny Flow Eligible)

- 🎯 **Trigger / Kondisi:** 
  1. `POST product/V4/mergeOrigin`: `quotaInfo.status == "EXECUTING_MACHINE"`, `circularCreditResp == null`, dan `bizId == "biz-mock-machine-001"`.
  2. *Sub-Chaining API* `POST tinyFlowRecord/checkRaiseApplyAmount`: Mengembalikan `businessResult == 0` (lolos eligibilitas) dan `expireSeconds > 0` (misal 300 detik / 5 menit).
- 📱 **Expected Result:**
  - Ikon review `loan_amount_icon_waiting_toolong` di tengah kartu.
  - Tombol penawaran (`actionButton`) muncul di pojok kanan atas kartu (ukuran `105 x 30`) dengan latar `readdition_cell_btn`.
  - Teks hitung mundur penawaran (`additionCountDownLabel`) berjalan: `"Berakhir 05:00"`.
  - Ikon jari telunjuk (`fingerImageView`, `40 x 44`) aktif di bawah tombol dengan animasi memantul vertikal berulang.
  - Saat data pertama kali dimuat di Home, modal dialog **`LoanAdditionPopView`** otomatis muncul ke layar.
- 👆 **Interaksi:**
  - Mengetuk tombol penawaran pada cell memicu `onAction()` → memanggil delegate `showAdditionPop(model:)` untuk membuka kembali modal dialog **`LoanAdditionPopView`**.
  - Saat timer mencapai 0, elemen penawaran otomatis disembunyikan dan memanggil `interactiveDelegate?.additionCountDownFinish()`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

#### 1. Fixture `POST product/V4/mergeOrigin`
*Sama dengan fixture Kasus D.1 di atas.*

#### 2. Fixture Sub-Chained `POST tinyFlowRecord/checkRaiseApplyAmount` (Eligible Penambahan Limit)
```json
{
  "code": "200",
  "msg": "",
  "sign": "26f9a8e8a31ccb994d79baa525c10098",
  "result": {
    "bizId": "biz-mock-machine-001",
    "businessResult": 0,
    "applyAmount": 2000000,
    "raiseAmount": 500000,
    "raiseAmountExpireTime": "2026-11-16 17:00:00",
    "expireSeconds": 300,
    "benefitPackageId": null,
    "raiseAmountTips": "Tingkatkan limit pinjaman Anda hingga Rp500.000",
    "serviceAmount": null,
    "serviceProtocol": null,
    "serviceProtocolText": null
  }
}
```

- 🔄 **Yang diubah:** `businessResult` bernilai `0` dan `expireSeconds` bernilai positif (`300`).
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi sub-chaining API, layout elemen penawaran readdition di cell, sinkronisasi timer lokal, animasi bouncing telunjuk, dan delegasi pemanggilan popup `LoanAdditionPopView`.

---

### 🔴 Kasus E — Percabangan Ganti Kartu Bank

- 🎯 **Trigger / Kondisi:** `status == "TRANSACTION"` dan `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"`.
- 📱 **Expected Result:** Dialihkan ke `AmountChangeCardViewCell` (memiliki tombol ganti kartu).
- 👆 **Interaksi:** Bukan interaksi cell ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "TRANSACTION",
      "title": null,
      "amount": null,
      "buttonText": "Ganti Rekening Bank",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-tx-fail-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": "TRANSACTION_FAIL_CHANGE_BANK_CARD",
      "tipsContent": "Nomor rekening tidak valid.",
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

- 🔄 **Yang diubah:** `quotaInfo.extraStatus` diisi nilai gagal ganti kartu.
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan percabangan khusus di dalam switch `TRANSACTION`.

---

### 🔴 Kasus F — Circular Override

- 🎯 **Trigger / Kondisi:** Kondisi Kasus A terpenuhi, tetapi `circularCreditResp != null`.
- 📱 **Expected Result:** `IDAmountCycleLoanViewCell` yang terpilih.
- 👆 **Interaksi:** Bukan interaksi cell ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "REFUSE_COUNTDOWN",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pengajuan pinjaman Anda belum dapat disetujui saat ini.",
      "countDownTimeStamp": "86400",
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-refuse-cd-002",
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
    "circularCreditResp": {
      "availableAmount": "1000000",
      "btnText": "Lanjutkan",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "ACTIVE",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "100000",
      "nominalAmount": "1000000",
      "tips": null,
      "title": "Limit Fleksibel",
      "hideCut": null,
      "confirmStepStyle": null
    },
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** Objek `circularCreditResp` diisi.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi override circular credit.

---

## ✅ Verifikasi & Batasan

- [x] Selector status multi-cabang terbukti source di `IDLoanService.swift`.
- [x] Timer hitung mundur, pemetaan ikon status, dan setup gradient banner terbukti source di `IDAmountIconDescCountDownViewCell.swift`.
- [x] Seluruh fixture JSON terbukti valid secara sintaksis model Swift client.

