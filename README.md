# Keşiş Kafe Yönetim ve Stok Takip Sistemi

Bu proje, bir tekstil firması veya kafe işletmeleri için geliştirilmiş, veri odaklı bir **Karar Destek Sistemi (KDS)** ve **Stok/Personel Yönetim** uygulamasıdır. Ürün satışları, stok durumları, personel takibi ve finansal raporlamalar gibi kritik operasyonları dijitalleştirerek yöneticilerin stratejik kararlar almasını kolaylaştırır.

![Sürüm](https://img.shields.io/badge/version-1.0.0-blue)
![Lisans](https://img.shields.io/badge/license-MIT-green)

## 🚀 Özellikler

*   **Rol Tabanlı Erişim:** Yönetici ve Kasiyer için özelleştirilmiş paneller.
*   **Stok & Reçete Yönetimi:** Satış yapıldığında ürün reçetelerine göre otomatik stok düşüşü.
*   **Karar Destek Sistemi:** Düşük performanslı ürünler ve mağazalar için yapay zeka destekli öneriler (Tedavülden kaldır, Kampanya yap vb.).
*   **Personel Takibi:** Giriş-çıkış logları, vardiya yönetimi ve otomatik maaş hesaplama.
*   **İleri Seviye Raporlama:** Günlük, haftalık, aylık satış grafikleri, Z-Raporu ve ciro analizleri.
*   **Tedarik Zinciri:** Toptancı yönetimi ve kritik stok seviyelerinde otomatik sipariş oluşturma.

## 🛠️ Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

*   [Node.js](https://nodejs.org/) (v14 veya üzeri)
*   [MySQL](https://www.mysql.com/)

### Adım Adım

1.  **Depoyu Klonlayın**
    ```bash
    git clone https://github.com/kullaniciadi/stok-takip.git
    cd stok-takip
    ```

2.  **Bağımlılıkları Yükleyin**
    ```bash
    npm install
    ```

3.  **Veritabanını Hazırlayın**
    *   MySQL'de `kesis_cafe` adında bir veritabanı oluşturun.
    *   Proje kök dizinindeki `kesis_cafe.sql` dosyasını içe aktarın.

4.  **Çevresel Değişkenleri Ayarlayın**
    `.env.example` dosyasının adını `.env` olarak değiştirin ve kendi ayarlarınızı girin:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=sifreniz
    DB_NAME=kesis_cafe
    JWT_SECRET=gizli_anahtariniz
    ```

5.  **Uygulamayı Başlatın**
    ```bash
    npm start
    # veya geliştirme modunda
    npm run dev
    ```
    Tarayıcınızda `http://localhost:3000` adresine gidin.

## 📖 Kullanım Senaryosu

1.  **Giriş:**
    *   Yönetici: `/login/admin`
    *   Kasiyer: `/login/cashier`

2.  **Yönetici Paneli:**
    *   Dashboard üzerinden anlık ciro ve stok durumunu izleyin.
    *   **Stok** sayfasından azalan malzemeleri kontrol edin ve **Tedarik** sayfasından sipariş verin.
    *   **Raporlar** sayfasından gün sonu raporunu (Z-Raporu) alın.

3.  **Kasiyer Ekranı:**
    *   `/cashier` sayfasından hızlı satış yapın.
    *   Satılan ürünlerin stokları otomatik olarak güncellenir.

## 📂 Proje Yapısı

```
stok-takip/
├── config/             # Veritabanı bağlantı ayarları
├── controllers/        # İş mantığı ve kontrolcüler
├── middleware/         # Auth ve upload ara yazılımları
├── models/             # Veritabanı modelleri
├── routes/             # API ve sayfa rotaları
├── views/              # HTML/Frontend dosyaları
├── .env                # Çevresel değişkenler
└── index.js            # Giriş noktası
```

## 📝 API Dokümantasyonu

Proje, frontend ile haberleşmek için RESTful API yapısını kullanır. Detaylı API listesi için proje kök dizinindeki `PROJE_RAPORU.md` dosyasını inceleyebilirsiniz.

**Örnek Endpointler:**

*   `POST /api/auth/login` - Kullanıcı girişi
*   `GET /api/products` - Tüm ürünleri listele
*   `GET /api/sales/daily` - Günlük satış verileri
