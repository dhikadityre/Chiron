# IDAmountButtonDescViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode langsung menjadi `IDLoanQuotaAreaModels`.
> `getCellListAry` memilih cell ini saat pengguna berada pada alur pinjaman tambahan (*add loan*), belum lunas (*unpaid*), atau jatuh tempo (*overdue*) tanpa alokasi limit virtual. Jika `circularCredit != nil`, switch ditimpa (*override*) menjadi `IDAmountCycleLoanViewCell`.
> 
> ℹ️ **Catatan Pemetaan Status Lainnya:**
> Status siklus order beranda (`INIT`, `REFUSE`, `FINISH`, `CANCEL`, `NO_ORDERS`, `UN_LOGIN`) **bukan** bagian dari cell ini karena cell ini tidak memiliki komponen label kuota nominal angka (`amountLabel`). Status-status tersebut secara tegas dipetakan oleh `IDLoanService.swift` ke `IDAmountNumberButtonViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Pinjaman Tambahan | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "EXECUTING_CREDIT_GRANTED_ADD_LOAN"`; `circularCreditResp == null` | Status pinjaman tambahan tanpa virtual quota | **Cell Target:** 2 baris deskripsi, ilustrasi kanan, tombol CTA. Exposure `Scene: "add"`, `Credit: "granted"` | Tap mengirim analitik `Apply_addloan_now_click` lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **B** — Belum Lunas (*Unpaid*) | Sama | `status == "UN_PAID"`; `circularCreditResp == null` | Status belum lunas | **Cell Target:** layout sama; exposure `Scene: "normal"`, `Credit: "disable"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa event `Apply_addloan_now_click` | Selector, binding, exposure, dan tap handler terbukti source |
| **C** — Jatuh Tempo (*Overdue*) | Sama | `status == "OVERDUE"`; `circularCreditResp == null` | Status keterlambatan bayar | **Cell Target:** layout sama; exposure `Scene: "normal"`, `Credit: "disable"` | Sama dengan kasus B | Selector, binding, exposure, dan tap handler terbukti source |
| **D** — CTA Kosong | Sama | Kondisi A; `buttonText == ""` | Teks tombol kosong | **Cell Target** tetap dipilih; judul tombol kosong. Guard exposure gagal | Handler tap tetap terpasang ke delegate | Guard exposure dan handler terbukti source |
| **E** — Circular Override | Sama | Kondisi A; `circularCreditResp != null` | Object circular ada | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler CTA cell target | Override terbukti source |
| **F** — Varian Virtual Quota | Sama | `status == "EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA"`; circular null | Status dengan varian virtual quota | `IDAmountNumberButtonDescViewCell`, bukan target | Bukan handler CTA cell target | Selector terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Source membuktikan endpoint `product/V4/mergeOrigin` dan pemetaan model response kuota dari `responseObject`. Fixture di bawah merupakan model fragment untuk validasi client, bukan jaminan bentuk HTTP envelope lengkap dari backend. Semua nilai mock mencerminkan tipe deklarasi Swift model.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`requstQueryQuotaArea`, `getCellListAry`)
> - Views: `IDLoanViews.swift` (`createTwoButtonDescCell`)
> - Cell Implementation: `IDAmountButtonDescViewCell.swift` (`updateData`, `applyAmountAction`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ descLabel1 (Judul Deskripsi)   ┌───┐ │  │
│  │                                │   │ │  │
│  │ descLabel2 (Subdeskripsi)      │img│ │  │  ← rightShareImage
│  │                                │   │ │  │    (ilustrasi)
│  │ ┌──────────────────────┐       └───┘ │  │
│  │ │     applyButton      │             │  │
│  │ └──────────────────────┘             │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu memiliki margin atas `20`, kiri/kanan `20` terhadap container. Background kartu berwarna putih dengan sudut melengkung `radius: 8.0` dan bayangan oranye halus.
- **Sisi Kiri:** Tumpukan vertikal teks `descLabel1` (offset top 32), `descLabel2` (jarak 12 dari label 1), dan tombol CTA `applyButton` (jarak 30 dari label 2, tinggi 38).
- **Sisi Kanan:** Ilustrasi `rightShareImage` menempel di pojok kanan atas dengan lebar 105 dan tinggi 182.

### Kategori Komponen Data
- **Deskripsi 1 (`descLabel1`):** API (`quotaInfo.descContent1`), font 14 semibold, warna teks `#222222` (`TextColor_Important`).
- **Deskripsi 2 (`descLabel2`):** API (`quotaInfo.descContent2`), font 14 medium, warna teks `#71584D`.
- **Tombol CTA (`applyButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan teks putih font Medium General.
- **Ilustrasi Kanan (`rightShareImage`):** Statis asset aplikasi (`R.image.loan_amount_share_illustration()`).

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan di `updateData` hanya jika `buttonText` tidak kosong dan `status` tersedia.
  - Untuk status `EXECUTING_CREDIT_GRANTED_ADD_LOAN`: parameter event adalah `["status": status, "Scene": "add", "Credit": "granted"]`.
  - Untuk status `UN_PAID` atau `OVERDUE`: parameter event adalah `["status": status, "Scene": "normal", "Credit": "disable"]`.
- **Tap CTA:** Aksi tombol dilindungi *throttle* 1000 ms:
  - Khusus status `EXECUTING_CREDIT_GRANTED_ADD_LOAN`, aplikasi mengirim event analitik `Apply_addloan_now_click`.
  - Selanjutnya memanggil `interactiveDelegate.requstJumpRouter(params: [:])`.
- *Catatan:* Memuat data selesai tidak otomatis memicu event tap atau router navigasi.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Pinjaman Tambahan (`EXECUTING_CREDIT_GRANTED_ADD_LOAN`)

- 🎯 **Trigger / Kondisi:** `status == "EXECUTING_CREDIT_GRANTED_ADD_LOAN"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil dengan dua baris deskripsi, ilustrasi share di kanan, dan tombol `Ajukan Sekarang`. Exposure tercatat dengan `Scene: "add"`, `Credit: "granted"`.
- 👆 **Interaksi:** Tap CTA mencatat event `Apply_addloan_now_click` lalu memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_ADD_LOAN",
      "title": null,
      "amount": null,
      "buttonText": "Ajukan Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-addloan-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Tersedia",
      "descContent2": "Ajukan pinjaman tambahan dengan proses kilat",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.buttonText`, `quotaInfo.descContent1`, `quotaInfo.descContent2`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji jalur pinjaman tambahan tanpa nominal limit di kartu, memvalidasi teks deskripsi 1 & 2 serta event exposure dan click spesifik `add`.

---

### 🟢 Kasus B — Belum Lunas (`UN_PAID`)

- 🎯 **Trigger / Kondisi:** `status == "UN_PAID"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil dengan teks penagihan/pengingat pembayaran. Exposure tercatat dengan `Scene: "normal"`, `Credit: "disable"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa event `Apply_addloan_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_PAID",
      "title": null,
      "amount": null,
      "buttonText": "Bayar Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-unpaid-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Menunggu Pembayaran",
      "descContent2": "Segera selesaikan pembayaran sebelum jatuh tempo",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `UN_PAID`, teks CTA disesuaikan.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi cabang status `UN_PAID` menggunakan cell yang sama tetapi dengan parameter exposure `Credit: "disable"` dan tanpa event tap khusus add-loan.

---

### 🟢 Kasus C — Jatuh Tempo (`OVERDUE`)

- 🎯 **Trigger / Kondisi:** `status == "OVERDUE"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil dengan copy peringatan keterlambatan. Exposure tercatat dengan `Scene: "normal"`, `Credit: "disable"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "OVERDUE",
      "title": null,
      "amount": null,
      "buttonText": "Selesaikan Pembayaran",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-overdue-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Tagihan Anda Telah Lewat Jatuh Tempo",
      "descContent2": "Hindari denda keterlambatan dengan membayar hari ini",
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

- 🔄 **Yang diubah:** `quotaInfo.status` menjadi `OVERDUE`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi status keterlambatan tetap diarahkan ke cell deskripsi ini jika tidak ada limit virtual.

---

### 🟡 Kasus D — Guard Exposure Gagal (`buttonText` Kosong)

- 🎯 **Trigger / Kondisi:** Status `EXECUTING_CREDIT_GRANTED_ADD_LOAN`, namun `buttonText == ""`.
- 📱 **Expected Result:** Cell target tetap terpilih. Tombol CTA tampil tanpa judul teks. Event exposure tidak dilaporkan.
- 👆 **Interaksi:** Tap tetap memanggil handler jika tombol disentuh.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_ADD_LOAN",
      "title": null,
      "amount": null,
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-addloan-002",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Tersedia",
      "descContent2": "Ajukan pinjaman tambahan dengan proses kilat",
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

- 🔄 **Yang diubah:** `quotaInfo.buttonText` diisi string kosong `""`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji guard `buttonText.isEmpty == false` pada fungsi `updateData` untuk memastikan analitik tidak dikirim jika judul tombol kosong.

---

### 🔴 Kasus E — Circular Credit Menimpa Cell Target

- 🎯 **Trigger / Kondisi:** Status memenuhi kriteria `EXECUTING_CREDIT_GRANTED_ADD_LOAN`, tetapi `circularCreditResp` terisi object.
- 📱 **Expected Result:** Layar memilih `IDAmountCycleLoanViewCell`, bukan cell target ini.
- 👆 **Interaksi:** Bukan interaksi cell ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_ADD_LOAN",
      "title": null,
      "amount": null,
      "buttonText": "Ajukan Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-addloan-003",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Tersedia",
      "descContent2": "Ajukan pinjaman tambahan dengan proses kilat",
      "needRefreshCircular": null
    },
    "repayInfo": null,
    "circularCreditResp": {
      "availableAmount": "2000000",
      "btnText": "Ambil Kuota",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "ACTIVE",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "500000",
      "nominalAmount": "2000000",
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

- 🔄 **Yang diubah:** Objek `circularCreditResp` diberikan data aktif.
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan bahwa pemeriksaan `dataModel.circularCredit != nil` di akhir `getCellListAry` selalu menimpa pilihan cell.

---

### 🔵 Kasus F — Varian Virtual Quota

- 🎯 **Trigger / Kondisi:** Status `EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA`.
- 📱 **Expected Result:** Sistem memilih `IDAmountNumberButtonDescViewCell` yang memiliki header estimasi limit virtual di atas deskripsi.
- 👆 **Interaksi:** Bukan interaksi cell ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA",
      "title": null,
      "amount": null,
      "buttonText": "Ajukan Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "5000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-addloan-004",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Estimasi limit pinjaman",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Tersedia",
      "descContent2": "Ajukan pinjaman tambahan dengan proses kilat",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke varian virtual quota.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi pemisahan rute antara kartu deskripsi murni dengan kartu deskripsi yang menyertakan nominal virtual quota.

---

## ✅ Verifikasi & Batasan

- [x] Selector status, field binding, exposure gate, dan tap action telah diverifikasi langsung ke source Swift production.
- [x] Seluruh JSON fixture adalah model fragment valid untuk pengujian client-side.
- [x] Logika navigasi runtime dan respons backend riil tidak diuji langsung.

