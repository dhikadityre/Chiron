# IDAmountTwoNumberButtonOrangeViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu kuota ganda berperingatan tegas (*double-digit orange warning card*) yang menggabungkan banner estimasi limit virtual di bagian atas dengan pesan peringatan jatuh tempo bertipografi oranye tegas (`IDThemeColor.MajorOrangeColor`) pada kartu utama di bagian bawah.
> Endpoint terkait: `product/V4/mergeOrigin` (`IDLoanQuotaAreaModels`).
> Dikhususkan untuk akun yang telah melewati tanggal jatuh tempo pembayaran (*overdue*) namun memiliki alokasi estimasi batas kredit virtual tambahan.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Kuota Ganda Peringatan Oranye (Overdue) | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `displayAmount != null`; `status` overdue; `amount != null` | Banner estimasi cokelat di atas + teks serba oranye peringatan di bawah | **Cell Target:** Header gradien cokelat, kartu bawah teks oranye pekat, tombol "Lunasi Sekarang". Exposure `home_apply` (`Scene: "normal"`) | Tap mengirim router `requstJumpRouter(params: [:])` via throttle 1000 ms | Hierarki dua tingkat, tipografi oranye, dan tap handler terbukti source |
| **B** — Judul Tombol Kosong | Sama | Kondisi A; `buttonText == ""` atau `null` | Judul tombol CTA kosong | **Cell Target** tetap aktif; teks tombol kosong; event exposure di-guard | Handler tap tetap terpasang | Guard exposure dan binding terbukti source |
| **C** — Pesan Peringatan Multi-baris | Sama | Kondisi A; `descContent` panjang (> 2 baris) | Rincian konsekuensi denda keterlambatan | **Cell Target:** `descLabel` mengembang otomatis secara vertikal (`numberOfLines = 0`) | Efek tap sama dengan kasus A | Konfigurasi AutoLayout multi-line terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari endpoint `product/V4/mergeOrigin`. Teks default tema lokal disiapkan pada `updateTheme` (misal judul `"Belum dibayar"`, nominal `"2.000.000"`, estimasi `"80.000.000"`), namun selalu diperbarui secara dinamis oleh payload respons backend pada `updateData`.

> 📌 **Referensi Source Code:**
> - Views: `IDLoanViews.swift` (baris 122: `register`, baris 224: `cellForRowAt`, baris 468: `createTwoNumberButtonOrangeCell`)
> - Cell Implementation: `IDAmountTwoNumberButtonOrangeViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `applyAmountAction`)
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
│  │ │ titleLabel (Orange)        ┌───┐ │ │  │    (offset -12 pt overlap)
│  │ │ Rp amountLabel (DINBold)   │ $ │ │ │  │    (goldCoinImage: 48 x 48 pt)
│  │ │                                  │ │  │
│  │ │ descLabel (Multi-line Orange)└───┘ │ │  │  ← descLabel
│  │ │ ┌──────────────────────────────┐ │ │  │
│  │ │     applyButton (Orange)       │ │ │  │  ← applyButton (tinggi 43 pt)
│  │ │ └──────────────────────────────┘ │ │  │
│  │ └──────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Struktur Kartu Bertumpuk (Two-Tier Layout):**
  - **Banner Atas (`topBgLabel`):** Berlatar gradien horizontal cokelat (`BrownCardMaxBgColor` ke `BrownCardMinBgColor`) dengan sudut lengkung `radius: 6.0 pt`. Memiliki tinggi `65 pt`.
    - `topDescLabel`: Label keterangan estimasi di sisi kiri (putih, font 11 pt reguler).
    - `topAmountLabel`: Nilai estimasi limit di sisi kanan (putih, font DINBold Middle).
  - **Kartu Bawah (`bottomBgLabel`):** Menindih bagian bawah banner atas dengan offset `-12 pt`. Berlatar putih dengan border tipis oranye dan sudut membulat `radius: 8.0 pt`.
    - `titleLabel`: Menggunakan font PingFangSC Regular Auxiliary dengan warna oranye menyala (`MajorOrangeColor`).
    - `middleLabel` (`rpLabel` + `amountLabel`): Prefix `"Rp"` dan nominal pinjaman berukuran besar diformat menggunakan font DINBold berwarna oranye (`MajorOrangeColor`).
    - `goldCoinImage`: Ikon koin emas (`loan_amount_icon_goldcoin`) di sisi kanan atas kartu bawah (`offset -30 pt`).
    - `descLabel`: Label peringatan multi-baris (`numberOfLines = 0`) dengan margin samping `20 pt`, berjarak `20 pt` di bawah nominal angka, berwarna oranye (`MajorOrangeColor`).
    - `applyButton`: Tombol oranye (`UIButton.idn.createButtonOrange`) dengan tinggi `43 pt` dan margin samping `20 pt`.

### Kategori Komponen Data
- **Keterangan Estimasi (`topDescLabel`):** API (`quotaInfo.displayAmountVirtualText`), teks putih.
- **Nominal Estimasi (`topAmountLabel`):** API (`quotaInfo.displayAmount`), format ribuan titik (`.`), font DINBold Middle, teks putih.
- **Judul Tagihan (`titleLabel`):** API (`quotaInfo.title`), font PingFangSC Regular Auxiliary, warna oranye (`MajorOrangeColor`).
- **Nominal Tagihan (`amountLabel`):** API (`quotaInfo.amount`), format ribuan titik (`.`), font DINBold Middle, warna oranye (`MajorOrangeColor`).
- **Pesan Peringatan (`descLabel`):** API (`quotaInfo.descContent`), multi-baris, warna oranye (`MajorOrangeColor`).
- **Tombol CTA (`applyButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan teks putih font Medium General.

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan di `updateData` jika `buttonText` tidak kosong dan `status` tersedia, dengan atribut `["status": status, "Scene": "normal"]`.
- **Tap CTA:** Tombol dilindungi oleh mekanisme throttle 1000 ms (`CZThrottle`). Saat disentuh, tombol memanggil `applyAmountAction` yang meneruskan delegasi ke `interactiveDelegate?.requstJumpRouter(params: [:])`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Tagihan Jatuh Tempo dengan Estimasi Kuota Virtual

