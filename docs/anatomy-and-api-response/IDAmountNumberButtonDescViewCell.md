# IDAmountNumberButtonDescViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode langsung menjadi `IDLoanQuotaAreaModels`.
> `getCellListAry` memilih cell ini saat pengguna memiliki kuota pinjaman tambahan (*add loan*), status belum lunas (*unpaid*), atau jatuh tempo (*overdue*) yang **disertai estimasi kuota virtual** pada header kartu. Jika `circularCredit != nil`, pilihan cell ditimpa menjadi `IDAmountCycleLoanViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Pinjaman Tambahan + Virtual Quota | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA"`; `circularCreditResp == null` | Status pinjaman tambahan dengan konfigurasi virtual quota | **Cell Target:** Header estimasi kuota virtual di atas kartu putih (deskripsi 1 & 2, tombol CTA, ilustrasi kanan). Exposure `Scene: "add"`, `Credit: "granted"` | Tap mengirim analitik `Apply_addloan_now_click` lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **B** — Belum Lunas + Virtual Quota | Sama | `status == "UN_PAID_VIRTUAL_QUOTA"`; `circularCreditResp == null` | Status belum lunas dengan kuota virtual | **Cell Target:** Layout sama; exposure `Scene: "normal"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa event `Apply_addloan_now_click` | Selector, binding, exposure, dan tap handler terbukti source |
| **C** — Jatuh Tempo + Virtual Quota | Sama | `status == "OVERDUE_VIRTUAL_QUOTA"`; `circularCreditResp == null` | Status keterlambatan dengan kuota virtual | **Cell Target:** Layout sama; exposure `Scene: "normal"` | Sama dengan kasus B | Selector, binding, exposure, dan tap handler terbukti source |
| **D** — CTA Kosong | Sama | Kondisi A; `buttonText == ""` | Judul tombol kosong | **Cell Target** tetap dipilih; teks tombol kosong. Guard exposure gagal | Handler tap tetap terpasang | Guard exposure dan handler terbukti source |
| **E** — Circular Override | Sama | Kondisi A; `circularCreditResp != null` | Object circular ada | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler CTA cell target | Override terbukti source |
| **F** — Varian Tanpa Virtual Quota | Sama | `status == "EXECUTING_CREDIT_GRANTED_ADD_LOAN"`; circular null | Status tanpa varian virtual quota | `IDAmountButtonDescViewCell`, bukan target | Bukan handler CTA cell target | Selector terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Source membuktikan endpoint `product/V4/mergeOrigin` dan parsing langsung ke `IDLoanQuotaAreaModels`. Nilai `displayAmount` diformat di client menggunakan pemisah ribuan titik (`toThousands(".")`). Fixture di bawah merupakan model fragment untuk keperluan pengujian UI/logic, bukan bukti format wire resmi backend.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`requstQueryQuotaArea`, `getCellListAry`)
> - Views: `IDLoanViews.swift` (`createNumberButtonDescCell`)
> - Cell Implementation: `IDAmountNumberButtonDescViewCell.swift` (`updateData`, `applyAmountAction`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ topDescLabel         topAmountLabel  │  │  ← topBgLabel (gradient cokelat)
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │  ← bottomBgLabel (kartu putih)
│  │ bottomDescLabel1              ┌───┐  │  │
│  │                               │   │  │  │
│  │ bottomDescLabel2              │img│  │  │  ← bottomRightShareImage
│  │                               │   │  │  │    (ilustrasi)
│  │ ┌──────────────────────┐      └───┘  │  │
│  │ │  bottomApplyButton   │             │  │
│  │ └──────────────────────┘             │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Struktur Kartu Ganda:** 
  - `topBgLabel`: Banner gradient horizontal warna cokelat (`BrownCardMaxBgColor` ke `BrownCardMinBgColor`) setinggi 65, memuat teks keterangan estimasi di kiri dan nominal terformat di kanan.
  - `bottomBgLabel`: Kartu putih di bawahnya (overlap top `-12` menumpuk di atas banner), memiliki border tipis oranye, memuat teks deskripsi, tombol CTA, dan gambar ilustrasi di kanan.

### Kategori Komponen Data
- **Deskripsi Kuota Virtual Atas (`topDescLabel`):** API (`quotaInfo.displayAmountVirtualText`), font Auxiliary warna putih.
- **Nominal Kuota Virtual Atas (`topAmountLabel`):** API + Transformasi tampilan (`quotaInfo.displayAmount?.cz.toThousands(".", minifractionDigits: 1, maximumFractionDigits: 2)`), font DINBold Middle warna putih.
- **Deskripsi 1 Bawah (`bottomDescLabel1`):** API (`quotaInfo.descContent1`), font 14 semibold, warna `#222222`.
- **Deskripsi 2 Bawah (`bottomDescLabel2`):** API (`quotaInfo.descContent2`), font 14 medium, warna `#71584D`.
- **Tombol CTA Bawah (`bottomApplyButton`):** API (`quotaInfo.buttonText`), tombol oranye tinggi 42 dengan teks putih font Medium General.
- **Ilustrasi Kanan (`bottomRightShareImage`):** Statis asset aplikasi (`R.image.loan_amount_share_illustration()`), ukuran 105x182.

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan di `updateData` jika `buttonText` tidak kosong dan `status` tersedia.
  - Untuk status `EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA`: parameter adalah `["status": status, "Scene": "add", "Credit": "granted"]`.
  - Untuk status lainnya (`UN_PAID_VIRTUAL_QUOTA`, `OVERDUE_VIRTUAL_QUOTA`): parameter adalah `["status": status, "Scene": "normal"]`.
