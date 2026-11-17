# IDAmountNumberButtonOrangeViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu kuota berperingatan tinggi (*orange warning card*) yang menampilkan nominal pinjaman, judul, dan deskripsi dengan tipografi berwarna oranye tegas (`IDThemeColor.MajorOrangeColor`).
> Endpoint terkait: `product/V4/mergeOrigin` (`IDLoanQuotaAreaModels`).
> Dikhususkan untuk status keterlambatan pembayaran (*overdue*) atau tagihan mendesak tanpa konfigurasi limit virtual di bagian atas kartu.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Keterlambatan Bayar (Orange Warning) | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | Status keterlambatan bayar; `title != null`; `amount != null` | Seluruh teks utama (judul, Rp, nominal, deskripsi) berwarna oranye | **Cell Target:** Teks serba oranye, deskripsi multi-baris peringatan, tombol oranye "Lunasi Sekarang". Exposure `home_apply` (`Scene: "normal"`) | Tap memicu router `requstJumpRouter(params: [:])` via throttle 1000 ms | Styling warna oranye, binding model, dan tap handler terbukti source |
| **B** — Judul Tombol Kosong | Sama | Kondisi A; `buttonText == ""` atau `null` | Tombol tanpa judul | **Cell Target** tetap aktif; teks tombol kosong; event exposure di-guard | Handler tap tetap terpasang | Guard exposure terbukti source |
| **C** — Deskripsi Peringatan Panjang | Sama | Kondisi A; `descContent` panjang (> 2 baris) | Pesan peringatan denda keterlambatan | **Cell Target:** `descLabel` mengembang otomatis secara vertikal (`numberOfLines = 0`) | Efek tap sama | Konfigurasi AutoLayout multi-line terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari endpoint `product/V4/mergeOrigin`. Nilai default tema tampilan lokal disiapkan pada `updateTheme` (misal judul `"Belum dibayar"`, nominal `"2.000.000"`, tombol `"Lunasi Sekarang"`), namun akan ditimpa secara dinamis oleh payload respons backend pada `updateData`.

> 📌 **Referensi Source Code:**
> - Views: `IDLoanViews.swift` (baris 120: `register`, baris 216: `cellForRowAt`, baris 442: `createAmountNumberButtonOrangeCell`)
> - Cell Implementation: `IDAmountNumberButtonOrangeViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `applyAmountAction`)
> - Model: `IDLoanAmountModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ titleLabel (Orange)            ┌───┐ │  │  ← goldCoinImage
│  │                                │ $ │ │  │    (48 x 48 pt)
│  │ Rp amountLabel (DINBold Orange)└───┘ │  │
│  │                                      │  │
│  │ descLabel (Multi-line Orange Warning)│  │  ← descLabel
│  │                                      │  │
│  │ ┌──────────────────────────────────┐ │  │
│  │ │      applyButton (Orange)        │ │  │  ← applyButton
│  │ └──────────────────────────────────┘ │  │    (tinggi 43 pt)
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar putih dengan sudut membulat `radius: 8.0 pt` dan bayangan oranye halus (`ShadowOrangeColor`, radius 20, opacity 0.8). Margin atas, kiri, dan kanan adalah `20 pt`.
- **Tata Letak Elemen:**
  - `titleLabel`: Berada di kiri atas kartu (`offset 20 pt`), menggunakan font PingFangSC Regular Auxiliary dengan warna oranye menyala (`MajorOrangeColor`).
  - `middleLabel` (`rpLabel` + `amountLabel`): Berjarak `8 pt` di bawah judul. Prefix `"Rp"` dan nominal angka berukuran besar diformat menggunakan font DINBold berwarna oranye (`MajorOrangeColor`).
  - `goldCoinImage`: Ikon koin emas (`loan_amount_icon_goldcoin`) berukuran `48 x 48 pt` di kanan atas (`offset -30 pt`).
  - `descLabel`: Berada `20 pt` di bawah nominal dengan margin kiri dan kanan `20 pt`. Mendukung multi-baris (`numberOfLines = 0`) untuk menampung teks peringatan panjang dengan warna oranye.
  - `applyButton`: Tombol oranye (`UIButton.idn.createButtonOrange`) dengan tinggi `43 pt`, margin samping `20 pt`, dan margin bawah `-20 pt`.

