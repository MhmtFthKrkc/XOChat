# Kendi Sohbetim — Mobil Uygulama (PWA)

Bu, `chat-backend` klasöründeki Python sunucuna bağlanan, telefona
**gerçek bir uygulama gibi kurulabilen** arayüz. App Store/Play Store'a
yüklemiyoruz (o ayrı bir süreç, ücret ve onay gerektirir) — bunun yerine
tarayıcıdan "Ana ekrana ekle" diyerek kuruyorsun, simge telefonunda
diğer uygulamalar gibi duruyor, tam ekran açılıyor.

## Dosyalar

| Dosya | Görevi |
|---|---|
| `index.html` | Giriş/kayıt ekranı + sohbet ekranı |
| `style.css` | Görünüm |
| `app.js` | Backend'e bağlanma, WebSocket, mesajlaşma mantığı |
| `config.js` | **Tek değiştirmen gereken dosya** — backend adresin |
| `manifest.json` | Telefona "bu bir uygulama" bilgisini veren dosya |
| `service-worker.js` | Uygulamanın kurulabilir/hızlı açılır olmasını sağlar |
| `icons/` | Uygulama simgesi |

## Adım 1 — Backend'i deploy et

Önce `chat-backend` klasöründeki README'yi takip edip Python sunucunu
Render.com'a (ücretsiz) yükle. Sana `https://senin-adin.onrender.com`
gibi bir adres verecek.

## Adım 2 — config.js'i güncelle

`config.js` dosyasını aç, şu iki satırı kendi adresinle değiştir:

```js
const BACKEND_HOST = "senin-adin.onrender.com";
const BACKEND_IS_SECURE = true;
```

## Adım 3 — Bu klasörü ücretsiz yayınla (GitHub Pages)

1. GitHub'da yeni bir repo aç (ör. `kendi-sohbetim`).
2. Bu klasördeki dosyaları (`index.html`, `style.css`, `app.js`, `config.js`,
   `manifest.json`, `service-worker.js`, `icons/`) o repoya yükle.
3. Repo ayarlarında **Settings → Pages → Branch: main → Save**.
4. Birkaç dakika sonra `https://kullanici-adin.github.io/kendi-sohbetim/`
   adresinde canlı olur. Bu adres **tamamen senin** — herhangi bir
   Anthropic/Claude bağlantısı yok, GitHub'ın ücretsiz barındırdığı
   kendi dosyaların.

## Adım 4 — Telefona "uygulama" olarak kur

- **Android (Chrome):** Siteyi aç → sağ üst ⋮ menüsü → "Ana ekrana ekle" /
  "Uygulamayı yükle". (Uygulama otomatik olarak bunu bir banner ile de önerecek.)
- **iPhone (Safari):** Siteyi aç → paylaş simgesi (kare + ok) → "Ana Ekrana Ekle".

Kurulduktan sonra simge telefonunda diğer uygulamalar gibi durur, tam ekran
açılır, adres çubuğu görünmez.

## Bunu gerçekten senin yapan şeyler

- Kod tamamen elinde, tek satırına kadar okuyup değiştirebilirsin.
- Sunucu senin Render hesabında, veriler senin veritabanında.
- Arayüz senin GitHub hesabında barındırılıyor.
- Anthropic/Claude'un bu sistemin çalışması için hiçbir rolü yok — ben
  sadece kodu yazdım, çalışan sistem tamamen senin altyapında.

## Gerçek native uygulama (Play Store'da .apk) istersen

Bu mümkün ama farklı bir yol: Python'da **Kivy** ile yazıp **Buildozer**
aracıyla Android APK'ya derlemek gerekir. Derleme işlemi Android SDK/NDK
indirmeyi gerektiriyor ve benim çalıştığım ortamda bunu yapamıyorum —
ama istersen Kivy ile tam kodu yazarım, sen kendi bilgisayarında
(Linux/WSL üzerinde) `buildozer android debug` komutuyla derlersin.
Şu an yaptığımız PWA, çoğu "arkadaş grubu sohbeti" ihtiyacı için
pratikte aynı deneyimi ücretsiz ve anında veriyor.
