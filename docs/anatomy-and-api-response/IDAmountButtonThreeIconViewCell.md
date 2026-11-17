# IDAmountButtonThreeIconViewCell

> 💡 **Ringkasan Komponen:**
> `IDLoanService.requstQueryQuotaArea` memanggil endpoint `product/V4/mergeOrigin` dan mendekode `responseObject` langsung menjadi `IDLoanQuotaAreaModels`.
> `getCellListAry` memilih cell dari `quotaInfo.status`. Untuk status `EXECUTING_CREDIT_GRANTED`, cell ini dipilih jika `title ?? ""` **atau** `amount ?? ""` kosong. Jika keduanya terisi, selector memilih `IDAmountNumberButtonViewCell`. Setelah evaluasi switch, kondisi `circularCreditResp != nil` selalu menimpa (*override*) pilihan menjadi `IDAmountCycleLoanViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Target lewat `title` | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "EXECUTING_CREDIT_GRANTED"`; `(title ?? "") == ""`; `amount == "5000000"`; `circularCreditResp == null` | `title` null atau kosong | **Cell Target:** 3 ikon/label statis dan CTA; tidak ada nominal/title dari model pada cell ini | Jika delegate tersedia, tap CTA melaporkan klik lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, dan handler terbukti source |
| **B** — Target lewat `amount` | Sama | Status sama; `title == "Limit pinjaman"`; `(amount ?? "") == ""`; circular null | `amount` null atau kosong | **Cell Target:** layout sama dengan A | Sama dengan A | Selector, binding, dan handler terbukti source |
| **C** — CTA kosong | Sama | Kondisi A; `buttonText == ""` | Teks CTA kosong | **Cell Target** tetap dipilih; tombol tidak memiliki judul. Guard exposure gagal | Handler tap tetap terpasang; jika diketuk dan delegate tersedia, handler memanggil delegate | Guard dan handler terbukti source; tindakan tap perlu interaksi |
| **D** — Kedua field terisi | Sama | Status sama; `title` dan `amount` keduanya non-empty; circular null | Kedua field tidak kosong | `IDAmountNumberButtonViewCell`, bukan target | Tidak ada tap handler cell target | Selector terbukti source |
| **E** — Circular override | Sama | Kondisi A; `circularCreditResp` berisi object | Circular bukan null | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler CTA cell target | Override terbukti source; fixture hanya menguji cabang client |
| **F** — Status lain | Sama | `status == "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA"`; `circularCreditResp == null` | Status berbeda | `IDAmountNumberButtonThreeIconViewCell`, bukan target | Bukan handler CTA cell target | Selector terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Source membuktikan endpoint dan bentuk object yang langsung didekode, tetapi tidak membuktikan envelope HTTP lengkap atau keabsahan kombinasi data dari backend. Fixture berikut adalah model fragment yang meniru object decode, bukan sample response BE terobservasi. Semua field model yang relevan ditulis dengan tipe model; `hitDisplayAmountAb` adalah field luar dan disalin service ke quota model, bukan field wire di dalam `quotaInfo`.

> 📌 **Referensi Source Code:**
> - Path: `IDLoanInterfacePath.HomeRequstQuotaZone`
> - Service: `IDLoanService.requstQueryQuotaArea`, `getCellListAry`
> - Models: `IDLoanQuotaAreaModels`, `IDLoanAmountModel`
> - Views: `IDLoanViews.createButtonThreeIconCell`
> - Implementation: `IDAmountButtonThreeIconViewCell.updateData`, `applyAmountAction`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout constraints production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
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

- **Layout Container:** Kartu memiliki inset atas `20` dan samping `20`. Grup tiga ikon berada di atas CTA. Kartu memiliki sudut membulat (*corner radius*) dan bayangan (*shadow*).

### Kategori Komponen Data
- **Grup 3 Ikon:** Asset dan label statis:
  - **Ikon Kiri:** Asset `loan_group_icon_left` → Label: `Aman`
  - **Ikon Tengah:** Asset `loan_group_icon_middle` → Label: `Pencairan Cepat`
  - **Ikon Kanan:** Asset `loan_group_icon_right` → Label: `Bunga Rendah`
- **CTA:** Dinamis via API (`quotaInfo.buttonText` → `applyButton.setTitle(_:for:)`). Jika `buttonText` kosong, cell tidak menggantinya dengan fallback default.
- **Komponen Nominal/Title:** Cell ini **tidak memiliki** komponen nominal atau deskripsi API.

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dijalankan pada `updateData` hanya jika `buttonText` ada dan tidak kosong, serta `status` tersedia.
- **Nilai Parameter:** Nilai `status` berasal dari model; `Scene: "normal"` dan `Credit: "granted"` adalah nilai literal aplikasi.
- **Tap CTA:** Menjalankan `applyAmountAction` melalui *throttle* 1000 ms. Jika delegate tersedia, aplikasi mengirimkan analytics `Apply_addloan_now_click` lalu memanggil `requstJumpRouter(params: [:])`.
- *Catatan:* Response selesai dimuat tidak otomatis menjalankan event tap atau navigasi.

---

## 🧪 Fixture & Skenario Uji

> Field model yang digunakan: `quotaInfo`, `repayInfo`, `circularCreditResp`, `benefitSpeedUpSign`, `hitDisplayAmountAb`, `skipInfoPage`, dan `oneClickLoan` dari `IDLoanQuotaAreaModels`. Field opsional yang tidak relevan diisi `null` agar setiap model fragment independen.

