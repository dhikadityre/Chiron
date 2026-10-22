# Mission: iOS Application Startup Sequence & Initial Routing

## Why
Memahami, menghafal, dan menguasai alur inisialisasi *cold-start* aplikasi SAMIR iOS (`IDSamirMainModule`), logika evaluasi *splash screen* vs layar utama (`checkAppStartHide`), *prewarming* FlutterEngine di latar belakang, serta mekanisme *pending deep link*, sekaligus mengaudit kelemahan arsitektur monolitik startup untuk di-refactor menggunakan *Composite Startup Task Pattern*.

## Success looks like
- Hafal urutan 11 tahapan inisialisasi di dalam [IDSamirMainModule.swift](file:///Users/samir/Documents/Workspace/SAMIR/Mobile/Develop/samir-mobile-develop/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift#L54-L75).
- Mampu menjelaskan secara tepat bagaimana `checkAppStartHide()` mengevaluasi cache lokal `UserDefaults` dan respons API `app-configuration`.
- Memahami alasan teknis mengapa `FlutterEngineManager.shared.prewarm()` wajib dipanggil sebelum `IDMainTabBarController` dirender.
- Menguasai penanganan *cold-start deep link* melalui key sementara `Samir_DeepLink_Str`.
- Mampu memetakan pelanggaran prinsip SOLID (SRP & DIP) pada kode startup existing dan menyusun blueprint abstraksi `AppStartupTask` yang 100% testable.
- Menyelesaikan seluruh kuis retensi interaktif (Memory Recall & Architectural Decision) dengan skor sempurna.

## Constraints
- Fokus pada *entry point* native iOS (`IDSamirMainModule`, `IDLaunchViewController`, `IDMainTabBarController`) dan jembatan ke Flutter, bukan rendering widget internal Dart.

## Out of scope
- Alur transaksi pinjaman mendalam (KYC Auth, Pengajuan Limit, Billing) yang baru terjadi setelah user login dan berpindah tab.
