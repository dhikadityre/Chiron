# IDLoanStepViewCell

> 💡 **Ringkasan Komponen:**
> Komponen panduan alur pinjaman cepat (*3-step borrowing guide*) yang menampilkan ilustrasi tiga tahapan mudah peminjaman dana di Samir: "Verifikasi Data", "Pilih Pinjaman", dan "Pinjaman Cair".
> Model data: `IDLoanStepModel(title: String?, dataAry: [IDLoanStepItemModel]?)`.
> Sumber: Diinisialisasi secara client-side pada `IDLoanService.swift` (`requstQueryProduct`) khusus untuk pengguna yang belum masuk / belum login (`!isLogin`), dan disaring pada `getCellListAry` saat `stepInfo != nil`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Pengguna Belum Login (Guest) | Client Logic / `IDLoanStepModel` | `isLogin == false`; `dataModel.stepInfo != nil` | Status sesi belum terautentikasi | **Cell Target:** Judul "Ajukan hanya dengan 3 langkah", 3 ikon tahapan pinjaman dihubungkan 2 garis putus-putus | Bersifat informatif (tidak ada handler interaktif) | Gate `!isLogin` pada `IDLoanService` dan binding item cell terbukti source |
| **B** — Pengguna Telah Login | Client Logic / `IDLoanStepModel` | `isLogin == true` | Pengguna sudah berhasil masuk | `stepModel = nil` sehingga cell **tidak dimuat** ke dalam beranda | Tidak ada | Guard `if !isLogin` di baris 28 terbukti source |
| **C** — Variasi Teks / Item Dinamis | Client Logic / `IDLoanStepModel` | Kondisi A; `dataAry.count >= 3` | Array 3 tahapan lengkap | **Cell Target:** `itemLeftView`, `itemMiddleView`, dan `itemRightView` terisi aman sesuai urutan indeks | Tidak ada | Akses aman `safe: 0`, `safe: 1`, `safe: 2` terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model `IDLoanStepModel` dihasilkan langsung di sisi client (tidak berasal dari respons backend). Cell ini murni ditujukan sebagai komponen edukasi visual konversi (*onboarding conversion cue*) bagi pengguna baru atau guest visitor.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (baris 27-38: pembentukan model `!isLogin`, baris 606-610: `getCellListAry`)
> - Views: `IDLoanViews.swift` (baris 127: `register`, baris 287-296: `cellForRowAt`)
> - Cell Implementation: `IDLoanStepViewCell.swift` (`initUI`, `commonUI`, `updateTheme`, `updateData`)
> - Model: `IDLoanStepModel.swift`

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Ajukan hanya dengan 3 langkah                        │  │  ← titleLabel (font 12 pt)
│  │                                                      │  │
│  │  ┌──────┐             ┌──────┐             ┌──────┐  │  │
│  │  │ [icon]│  - - - - -  │ [icon]│  - - - - -  │ [icon]│  │  │  ← 3 step item views
│  │  │Verifi-│  (garis     │Pilih │  (garis     │ Cair │  │  │  ← 2 dashed lines
│  │  │ kasi  │  putus-     │Pinjam│  putus-     │      │  │  │    (panjang 60 pt)
│  │  └──────┘   putus)     └──────┘   putus)     └──────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar belakang putih (`bgLabel.backgroundColor = .white`) dengan sudut melengkung `corner(8)` dan margin atas `20 pt`, kiri `20 pt`, kanan `-20 pt`.
- **Tata Letak Elemen:**
  - `titleLabel`: Berada di kiri atas kartu (`offset 20 pt`), menggunakan font PingFangSC Regular Auxiliary dengan warna `#71584D` (`TextColor_General`).
  - `containerView`: Area horizontal setinggi `50 pt` yang menampung 3 kotak tahapan dan 2 garis penghubung.
  - `itemLeftView`: Tahap 1, ukuran `66 x 50 pt` menempel di sisi kiri.
  - `lineLeftView`: Garis horizontal putus-putus (*dashed line*) selebar `60 pt` dengan tinggi `0.5 pt`, pola garis `lineLength: 4, lineSpacing: 4`, warna abu-abu sekunder.
  - `itemMiddleView`: Tahap 2, ukuran `66 x 50 pt` di tengah.
  - `lineRightView`: Garis putus-putus kanan selebar `60 pt`.
  - `itemRightView`: Tahap 3, ukuran `66 x 50 pt` menempel di sisi kanan.

### Kategori Komponen Data
- **Judul Kartu (`titleLabel`):** Statis client `"Ajukan hanya dengan 3 langkah"`.
- **Tahap 1:** Ikon asset `R.image.loan_step_infoverify()` + label `"Verifikasi Data"`.
- **Tahap 2:** Ikon asset `R.image.loan_step_infowrite()` + label `"Pilih Pinjaman"`.
- **Tahap 3:** Ikon asset `R.image.loan_step_infolending()` + label `"Pinjaman Cair"`.

### Logika Interaksi & Delegasi
- Komponen ini tidak memiliki event tap atau penanganan router (hanya tampilan edukatif statis).

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Pengguna Belum Login (Guest Mode Aktif)

- 🎯 **Trigger / Kondisi:** Sesi akun `isLogin == false`.
- 📱 **Expected Result:** Cell target tampil di bawah area kuota beranda dengan judul "Ajukan hanya dengan 3 langkah" dan 3 tahapan pinjaman.
- 👆 **Interaksi:** Tidak ada.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "stepInfo": {
      "title": "Ajukan hanya dengan 3 langkah",
      "dataAry": [
        {
          "desc": "Verifikasi Data"
        },
        {
          "desc": "Pilih Pinjaman"
        },
        {
          "desc": "Pinjaman Cair"
        }
      ]
    }
  }
}
```

- 🔄 **Yang diubah:** `stepInfo` dibentuk saat pengguna berstatus belum login.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi pemuatan panduan 3 langkah bagi pengunjung beranda yang belum terautentikasi.

---

### 🟢 Kasus B — Pengguna Telah Login (Sesi Terautentikasi)

- 🎯 **Trigger / Kondisi:** Sesi akun `isLogin == true`.
- 📱 **Expected Result:** `stepInfo` bernilai `nil`. Section panduan 3 langkah dihilangkan dari susunan tabel beranda.
- 👆 **Interaksi:** Tidak ada.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "stepInfo": null
  }
}
```

- 🔄 **Yang diubah:** `stepInfo` bernilai `null`.
- 🎯 **Alasan / Hasil yang diuji:** Memverifikasi penekanan (*suppression*) panduan edukasi setelah pengguna berhasil login ke akun Samir.

---

## ✅ Verifikasi & Batasan

- [x] Syarat pemunculan `!isLogin` pada `requstQueryProduct` dan pembuatan 3 item model verifikasi, pemilihan pinjaman, serta pencairan terbukti source code Swift.
- [x] Implementasi garis putus-putus CAShapeLayer dan layouting horizontal 3 item cell dikonfirmasi.

