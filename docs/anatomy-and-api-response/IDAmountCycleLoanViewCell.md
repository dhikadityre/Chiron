# IDAmountCycleLoanViewCell

> 💡 **Ringkasan Komponen:**
> Endpoint area kuota: `product/V4/mergeOrigin` didekode menjadi `IDLoanQuotaAreaModels`.
> Cell ini mengelola tampilan kredit siklus berulang (*circular credit* / pinjaman fleksibel). Cell ini dipilih jika `quotaInfo.status == "CIRCULAR_CREDIT"` **atau** setiap kali objek `circularCredit != nil` tersedia pada response home (menimpa seluruh cabang seleksi status lainnya).

---

## 📊 Matriks Pemilihan Cell

| Kasus | Endpoint / Model | Kondisi Tepat | Delta Utama | Hasil UI | Efek Tap / Event | Evidence / Confidence |
|---|---|---|---|---|---|---|
| **A** — Kredit Siklus Standar | `product/V4/mergeOrigin` / `IDLoanQuotaAreaModels` | `circularCreditResp != null`; `creditState == "1"`; `dialogResp == null` | Objek kredit siklus aktif tanpa dialog | **Cell Target:** Judul siklus, nominal limit aktif, tombol CTA enabled. Tap realtime event `home_Cycle_Orig_Apply` | Tap memanggil `interactiveDelegate.jumpCycle(cycleModel)` | Selector, override, binding, dan handler terbukti source |
| **B** — Override dari Status Lain | Sama | `status == "EXECUTING_CREDIT_GRANTED"`; `circularCreditResp != null` | Override prioritas tertinggi | **Cell Target:** Menggantikan cell status normal menjadi cell siklus | Sama dengan kasus A | Override rule di akhir `getCellListAry` terbukti source |
| **C** — Limit Tertutup / Terkunci | Sama | `circularCreditResp.availableAmount` memuat `"*"`; `creditState == "2"` | Nominal tersensor dan status freeze | **Cell Target:** Tombol CTA otomatis menjadi disabled (`applyButton.isEnabled = false`) | Tombol tidak dapat diklik | Kondisi `isEnabled` terbukti source |
| **D** — Dialog Peringatan Jatuh Tempo | Sama | `dialogResp.showType == .overdue`; `creditState == "1"` | Adanya dialog respon overdue | **Cell Target:** View realtime `home_cycle_over_orig` | Tap mencatat event `home_cycle_over_orig_apply` lalu `jumpCycle` | Event mapping terbukti source |
| **E** — Dialog Limit Maksimal Pesanan | Sama | `dialogResp.showType == .orderLimit`; `creditState == "1"` | Adanya dialog respon order limit | **Cell Target:** View realtime `home_cycle_ungetmore_orig` | Tap mencatat event `home_cycle_ungetmore_orig_apply` lalu `jumpCycle` | Event mapping terbukti source |
| **F** — Badge Diskon Hide-Cut | Sama | `circularCreditResp.hideCut == "1"`; `hitDisplayAmountAb == "1"` | Flag hide-cut siklus dan AB aktif | **Cell Target:** Ikon badge diskon `home_hidecut_icon` tampil di pojok kanan atas nominal | Sama dengan kasus A | Kondisi binding terbukti source |

> 💡 **HTTP Transport Envelope:** Seluruh fixture di bawah telah dilengkapi HTTP envelope standar (`code: "200"`, `msg: ""`, `sign: "..."`, `result: { ... }`) sesuai spesifikasi `IDNetworkRequest.swift` sehingga dapat langsung di-copas ke Proxyman Breakpoint / Map Local untuk pengujian client tanpa error decode.

> ⚠️ **Batas Kontrak (Contract Boundary):**
> Model `circularCreditResp` didekode dari field khusus response kuota. Nilai teks, nominal, dan konfigurasi dialog diatur langsung oleh entitas model `CircularCreditModel`.

> 📌 **Referensi Source Code:**
> - Service: `IDLoanService.swift` (`getCellListAry`)
> - Views: `IDLoanViews.swift` (`createCycleLoanCell`)
> - Cell Implementation: `IDAmountCycleLoanViewCell.swift` (`updateData`, `clickInjectPoints`, `applyButton`)

