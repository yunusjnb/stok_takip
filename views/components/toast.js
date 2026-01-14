/**
 * Toast Notification System
 * Kullanıcıya bildirim göstermek için kullanılan toast mesaj sistemi
 * Alert'lerin yerine kullanılır - daha iyi kullanıcı deneyimi sağlar
 */
class Toast {
  constructor() {
    this.container = null; // Toast mesajlarının gösterileceği container
    this.init();
  }

  /**
   * Toast container'ı oluşturur veya mevcut olanı alır
   * Sayfanın sağ üst köşesine sabitlenmiş bir container oluşturur
   */
  init() {
    // Eğer container yoksa oluştur
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
      document.body.appendChild(container);
      this.container = container;
    } else {
      // Mevcut container'ı al
      this.container = document.getElementById('toast-container');
    }
  }

  /**
   * Toast mesajı gösterir
   * @param {string} message - Gösterilecek mesaj
   * @param {string} type - Mesaj tipi: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Otomatik kapanma süresi (milisaniye), 0 = otomatik kapanmaz
   * @returns {HTMLElement} - Oluşturulan toast elementi
   */
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    
    // Mesaj tipine göre arka plan rengi
    const bgColor = {
      success: 'bg-primary',      // Başarılı işlemler için yeşil
      error: 'bg-red-500',         // Hatalar için kırmızı
      warning: 'bg-yellow-500',    // Uyarılar için sarı
      info: 'bg-blue-500'          // Bilgilendirme için mavi
    }[type] || 'bg-gray-500';

    // Mesaj tipine göre ikon
    const icon = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    }[type] || 'info';

    // Toast elementini oluştur - başlangıçta sağdan dışarıda (görünmez)
    toast.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px] transform transition-all duration-300 ease-in-out translate-x-full opacity-0`;
    toast.innerHTML = `
      <span class="material-symbols-outlined">${icon}</span>
      <span class="flex-1 text-sm font-medium">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20">
        <span class="material-symbols-outlined text-lg">close</span>
      </button>
    `;

    this.container.appendChild(toast);

    // Animasyon: Toast'u sağdan içeri kaydır (fade-in efekti)
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    }, 10);

    // Otomatik kaldır - belirtilen süre sonra toast'u kaldır
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }

    return toast;
  }

  /**
   * Toast mesajını kaldırır (animasyonlu)
   * @param {HTMLElement} toast - Kaldırılacak toast elementi
   */
  remove(toast) {
    // Çıkış animasyonu: sağa kaydır ve fade-out
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300); // Animasyon süresi
  }

  /**
   * Başarı mesajı gösterir
   * @param {string} message - Gösterilecek mesaj
   * @param {number} duration - Otomatik kapanma süresi (varsayılan: 3000ms)
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Hata mesajı gösterir
   * @param {string} message - Gösterilecek mesaj
   * @param {number} duration - Otomatik kapanma süresi (varsayılan: 4000ms - hatalar daha uzun gösterilir)
   */
  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  /**
   * Uyarı mesajı gösterir
   * @param {string} message - Gösterilecek mesaj
   * @param {number} duration - Otomatik kapanma süresi (varsayılan: 3000ms)
   */
  warning(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Bilgilendirme mesajı gösterir
   * @param {string} message - Gösterilecek mesaj
   * @param {number} duration - Otomatik kapanma süresi (varsayılan: 3000ms)
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }
}

// Global instance - tüm sayfalarda kullanılabilir
const toast = new Toast();

