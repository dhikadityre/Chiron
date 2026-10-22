# iOS Application Startup Sequence Glossary

Kamus istilah kanonikal, nama class, method, protokol delegasi, dan kunci persistensi yang mengatur seluruh alur startup pada SAMIR iOS.

## Istilah & Komponen Codebase

**IDSamirMainModule**:
Class modul utama di dalam sub-proyek `SamirMainModule` yang bertindak sebagai receiver delegasi siklus hidup `UIApplicationDelegate` yang diteruskan dari `CZModuleManager`.

**checkAppStartHide**:
Method evaluasi boolean di `IDSamirMainModule` untuk menentukan apakah layar splash screen perlu dilewati (`true`) atau wajib ditampilkan (`false`).

**APP_Start_Hide**:
Key di `UserDefaults` bertipe String (`"1"` atau `"0"`) yang menyimpan cache lokal konfigurasi penonaktifan splash screen hasil sinkronisasi dari endpoint `app-configuration`.

**FlutterEngineManager.shared.prewarm()**:
Method singleton yang membangkitkan instance tunggal Dart VM dan Flutter runtime di latar belakang sebelum tab atau layar Flutter dibuka oleh user.

**IDLaunchViewController**:
ViewController sementara yang menyajikan tampilan splash screen promosi selama 3 detik dilengkapi tombol hitung mundur *"Lewati Ns"*.

**IDLaunchViewProtocol**:
Protokol delegasi antara `IDLaunchViewController` dan `IDSamirMainModule` yang memicu fungsi `finishLaunch()` saat hitung mundur berakhir atau tombol lewati ditekan.

**Samir_DeepLink_Str**:
Key penyimpanan string URL sementara di `UserDefaults` untuk menahan *deep link* saat aplikasi diluncurkan dari kondisi mati (*cold start*), dieksekusi setelah `IDMainTabBarController` aktif.

## Konsep Arsitektur

**Single Responsibility Principle (SRP)**:
Prinsip bahwa sebuah class hanya boleh memiliki satu alasan untuk berubah. Pada startup existing, `IDSamirMainModule` melanggar SRP karena merangkap tugas orkestrasi SDK, konfigurasi window, penanganan deep link, dan cache reading.

**Composite Startup Pattern**:
Pola arsitektur yang mereduksi method raksasa `didFinishLaunchingWithOptions` menjadi sekumpulan task independen yang mengadopsi protokol bersama (`AppStartupTask`).

**Dependency Inversion Principle (DIP)**:
Prinsip bahwa modul tingkat tinggi tidak boleh bergantung langsung pada implementasi konkret pihak ketiga, melainkan pada abstraksi atau protokol injeksi.
