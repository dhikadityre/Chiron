# IDLoanFAQViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kumpulan pertanyaan umum (*Frequently Asked Questions / FAQ*) pada beranda yang menyajikan daftar pertanyaan populer dalam tata letak kisi horizontal (*horizontal scrollable collection*), dilengkapi ikon penomoran urut (`01`, `02`, `03`, `04`) dan penanganan navigasi ke halaman jawaban H5 melalui webview terotentikasi.
> Endpoint terkait: `activity/queryNonCreditCardZoneForHomepage` (`IDLoanNonQuotaAreaModels.faqInfo`).
> Dipilih pada `IDLoanService.swift` (`getCellListAry`) ketika properti `dataModel.faqInfo != nil`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Daftar FAQ Standar (4 Item) | `activity/queryNonCreditCardZoneForHomepage` / `IDLoanFAQModel` | `dataModel.faqInfo != nil`; `list.count == 4` | Daftar pertanyaan lengkap dengan nomor serial 01–04 | **Cell Target:** Judul FAQ, deretan 4 kartu pertanyaan berukuran 108 x 56 pt yang dapat digulir horizontal | Tap pada kartu FAQ memanggil `IDBusinessWebViewController.loadUrlWithAuth` untuk URL tujuan | Selector di `getCellListAry`, reload data collection, dan tap handler terbukti source |
| **B** — Penomoran Serial Khusus | Sama | Kondisi A; `serialNumber` bernilai `"01"`, `"02"`, `"03"`, `"04"` | Nilai string serial menentukan icon | **Cell Target:** Menampilkan asset icon serial yang cocok (`loan_faq_serial_01` s/d `loan_faq_serial_04`) | Efek tap sama dengan kasus A | Switch branching di `IDLoanFAQItemCell` terbukti source |
| **C** — Penomoran Fallback | Sama | `serialNumber` tidak cocok dengan `"01"`–`"04"` (misal: `"99"`) | Nomor serial di luar jangkauan | **Cell Target:** Menampilkan ikon default `loan_faq_serial_01` | Efek tap sama | Percabangan `else` pada `IDLoanFAQItemCell` terbukti source |
| **D** — Target URL Kosong | Sama | Kondisi A; `jumpUrl == ""` atau `null` | Item FAQ tanpa URL target | **Cell Target** tetap menampilkan kartu pertanyaan | Tap tidak melakukan aksi atau membuka webview | Guard `!jumpUrl.isEmpty` di `didSelectItemAt` terbukti source |
| **E** — Section Suppressed | Sama | `dataModel.faqInfo == nil` | FAQ model bernilai null | Cell FAQ tidak dimuat ke dalam beranda | Tidak ada interaksi | Guard `if dataModel.faqInfo != nil` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model data di-decode dari respons endpoint `activity/queryNonCreditCardZoneForHomepage`. Judul section diambil dari `faqInfo.title`, sedangkan item-item di dalam `UICollectionView` mengonsumsi array `list` bertipe `IDLoanFAQItemModel`.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 627-631: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 129: `register`, baris 310-318: `cellForRowAt`)
> - Cell Implementation: `IDLoanFAQViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`, `UICollectionViewDelegate`, `UICollectionViewDataSource`)
> - Sub-Cell: `IDLoanFAQItemCell.swift` (`prepare`, `layout`, `model didSet`)
> - Model: `IDLoanFAQModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │ titleLabel (Pertanyaan yang Sering Diajukan)         │  │  ← titleLabel (font 12 pt)
│  │                                                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  --> │  │  ← collectionView
│  │  │[01] Berapa │  │[02] Syarat │  │[03] Cara   │      │  │    (tinggi 56 pt)
│  │  │     lama   │  │     apa    │  │     bayar  │      │  │    (item: 108 x 56 pt)
│  │  │     proses?│  │     saja?  │  │     tagihan│      │  │    (spacing: 8 pt)
│  │  └────────────┘  └────────────┘  └────────────┘      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar putih (`bgLabel.backgroundColor = .white`) dengan sudut melengkung `corner(8)` dan margin atas `20 pt`, kiri `20 pt`, kanan `-20 pt`.
- **Tata Letak Elemen:**
  - `titleLabel`: Berada di kiri atas kartu (`offset 20 pt`), menggunakan font PingFangSC Regular Auxiliary dengan warna teks utama `#222222` (`TextColor_Important`).
  - `collectionView`: Berada di bawah judul dengan jarak `16 pt`, margin kiri/kanan `20 pt`, tinggi `56 pt`, dan jarak dari bawah `-20 pt`. Menggunakan layout horizontal (`scrollDirection = .horizontal`) dengan jarak antar-item `8 pt`.
