# IDAmountNumberButtonViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode menjadi `IDLoanQuotaAreaModels`.
> Cell ini adalah kartu kuota utama (*default amount card*) yang digunakan pada 6 status dasar (`UN_LOGIN`, `NO_ORDERS`, `CANCEL`, `REFUSE`, `FINISH`, `INIT`), serta status kredit disetujui (`EXECUTING_CREDIT_GRANTED`) jika `title` dan `amount` keduanya memiliki nilai. Jika salah satu kosong, selector berpindah ke `IDAmountButtonThreeIconViewCell`. Jika `circularCredit != nil`, pilihan cell selalu ditimpa (*override*) menjadi `IDAmountCycleLoanViewCell`.

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap Saja | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Belum Login (`UN_LOGIN`) | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `status == "UN_LOGIN"`; `circularCreditResp == null` | Pengguna belum terautentikasi | **Cell Target:** Judul kuota, nominal limit, tombol CTA. Exposure `Scene: "unlogin"`, `Credit: "disable"` | Tap memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **B** — Tanpa Pesanan (`NO_ORDERS`) | Sama | `status == "NO_ORDERS"`; `circularCreditResp == null` | Pengguna belum memiliki pinjaman aktif | **Cell Target:** Layout sama; exposure `Scene: "normal"`, `Credit: "not_granted"` | Tap mengirim analitik `Apply_now_click` lalu memanggil `requstJumpRouter(params: [:])` | Selector, binding, exposure, dan tap handler terbukti source |
| **C** — Kredit Disetujui (Lengkap) | Sama | `status == "EXECUTING_CREDIT_GRANTED"`; `title != ""` & `amount != ""`; `circularCreditResp == null` | Kedua field judul dan nominal terisi | **Cell Target:** Layout sama; exposure `Scene: "normal"`, `Credit: "granted"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa `Apply_now_click` | Selector, binding, exposure, dan tap handler terbukti source |
| **D** — Badge Potongan Bunga (*Hide-Cut*) | Sama | Kondisi B; `hideCut == true`; `hitDisplayAmountAb == "1"` | Flag hide-cut dan varian AB aktif | **Cell Target:** Badge `home_hidecut_icon` muncul di kanan atas nominal, margin nominal bertambah menjadi 36 | Sama dengan kasus B | Layout offset dan kondisi flag terbukti source |
| **E** — Fallback: `title`/`amount` Kosong | Sama | `status == "EXECUTING_CREDIT_GRANTED"`; `title == ""` atau `amount == ""` | Salah satu field kuota kosong | `IDAmountButtonThreeIconViewCell`, bukan target | Bukan handler cell target | Selector terbukti source |
| **F** — Circular Override | Sama | Kondisi C; `circularCreditResp != null` | Object circular terisi | `IDAmountCycleLoanViewCell`, bukan target | Bukan handler cell target | Override terbukti source |
| **G** — Inisialisasi Pesanan (`INIT`) | Sama | `status == "INIT"`; `circularCreditResp == null` | Tahap inisiasi permohonan | **Cell Target:** Layout sama; exposure `Scene: "normal"`, `Credit: "disable"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa `Apply_now_click` | Selector, binding, exposure, dan tap handler terbukti source |
| **H** — Pesanan Ditolak (`REFUSE`) | Sama | `status == "REFUSE"`; `circularCreditResp == null` | Pengajuan pinjaman ditolak | **Cell Target:** Layout sama; exposure `Scene: "normal"`, `Credit: "disable"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa `Apply_now_click` | Selector, binding, exposure, dan tap handler terbukti source |
| **I** — Pinjaman Lunas (`FINISH`) | Sama | `status == "FINISH"`; `circularCreditResp == null` | Pinjaman sebelumnya lunas | **Cell Target:** Layout sama; exposure `Scene: "normal"`, `Credit: "granted"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa `Apply_now_click` | Selector, binding, exposure, dan tap handler terbukti source |
| **J** — Pesanan Dibatalkan (`CANCEL`) | Sama | `status == "CANCEL"`; `circularCreditResp == null` | Permohonan dibatalkan | **Cell Target:** Layout sama; exposure `Scene: "normal"`, `Credit: "disable"` | Tap memanggil `requstJumpRouter(params: [:])` tanpa `Apply_now_click` | Selector, binding, exposure, dan tap handler terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model didekode langsung dari `responseObject`. Tampilan nominal angka menggunakan format pemisah ribuan titik (`toThousands(".")`). Field `hitDisplayAmountAb` disalin oleh service dari level luar, bukan field wire langsung di dalam `quotaInfo`.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`requstQueryQuotaArea`, `getCellListAry`)
> - Views: `IDLoanViews.swift` (`createAmountNumberButtonCell`)
> - Cell Implementation: `IDAmountNumberButtonViewCell.swift` (`updateData`, `applyButton`, `clickInjectPoints`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │              titleLabel              │  │  ← titleLabel (Judul Kuota)
│  │                                      │  │
│  │                  ┌─────────────────┐ │  │
│  │                  │hideCutImageView │ │  │  ← hideCutImageView (Badge diskon)
│  │                  └─────────────────┘ │  │
│  │             amountLabel              │  │  ← amountLabel (Nominal Rp)
│  │                                      │  │
│  │       ┌──────────────────────┐       │  │
│  │       │     applyButton      │       │  │  ← applyButton (Tombol CTA)
│  │       └──────────────────────┘       │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu berlatar belakang putih dengan sudut membulat `radius: 8.0` dan bayangan oranye halus. Margin atas, kiri, dan kanan bernilai `20`.
- **Tata Letak Elemen:**
  - `titleLabel`: Berada di tengah atas kartu dengan offset top `40` terhadap container kartu.
  - `amountLabel`: Ditampilkan di bawah judul (offset top `20`, atau `36` jika badge diskon aktif), menggunakan font ukuran besar `56` bold.
  - `hideCutImageView`: Ikon badge diskon ukuran `129 x 24` menempel di pojok kanan atas `amountLabel`.
  - `applyButton`: Tombol oranye di bawah nominal dengan tinggi `42` dan margin samping `32`.

### Kategori Komponen Data
- **Judul Kuota (`titleLabel`):** API (`quotaInfo.title`), font PingFangSC Medium General warna `TextColor_General`.
- **Nominal Kuota (`amountLabel`):** API + Pemformatan angka (`quotaInfo.displayAmount?.cz.toThousands(".", minifractionDigits: 1, maximumFractionDigits: 2)`), font `DINPro-Bold` ukuran 56 warna `#391100`.
- **Badge Diskon Bunga (`hideCutImageView`):** Statis asset (`R.image.home_hidecut_icon()`), tampil jika `hideCut == true` dan `hitDisplayAmountAb == "1"`.
- **Tombol CTA (`applyButton`):** API (`quotaInfo.buttonText`), tombol oranye dengan teks putih font Medium General.

### Logika Exposure & Tap
- **Exposure Event:** Event `home_apply` / `show` dilaporkan di `updateData` jika `buttonText` tidak kosong dan `status` tersedia:
  - `UN_LOGIN`: `["status": status, "Scene": "unlogin", "Credit": "disable"]`.
  - `NO_ORDERS`: `["status": status, "Scene": "normal", "Credit": "not_granted"]`.
  - `EXECUTING_CREDIT_GRANTED` atau `FINISH`: `["status": status, "Scene": "normal", "Credit": "granted"]`.
  - `CANCEL`, `REFUSE`, `INIT`: `["status": status, "Scene": "normal", "Credit": "disable"]`.
- **Tap CTA:** Aksi tombol dilindungi *throttle* 1000 ms:
  - Jika `status == "NO_ORDERS"`, mengirim analitik `Apply_now_click`.
  - Memanggil `interactiveDelegate.requstJumpRouter(params: [:])`.
- *Catatan:* Selesai memuat response tidak memicu aksi tap otomatis.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Belum Login (`UN_LOGIN`)

- 🎯 **Trigger / Kondisi:** `status == "UN_LOGIN"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Judul `Limit Pinjaman Maksimal`, nominal `5.000.000`, dan tombol `Ajukan Sekarang`. Exposure tercatat dengan `Scene: "unlogin"`, `Credit: "disable"`.
- 👆 **Interaksi:** Tap tombol CTA memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "UN_LOGIN",
      "title": "Limit Pinjaman Maksimal",
      "amount": "5000000",
      "buttonText": "Ajukan Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-unlogin-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "5000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status`, `quotaInfo.title`, `quotaInfo.amount`, `quotaInfo.displayAmount`, `quotaInfo.buttonText`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji parameter event exposure khusus pengunjung yang belum login (`Scene: "unlogin"`).

---

### 🟢 Kasus B — Tanpa Pesanan (`NO_ORDERS`)

- 🎯 **Trigger / Kondisi:** `status == "NO_ORDERS"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil menampilkan kuota siap pakai. Exposure tercatat dengan `Scene: "normal"`, `Credit: "not_granted"`.
- 👆 **Interaksi:** Tap CTA mencatat event analitik `Apply_now_click` lalu memanggil `requstJumpRouter(params: [:])`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "NO_ORDERS",
      "title": "Limit Siap Digunakan",
      "amount": "8000000",
      "buttonText": "Ambil Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-noorders-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "8000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `NO_ORDERS`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi pemicuan event analitik `Apply_now_click` pada status `NO_ORDERS`.

---

### 🟢 Kasus C — Kredit Disetujui Lengkap (`EXECUTING_CREDIT_GRANTED`)

- 🎯 **Trigger / Kondisi:** `status == "EXECUTING_CREDIT_GRANTED"`, dengan `title` dan `amount` keduanya non-empty.
- 📱 **Expected Result:** Cell target tetap dipilih karena kedua field terisi. Exposure tercatat dengan `Scene: "normal"`, `Credit: "granted"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa event `Apply_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED",
      "title": "Limit Pinjaman Anda",
      "amount": "10000000",
      "buttonText": "Cairkan Dana",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-granted-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "10000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status` menjadi `EXECUTING_CREDIT_GRANTED`, `title` dan `amount` terisi string valid.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi bahwa kondisi kedua field non-empty menahan selector agar tetap di cell ini dan tidak jatuh ke `IDAmountButtonThreeIconViewCell`.

---

### 🟢 Kasus D — Badge Potongan Bunga Aktif (`hideCut == true`)

- 🎯 **Trigger / Kondisi:** Kondisi Kasus B, ditambah `hideCut: true` dan `hitDisplayAmountAb: "1"`.
- 📱 **Expected Result:** Badge `home_hidecut_icon` tampil di atas kanan nominal, offset vertikal nominal bergeser ke `36`.
- 👆 **Interaksi:** Tap CTA mencatat `Apply_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "NO_ORDERS",
      "title": "Limit Siap Digunakan",
      "amount": "8000000",
      "buttonText": "Ambil Pinjaman",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-noorders-hidecut-001",
      "benefitSpeedUpSign": null,
      "hideCut": true,
      "displayAmount": "8000000",
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
    "hitDisplayAmountAb": "1",
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.hideCut` diubah ke `true`, dan field eksperimen `hitDisplayAmountAb` bernilai `"1"`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji kedua gerbang kondisi untuk menampilkan badge `hideCutImageView` dan penyesuaian constraint layout.

---

### 🔴 Kasus E — Fallback: `title` atau `amount` Kosong

- 🎯 **Trigger / Kondisi:** Status `EXECUTING_CREDIT_GRANTED`, namun `title == ""` atau `amount == ""`.
- 📱 **Expected Result:** Selector memilih `IDAmountButtonThreeIconViewCell` (cell 3 ikon tanpa nominal).
- 👆 **Interaksi:** Bukan interaksi cell ini.
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
      "bizId": "biz-mock-granted-empty-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "5000000",
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

- 🔄 **Yang diubah:** `quotaInfo.title` dikosongkan.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi percabangan fallback ke `IDAmountButtonThreeIconViewCell`.

---

### 🔴 Kasus F — Circular Credit Override

- 🎯 **Trigger / Kondisi:** Kondisi Kasus C, tetapi `circularCreditResp != null`.
- 📱 **Expected Result:** `IDAmountCycleLoanViewCell` yang terpilih.
- 👆 **Interaksi:** Bukan interaksi cell ini.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED",
      "title": "Limit Pinjaman Anda",
      "amount": "10000000",
      "buttonText": "Cairkan Dana",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-granted-circular-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "10000000",
      "displayAmountVirtualText": null,
      "extraStatus": null,
      "tipsContent": null,
      "descContent1": null,
      "descContent2": null,
      "needRefreshCircular": null
    },
    "repayInfo": null,
    "circularCreditResp": {
      "availableAmount": "10000000",
      "btnText": "Lanjutkan",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "ACTIVE",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "500000",
      "nominalAmount": "10000000",
      "tips": null,
      "title": "Limit Fleksibel",
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

- 🔄 **Yang diubah:** Objek `circularCreditResp` diisi.
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan override circular credit mengalahkan kriteria status dasar.

---

---

### 🟢 Kasus G — Inisialisasi Pesanan (`INIT`)

- 🎯 **Trigger / Kondisi:** `status == "INIT"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil menampilkan kuota inisialisasi awal. Exposure tercatat dengan `Scene: "normal"`, `Credit: "disable"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa analitik `Apply_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "INIT",
      "title": "Limit Pengajuan Anda",
      "amount": "5000000",
      "buttonText": "Lanjutkan Pengajuan",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-init-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "5000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `"INIT"`, `buttonText` ke `"Lanjutkan Pengajuan"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi parameter exposure `["status": "INIT", "Scene": "normal", "Credit": "disable"]` dan perilaku navigasi tanpa event `Apply_now_click`.

---

### 🟢 Kasus H — Pesanan Ditolak (`REFUSE`)

- 🎯 **Trigger / Kondisi:** `status == "REFUSE"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil dengan limit pasca penolakan. Exposure tercatat dengan `Scene: "normal"`, `Credit: "disable"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa analitik `Apply_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "REFUSE",
      "title": "Limit Tersedia",
      "amount": "3000000",
      "buttonText": "Coba Lagi Nanti",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-refuse-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "3000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `"REFUSE"`, `buttonText` ke `"Coba Lagi Nanti"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi handling exposure status penolakan pinjaman dan render nominal sisa limit.

---

### 🟢 Kasus I — Pinjaman Lunas (`FINISH`)

- 🎯 **Trigger / Kondisi:** `status == "FINISH"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil dengan limit segar yang telah kembali. Exposure tercatat dengan `Scene: "normal"`, `Credit: "granted"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa analitik `Apply_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "FINISH",
      "title": "Limit Kredit Anda Kembali",
      "amount": "10000000",
      "buttonText": "Ajukan Pinjaman Baru",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-finish-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "10000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `"FINISH"`, nilai credit menjadi `"granted"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi bahwa status lunas (`FINISH`) menghasilkan analitik `Credit: "granted"` berbeda dari status default lainnya (`disable`).

---

### 🟢 Kasus J — Pesanan Dibatalkan (`CANCEL`)

- 🎯 **Trigger / Kondisi:** `status == "CANCEL"` dan `circularCreditResp == null`.
- 📱 **Expected Result:** Cell target tampil dengan penawaran limit pengajuan ulang. Exposure tercatat dengan `Scene: "normal"`, `Credit: "disable"`.
- 👆 **Interaksi:** Tap CTA memanggil `requstJumpRouter(params: [:])` tanpa analitik `Apply_now_click`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` | `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "CANCEL",
      "title": "Limit Pinjaman Anda",
      "amount": "6000000",
      "buttonText": "Ajukan Ulang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-cancel-001",
      "benefitSpeedUpSign": null,
      "hideCut": false,
      "displayAmount": "6000000",
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

- 🔄 **Yang diubah:** `quotaInfo.status` disetel ke `"CANCEL"`, `buttonText` ke `"Ajukan Ulang"`.
- 🎯 **Alasan / Hasil yang diuji:** Memvalidasi rendering kartu kuota pasca pembatalan pinjaman dan parameter event `Credit: "disable"`.

## ✅ Verifikasi & Batasan

- [x] Selector status, field binding, exposure gate, dan tap action telah diverifikasi langsung ke source Swift production.
- [x] Seluruh JSON fixture adalah model fragment valid untuk pengujian client-side.
- [x] Logika navigasi runtime dan respons backend riil tidak diuji langsung.
