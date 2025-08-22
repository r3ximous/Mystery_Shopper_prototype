// PWA Installation and Mobile Features
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/static/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.hideInstallButton();
    });

    // Mobile-specific features
    this.setupMobileFeatures();
  }

  showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install';
    installBtn.className = 'install-btn';
    installBtn.textContent = '📱 Install App';
    installBtn.onclick = () => this.installApp();
    
    const header = document.querySelector('header div:last-child');
    if (header && !document.getElementById('pwa-install')) {
      header.appendChild(installBtn);
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install');
    if (installBtn) installBtn.remove();
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted PWA install');
    }
    
    this.deferredPrompt = null;
  }

  setupMobileFeatures() {
    // Camera access for evidence photos
    if ('mediaDevices' in navigator) {
      this.setupCamera();
    }

    // Vibration for voice feedback
    if ('vibrate' in navigator) {
      this.setupVibration();
    }

    // Device orientation for better UX
    this.setupOrientation();
  }

  setupCamera() {
    // Future: Add camera capture for evidence photos
    // Would integrate with survey submission payload
  }

  setupVibration() {
    // Add haptic feedback to voice interactions
    const originalSpeak = window.speechSynthesis.speak;
    if (originalSpeak) {
      window.speechSynthesis.speak = function(utterance) {
        navigator.vibrate(50); // Short vibration on TTS
        return originalSpeak.call(this, utterance);
      };
    }
  }

  setupOrientation() {
    // Handle orientation changes for better mobile UX
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        window.scrollTo(0, 1); // Hide address bar
      }, 500);
    });
  }

  // Offline submission storage
  async storeOfflineSubmission(data) {
    if (!('indexedDB' in window)) return false;

    try {
      const db = await this.openDB();
      const tx = db.transaction(['submissions'], 'readwrite');
      const store = tx.objectStore('submissions');
      
      await store.add({
        id: Date.now(),
        data: data,
        timestamp: new Date().toISOString()
      });

      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('survey-submission');
      }

      return true;
    } catch (error) {
      console.log('Offline storage failed:', error);
      return false;
    }
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MysteryShopperDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('submissions')) {
          db.createObjectStore('submissions', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize PWA when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
  });
} else {
  window.pwaManager = new PWAManager();
}