- 🎯 **Trigger / Kondisi:** Akun berstatus keterlambatan dengan estimasi limit virtual Rp 80.000.000 dan tagihan tertunggak Rp 3.200.000.
- 📱 **Expected Result:** Banner cokelat menampilkan `"Estimasi jumlah pinjaman(Rp)"` dan `"80.000.000"`. Kartu bawah menampilkan teks judul, nominal `"3.200.000"`, dan deskripsi peringatan keterlambatan dalam warna oranye. Tombol `"Lunasi Sekarang"` aktif. Exposure `home_apply` tercatat dengan `Scene: "normal"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "OVERDUE_TWO_NUMBER_ORANGE",
      "title": "Tagihan Telah Jatuh Tempo",
      "amount": "3200000",
      "buttonText": "Lunasi Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "80000000",
      "descContent": "Tagihan Anda telah jatuh tempo. Segera selesaikan pembayaran untuk memulihkan akses pengajuan pinjaman Anda.",
      "countDownTimeStamp": null,
      "dueDate": "05 Mei 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-twonumberorange-001",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "80000000",
      "displayAmountVirtualText": "Estimasi jumlah pinjaman(Rp)",
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

- 🔄 **Yang diubah:** `quotaInfo.displayAmount`, `quotaInfo.displayAmountVirtualText`, `quotaInfo.title`, `quotaInfo.amount`, `quotaInfo.descContent`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji kombinasi visual kartu estimasi limit cokelat di atas dan peringatan keterlambatan oranye di bawah.

---

### 🟢 Kasus B — Guard Exposure saat Judul Tombol Kosong

- 🎯 **Trigger / Kondisi:** API mengembalikan `buttonText: ""` atau `null`.
- 📱 **Expected Result:** Struktur kartu tetap tampil utuh; pelaporan event analitik ditahan oleh guard `buttonText.isEmpty == false`.
- 👆 **Interaksi:** Tap tombol tetap diarahkan ke router delegate.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "OVERDUE_TWO_NUMBER_ORANGE",
      "title": "Tagihan Telah Jatuh Tempo",
      "amount": "3200000",
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": "80000000",
      "descContent": "Segera selesaikan pembayaran tagihan Anda.",
      "countDownTimeStamp": null,
      "dueDate": "05 Mei 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-twonumberorange-002",
      "benefitSpeedUpSign": null,
      "hideCut": null,
      "displayAmount": "80000000",
      "displayAmountVirtualText": "Estimasi jumlah pinjaman(Rp)",
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
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi ketahanan guard analitik pada varian kartu kuota ganda oranye.

---

## ✅ Verifikasi & Batasan

- [x] Struktur tumpukan `topBgLabel` dan `bottomBgLabel`, styling tipografi `MajorOrangeColor` kartu bawah, serta throttle tap 1000 ms diverifikasi langsung pada source Swift.
- [x] Pelaporan analitik realtime `home_apply` dikonfirmasi menggunakan scene `"normal"`.

