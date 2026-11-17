# IDAmountIconDescButtonViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode langsung menjadi `IDLoanQuotaAreaModels`.
> `getCellListAry` memilih cell ini untuk tahapan proses pengguna yang membutuhkan tombol aksi tanpa komponen nominal angka (seperti peninjauan manual pinjaman, tanda tangan digital Privy, pengajuan ulang pinjaman yang ditolak, atau tahapan pendaftaran tanpa pesanan aktif). Jika `circularCredit != nil`, pilihan cell ditimpa menjadi `IDAmountCycleLoanViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Tanda Tangan Digital | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "DIGISIGN_SIGN"`; `circularCreditResp == null` | Menunggu tanda tangan digital | **Cell Target:** Ikon Privy (`loan_amount_icon_digisign`), teks deskripsi, tombol tanda tangan. Exposure `Scene: "normal"`, `Credit: "granted"` | Tap mengirim analitik `Privy_sign_click` lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **B** — Pengajuan Ulang (*Recall*) | Sama | `status == "REFUSE_RECALL"`; `circularCreditResp == null` | Penolakan dengan alur *recall* | **Cell Target:** Ikon recall (`loan_rejected_tiny_flow_recall`), deskripsi, tombol ajukan lagi. Exposure `Credit: "not_granted"` + realtime view `homeRejectedReloan` | Tap mengirim analitik `homeRejectedReloanButtom` detail `Reloan` lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **C** — Peninjauan Manual | Sama | `status == "EXECUTING_UNDER_VIEW"`; `circularCreditResp == null` | Peninjauan manual | **Cell Target:** Ikon review (`loan_amount_icon_reloan_review`), tombol CTA. Exposure `Credit: "not_granted"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa analitik klik khusus | Selector, binding, exposure, dan tap handler terbukti source |
| **D** — Tahapan Tanpa Pesanan | Sama | `status == "NO_ORDERS_STEP"`; `circularCreditResp == null` | Tahapan awal tanpa pesanan | **Cell Target:** Ikon dropout (`loan_amount_icon_dropout`), tombol CTA. Exposure `Credit: "not_granted"` | Sama dengan kasus C | Selector, binding, exposure, dan tap handler terbukti source |
| **E** — CTA Kosong | Sama | Kondisi A; `buttonText == ""` | Teks tombol kosong | **Cell Target** tetap dipilih; judul tombol kosong. Guard exposure gagal | Handler tap tetap terpasang | Guard exposure dan handler terbukti source |
| **F** — Circular Override | Sama | Kondisi A; `circularCreditResp != null` | Object circular terisi | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler cell target | Override terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Source membuktikan bahwa ikon dipilih berdasarkan mapping nilai `status` pada fungsi `updateData`. Teks deskripsi diambil langsung dari field `descContent`. Fixture di bawah merupakan model fragment client, bukan sampel HTTP payload resmi server.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`getCellListAry`)
> - Views: `IDLoanViews.swift` (`createAmountIconDescButtonCell`)
> - Cell Implementation: `IDAmountIconDescButtonViewCell.swift` (`updateData`, `clickInjectPoints`, `applyButton`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │               ┌─────────┐            │  │
│  │               │ [icon]  │            │  │  ← iconImageView (ikon status dinamis)
│  │               └─────────┘            │  │
│  │                                      │  │
│  │           descLabel (Teks            │  │  ← descLabel
│  │             Keterangan)              │  │
│  │                                      │  │
│  │       ┌──────────────────────┐       │  │
│  │       │     applyButton      │       │  │  ← applyButton
│  │       └──────────────────────┘       │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar belakang putih dengan sudut membulat `radius: 8.0` dan bayangan oranye halus. Margin atas, kiri, dan kanan bernilai `20`.
- **Tata Letak Elemen:**
  - `iconImageView`: Ditampilkan di bagian tengah atas kartu dengan ukuran `198 x 106`. Gambar ikon berubah dinamis berdasarkan nilai `status`.
  - `descLabel`: Berada di bawah ikon dengan margin kiri/kanan `32`, teks rata tengah dengan font Medium General warna `#222222`.
  - `applyButton`: Tombol oranye di bawah teks keterangan dengan tinggi `34` dan margin samping `32`.

### Kategori Komponen Data
- **Ikon Status (`iconImageView`):** Statis/Logic (pemetaan asset aplikasi berdasarkan nilai `status`):
  - `DIGISIGN_SIGN` → `R.image.loan_amount_icon_digisign()`
  - `REFUSE_RECALL` → `R.image.loan_rejected_tiny_flow_recall()`
  - `EXECUTING_UNDER_VIEW` → `R.image.loan_amount_icon_reloan_review()`
  - `NO_ORDERS_STEP` → `R.image.loan_amount_icon_dropout()`