---

## 📐 Preview & Anatomi Tampilan

*Sketsa hierarki dan posisi relatif berdasarkan AutoLayout production (bukan screenshot berskala):*

```text
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │              titleLabel              │  │  ← titleLabel (Judul Kredit Siklus)
│  │                                      │  │
│  │                  ┌─────────────────┐ │  │
│  │                  │hideCutImageView │ │  │  ← hideCutImageView (Badge diskon)
│  │                  └─────────────────┘ │  │
│  │             amountLabel              │  │  ← amountLabel (Nominal Limit Siklus)
│  │                                      │  │
│  │               rpLabel                │  │  ← rpLabel (Label Nominal Sekunder)
│  │                                      │  │
│  │       ┌──────────────────────┐       │  │
│  │       │     applyButton      │       │  │  ← applyButton (Tombol CTA Siklus)
│  │       └──────────────────────┘       │  │
│  │                                      │  │
│  │              tipsLabel               │  │  ← tipsLabel (Keterangan Footer)
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- **Layout Container:** Kartu putih dengan sudut `radius: 8.0` dan bayangan oranye. Inset atas, kiri, dan kanan bernilai `20`.
- **Tata Letak Elemen:**
  - `titleLabel`: Teks judul rata tengah dengan font Bold General warna `TextGeneralColor`.
  - `amountLabel`: Nominal angka besar menggunakan font `DINPro-Bold` ukuran 56.
  - `rpLabel`: Label keterangan nominal sekunder di bawah nominal dengan background oranye muda.
  - `applyButton`: Tombol oranye tinggi 42 di bawah nominal/label.
  - `tipsLabel`: Teks petunjuk tambahan di bawah tombol CTA.

### Kategori Komponen Data
- **Judul Siklus (`titleLabel`):** API (`circularCreditResp.title`).
- **Nominal Limit (`amountLabel`):** API (`circularCreditResp.availableAmount`).
- **Nominal Sekunder (`rpLabel`):** API (`circularCreditResp.nominalAmount`).
- **Badge Diskon (`hideCutImageView`):** Statis asset (`home_hidecut_icon`), tampil jika `hideCut == "1"` dan `hitDisplayAmountAb == "1"`.
- **Tombol CTA (`applyButton`):** API (`circularCreditResp.btnText`).
- **Petunjuk Footer (`tipsLabel`):** API (`circularCreditResp.tips`).

### Logika Exposure & Tap
- **Exposure / View Events:** Jika `dialogResp` tersedia dan `creditState == "1"`:
  - Tipe `.overdue`: memicu event view `IDCustomEventHomeCycleKey.home_cycle_over_orig`.
  - Tipe `.orderLimit`: memicu event view `IDCustomEventHomeCycleKey.home_cycle_ungetmore_orig`.
- **Tap CTA:** Aksi tombol dilindungi *throttle* 1000 ms:
  - Memanggil `interactiveDelegate.jumpCycle(cycleModel)`.
  - Memicu analitik injeksi (`clickInjectPoints`): `home_cycle_over_orig_apply`, `home_cycle_ungetmore_orig_apply`, atau `home_Cycle_Orig_Apply`.

---

## 🧪 Fixture & Skenario Uji

---

### 🟢 Kasus A — Kredit Siklus Standar

- 🎯 **Trigger / Kondisi:** `circularCreditResp` terisi data aktif dan `creditState == "1"`.
- 📱 **Expected Result:** Judul `Kredit Siklus Fleksibel`, nominal `Rp 3.000.000`, tombol `Ambil Sekarang` aktif (enabled).
- 👆 **Interaksi:** Tap tombol CTA mencatat `home_Cycle_Orig_Apply` lalu memanggil `jumpCycle`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "CIRCULAR_CREDIT",
      "title": "Limit Utama",
      "amount": "3000000",
      "buttonText": "Ambil Sekarang",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-cycle-001",
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
      "availableAmount": "3000000",
      "btnText": "Ambil Sekarang",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "1",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "500000",
      "nominalAmount": "3000000",
      "tips": "Bunga dihitung harian sesuai pemakaian",
      "title": "Kredit Siklus Fleksibel",
      "hideCut": "0",
      "confirmStepStyle": null
    },
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.status`, objek `circularCreditResp`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji rendering lengkap komponen kredit siklus standar dan router `jumpCycle`.