- **Tap CTA:** Aksi tombol dilindungi *throttle* 1000 ms:
  - Khusus status `EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA`, mengirim event `Apply_addloan_now_click`.
  - Memanggil `interactiveDelegate.requstJumpRouter(params: [:])`.
- *Catatan:* Selesai memuat response tidak memicu tap otomatis.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Pinjaman Tambahan + Virtual Quota

- 🎯 **Trigger / Kondisi:** `status == "EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Header atas menampilkan estimasi limit virtual dan nominal `Rp 5.000.000`. Kartu bawah menampilkan deskripsi pinjaman tambahan dan CTA `Ajukan Sekarang`. Exposure tercatat dengan `Scene: "add"`, `Credit: "granted"`.
- 👆 **Interaksi:** Tap tombol CTA mencatat `Apply_addloan_now_click` lalu memanggil `requstJumpRouter(params: [:])`.
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
      "bizId": "biz-mock-vq-addloan-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Estimasi limit pinjaman",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Disetujui",
      "descContent2": "Ambil dana tambahan Anda sekarang juga",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.displayAmount`, `quotaInfo.displayAmountVirtualText`, `quotaInfo.descContent1`, `quotaInfo.descContent2`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji keberadaan komponen nominal virtual quota atas dan validasi format pemisah ribuan titik pada string angka.

---

### 🟢 Kasus B — Belum Lunas + Virtual Quota

- 🎯 **Trigger / Kondisi:** `status == "UN_PAID_VIRTUAL_QUOTA"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Header atas menampilkan estimasi limit virtual. Kartu bawah menampilkan teks status belum lunas. Exposure tercatat dengan `Scene: "normal"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil `requstJumpRouter(params: [:])` tanpa event `Apply_addloan_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_PAID_VIRTUAL_QUOTA",
      "title": null,
      "amount": null,
      "buttonText": "Bayar Tagihan",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "7500000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-vq-unpaid-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "7500000",
      "displayAmountVirtualText": "Limit yang akan tersedia kembali",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Tagihan Menunggu Pelunasan",
      "descContent2": "Lunasi pinjaman untuk mengaktifkan kembali limit",
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

- 🔄 **Yang diubah:** `quotaInfo.status` diubah menjadi `UN_PAID_VIRTUAL_QUOTA`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji parameter event analitik exposure yang hanya mengirimkan `Scene: "normal"` tanpa atribut `Credit`.

---

### 🟢 Kasus C — Jatuh Tempo + Virtual Quota

- 🎯 **Trigger / Kondisi:** `status == "OVERDUE_VIRTUAL_QUOTA"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Header virtual quota tetap tampil bersama kartu peringatan keterlambatan. Exposure tercatat dengan `Scene: "normal"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "OVERDUE_VIRTUAL_QUOTA",
      "title": null,
      "amount": null,
      "buttonText": "Bayar Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "10000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-vq-overdue-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "10000000",
      "displayAmountVirtualText": "Limit yang tertahan",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Telah Jatuh Tempo",
      "descContent2": "Segera selesaikan tagihan untuk memulihkan status",
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

- 🔄 **Yang diubah:** `quotaInfo.status` diubah menjadi `OVERDUE_VIRTUAL_QUOTA`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi cabang keterlambatan dengan limit virtual.

---

### 🟡 Kasus D — Guard Exposure Gagal (`buttonText` Kosong)

- 🎯 **Trigger / Kondisi:** Status `EXECUTING_CREDIT_GRANTED_ADD_LOAN_VIRTUAL_QUOTA`, tetapi `buttonText == ""`.
- 📱 **Expected Result:** Cell target tetap terpilih. Tombol CTA tidak memiliki teks judul. Guard exposure gagal.
- 👆 **Interaksi:** Handler tap tetap aktif jika tombol ditekan.
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
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "5000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-vq-addloan-002",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Estimasi limit pinjaman",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Disetujui",
      "descContent2": "Ambil dana tambahan Anda sekarang juga",
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
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan guard exposure mensyaratkan teks tombol tidak kosong.

---

### 🔴 Kasus E — Circular Credit Menimpa Cell Target

- 🎯 **Trigger / Kondisi:** Status memenuhi kriteria virtual quota, tetapi `circularCreditResp != null`.
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
      "bizId": "biz-mock-vq-addloan-003",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Estimasi limit pinjaman",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": "Pinjaman Tambahan Disetujui",
      "descContent2": "Ambil dana tambahan Anda sekarang juga",
      "needRefreshCircular": null
    },
    "repayInfo": null,
    "circularCreditResp": {
      "availableAmount": "3000000",
      "btnText": "Lanjutkan",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "ACTIVE",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "500000",
      "nominalAmount": "3000000",
      "tips": null,
      "title": "Kredit Siklus",
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
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan override circular credit mengabaikan switch status virtual quota.

---

### 🔵 Kasus F — Varian Tanpa Virtual Quota

- 🎯 **Trigger / Kondisi:** Status `EXECUTING_CREDIT_GRANTED_ADD_LOAN` (tanpa `_VIRTUAL_QUOTA`).
- 📱 **Expected Result:** Sistem memilih `IDAmountButtonDescViewCell` yang tidak memiliki header banner estimasi limit atas.
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
      "bizId": "biz-mock-vq-addloan-004",
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

- 🔄 **Yang diubah:** `quotaInfo.status` diubah ke versi tanpa virtual quota.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi bahwa penghilangan suffix `_VIRTUAL_QUOTA` mengembalikan routing ke `IDAmountButtonDescViewCell`.

---

## ✅ Verifikasi & Batasan

- [x] Selector status, field binding, exposure gate, dan tap action telah diverifikasi langsung ke source Swift production.
- [x] Seluruh JSON fixture adalah model fragment valid untuk pengujian client-side.
- [x] Logika navigasi runtime dan respons backend riil tidak diuji langsung.