- **Anatomi Item (`IDLoanFAQItemCell`):**
  - Ukuran tetap: lebar `108 pt` dan tinggi `56 pt` dengan sudut membulat `corner(8)`.
  - `numberImageView`: Ikon angka serial berukuran proporsional di sisi kiri kartu.
  - `descLabel`: Label teks pertanyaan maksimal 2 baris (`numberOfLines = 2`) menggunakan font PingFangSC Regular Secondary dengan warna abu-abu gelap.

### Kategori Komponen Data
- **Judul Bagian (`titleLabel`):** API (`faqInfo.title`), contoh: `"Pertanyaan yang Sering Diajukan"`.
- **Nomor Serial (`serialNumber`):** API (`item.serialNumber`), bernilai string `"01"`, `"02"`, `"03"`, atau `"04"`.
- **Deskripsi Pertanyaan (`desc`):** API (`item.desc`), teks ringkas pertanyaan maksimal 2 baris.
- **Tautan Jawaban (`jumpUrl`):** API (`item.jumpUrl`), URL webview yang memuat artikel jawaban lengkap.

### Logika Interaksi & Delegasi
- **Tap Item FAQ (`didSelectItemAt`):**
  - Mengekstrak `itemModel.jumpUrl`.
  - Jika URL tersedia dan tidak kosong, sistem langsung membuka tautan menggunakan:
    `IDBusinessWebViewController.loadUrlWithAuth(targetUrl: jumpUrl, canGoBack: true)`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Daftar FAQ Standar Lengkap (4 Topik Populer)

- 🎯 **Trigger / Kondisi:** Endpoint `activity/queryNonCreditCardZoneForHomepage` mengembalikan objek `faqInfo` berisi 4 pertanyaan umum.
- 📱 **Expected Result:** Bagian FAQ tampil dengan judul "Pertanyaan Populer", memuat 4 item serial ("01", "02", "03", "04") yang dapat digeser menyamping.
- 👆 **Interaksi:** Tap pada kartu 01 membuka URL `"https://h5.samir.co.id/faq/durasi-pencairan"`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "bannerInfo": null,
    "faqInfo": {
      "title": "Pertanyaan Populer",
      "list": [
        {
          "serialNumber": "01",
          "desc": "Berapa lama proses verifikasi?",
          "jumpUrl": "https://h5.samir.co.id/faq/durasi-pencairan"
        },
        {
          "serialNumber": "02",
          "desc": "Dokumen apa saja yang dibutuhkan?",
          "jumpUrl": "https://h5.samir.co.id/faq/syarat-dokumen"
        },
        {
          "serialNumber": "03",
          "desc": "Bagaimana cara melunasi pinjaman?",
          "jumpUrl": "https://h5.samir.co.id/faq/cara-bayar"
        },
        {
          "serialNumber": "04",
          "desc": "Apakah ada biaya tersembunyi?",
          "jumpUrl": "https://h5.samir.co.id/faq/biaya-transparan"
        }
      ]
    }
  }
}
```

- 🔄 **Yang diubah:** `faqInfo.title` dan 4 objek di dalam `faqInfo.list`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penyusunan horizontal kisi pertanyaan FAQ dan pemetaan nomor serial ke asset grafis.

---

### 🟢 Kasus B — Serial Number Fallback

- 🎯 **Trigger / Kondisi:** Nilai `serialNumber` tidak terdaftar (misal: `"99"`).
- 📱 **Expected Result:** Item tetap tampil dengan teks pertanyaan, menggunakan ikon default `loan_faq_serial_01`.
- 👆 **Interaksi:** Tap item membuka `jumpUrl` yang ditentukan.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "bannerInfo": null,
    "faqInfo": {
      "title": "Bantuan Pengguna",
      "list": [
        {
          "serialNumber": "99",
          "desc": "Pertanyaan Tambahan Khusus",
          "jumpUrl": "https://h5.samir.co.id/faq/pertanyaan-khusus"
        }
      ]
    }
  }
}
```

- 🔄 **Yang diubah:** `serialNumber` disetel ke `"99"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi mekanisme fallback icon penomoran pada `IDLoanFAQItemCell`.

---

## ✅ Verifikasi & Batasan

- [x] Selector `dataModel.faqInfo != nil` pada `getCellListAry` dan konfigurasi UICollectionView horizontal terkonfirmasi source Swift.
- [x] Pemetaan serial `01`–`04` ke `R.image.loan_faq_serial_xx` serta penanganan klik via `loadUrlWithAuth` diverifikasi pada source code.

