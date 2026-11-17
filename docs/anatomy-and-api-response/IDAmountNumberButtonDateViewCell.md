# IDAmountNumberButtonDateViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu kuota yang menampilkan informasi limit nominal angka pinjaman, tanggal jatuh tempo pembayaran (`dueDate`), deskripsi keterangan (`descContent`), ikon koin emas, serta tombol aksi pengajuan/pembayaran (CTA).
> Endpoint terkait: `product/V4/mergeOrigin` (`IDLoanQuotaAreaModels`).
> Diperuntukkan bagi skenario akun yang memiliki tanggal jatuh tempo aktif pada kartu beranda utama tanpa konfigurasi limit virtual tambahan di bagian atas.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Jatuh Tempo Aktif | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `amount != null`; `dueDate != null`; `buttonText != null` | Terdapat tanggal jatuh tempo dan nominal pinjaman aktif | **Cell Target:** Judul kuota, prefix "Rp", nominal ribuan, tanggal jatuh tempo di kanan, tombol CTA. Exposure `home_apply` / `show` (`Scene: "normal"`) | Tap mengirim perintah router `requstJumpRouter(params: [:])` via throttle 1000 ms | Binding data, formatting angka, dan tap handler terbukti source |
| **B** — Tombol CTA Kosong | Sama | Kondisi A; `buttonText == ""` atau `null` | Judul tombol CTA kosong | **Cell Target** tetap dimuat; judul tombol kosong, pelaporan analitik exposure di-guard | Handler tap tetap terpasang | Guard exposure dan binding terbukti source |
| **C** — Format Ribuan Presisi | Sama | `amount == "2500000.50"` | Nilai nominal dengan pecahan | **Cell Target:** `amountLabel` diformat otomatis menjadi `"2.500.000,5"` melalui ekstensi `toThousands` | Efek tap sama dengan kasus A | Formatter `toThousands` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data kuota di-decode dari endpoint `product/V4/mergeOrigin`. Nilai `amount` bertipe string numerik yang diformat menjadi representasi desimal ribuan lokal Indonesia (`.` untuk ribuan). Tanggal `dueDate` disajikan apa adanya sesuai string dari backend tanpa konversi zona waktu client.

> 📌 **Referensi Source Code:**
> - Views: `IDLoanViews.swift` (baris 119: `register`, baris 212: `cellForRowAt`, baris 429: `createAmountNumberButtonDateCell`)
> - Cell Implementation: `IDAmountNumberButtonDateViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `applyAmountAction`)
> - Model: `IDLoanAmountModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ titleLabel                     ┌───┐ │  │  ← goldCoinImage
│  │                                │ $ │ │  │    (48 x 48 pt)
│  │ Rp amountLabel (DINBold)       └───┘ │  │
│  │                                      │  │
│  │ descLabel                  dateLabel │  │  ← dateLabel (dueDate)
│  │                                      │  │
│  │ ┌──────────────────────────────────┐ │  │
│  │ │           applyButton            │ │  │  ← gradient orange button
│  │ └──────────────────────────────────┘ │  │    (tinggi 43 pt)
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar putih dengan sudut lengkung `radius: 8.0 pt` dan bayangan oranye halus (`ShadowOrangeColor`, radius 20, opacity 0.8). Margin atas, kiri, dan kanan adalah `20 pt`.
- **Tata Letak Elemen:**
  - `titleLabel`: Offset kiri `20 pt`, atas `20 pt`, warna teks sekunder (`#9E9894`).
  - `rpLabel` & `amountLabel`: Berada di bawah judul dengan jarak `8 pt`. Prefix `"Rp"` menggunakan font reguler dan nominal angka menggunakan font DINBold berukuran besar dengan warna `#222222`.
  - `goldCoinImage`: Ikon koin emas (`loan_amount_icon_goldcoin`) berukuran `48 x 48 pt` di pojok kanan atas (`offset -30 pt`).
  - `descLabel`: Berada `20 pt` di bawah nominal angka pada sisi kiri.
  - `dateLabel`: Berada di sisi kanan sejajar secara vertikal dengan `descLabel` (`centerY`), menampilkan string tanggal jatuh tempo (`dueDate`).
  - `applyButton`: Tombol oranye horizontal gradien dengan sudut membulat `radius: 21.5 pt`, tinggi `43 pt`, dan margin samping `20 pt`.

