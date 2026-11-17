# IDAmountNumberButtonThreeIconViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin`. `IDLoanService.requstQueryQuotaArea` mendekode object response menjadi `IDLoanQuotaAreaModels`, lalu memasukkan `quotaInfo` dan `circularCreditResp` ke model home.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Kondisi Selector | Hasil | Tap / Efek |
|---|---|---|---|
| **A** — Cell Target | `status == "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA"` dan `circularCreditResp == null` | `IDAmountNumberButtonThreeIconViewCell` | Tap CTA meneruskan `params: [:]` ke delegate. |
| **B** — Guard Exposure Gagal | Sama dengan A, tetapi `buttonText == ""` | Cell tetap tampil; teks CTA kosong | Exposure tidak dicatat. Tap tetap terhubung ke delegate. |
| **C** — Circular Override | Status sama dengan A, tetapi `circularCreditResp != null` | Pemilihan ditimpa menjadi `IDAmountCycleLoanViewCell` | Bukan interaksi cell target. |
| **D** — Status Mirip | `status == "EXECUTING_CREDIT_GRANTED"`, `title == ""`, `amount == ""` | `IDAmountButtonThreeIconViewCell`, bukan cell target | Bukan interaksi cell target. Bila `title` dan `amount` keduanya tidak kosong, selector memilih `IDAmountNumberButtonViewCell`. |

> 📌 **Referensi Source Code:**
> - `IDLoanService.swift` (`requstQueryQuotaArea`, `getCellListAry`)
> - `IDLoanViews.swift` (`createNumberButtonThreeIconCell`)
> - `IDAmountNumberButtonThreeIconViewCell.swift` (`updateData`, `applyAmountAction`)

> ⚠️ **Catatan Kontrak (Contract Boundary):**
> Model response kuota didekode langsung dari `responseObject`, tetapi wrapper transport lengkap tidak dibuktikan source. Fixture di bawah merupakan model fragment, bukan klaim bentuk HTTP response lengkap. `hitDisplayAmountAb` adalah field luar yang disalin service ke quota model; jangan kirim sebagai field `quotaInfo` dari wire. Kombinasi mock bukan bukti backend menerima atau mengirim nilai tersebut.

---

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ Deskripsi virtual   Nominal          │  │  ← gradient atas
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │   [icon]       [icon]       [icon]   │  │
│  │    Aman     Pencairan Cepat Bunga Rendah│ │
│  │                                      │  │
│  │       ┌──────────────────────┐       │  │
│  │       │        CTA           │       │  │
│  │       └──────────────────────┘       │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- Bagian kartu bawah sedikit tumpang-tindih dengan gradient atas. Tiga ikon disusun kiri–tengah–kanan; CTA berada di bawah grup ikon.

### Kategori Value
- **Deskripsi virtual:** API.
- **Nominal:** API + transformasi format angka.
- **CTA:** API.
- **Grup 3 ikon:** Asset dan label statis dari aplikasi.

### Isi Kartu
Urutan mengikuti preview:
- **Deskripsi virtual:** `quotaInfo.displayAmountVirtualText` → `topDescLabel.text`.
- **Nominal:** `quotaInfo.displayAmount` → `toThousands(".", minifractionDigits: 1, maximumFractionDigits: 2)` → `topAmountLabel.text`.
- **Grup 3 ikon:**
  - **Ikon kiri:** Asset `loan_group_icon_left` → Label statis `Aman`.
  - **Ikon tengah:** Asset `loan_group_icon_middle` → Label statis `Pencairan Cepat`.
  - **Ikon kanan:** Asset `loan_group_icon_right` → Label statis `Bunga Rendah`.
- **CTA:** `quotaInfo.buttonText` → Judul `applyButton`.

### Exposure dan Tap
- Exposure dilaporkan saat `updateData`, bila `buttonText` tidak kosong dan `status` tersedia.
- Event mengirim `status` dari model. `Scene: "normal"` dan `Credit: "granted"` adalah literal aplikasi.
- Tap CTA menjalankan `requstJumpRouter(params: [:])` melalui delegate.
- Memuat response bukan tap dan tidak otomatis menjalankan navigasi.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Cell Target Tampil

- 🎯 **Trigger / Kondisi:** `status == "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target menampilkan deskripsi, nominal terformat, dan CTA. Tiga label ikon statis.
- 👆 **Interaksi:** Tap CTA meneruskan `params: [:]`; guard exposure terpenuhi.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA",
      "title": "Limit pinjaman",
      "amount": "5000000",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "5000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Limit pinjaman tersedia",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": "0"
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

- 🔄 **Yang diubah:** `status`, `circularCreditResp`, `displayAmountVirtualText`, `displayAmount`, `buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Status dan nilai circular memilih cell target; tiga field tampilan mengisi konten, serta guard exposure terpenuhi.

---

### 🟡 Kasus B — Cell Target, Exposure Tidak Dicatat

- 🎯 **Trigger / Kondisi:** Sama dengan A, tetapi `buttonText == ""`.
- 📱 **Expected Result:** Cell target tetap dipilih; CTA memiliki judul kosong.
- 👆 **Interaksi:** Tap tetap masuk ke handler tombol. Exposure tidak dicatat.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA",
      "title": "Limit pinjaman",
      "amount": "5000000",
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "5000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Limit pinjaman tersedia",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": "0"
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

- 🔄 **Yang diubah:** `quotaInfo.buttonText` menjadi string kosong.
- 🎯 **Alasan / Hasil yang diuji:** Selector tidak bergantung pada teks tombol; guard exposure membutuhkan teks tidak kosong.

---

### 🔴 Kasus C — Circular Credit Menimpa Pemilihan Cell

- 🎯 **Trigger / Kondisi:** Status sama dengan A, tetapi `circularCreditResp` berisi object.
- 📱 **Expected Result:** Service memilih `IDAmountCycleLoanViewCell`, bukan cell target.
- 👆 **Interaksi:** Tidak ada tap handler cell target dalam kasus ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA",
      "title": "Limit pinjaman",
      "amount": "5000000",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "5000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Limit pinjaman tersedia",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": "0"
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
      "title": "Kredit sirkular",
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

- 🔄 **Yang diubah:** `circularCreditResp` dari `null` menjadi object.
- 🎯 **Alasan / Hasil yang diuji:** Keberadaan circular credit menimpa hasil switch status dan memilih cell siklus.

---

### 🔵 Kasus D — Status Mirip, Cell Berbeda

- 🎯 **Trigger / Kondisi:** `status == "EXECUTING_CREDIT_GRANTED"`, `title == ""`, `amount == ""`.
- 📱 **Expected Result:** `IDAmountButtonThreeIconViewCell`, bukan cell target.
- 👆 **Interaksi:** Tidak ada tap handler cell target dalam kasus ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED",
      "title": "",
      "amount": "",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "5000000",
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "5000000",
      "displayAmountVirtualText": "Limit pinjaman tersedia",
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": "0"
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

- 🔄 **Yang diubah:** `status`, `title`, `amount`.
- 🎯 **Alasan / Hasil yang diuji:** Status ini memakai cell alternatif saat `title` atau `amount` kosong; tidak memilih cell target.

---

## ✅ Verifikasi & Batasan

- [x] JSON fixtures diparse dan dicek terhadap key serta tipe model.
- [x] Anatomy dicocokkan dengan view hierarchy, constraints, `updateData`, dan selector production.
- [x] Envelope transport, penerimaan BE, dan tampilan runtime tidak diverifikasi.
