# IDAmountTwoNumberButtonDateViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu kuota ganda (*double-digit amount card*) yang menggabungkan banner estimasi limit virtual di bagian atas kartu dengan informasi pinjaman berjalan beserta tanggal jatuh tempo (`dueDate`) di kartu utama bagian bawah.
> Endpoint terkait: `product/V4/mergeOrigin` (`IDLoanQuotaAreaModels`).
> Dikhususkan untuk akun yang memiliki tagihan belum lunas atau pinjaman tambahan yang belum jatuh tempo, namun telah dialokasikan estimasi batas limit pinjaman virtual tambahan.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Kuota Ganda & Tanggal Jatuh Tempo | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `displayAmount != null`; `amount != null`; `dueDate != null` | Banner estimasi limit cokelat di atas + tanggal jatuh tempo di bawah | **Cell Target:** Header gradien cokelat (estimasi limit), kartu putih (tagihan berjalan & tanggal jatuh tempo), tombol CTA. Exposure `home_apply` (`Scene: "normal"`) | Tap mengirim router `requstJumpRouter(params: [:])` via throttle 1000 ms | Hierarki dua kartu, pemformatan nominal ganda, dan tap handler terbukti source |
| **B** — Tombol CTA Kosong | Sama | Kondisi A; `buttonText == ""` atau `null` | Judul tombol CTA kosong | **Cell Target** tetap aktif; teks tombol kosong; event exposure di-guard | Handler tap tetap terpasang | Guard exposure dan binding terbukti source |
| **C** — Format Estimasi Desimal | Sama | `displayAmount == "50000000"` | Angka estimasi limit puluhan juta | **Cell Target:** `topAmountLabel` diformat menjadi `"50.000.000"` | Efek tap sama dengan kasus A | Formatter `toThousands` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari endpoint `product/V4/mergeOrigin`. Banner atas mengonsumsi `displayAmountVirtualText` dan `displayAmount`, sementara bagian kartu utama mengonsumsi `title`, `amount`, `descContent`, dan `dueDate`. Keduanya diformat menggunakan pemisah ribuan titik (`.`).

> 📌 **Referensi Source Code:**
> - Views: `IDLoanViews.swift` (baris 121: `register`, baris 220: `cellForRowAt`, baris 455: `createTwoNumberButtonDateCell`)
> - Cell Implementation: `IDAmountTwoNumberButtonDateViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `applyAmountAction`)
> - Model: `IDLoanAmountModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ ┌──────────────────────────────────┐ │  │  ← topBgLabel (Brown Gradient)
│  │ │ topDescLabel       topAmountLabel│ │  │    (tinggi 65 pt, radius 6.0)
│  │ └──────────────────────────────────┘ │  │
│  │ ┌──────────────────────────────────┐ │  │  ← bottomBgLabel (White Card)
│  │ │ titleLabel                 ┌───┐ │ │  │    (offset -12 pt overlap)
│  │ │ Rp amountLabel             │ $ │ │ │  │    (goldCoinImage: 48 x 48 pt)
│  │ │ descLabel        dateLabel └───┘ │ │  │    (dateLabel: dueDate)
│  │ │ ┌──────────────────────────────┐ │ │  │
│  │ │          applyButton           │ │ │  │  ← applyButton (tinggi 43 pt)
│  │ │ └──────────────────────────────┘ │ │  │
│  │ └──────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Struktur Kartu Bertumpuk (Two-Tier Layout):**
  - **Banner Atas (`topBgLabel`):** Berlatar gradien horizontal cokelat (`BrownCardMaxBgColor` ke `BrownCardMinBgColor`) dengan sudut lengkung `radius: 6.0 pt`. Memiliki tinggi `65 pt`.
    - `topDescLabel`: Label keterangan di sisi kiri (putih, font 11 pt reguler).
    - `topAmountLabel`: Nilai estimasi nominal di sisi kanan (putih, font DINBold Middle).
  - **Kartu Bawah (`bottomBgLabel`):** Menindih (*overlap*) bagian bawah banner atas dengan offset `-12 pt`. Berlatar putih dengan border tipis oranye dan sudut membulat `radius: 8.0 pt`.
    - `titleLabel`: Offset kiri `20 pt`, warna teks sekunder (`#9E9894`).
    - `middleLabel` (`rpLabel` + `amountLabel`): Prefix `"Rp"` dan nominal angka utama berwarna gelap `#222222`.
    - `goldCoinImage`: Ikon koin emas (`loan_amount_icon_goldcoin`) di sisi kanan atas kartu bawah (`offset -30 pt`).
    - `descLabel`: Keterangan di sisi kiri bawah nominal.
    - `dateLabel`: Label tanggal jatuh tempo di sisi kanan sejajar dengan `descLabel`.
    - `applyButton`: Tombol oranye (`UIButton.idn.createButtonOrange`) dengan tinggi `43 pt` dan margin samping `20 pt`.