### Kategori Komponen Data
- **Judul Kuota (`titleLabel`):** API (`quotaInfo.title`), font PingFangSC Regular Auxiliary, warna teks sekunder.
- **Prefix Simbol (`rpLabel`):** Statis client `"Rp"`.
- **Nominal Pinjaman (`amountLabel`):** API (`quotaInfo.amount`), diformat ribuan dengan pemisah titik (`.`), font DINBold Middle.
- **Keterangan (`descLabel`):** API (`quotaInfo.descContent`), font PingFangSC Regular Auxiliary.
- **Tanggal Jatuh Tempo (`dateLabel`):** API (`quotaInfo.dueDate`), font PingFangSC Regular Auxiliary, warna `#3D3835` (`TextColor_General`).
- **Tombol CTA (`applyButton`):** API (`quotaInfo.buttonText`), tombol gradien oranye horizontal dengan teks putih.
- **Ikon Koin Emas (`goldCoinImage`):** Statis asset aplikasi (`R.image.loan_amount_icon_goldcoin()`).

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan pada `updateData` jika `buttonText` tidak kosong dan `status` tersedia, dengan parameter `["status": status, "Scene": "normal"]`.
- **Tap CTA:** Tombol dilindungi oleh mekanisme throttle 1000 ms (`CZThrottle`). Saat diklik, tombol mengeksekusi `applyAmountAction` yang meneruskan panggilan ke `interactiveDelegate?.requstJumpRouter(params: [:])`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Pengingat Jatuh Tempo Normal

- 🎯 **Trigger / Kondisi:** Akun memiliki tanggal jatuh tempo dan nominal pinjaman aktif (`amount: "3000000"`, `dueDate: "25 Mei 2024"`).
- 📱 **Expected Result:** Nominal tampil `"3.000.000"`, tanggal jatuh tempo `"25 Mei 2024"` tampil di kanan, tombol `"Bayar Sekarang"` aktif. Exposure `home_apply` terkirim dengan `Scene: "normal"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_PAID_DATE_VIEW",
      "title": "Total Tagihan",
      "amount": "3000000",
      "buttonText": "Bayar Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Jatuh tempo pembayaran",
      "countDownTimeStamp": null,
      "dueDate": "25 Mei 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-date-001",
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

- 🔄 **Yang diubah:** `quotaInfo.title`, `quotaInfo.amount`, `quotaInfo.dueDate`, `quotaInfo.descContent`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji rendering lengkap elemen nominal pinjaman dan penanggalan jatuh tempo pada kartu.

---

### 🟢 Kasus B — Guard Exposure saat Judul Tombol Kosong

- 🎯 **Trigger / Kondisi:** API mengembalikan `buttonText: ""` atau `null`.
- 📱 **Expected Result:** Cell target tampil tanpa teks tombol; guard `buttonText.isEmpty == false` menahan pelaporan event analitik `home_apply_show`.
- 👆 **Interaksi:** Tap tombol tetap diarahkan ke router delegate.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_PAID_DATE_VIEW",
      "title": "Total Tagihan",
      "amount": "3000000",
      "buttonText": "",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": "Menunggu konfirmasi pembayaran",
      "countDownTimeStamp": null,
      "dueDate": "28 Mei 2024",
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-date-002",
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

- 🔄 **Yang diubah:** `buttonText` disetel menjadi string kosong `""`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi ketahanan guard exposure ketika backend tidak mengirimkan label teks tombol aksi.

---

## ✅ Verifikasi & Batasan

- [x] Selector cell, formatting ribuan pada `amountLabel`, pemasangan `dueDate` pada `dateLabel`, dan event tap CTA diverifikasi langsung ke kode Swift production.
- [x] Pelaporan analitik realtime `home_apply` dikonfirmasi menggunakan scene `"normal"`.