---

### 🟢 Kasus B — Override dari Status Lain

- 🎯 **Trigger / Kondisi:** `quotaInfo.status == "EXECUTING_CREDIT_GRANTED"`, tetapi `circularCreditResp != null`.
- 📱 **Expected Result:** Layar mengabaikan cell normal dan tetap merender `IDAmountCycleLoanViewCell`.
- 👆 **Interaksi:** Tap memanggil `jumpCycle`.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "EXECUTING_CREDIT_GRANTED",
      "title": "Limit Reguler",
      "amount": "5000000",
      "buttonText": "Ajukan",
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-cycle-override-001",
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
      "availableAmount": "5000000",
      "btnText": "Gunakan Kuota Siklus",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "1",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "500000",
      "nominalAmount": "5000000",
      "tips": null,
      "title": "Kredit Siklus",
      "hideCut": "0",
      "confirmStepStyle": null
    },
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `quotaInfo.status` adalah status reguler, namun `circularCreditResp` terisi.
- 🎯 **Alasan / Hasil yang diuji:** Membuktikan kekuatan override circular credit terhadap seluruh cabang switch.

---

### 🟢 Kasus C — Limit Terkunci (`creditState == "2"`)

- 🎯 **Trigger / Kondisi:** `availableAmount` memuat karakter sensor `*` dan `creditState == "2"`.
- 📱 **Expected Result:** Nominal limit tersensor (misal `***`), tombol CTA menjadi non-aktif / tidak dapat diklik (`isEnabled == false`).
- 👆 **Interaksi:** Tombol tidak dapat ditekan.
- 🏷️ **Provenance:** `MOCK UI TEST — not observed BE response` \| `FULL HTTP ENVELOPE — ready for Proxyman / Map Local`

```json
{
  "code": "200",
  "msg": "",
  "sign": "c5eece0413417b9d71c5d3c2c7a60246",
  "result": {
    "quotaInfo": {
      "status": "CIRCULAR_CREDIT",
      "title": null,
      "amount": null,
      "buttonText": null,
      "virtualAmountTitle": null,
      "virtualCreditAmount": null,
      "descContent": null,
      "countDownTimeStamp": null,
      "dueDate": null,
      "hitFancyPlusWhiteList": null,
      "step": null,
      "bizId": "biz-mock-cycle-locked-001",
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
      "availableAmount": "******",
      "btnText": "Kuota Dibekukan",
      "colorCreditTips": null,
      "colorTips": null,
      "creditState": "2",
      "creditTips": null,
      "dialogResp": null,
      "hits": null,
      "minAmount": "0",
      "nominalAmount": "0",
      "tips": "Selesaikan kewajiban untuk membuka kunci kuota",
      "title": "Kredit Siklus",
      "hideCut": "0",
      "confirmStepStyle": null
    },
    "benefitSpeedUpSign": null,
    "hitDisplayAmountAb": null,
    "skipInfoPage": "0",
    "oneClickLoan": "0"
  }
}
```

- 🔄 **Yang diubah:** `circularCreditResp.availableAmount` disensor bintang, `creditState` disetel ke `"2"`.
- 🎯 **Alasan / Hasil yang diuji:** Menguji penonaktifan tombol `applyButton.isEnabled = false`.

---

## ✅ Verifikasi & Batasan

- [x] Selector override `dataModel.circularCredit != nil` diverifikasi langsung pada `IDLoanService.swift`.
- [x] Binding komponen dan percabangan dialog response diverifikasi pada `IDAmountCycleLoanViewCell.swift`.
- [x] Seluruh fixture JSON terbukti valid secara sintaksis model Swift client.