### Kategori Komponen Data
- **Judul Tagihan (`titleLabel`):** API (`quotaInfo.title`), font PingFangSC Regular Auxiliary, warna oranye (`MajorOrangeColor`).
- **Simbol Mata Uang (`rpLabel`):** Statis client `"Rp"`, warna oranye.
- **Nominal Tagihan (`amountLabel`):** API (`quotaInfo.amount`), diformat ribuan dengan pemisah titik (`.`), font DINBold Middle, warna oranye.
- **Pesan Peringatan (`descLabel`):** API (`quotaInfo.descContent`), multi-baris, warna oranye.
- **Tombol Lunasi (`applyButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan teks putih font Medium General.
- **Ikon Koin Emas (`goldCoinImage`):** Statis asset aplikasi (`R.image.loan_amount_icon_goldcoin()`).

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dikirim pada `updateData` apabila `buttonText` tidak kosong dan `status` tersedia, dengan atribut `["status": status, "Scene": "normal"]`.
- **Tap CTA:** Aksi tombol dilindungi throttle 1000 ms (`CZThrottle`). Saat disentuh, tombol memanggil `applyAmountAction` yang meneruskan delegasi ke `interactiveDelegate?.requstJumpRouter(params: [:])`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Tagihan Jatuh Tempo Mendesak (Overdue Warning)

- 🎯 **Trigger / Kondisi:** Akun berstatus keterlambatan dengan nominal denda (`amount: "2150000"`, status overdue).
- 📱 **Expected Result:** Teks judul, nominal `"2.150.000"`, dan deskripsi peringatan denda tampil dalam warna oranye pekat. Tombol `"Lunasi Sekarang"` aktif. Exposure `home_apply` terkirim dengan `Scene: "normal"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil router navigasi pembayaran `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "OVERDUE_WARNING_ORANGE",
      "title": "Tagihan Telah Jatuh Tempo",
      "amount": "2150000",
      "buttonText": "Lunasi Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Pembayaran Anda telah melewati tanggal jatuh tempo. Harap segera lakukan pelunasan untuk menghindari akumulasi biaya keterlambatan.",
      "countDownTimeStamp": null,
      "dueDate": "10 Mei 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-orange-001",
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

- 🔄 **Yang diubah:** `quotaInfo.title`, `quotaInfo.amount`, `quotaInfo.descContent`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penataan visual warna oranye terpadu pada kasus tagihan kritis atau keterlambatan bayar.

---

### 🟢 Kasus B — Guard Exposure saat Judul Tombol Kosong

- 🎯 **Trigger / Kondisi:** API mengembalikan `buttonText: ""` atau `null`.
- 📱 **Expected Result:** Kartu oranye tetap tampil dengan peringatan utuh; pelaporan event analitik ditahan oleh guard `buttonText.isEmpty == false`.
- 👆 **Interaksi:** Tap tombol tetap diarahkan ke router delegate.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "OVERDUE_WARNING_ORANGE",
      "title": "Tagihan Telah Jatuh Tempo",
      "amount": "2150000",
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Harap segera lunasi tagihan Anda hari ini.",
      "countDownTimeStamp": null,
      "dueDate": "10 Mei 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-orange-002",
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

- 🔄 **Yang diubah:** `buttonText` bernilai string kosong `""`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi proteksi guard exposure analitik pada varian kartu oranye.

---

## ✅ Verifikasi & Batasan

- [x] Pewarnaan teks `MajorOrangeColor` pada `titleLabel`, `rpLabel`, `amountLabel`, dan `descLabel` diverifikasi langsung pada source Swift.
- [x] AutoLayout multi-line `descLabel` dan pembatasan throttle tap 1000 ms terkonfirmasi.

