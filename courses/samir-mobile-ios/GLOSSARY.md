# SAMIR Mobile iOS Glossary

Kamus istilah kanonikal, nama class, method, protokol delegasi, dan konfigurasi persistensi pada SAMIR iOS.

## Komponen & Modul Codebase
- **IDSamirMainModule**: Modul utama UIKit yang bertindak sebagai receiver delegasi siklus hidup `UIApplicationDelegate`.
- **CZModuleManager**: Modul arsitektur berbasis komponen untuk registrasi sub-modul startup dan inter-module messaging.
- **FlutterEngineManager**: Singleton manajer untuk membangkitkan instance tunggal Dart VM di latar belakang (`prewarm()`).
- **IDMainTabBarController**: Root tab controller yang menyatukan tab native Swift (Home) dan tab host Flutter (Repay & Mine).
- **IDRouterManager**: Modul routing terpusat untuk dispatch URL scheme dan deep link.
- **APP_Start_Hide**: Key persistensi `UserDefaults` untuk menentukan apakah splash screen promosi wajib ditampilkan.
- **Samir_DeepLink_Str**: Key penyimpanan string URL sementara untuk menahan *cold-start deep link*.

## Standar & Arsitektur
- **Single Responsibility Principle (SRP)**: Prinsip pemisahan tanggung jawab agar class tidak menjadi god object.
- **Dependency Inversion Principle (DIP)**: Modul tingkat tinggi wajib bergantung pada abstraksi protokol, bukan implementasi konkret.
- **Composite Startup Task**: Pola pemecahan inisialisasi monolitik startup menjadi serangkaian task mandiri yang testable.
