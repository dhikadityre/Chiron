# SAMIR Mobile Flutter Glossary

Kamus istilah kanonikal, class presenter, method channel, model data, dan struktur add-to-app pada SAMIR Flutter.

## Komponen & Modul Codebase
- **flutter_app_project**: Nama paket add-to-app Flutter yang di-embed ke dalam aplikasi host native iOS & Android.
- **FlutterNativeChannel**: Bridge MethodChannel untuk pertukaran data dua arah (Auth token, Device Info, Router).
- **RepayHomePage**: Layar tagihan nasabah (`repay_home_page.dart`) yang memuat rincian pinjaman aktif dan kode VA.
- **MineHomePage**: Layar profil nasabah (`mine_home_page.dart`) yang memuat data akun, pengaturan, dan pusat bantuan.
- **DioHttpClient**: Singleton client jaringan dengan interceptor penandatanganan parameter MD5/RSA dan enkripsi payload.
- **Global / SessionState**: Pengelola status sesi otentikasi nasabah yang disinkronkan dari aplikasi host native.

## Standar & Arsitektur
- **Clean Architecture BLoC / Controller**: Pemisahan logika bisnis dari tree widget Flutter.
- **Platform Channel Decoupling**: Abstraksi pemanggilan native ke dalam interface terisolasi agar dapat di-mock saat widget test.
