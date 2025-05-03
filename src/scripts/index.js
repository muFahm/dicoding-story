import '../styles/styles.css';
import App from './pages/app';

// Tambahkan state untuk melacak instance App
let appInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Cek apakah browser mendukung View Transitions API
  if (!document.startViewTransition) {
    console.warn('Browser Anda tidak mendukung View Transitions API. Transisi halaman mungkin kurang smooth.');
  }
  
  // Bersihkan instance app sebelumnya jika ada
  if (appInstance) {
    appInstance.cleanup();
    appInstance = null;
  }
  
  // Buat instance app baru
  appInstance = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
    authMenu: document.querySelector('#auth-menu'),
  });
  
  // Tambahkan metode cleanup ke appInstance jika belum ada
  if (!appInstance.cleanup) {
    appInstance.cleanup = function() {
      // Cleanup any resources
      if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
        this.currentPage.cleanup();
      }
      console.log('App instance cleaned up');
    };
  }
  
  // Render halaman initial
  await appInstance.renderPage();
  
  // Hapus event listener lama jika ada
  if (window._hashChangeHandler) {
    window.removeEventListener('hashchange', window._hashChangeHandler);
  }
  
  // Buat handler baru dengan reference yang disimpan
  window._hashChangeHandler = async () => {
    // Gunakan flag untuk menghindari render ganda
    if (appInstance._isRendering) {
      console.log('Render sedang berjalan, abaikan hashchange event');
      return;
    }
    
    // Set flag rendering
    appInstance._isRendering = true;
    
    try {
      await appInstance.renderPage();
    } catch (error) {
      console.error('Error rendering page:', error);
    } finally {
      // Reset flag
      appInstance._isRendering = false;
    }
  };
  
  // Tambahkan event listener baru
  window.addEventListener('hashchange', window._hashChangeHandler);
  
  // Tambahkan service worker jika didukung
  if ('serviceWorker' in navigator) {
    try {
      // Gunakan opsi scope untuk memastikan service worker memiliki cakupan yang benar
      navigator.serviceWorker.register('/service-worker.js', { 
        scope: '/',
        updateViaCache: 'none' // Hindari cache untuk memastikan update terbaru
      }).then(registration => {
        console.log('Service worker registered successfully with scope:', registration.scope);
        
        // Periksa untuk update
        registration.update();
        
        // Tambahkan interval untuk update rutin
        setInterval(() => {
          registration.update();
          console.log('Checking for service worker updates...');
        }, 60 * 60 * 1000); // Periksa tiap jam
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
  
  // Tambahkan handler untuk bereskan resource saat unload
  window.addEventListener('beforeunload', () => {
    if (appInstance) {
      appInstance.cleanup();
    }
  });
});

export class FloatingButton {
  constructor(options = {}) {
    this.options = {
      text: options.text || 'Tambah',
      href: options.href || '#/add',
      icon: options.icon || '+',
      position: options.position || 'bottom-right',
      tooltip: options.tooltip || 'Tambah Cerita Baru',
      onClick: options.onClick || null,
      color: options.color || 'var(--tosca-primary)',
      ...options
    };
    
    this.element = null;
    this._hashChangeHandler = null; // Untuk tracking event listener
    this.create();
  }
  
  create() {
    // Hapus instance yang ada
    this.remove();
    
    // Buat elemen baru
    this.element = document.createElement('div');
    this.element.className = `floating-button floating-button-${this.options.position}`;
    
    // Jika menggunakan href, gunakan link
    if (this.options.href) {
      this.element.innerHTML = `
        <a href="${this.options.href}" class="floating-button-link" aria-label="${this.options.tooltip}">
          ${this.options.icon}
        </a>
      `;
    } else {
      // Gunakan button jika tidak ada href
      this.element.innerHTML = `
        <button class="floating-button-btn" aria-label="${this.options.tooltip}">
          ${this.options.icon}
        </button>
      `;
    }
    
    // Tambahkan tooltip jika diperlukan
    if (this.options.tooltip) {
      const tooltip = document.createElement('span');
      tooltip.className = 'floating-button-tooltip';
      tooltip.textContent = this.options.tooltip;
      this.element.appendChild(tooltip);
      
      // Show tooltip on hover
      this.element.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
      });
      
      this.element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
      });
    }
    
    // Custom styling
    const buttonElement = this.element.querySelector('.floating-button-link, .floating-button-btn');
    if (buttonElement) {
      buttonElement.style.backgroundColor = this.options.color;
    }
    
    // Click handler
    if (this.options.onClick) {
      this.element.querySelector('.floating-button-link, .floating-button-btn')
        .addEventListener('click', this.options.onClick);
    }
    
    // Tambahkan ke DOM
    document.body.appendChild(this.element);
    
    // Definisikan handler untuk hashchange
    this._hashChangeHandler = () => this.remove();
    
    // Clean up on navigation
    window.addEventListener('hashchange', this._hashChangeHandler);
  }
  
  remove() {
    if (this.element && document.body.contains(this.element)) {
      document.body.removeChild(this.element);
    }
    
    // Hapus event listener untuk mencegah memory leak
    if (this._hashChangeHandler) {
      window.removeEventListener('hashchange', this._hashChangeHandler);
      this._hashChangeHandler = null;
    }
  }
}