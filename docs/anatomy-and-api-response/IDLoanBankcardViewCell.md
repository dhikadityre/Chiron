# IDLoanBankcardViewCell

> 💡 **Ringkasan Komponen:**
> Komponen kartu pengingat pelengkap kartu bank (*supplement bank card banner*) yang mengingatkan pengguna untuk melengkapi atau memperbarui informasi rekening bank penerima pencairan pinjaman.
> Model data: `IDLoanBankcardModel(jumpUrl: String?)`.
> Sumber: Dipilih pada `IDLoanService.swift` (`getCellListAry`) ketika properti `bankcardInfo != nil`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Banner Tambah / Ganti Kartu Bank | `IDLoanModels` / `IDLoanBankcardModel` | `dataModel.bankcardInfo != nil`; `jumpUrl` valid | Model kartu bank aktif dengan tautan deeplink | **Cell Target:** Banner kartu suplemen bank berwarna oranye/emas (`home_supplement_bankcard`) | Tap memanggil `interactiveDelegate?.jumpWithUrl(jumpUrl)` | Selector di `getCellListAry`, gesture recognizer, dan delegate call terbukti source |
| **B** — URL Navigasi Kosong | Sama | Kondisi A; `jumpUrl == ""` atau `null` | String tautan navigasi kosong | **Cell Target** tetap tampil | Tap memanggil `jumpWithUrl("")` tanpa crash | Fallback `self.dataModel?.jumpUrl ?? ""` terbukti source |
| **C** — Section Suppressed | Sama | `dataModel.bankcardInfo == nil` | Model kartu bank bernilai null | Cell suplemen kartu bank tidak dimasukkan ke dalam daftar tampilan | Tidak ada interaksi | Guard `if (dataModel.bankcardInfo != nil)` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model `IDLoanBankcardModel` merupakan bagian dari agregasi `IDLoanModels`. Banner disajikan dalam bentuk grafis statis (`home_supplement_bankcard`) yang memiliki seluruh copy teks di dalam asset gambar, sedangkan tautan tujuan saat disentuh dikontrol oleh atribut `jumpUrl`.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 593-597: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 125: `register`, baris 262-271: `cellForRowAt`)
> - Cell Implementation: `IDLoanBankcardViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`)
> - Model: `IDLoanBankcardModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │ ┌──────────────────────────────────┐ │  │  ← bgImageView
│  │ │  [home_supplement_bankcard]      │ │  │    (R.image.home_supplement_bankcard)
│  │ │  Lengkapi Rekening Bank Penerima  │ │  │    (contentMode: .scaleAspectFill)
│  │ └──────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Wrapper transparan dengan margin atas `20 pt`, kiri `20 pt`, dan kanan `-20 pt` terhadap lebar tabel beranda.
- **Tata Letak Elemen:**
  - `bgImageView`: Menempati seluruh ruang kartu dengan batasan margin tepi. Menggunakan mode konten `.scaleAspectFill` dan memuat asset gambar `R.image.home_supplement_bankcard()`.
  - Keseluruhan banner dapat disentuh secara interaktif melalui gestur ketuk (*tap gesture recognizer*).

### Kategori Komponen Data
- **Asset Gambar Banner (`bgImageView`):** Statis asset grafis aplikasi (`R.image.home_supplement_bankcard()`).
- **Tautan Navigasi (`jumpUrl`):** API / Konfigurasi (`data.jumpUrl`), string deeplink (misal: `"samir://bankcard"` atau tautan H5).

### Logika Interaksi & Delegasi
- **Tap Banner:** Ketika pengguna mengetuk area banner gambar, sistem langsung mengeksekusi `interactiveDelegate?.jumpWithUrl(self.dataModel?.jumpUrl ?? "")` untuk mengarahkan pengguna ke halaman manajemen kartu bank.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Banner Kartu Bank dengan Deeplink Standar

- 🎯 **Trigger / Kondisi:** Akun membutuhkan pengisian ulang data kartu bank; `bankcardInfo != nil` dengan `jumpUrl: "samir://bankcard"`.
- 📱 **Expected Result:** Banner suplemen kartu bank tampil di bawah area kuota.
- 👆 **Interaksi:** Tap pada gambar banner memicu navigasi ke `"samir://bankcard"`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "bankcardInfo": {
      "jumpUrl": "samir://bankcard"
    }
  }
}
```

- 🔄 **Yang diubah:** Objek `bankcardInfo` disediakan data aktif.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi rendering banner kartu bank dan routing deeplink internal aplikasi.

---

### 🟢 Kasus B — Banner Kartu Bank dengan Tautan Web H5

- 🎯 **Trigger / Kondisi:** Tautan navigasi berupa URL web H5 eksternal/internal.
- 📱 **Expected Result:** Banner tampil persis seperti kasus A.
- 👆 **Interaksi:** Tap banner meneruskan URL `"https://h5.samir.co.id/bank-guide"` ke delegate navigasi.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "bankcardInfo": {
      "jumpUrl": "https://h5.samir.co.id/bank-guide"
    }
  }
}
```

- 🔄 **Yang diubah:** `jumpUrl` disetel ke URL H5.
- 🎯 **Alasan / Hasil yang diuji:** Menguji fleksibilitas penerusan URL web melalui `jumpWithUrl`.

---

## ✅ Verifikasi & Batasan

- [x] Selector `dataModel.bankcardInfo != nil` pada `getCellListAry` dan penanganan `jumpWithUrl` pada gestur ketuk diverifikasi langsung pada source Swift.
- [x] Komponen UI terbukti berupa single interactive image banner tanpa label teks UIKit terpisah.