### Kategori Komponen Data
- **Keterangan Estimasi (`topDescLabel`):** API (`quotaInfo.displayAmountVirtualText`), teks putih.
- **Nominal Estimasi (`topAmountLabel`):** API (`quotaInfo.displayAmount`), format ribuan pemisah titik (`.`), font DINBold Middle, teks putih.
- **Judul Tagihan (`titleLabel`):** API (`quotaInfo.title`), font PingFangSC Regular Auxiliary.
- **Nominal Tagihan (`amountLabel`):** API (`quotaInfo.amount`), format ribuan pemisah titik (`.`), font DINBold Middle.
- **Keterangan Tagihan (`descLabel`):** API (`quotaInfo.descContent`), font PingFangSC Regular Auxiliary.
- **Tanggal Jatuh Tempo (`dateLabel`):** API (`quotaInfo.dueDate`), font PingFangSC Regular Auxiliary, warna `#3D3835`.
- **Tombol CTA (`applyButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan teks putih font Medium General.

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan di `updateData` jika `buttonText` tidak kosong dan `status` tersedia, dengan atribut `["status": status, "Scene": "normal"]`.
- **Tap CTA:** Tombol dilindungi oleh mekanisme throttle 1000 ms (`CZThrottle`). Saat diklik, tombol mengeksekusi `applyAmountAction` yang meneruskan panggilan ke `interactiveDelegate?.requstJumpRouter(params: [:])`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Estimasi Kuota Virtual dengan Tagihan Jatuh Tempo

- 🎯 **Trigger / Kondisi:** Akun memiliki alokasi limit virtual estimasi Rp 50.000.000 dan tagihan pinjaman aktif Rp 2.500.000 dengan tanggal jatuh tempo 15 Juni 2024.
- 📱 **Expected Result:** Banner cokelat menampilkan `"Estimasi batas kredit pinjaman"` dan `"50.000.000"`. Kartu bawah menampilkan nominal tagihan `"2.500.000"`, tanggal jatuh tempo `"15 Juni 2024"`, dan tombol `"Bayar Sekarang"`. Exposure `home_apply` tercatat dengan `Scene: "normal"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_PAID_TWO_NUMBER_DATE",
      "title": "Tagihan Belum Dibayar",
      "amount": "2500000",
      "buttonText": "Bayar Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "50000000",
      "descContent": "Waktu jatuh tempo pembayaran",
      "countDownTimeStamp": null,
      "dueDate": "15 Juni 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-twonumberdate-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "50000000",
      "displayAmountVirtualText": "Estimasi batas kredit pinjaman",
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

- 🔄 **Yang diubah:** `quotaInfo.displayAmount`, `quotaInfo.displayAmountVirtualText`, `quotaInfo.title`, `quotaInfo.amount`, `quotaInfo.dueDate`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji presentasi visual dua nominal (virtual limit banner + pinjaman riil berpenanggalan).

---

### 🟢 Kasus B — Guard Exposure saat Judul Tombol Kosong

- 🎯 **Trigger / Kondisi:** API mengembalikan `buttonText: ""` atau `null`.
- 📱 **Expected Result:** Struktur dua kartu tetap tampil sempurna; pelaporan event analitik ditahan oleh guard `buttonText.isEmpty == false`.
- 👆 **Interaksi:** Tap tombol tetap diarahkan ke router delegate.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_PAID_TWO_NUMBER_DATE",
      "title": "Tagihan Belum Dibayar",
      "amount": "2500000",
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "50000000",
      "descContent": "Waktu jatuh tempo pembayaran",
      "countDownTimeStamp": null,
      "dueDate": "15 Juni 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-twonumberdate-002",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "50000000",
      "displayAmountVirtualText": "Estimasi batas kredit pinjaman",
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

- 🔄 **Yang diubah:** `buttonText` bernilai string kosong `""`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi ketahanan guard exposure ketika label tombol tidak disediakan.

---

## ✅ Verifikasi & Batasan

- [x] Hierarki tumpukan view `topBgLabel` dan `bottomBgLabel`, formatting ribuan ganda, dan penanganan tanggal `dueDate` diverifikasi langsung pada source Swift production.
- [x] Pelaporan analitik realtime `home_apply` dikonfirmasi menggunakan scene `"normal"`.

