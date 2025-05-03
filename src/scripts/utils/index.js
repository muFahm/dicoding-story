import CONFIG from '../config';

export function showFormattedDate(date, locale = CONFIG.DEFAULT_LANGUAGE, options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function getUserData() {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');

    if (userData && userData.expiry && userData.expiry < Date.now()) {
      clearUserData();
      return null;
    }

    return userData;
  } catch (error) {
    debugLog('Error parsing user data from localStorage:', error);
    return null;
  }
}

export function isUserLoggedIn() {
  const userData = getUserData();
  return userData !== null && userData.token !== undefined;
}

export function saveUserData(userData, remember = false) {
  try {
    if (remember) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const dataWithExpiry = {
        ...userData,
        expiry: expiryDate.getTime(),
      };

      localStorage.setItem('userData', JSON.stringify(dataWithExpiry));
    } else {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  } catch (error) {
    debugLog('Error saving user data to localStorage:', error);
  }
}

export function clearUserData() {
  try {
    localStorage.removeItem('userData');
    // Arahkan ke halaman login setelah logout
    window.location.hash = '#/login';
  } catch (error) {
    debugLog('Error clearing user data from localStorage:', error);
  }
}

// Tambahkan fungsi logout yang terpisah
export function handleLogout() {
  // Hapus data user dari localStorage
  clearUserData();
  
  // Tambahkan notifikasi
  showNotification('Berhasil', 'Anda telah keluar dari sistem', 'success');
}

export function loadMapScript() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    fetch('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    })
    .then(() => {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

      script.onload = () => {
        debugLog('Leaflet script loaded successfully');
        resolve(window.L);
      };

      script.onerror = (error) => {
        debugLog('Failed to load Leaflet script:', error);
        reject(new Error('Failed to load map library. Please check your internet connection.'));
      };

      document.head.appendChild(script);
    })
    .catch((error) => {
      debugLog('Failed to fetch Leaflet CSS:', error);
      reject(new Error('Failed to load map resources. Please check your internet connection.'));
    });
  });
}

export function initCamera(videoElement) {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error('Browser Anda tidak mendukung penggunaan kamera. Coba gunakan browser modern seperti Chrome, Firefox, atau Edge terbaru.'));
      return;
    }

    const constraints = {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'environment'
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => {
              resolve(stream);
            })
            .catch((error) => {
              debugLog('Error playing video:', error);
              reject(new Error('Gagal memulai kamera: ' + error.message));
            });
        };

        videoElement.onerror = (error) => {
          debugLog('Video element error:', error);
          reject(new Error('Terjadi kesalahan pada elemen video: ' + error.message));
        };
      })
      .catch((error) => {
        debugLog('getUserMedia error:', error);

        let errorMessage = 'Gagal mengakses kamera: ';

        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += 'Izin kamera ditolak. Harap berikan izin kamera di pengaturan browser Anda.';
            break;
          case 'NotFoundError':
            errorMessage += 'Tidak ada kamera yang ditemukan pada perangkat Anda.';
            break;
          case 'NotReadableError':
            errorMessage += 'Kamera sedang digunakan oleh aplikasi lain.';
            break;
          case 'OverconstrainedError':
            errorMessage += 'Kamera tidak mendukung kualitas yang diminta.';
            break;
          case 'AbortError':
            errorMessage += 'Akses kamera dibatalkan.';
            break;
          default:
            errorMessage += error.message || 'Error tidak diketahui.';
        }

        reject(new Error(errorMessage));
      });
  });
}

export function captureImage(videoElement, canvasElement) {
  const canvas = canvasElement;
  const context = canvas.getContext('2d');

  try {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengambil gambar. Silakan coba lagi.'));
        }
      }, 'image/jpeg', 0.8);
    });
  } catch (error) {
    debugLog('Error capturing image:', error);
    return Promise.reject(new Error('Gagal mengambil gambar: ' + error.message));
  }
}

export function stopCamera(stream) {
  if (stream) {
    try {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      debugLog('Camera stopped successfully');
    } catch (error) {
      debugLog('Error stopping camera:', error);
    }
  }
}

export function checkBrowserSupport() {
  const support = {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    geolocation: !!navigator.geolocation,
    localStorage: !!window.localStorage,
    viewTransition: !!document.startViewTransition,
  };

  const unsupported = Object.entries(support)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);

  return {
    fullSupport: unsupported.length === 0,
    support,
    unsupported,
  };
}

export function debugLog(...args) {
  if (CONFIG.DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

export function showNotification(title, message, type = 'success') {
  // Menggunakan alert untuk notifikasi sederhana
  alert(`${title}: ${message}`);
}

// Fungsi untuk memproses file gambar dari galeri dengan perbaikan
export function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.match('image.*')) {
      reject(new Error('File harus berupa gambar (jpg, png, gif, dll)'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize jika gambar terlalu besar
        const MAX_SIZE = 1600;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Konversi ke blob dengan kualitas yang baik
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Tambahkan properti name agar sesuai dengan ekspektasi API
              blob.name = file.name || 'photo.jpg';
              resolve(blob);
            } else {
              reject(new Error('Gagal memproses gambar'));
            }
          }, 
          'image/jpeg',  // Format output
          0.85  // Kualitas (0-1)
        );
      };

      img.onerror = () => {
        reject(new Error('Gagal memuat gambar'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar'));
    };

    reader.readAsDataURL(file);
  });
}

// Fungsi khusus untuk menangani file dari galeri
export function handleGalleryFile(fileInputElement, previewImageElement) {
  return new Promise((resolve, reject) => {
    try {
      if (!fileInputElement || !fileInputElement.files || fileInputElement.files.length === 0) {
        reject(new Error('Tidak ada file yang dipilih'));
        return;
      }
      
      const file = fileInputElement.files[0];
      
      // Validasi tipe file
      if (!file.type.match('image.*')) {
        reject(new Error('File harus berupa gambar (jpg, png, gif, dll)'));
        return;
      }
      
      // Proses file gambar
      processImageFile(file)
        .then(blob => {
          // Tampilkan preview jika ada elemen untuk itu
          if (previewImageElement) {
            const imageUrl = URL.createObjectURL(blob);
            previewImageElement.src = imageUrl;
            previewImageElement.style.display = 'block';
            
            // Bersihkan URL object saat image sudah dimuat
            previewImageElement.onload = () => {
              URL.revokeObjectURL(imageUrl);
            };
          }
          
          resolve(blob);
        })
        .catch(error => {
          reject(error);
        });
    } catch (error) {
      reject(new Error(`Gagal memproses file dari galeri: ${error.message}`));
    }
  });
}

// Tambahkan fungsi ini ke file utils/index.js

/**
 * Fungsi untuk mendapatkan header otorisasi dari localStorage
 * @returns {Object} Object berisi header Authorization dengan token
 */
export function getAuthorizationHeader() {
  try {
    const userData = getUserData();
    
    if (!userData || !userData.token) {
      throw new Error('Token tidak tersedia');
    }
    
    return {
      'Authorization': `Bearer ${userData.token}`,
    };
  } catch (error) {
    debugLog('Error mendapatkan header otorisasi:', error);
    throw error;
  }
}