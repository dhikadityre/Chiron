# AmountChangeCardViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode menjadi `IDLoanQuotaAreaModels`.
> `getCellListAry` memilih cell ini saat transaksi pencairan pinjaman mengalami kendala transfer rekening bank penerima (`status == "TRANSACTION"` dan `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"`), sehingga pengguna diminta mengganti kartu bank tujuan pencairan. Jika `circularCredit != nil`, pilihan cell ditimpa menjadi `IDAmountCycleLoanViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Target Ganti Kartu Bank | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "TRANSACTION"`; `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"`; `circularCreditResp == null` | Status transaksi dengan instruksi ganti kartu bank | **Cell Target:** Ikon kartu gagal, teks tips dari API, tombol ganti kartu. Exposure `homepage_disbursement_bankcard_failed` | Tap mengirim analitik `homepage_disbursement_bankcard_clk` lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **B** — Target dengan Timer Countdown | Sama | Kondisi A; `countDownTimeStamp == "3600"` | Timestamp numerik valid | **Cell Target:** Di ujung teks `descLabel` ditambahkan hitung mundur waktu berwarna oranye (`#FF7041`) | Saat timer habis, cell memanggil `weakDelegate.countDownFinish()` | Timer logic dan delegate call terbukti source |
| **C** — Transaksi Normal (Bukan Ganti Kartu) | Sama | `status == "TRANSACTION"`; `extraStatus != "TRANSACTION_FAIL_CHANGE_BANK_CARD"` | Tanpa extraStatus ganti kartu | `IDAmountIconDescCountDownViewCell`, bukan target | Bukan handler cell target | Selector terbukti source |
| **D** — Circular Override | Sama | Kondisi A; `circularCreditResp != null` | Object circular terisi | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler cell target | Override terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Source membuktikan percabangan ganda di dalam status `TRANSACTION` berdasarkan nilai exact `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"`. Fixture di bawah merupakan model fragment client, bukan sampel HTTP payload resmi server.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`getCellListAry`)
> - Views: `IDLoanViews.swift` (`createChangeCardDataCell`)
> - Cell Implementation: `AmountChangeCardViewCell.swift` (`updateData`, `onAction`, `startCountDown`, `updateDescLabelWithCountdown`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │               ┌─────────┐            │  │
│  │               │ [icon]  │            │  │  ← iconImageView
│  │               └─────────┘            │  │    (loan_amount_change_card)
│  │                                      │  │
│  │       descLabel (Keterangan +        │  │
│  │            Countdown)                │  │
│  │                                      │  │
│  │       ┌──────────────────────┐       │  │
│  │       │     actionButton     │       │  │
│  │       └──────────────────────┘       │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar belakang putih dengan sudut membulat `radius: 8.0` dan bayangan oranye. Inset atas, kiri, dan kanan bernilai `20`.
- **Tata Letak Elemen:**
  - `iconImageView`: Berada di tengah atas dengan ukuran `198 x 106`, menampilkan gambar kegagalan transfer bank.
  - `descLabel`: Berada di bawah ikon dengan margin kiri/kanan `32`, teks rata tengah.
  - `actionButton`: Tombol oranye di bawah teks keterangan dengan tinggi `36` dan margin samping `32`.

### Kategori Komponen Data
- **Ikon Status (`iconImageView`):** Statis/Logic (`R.image.loan_amount_change_card()`), dipasang jika `status == "TRANSACTION"` dan `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"`.
- **Keterangan & Countdown (`descLabel`):** API + Logic tampilan:
  - Teks dasar dari `quotaInfo.tipsContent`, font 14 medium, warna `#222222`.
  - Jika `countDownTimeStamp` tersedia dan berupa angka, teks waktu ditambahkan di akhir dengan warna oranye `#FF7041`.
- **Tombol Aksi (`actionButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan font Medium General teks putih.

### Logika Exposure & Tap
- **Exposure Event:** Mengirim event analitik realtime `homepage_disbursement_bankcard_failed` saat `updateData` mendeteksi kondisi ganti kartu bank.
- **Tap CTA:**
  - Mengirim analitik `homepage_disbursement_bankcard_clk` dengan detail `clk`.
  - Memanggil `interactiveDelegate.requstJumpRouter(params: [:])`.
- **Countdown Selesai:** Ketika timer mencapai 0, `weakDelegate.countDownFinish()` dipicu secara otomatis.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Target Ganti Kartu Bank (Tanpa Countdown)

- 🎯 **Trigger / Kondisi:** `status == "TRANSACTION"` dan `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"`.
- 📱 **Expected Result:** Cell target tampil menampilkan ilustrasi kartu gagal, teks petunjuk dari `tipsContent`, dan tombol CTA `Ganti Rekening Bank`.
- 👆 **Interaksi:** Tap CTA mencatat event `homepage_disbursement_bankcard_clk` lalu membuka router navigasi.
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
      "bizId": "biz-mock-bankcard-fail-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": "TRANSACTION_FAIL_CHANGE_BANK_CARD",
      "tipsContent": "Pencairan dana terkendala karena nomor rekening tidak sesuai. Silakan ubah rekening bank Anda.",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.extraStatus`, `quotaInfo.tipsContent`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji pemilihan cell khusus ganti kartu bank saat transaksi pencairan gagal di sisi rekening.

---

### 🟢 Kasus B — Target dengan Timer Countdown Aktif

- 🎯 **Trigger / Kondisi:** Kondisi sama dengan Kasus A, ditambah `countDownTimeStamp == "1800"` (30 menit).
- 📱 **Expected Result:** Teks `descLabel` menampilkan kalimat `tipsContent` diikuti string waktu hitung mundur (misal `00:29:59.`) dengan format warna oranye `#FF7041`.
- 👆 **Interaksi:** Saat hitungan mundur habis, memicu callback `countDownFinish()`.
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
      "countDownTimeStamp": "1800",
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-bankcard-fail-002",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": "TRANSACTION_FAIL_CHANGE_BANK_CARD",
      "tipsContent": "Batas waktu penggantian rekening bank:",
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

- 🔄 **Yang diubah:** `quotaInfo.countDownTimeStamp` disetel ke string nilai detik `"1800"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi mekanisme timer `startCountDown`, penambahan atribut teks warna oranye pada label, serta pemanggilan `countDownFinish`.

---

### 🔴 Kasus C — Transaksi Pencairan Normal

- 🎯 **Trigger / Kondisi:** `status == "TRANSACTION"`, tetapi `extraStatus` bernilai `null` atau bukan `TRANSACTION_FAIL_CHANGE_BANK_CARD`.
- 📱 **Expected Result:** Menampilkan `IDAmountIconDescCountDownViewCell` (pencairan sedang diproses), bukan cell ganti kartu.
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
      "buttonText": "Lihat Status",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Dana pinjaman sedang ditransfer ke rekening Anda",
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-bankcard-normal-001",
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

- 🔄 **Yang diubah:** `quotaInfo.extraStatus` dikosongkan (`null`).
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan bahwa status `TRANSACTION` tanpa sub-status ganti kartu akan dialihkan ke `IDAmountIconDescCountDownViewCell`.

---

### 🔴 Kasus D — Circular Credit Menimpa Cell Target

- 🎯 **Trigger / Kondisi:** Kondisi Kasus A terpenuhi, namun `circularCreditResp != null`.
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
      "bizId": "biz-mock-bankcard-fail-003",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": null,
      "displayAmountVirtualText": null,
      "extraStatus": "TRANSACTION_FAIL_CHANGE_BANK_CARD",
      "tipsContent": "Nomor rekening tidak sesuai.",
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
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan prioritas override circular credit terhadap seluruh cabang switch.

---

## ✅ Verifikasi & Batasan

- [x] Selector `status == "TRANSACTION"` dan `extraStatus == "TRANSACTION_FAIL_CHANGE_BANK_CARD"` diverifikasi langsung pada `IDLoanService.swift`.
- [x] Perhitungan timer dan pewarnaan string countdown diverifikasi pada `AmountChangeCardViewCell.swift`.
- [x] Seluruh fixture JSON valid secara sintaksis dan sesuai model Swift client.

