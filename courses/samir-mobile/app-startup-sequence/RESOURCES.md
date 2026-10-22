# iOS Application Startup Sequence Resources

## Codebase Sources (GitLab: learn/iOS-Arch & Workspace)

- [IDSamirMainModule.swift](http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift#L54-L129)
  Core module lifecycle handler yang menjalankan 11 langkah inisialisasi SDK, penentuan root window, dan pendaftaran remote notifications.
- [FlutterEngineManager.swift](http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/IDSamirLoan/Application/SamirCommonModule/Classes/FChannel/FlutterEngineManager.swift#L27-L158)
  Single engine manager yang mem-booting Dart VM runtime di background (`prewarm()`) dan memegang penjagaan crash `precondition(hasRun)`.
- [IDLaunchViewController.swift](http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDController/IDLaunchViewController.swift)
  Layar splash screen dengan hitung mundur 3 detik dan tombol 'Lewati' yang memicu callback delegasi `IDLaunchViewProtocol`.
- [IDMainTabBarController.swift](http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDController/IDMainTabBarController.swift)
  Root container controller pasca-startup yang menyusun 3 tab native dan memasang host container Flutter Engine.
- [03-startup-sequence-and-initial-routing.md](file:///Users/samir/Documents/Workspace/SAMIR/Documentation/docs-learning-curve/iOS/02-understanding-app-startup/03-startup-sequence-and-initial-routing.md)
  Dokumentasi acuan SSOT pada learning curve iOS SAMIR.

## Knowledge & External References

- [Apple Developer: UIApplicationDelegate](https://developer.apple.com/documentation/uikit/uiapplicationdelegate)
  Dokumentasi resmi Apple mengenai siklus hidup peluncuran aplikasi iOS dan delegasi window.
- [Flutter Dev: Pre-warming the Flutter engine](https://docs.flutter.dev/add-to-app/ios/add-flutter-screen#pre-warm-the-flutterengine)
  Panduan resmi pemanasan FlutterEngine di iOS untuk menghilangkan latensi dan flicker peluncuran awal.
- [Refactoring Guru: Composite Pattern](https://refactoring.guru/design-patterns/composite)
  Pola desain komposit untuk memecah inisialisasi monolitik startup menjadi tugas-tugas kecil independen.

## Wisdom (Best Practice Guides)

- **Clean Architecture iOS**: *Separation of Concerns* pada AppDelegate & SceneDelegate — mencegah god object.
- **Micro-Task Startup Architecture**: Standar industri (Uber / Google style app launch pipelines) untuk eksekusi inisialisasi asynchronous dan terukur.