---

### 🟢 Kasus A — Cell Target: `title` Kosong

- 🎯 **Trigger / Kondisi:** Kasus A pada matriks. Selector mengevaluasi `title ?? ""` bernilai kosong (`""`). Field `amount` yang terisi tidak mencegah cell target terpilih.
- 📱 **Expected Result:** Cell target tampil dengan tiga ikon dan label statis serta tombol bertuliskan `Ajukan Pinjaman`. Field `title` dan `amount` tidak dirender.
- 👆 **Interaksi:** Guard exposure lolos. Tap CTA memanggil delegate dengan `params: [:]`.
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
      "amount": "5000000",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.title`, `quotaInfo.amount`, dan `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Mengisolasi kondisi kiri dari OR selector (`title` kosong). `buttonText` non-empty memastikan lolos guard exposure.

---

### 🟢 Kasus B — Cell Target: `amount` Kosong

- 🎯 **Trigger / Kondisi:** Kasus B pada matriks. `title` terisi, tetapi `amount ?? ""` bernilai kosong.
- 📱 **Expected Result:** Cell target tampil. Konten visual tetap ikon statis dan CTA, bukan `title`/`amount`.
- 👆 **Interaksi:** Guard exposure lolos. Tap CTA memanggil delegate dengan `params: [:]`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED",
      "title": "Limit pinjaman",
      "amount": "",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
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

- 🔄 **Yang diubah:** Dibandingkan Kasus A, `quotaInfo.title` diisi non-empty dan `quotaInfo.amount` dikosongkan.
- 🎯 **Alasan / Hasil yang diuji:** Mengisolasi kondisi kanan dari OR selector (`amount` kosong). Teks tombol memastikan exposure guard lolos.

---

### 🟡 Kasus C — CTA Kosong: Exposure Tidak Dicatat

- 🎯 **Trigger / Kondisi:** Kasus C pada matriks. Selector tetap melihat `title` kosong dan memilih target. Nilai `buttonText == ""` membuat guard exposure gagal.
- 📱 **Expected Result:** Cell target tetap dipilih, namun tombol CTA tidak memiliki teks judul.
- 👆 **Interaksi:** Handler tap tetap aktif. Jika ditekan dan delegate tersedia, event klik tetap dilaporkan dan `requstJumpRouter(params: [:])` dipanggil.
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
      "amount": "5000000",
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
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

- 🔄 **Yang diubah:** Dibandingkan Kasus A, hanya `quotaInfo.buttonText` diubah menjadi string kosong (`""`).
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan bahwa selector cell tidak bergantung pada teks CTA, sedangkan tracker exposure mensyaratkan teks non-empty. UI tidak menyembunyikan tombol.

---

### 🔴 Kasus D — Kedua Field Terisi: Cell Target Tidak Dipilih

- 🎯 **Trigger / Kondisi:** Kasus D pada matriks. `title` dan `amount` keduanya terisi, sehingga selector masuk ke cabang `else` dan memilih `IDAmountNumberButtonViewCell`.
- 📱 **Expected Result:** Cell target ini tidak dirender.
- 👆 **Interaksi:** Tidak ada interaksi tap pada cell target.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED",
      "title": "Limit pinjaman",
      "amount": "5000000",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
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

- 🔄 **Yang diubah:** Dibandingkan Kasus A, `quotaInfo.title` dan `quotaInfo.amount` keduanya non-empty.
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan bahwa kedua field harus non-empty agar selector berpindah ke `IDAmountNumberButtonViewCell`.

---

### 🔴 Kasus E — Circular Credit Menimpa Cell Target

- 🎯 **Trigger / Kondisi:** Kasus E pada matriks. Status dan title memenuhi kriteria switch target, tetapi dievaluasi lanjut oleh `circularCreditResp != nil` yang menimpa hasil akhir.
- 📱 **Expected Result:** `IDAmountCycleLoanViewCell` yang tampil, bukan `IDAmountButtonThreeIconViewCell`.
- 👆 **Interaksi:** Tidak ada handler CTA cell target.
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
      "amount": "5000000",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
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

- 🔄 **Yang diubah:** Dibandingkan Kasus A, objek `circularCreditResp` diisi (bukan `null`).
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan override circular credit mengalahkan kriteria status dasar.

---

### 🔵 Kasus F — Status Lain: Neighboring Cell

- 🎯 **Trigger / Kondisi:** Kasus F pada matriks. Status `status == "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA"` memilih `IDAmountNumberButtonThreeIconViewCell` (circular tetap null).
- 📱 **Expected Result:** Cell tiga ikon dengan nominal di bagian atas, bukan target tanpa nominal.
- 👆 **Interaksi:** Bukan handler CTA cell target.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA",
      "title": "",
      "amount": "5000000",
      "buttonText": "Ajukan Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-001",
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

- 🔄 **Yang diubah:** Dibandingkan Kasus A, `quotaInfo.status` diubah menjadi `EXECUTING_CREDIT_GRANTED_VIRTUAL_QUOTA`.
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan pemisahan cabang status ke cell varian lain yang memiliki display nominal.

---

## ✅ Verifikasi & Batasan

- [x] Selector, decoder, field model, layout, exposure, dan CTA handler telah ditelusuri ke kode source production.
- [x] Semua fixture merupakan mock model fragment; tidak mengklaim validasi backend HTTP envelope riil.
- [x] JSON fixture telah diverifikasi valid secara sintaksis. Runtime app/UI tidak dijalankan.

