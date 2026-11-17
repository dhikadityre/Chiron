# IDOfficialViewCell

> 💡 **Ringkasan Komponen:**
> Komponen legalitas dan kepatuhan resmi (*official regulatory endorsement card*) yang menampilkan pernyataan izin dan pengawasan pemerintah beserta logo otoritas terkait (Otoritas Jasa Keuangan / OJK dan Asosiasi Fintech Pendanaan Bersama Indonesia / AFPI) untuk membangun kredibilitas dan rasa percaya pengguna (*trust cue*).
> Model data: `IDOfficialModel(title: String?, logoImage: String?)`.
> Sumber: Dibentuk secara default di sisi client oleh `IDLoanService.swift` (`requstQueryProduct`) dan disaring pada `getCellListAry` ketika `officialInfo != nil`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Kepatuhan Regulasi Standar | Client Default / `IDOfficialModel` | `dataModel.officialInfo != nil` | Header kepatuhan dengan logo resmi OJK & AFPI | **Cell Target:** Judul "Berizin dan Diawasi oleh", kotak latar oranye muda setinggi 46 pt dengan logo OJK & AFPI terpusat | Bersifat informatif statis (tidak ada handler klik) | Inisialisasi default di `IDLoanService`, layouting, dan binding terbukti source |
| **B** — Kustomisasi Judul Legalitas | Client Default / `IDOfficialModel` | Kondisi A; `title == "Terdaftar dan Berizin OJK"` | Teks judul kepatuhan diubah | **Cell Target:** `titleLabel` menampilkan teks judul kustom | Tidak ada | Properti `model.title` di `updateData` terbukti source |
| **C** — Section Suppressed | Client Default / `IDOfficialModel` | `dataModel.officialInfo == nil` | Model official bernilai null | Cell kepatuhan regulasi tidak dimasukkan ke dalam beranda | Tidak ada interaksi | Guard `if (dataModel.officialInfo != nil)` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model `IDOfficialModel` diatur secara default pada `IDLoanService.swift` baris 98 dengan judul `"Berizin dan Diawasi oleh"` dan logo `"loan_official_ojk_afpi"`. Komponen ini tidak bergantung pada respons jaringan backend.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 98: inisialisasi model, baris 634-638: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 130: `register`, baris 320-327: `cellForRowAt`)
> - Cell Implementation: `IDOfficialViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`)
> - Model: `IDOfficialModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Berizin dan Diawasi oleh                             │  │  ← titleLabel (font 12 pt)
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │  ← bgView (Orange Light)
│  │  │          [OJK LOGO]       [AFPI LOGO]          │  │  │    (tinggi 46 pt, corner 8)
│  │  └────────────────────────────────────────────────┘  │  │  ← logoImage (aspect fit)
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar putih (`bgLabel.backgroundColor = .white`) dengan sudut membulat `corner(8)` dan margin atas `20 pt`, kiri `20 pt`, kanan `-20 pt`.
- **Tata Letak Elemen:**
  - `titleLabel`: Berada di kiri atas kartu (`offset 20 pt`), menggunakan font PingFangSC Regular Auxiliary dengan warna `#71584D` (`TextColor_General`).
  - `bgView`: Kotak dalam berlatar warna oranye sangat muda (`SecondaryColor_OrangeLight`) dengan sudut membulat `corner(8)` setinggi `46 pt`, margin kiri/kanan `20 pt`, dan margin bawah `-20 pt`.
  - `logoImage`: Berada di dalam `bgView` dengan margin inset `4 pt` di setiap sisi, menggunakan mode konten `.scaleAspectFit`, memuat gambar logo legalitas `R.image.loan_official_ojk_afpi()`.

### Kategori Komponen Data
- **Judul Legalitas (`titleLabel`):** Client Model (`model.title`), nilai default: `"Berizin dan Diawasi oleh"`.
- **Logo Regulasi (`logoImage`):** Statis asset aplikasi (`R.image.loan_official_ojk_afpi()`).

### Logika Interaksi & Delegasi
- Komponen ini murni bersifat informatif / kepatuhan regulasi dan tidak memiliki handler aksi sentuh.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Informasi Regulasi Standar (OJK & AFPI)

- 🎯 **Trigger / Kondisi:** Inisialisasi normal beranda; `officialInfo` aktif.
- 📱 **Expected Result:** Kartu kepatuhan tampil di bagian bawah beranda dengan judul "Berizin dan Diawasi oleh" serta logo resmi OJK dan AFPI dalam kotak oranye muda.
- 👆 **Interaksi:** Tidak ada.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "officialInfo": {
      "title": "Berizin dan Diawasi oleh",
      "logoImage": "loan_official_ojk_afpi"
    }
  }
}
```

- 🔄 **Yang diubah:** Inisialisasi objek `officialInfo`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penyajian kartu bukti kepatuhan regulasi finansial fintech lending berizin.

---

### 🟢 Kasus B — Variasi Teks Judul Kepatuhan

- 🎯 **Trigger / Kondisi:** Model disuplai dengan teks kepatuhan yang diperbarui.
- 📱 **Expected Result:** `titleLabel` memperbarui teksnya menjadi "Layanan Pendanaan Berizin dan Diawasi oleh Otoritas Jasa Keuangan".
- 👆 **Interaksi:** Tidak ada.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "officialInfo": {
      "title": "Layanan Pendanaan Berizin dan Diawasi oleh Otoritas Jasa Keuangan",
      "logoImage": "loan_official_ojk_afpi"
    }
  }
}
```

- 🔄 **Yang diubah:** `officialInfo.title`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi pembaruan dinamis teks legalitas pada saat runtime.

---

## ✅ Verifikasi & Batasan

- [x] Selector `dataModel.officialInfo != nil` pada `getCellListAry` dan penataan AutoLayout logo OJK & AFPI terkonfirmasi source Swift.
- [x] Komponen diverifikasi sebagai elemen kepatuhan non-interaktif.