- **Keterangan Status (`descLabel`):** API (`quotaInfo.descContent`), font Medium General, teks rata tengah warna `#222222`.
- **Tombol Aksi (`applyButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan teks putih font Medium General.

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan di `updateData` jika `buttonText` tidak kosong dan `status` tersedia:
  - `DIGISIGN_SIGN`: `["status": status, "Scene": "normal", "Credit": "granted"]`.
  - `REFUSE_RECALL`, `EXECUTING_UNDER_VIEW`, `NO_ORDERS_STEP`: `["status": status, "Scene": "normal", "Credit": "not_granted"]`.
  - Khusus `REFUSE_RECALL`: memicu event realtime tambahan `IDCustomEventHomeKey.homeRejectedReloan`.
- **Tap CTA:** Aksi tombol dilindungi *throttle* 1000 ms:
  - Jika `status == "DIGISIGN_SIGN"`, mencatat analitik `Privy_sign_click`.
  - Jika `status == "REFUSE_RECALL"`, mencatat analitik `homeRejectedReloanButtom` dengan parameter `Reloan`.
  - Memanggil `interactiveDelegate.requstJumpRouter(params: [:])`.
- *Catatan:* Selesai memuat response tidak memicu aksi tap otomatis.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Tanda Tangan Digital (`DIGISIGN_SIGN`)

- 🎯 **Trigger / Kondisi:** `status == "DIGISIGN_SIGN"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Menampilkan ilustrasi Privy, teks petunjuk tanda tangan elektronik, dan tombol `Tanda Tangani`. Exposure tercatat dengan `Scene: "normal"`, `Credit: "granted"`.
- 👆 **Interaksi:** Tap CTA mencatat event `Privy_sign_click` lalu memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "DIGISIGN_SIGN",
      "title": null,
      "amount": null,
      "buttonText": "Tanda Tangani",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Silakan selesaikan tanda tangan elektronik untuk pencairan pinjaman Anda.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-digisign-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.descContent`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji alur penandatanganan Privy, verifikasi pemilihan aset `loan_amount_icon_digisign` dan analitik klik `Privy_sign_click`.

---

### 🟢 Kasus B — Pengajuan Ulang (*Recall* Penolakan)

- 🎯 **Trigger / Kondisi:** `status == "REFUSE_RECALL"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Menampilkan ikon recall penolakan, teks peluang pengajuan ulang, dan tombol `Ajukan Ulang`. Memicu exposure ganda (`home_apply` dan `homeRejectedReloan`).
- 👆 **Interaksi:** Tap CTA mencatat event `homeRejectedReloanButtom` lalu memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "REFUSE_RECALL",
      "title": null,
      "amount": null,
      "buttonText": "Ajukan Ulang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pengajuan sebelumnya belum berhasil. Anda dapat mengajukan permohonan baru sekarang.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-recall-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `REFUSE_RECALL`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji pemilihan ikon `loan_rejected_tiny_flow_recall`, analitik view `homeRejectedReloan`, dan analitik tombol `homeRejectedReloanButtom`.

---

### 🟢 Kasus C — Peninjauan Manual (`EXECUTING_UNDER_VIEW`)

- 🎯 **Trigger / Kondisi:** `status == "EXECUTING_UNDER_VIEW"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Menampilkan ikon review manual (`loan_amount_icon_reloan_review`), teks evaluasi analis, dan tombol CTA. Exposure tercatat dengan `Credit: "not_granted"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa analitik klik khusus.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_UNDER_VIEW",
      "title": null,
      "amount": null,
      "buttonText": "Lihat Progres",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pengajuan Anda sedang ditinjau secara manual oleh tim kami.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-underview-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status` diubah menjadi `EXECUTING_UNDER_VIEW`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji verifikasi icon review dan parameter exposure tanpa event click khusus.

---

### 🟢 Kasus D — Tahapan Tanpa Pesanan (`NO_ORDERS_STEP`)

- 🎯 **Trigger / Kondisi:** `status == "NO_ORDERS_STEP"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Menampilkan ikon dropout (`loan_amount_icon_dropout`), teks instruksi langkah pengajuan, dan tombol CTA.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "NO_ORDERS_STEP",
      "title": null,
      "amount": null,
      "buttonText": "Lanjutkan Pendaftaran",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Selesaikan langkah pengisian data untuk mengaktifkan limit pinjaman.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-step-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status` diubah menjadi `NO_ORDERS_STEP`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji ikon `loan_amount_icon_dropout` untuk pengguna pada tahapan pendaftaran.

---

### 🟡 Kasus E — Guard Exposure Gagal (`buttonText` Kosong)

- 🎯 **Trigger / Kondisi:** Status `DIGISIGN_SIGN`, tetapi `buttonText == ""`.
- 📱 **Expected Result:** Cell target tetap dipilih, tombol CTA tampil tanpa judul teks. Guard exposure gagal.
- 👆 **Interaksi:** Handler tap tetap aktif jika tombol ditekan.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "DIGISIGN_SIGN",
      "title": null,
      "amount": null,
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Silakan selesaikan tanda tangan elektronik.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-digisign-002",
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

- 🔄 **Yang diubah:** `quotaInfo.buttonText` diisi string kosong `""`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi guard `buttonText.isEmpty == false` pada fungsi `updateData`.

---

### 🔴 Kasus F — Circular Credit Menimpa Cell Target

- 🎯 **Trigger / Kondisi:** Status memenuhi kriteria switch, namun `circularCreditResp != null`.
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
      "status": "DIGISIGN_SIGN",
      "title": null,
      "amount": null,
      "buttonText": "Tanda Tangani",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Silakan selesaikan tanda tangan elektronik.",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-digisign-003",
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
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi prioritas tertinggi override circular credit.

---

## ✅ Verifikasi & Batasan

- [x] Pemetaan `status` ke aset ikon dan event injection (`clickInjectPoints`) diverifikasi langsung pada `IDAmountIconDescButtonViewCell.swift`.
- [x] Selector cabang status di `IDLoanService.swift` terbukti source.
- [x] Seluruh fixture JSON terbukti valid dan mematuhi format model Swift.

