/**
 * Sidebar Component Loader
 * Sidebar bileşenini dinamik olarak yükler ve aktif navigasyon öğesini ayarlar
 * Tüm admin sayfalarında kullanılan ortak sidebar bileşeni
 */

/**
 * Sidebar HTML'ini yükler ve sayfaya ekler
 * Fade-in animasyonu ile görünür hale getirir
 * Aktif menü öğesini belirler ve sayfa geçişlerini ayarlar
 */
async function loadSidebar() {
  try {
    // Sidebar HTML dosyasını fetch et
    const response = await fetch('/components/sidebar.html');
    if (!response.ok) {
      throw new Error('Sidebar component could not be loaded');
    }
    const sidebarHTML = await response.text();
    
    // Sidebar container'ı bul
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
      console.error('Sidebar container not found');
      return;
    }
    
    // Sidebar HTML'ini ekle - fade-in efekti için başlangıçta görünmez yap
    sidebarContainer.style.opacity = '0';
    sidebarContainer.style.transition = 'opacity 0.3s ease-in';
    sidebarContainer.innerHTML = sidebarHTML;
    
    // Fade-in animasyonu: sidebar'ı görünür yap
    setTimeout(() => {
      sidebarContainer.style.opacity = '1';
    }, 50);
    
    // Mevcut sayfaya göre aktif menü öğesini ayarla
    setActiveNavItem();
    
    // Navigasyon linklerine smooth geçiş efektleri ekle
    addSmoothTransitions();
    
    // Çıkış butonuna özel işlev ekle
    setupLogoutButton();
  } catch (error) {
    console.error('Error loading sidebar:', error);
  }
}

/**
 * Navigasyon linklerine smooth sayfa geçiş efektleri ekler
 * Link tıklandığında main içeriği fade-out yapar, sonra sayfayı yükler
 * Bu sayede sayfa geçişleri daha yumuşak görünür
 */
function addSmoothTransitions() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Hash link veya boş link ise işlem yapma
      if (!href || href === '#' || href.startsWith('#')) {
        return;
      }
      
      // Varsayılan navigasyonu engelle
      e.preventDefault();
      
      // Main içeriği fade-out yap (sayfa geçişi için)
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.transition = 'opacity 0.2s ease-out';
        mainContent.style.opacity = '0';
      }
      
      // Kısa bir gecikme sonrası sayfayı yükle (fade-out animasyonu için)
      setTimeout(() => {
        window.location.href = href;
      }, 150);
    });
  });
}

/**
 * Mevcut sayfaya göre aktif navigasyon öğesini belirler ve vurgular
 * URL path'ine göre hangi menü öğesinin aktif olacağını belirler
 * Aktif öğe farklı renk ve stil ile gösterilir
 */
function setActiveNavItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    const icon = link.querySelector('.material-symbols-outlined');
    
    // Tüm linkleri varsayılan duruma getir (smooth transition ile)
    link.style.transition = 'all 0.2s ease-in-out';
    link.classList.remove('bg-primary-light', 'text-primary-darker');
    link.classList.add('text-text-secondary', 'hover:text-text-primary');
    if (icon) {
      icon.style.transition = 'all 0.2s ease-in-out';
      icon.classList.remove('fill'); // İkon dolgu stilini kaldır
    }
    
    // Mevcut path bu link ile eşleşiyorsa aktif yap
    if (linkPath && currentPath.startsWith(linkPath)) {
      link.classList.add('bg-primary-light', 'text-primary-darker');
      link.classList.remove('text-text-secondary', 'hover:text-text-primary');
      if (icon) {
        icon.classList.add('fill'); // Aktif ikon için dolgu stili ekle
      }
    }
  });
}

/**
 * Çıkış butonunu ayarla
 * Çıkış yapıldığında localStorage temizlenir ve welcome sayfasına yönlendirilir
 */
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Onay al
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      // localStorage'ı temizle
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      
      // Welcome sayfasına yönlendir
      window.location.href = '/welcome';
    }
  });
}

/**
 * Sayfa yüklendiğinde main içeriğe fade-in efekti ekler
 * Sayfa ilk açıldığında içerik yumuşak bir şekilde görünür hale gelir
 */
function addPageFadeIn() {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    // Başlangıçta görünmez yap
    mainContent.style.opacity = '0';
    mainContent.style.transition = 'opacity 0.3s ease-in';
    
    // Kısa gecikme sonrası görünür yap (fade-in)
    setTimeout(() => {
      mainContent.style.opacity = '1';
    }, 50);
  }
}

// Sidebar'ı DOM hazır olduğunda yükle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
    addPageFadeIn();
  });
} else {
  loadSidebar();
  addPageFadeIn();
}

