import { addStory } from '../../data/api';
import { showNotification, getUserData, loadMapScript, initCamera, captureImage, processImageFile, stopCamera } from '../../utils';

export default class AddStoryPage {
  constructor() {
    this._map = null;
    this._currentMarker = null;
    this._cameraStream = null;
    this._imageBlob = null;
    this._location = {
      lat: null,
      lon: null
    };
  }

  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Tambah Cerita Baru</h1>
        
        <div class="form-container">
          <div id="add-story-alert" class="alert" style="display: none;"></div>
          
          <form id="add-story-form">
            <div class="form-group">
              <label for="description" class="form-label">Deskripsi</label>
              <textarea 
                id="description" 
                class="form-input" 
                placeholder="Ceritakan pengalamanmu..." 
                required
                rows="4"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Foto</label>
              
              <div class="camera-section">
                <div class="camera-container">
                  <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                  <canvas id="camera-canvas" style="display: none;"></canvas>
                  <img id="photo-preview" class="photo-preview" src="#" alt="Preview" style="display: none;">
                </div>
                
                <div class="camera-buttons">
                  <button type="button" id="camera-start-button" class="btn btn-primary">
                    <span>Kamera</span>
                  </button>
                  <button type="button" id="gallery-button" class="btn btn-info">
                    <span>Galeri</span>
                  </button>
                  <button type="button" id="camera-capture-button" class="btn btn-success" style="display: none;">
                    <span>Ambil Foto</span>
                  </button>
                  <button type="button" id="camera-reset-button" class="btn btn-danger" style="display: none;">
                    <span>Reset</span>
                  </button>
                </div>
                
                <input type="file" id="gallery-input" accept="image/*" style="display: none;">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Lokasi</label>
              
              <div id="map-container" class="map-container" style="height: 300px;"></div>
              
              <div class="location-info" style="margin-top: 10px;">
                <p id="location-text">Klik pada peta untuk memilih lokasi, atau gunakan lokasi saat ini.</p>
                
                <button type="button" id="current-location-button" class="btn btn-info">
                  <span>Gunakan Lokasi Saat Ini</span>
                </button>
                
                <div class="coordinates-display" style="margin-top: 10px; display: none;" id="coordinates-display">
                  <div class="form-row">
                    <div class="form-group form-group-half">
                      <label for="lat" class="form-label">Latitude</label>
                      <input type="text" id="lat" class="form-input" readonly>
                    </div>
                    <div class="form-group form-group-half">
                      <label for="lon" class="form-label">Longitude</label>
                      <input type="text" id="lon" class="form-input" readonly>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="submit-button">
              Tambah Cerita
            </button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      const form = document.getElementById('add-story-form');
      const submitButton = document.getElementById('submit-button');
      const cameraStartButton = document.getElementById('camera-start-button');
      const cameraCaptureButton = document.getElementById('camera-capture-button');
      const cameraResetButton = document.getElementById('camera-reset-button');
      const cameraPreview = document.getElementById('camera-preview');
      const cameraCanvas = document.getElementById('camera-canvas');
      const photoPreview = document.getElementById('photo-preview');
      const galleryButton = document.getElementById('gallery-button');
      const galleryInput = document.getElementById('gallery-input');
      const currentLocationButton = document.getElementById('current-location-button');
      const coordinatesDisplay = document.getElementById('coordinates-display');
      const latInput = document.getElementById('lat');
      const lonInput = document.getElementById('lon');
      
      // Initialize map
      await this._initMap();
      
      // Camera button event
      if (cameraStartButton) {
        cameraStartButton.addEventListener('click', async () => {
          try {
            cameraStartButton.disabled = true;
            
            // Show video element and capture button
            cameraPreview.style.display = 'block';
            cameraCaptureButton.style.display = 'inline-block';
            cameraResetButton.style.display = 'inline-block';
            photoPreview.style.display = 'none';
            
            // Start camera
            this._cameraStream = await initCamera(cameraPreview);
            cameraCaptureButton.disabled = false;
          } catch (error) {
            showNotification('Error', error.message, 'error');
            cameraStartButton.disabled = false;
          }
        });
      }
      
      // Capture button event
      if (cameraCaptureButton) {
        cameraCaptureButton.addEventListener('click', async () => {
          try {
            // Capture image
            this._imageBlob = await captureImage(cameraPreview, cameraCanvas);
            
            // Show preview
            const imageUrl = URL.createObjectURL(this._imageBlob);
            photoPreview.src = imageUrl;
            photoPreview.style.display = 'block';
            cameraPreview.style.display = 'none';
            
            // Stop camera
            if (this._cameraStream) {
              stopCamera(this._cameraStream);
              this._cameraStream = null;
            }
            
            cameraCaptureButton.style.display = 'none';
          } catch (error) {
            showNotification('Error', error.message, 'error');
          }
        });
      }
      
      // Reset button event
      if (cameraResetButton) {
        cameraResetButton.addEventListener('click', () => {
          // Reset camera and preview
          if (this._cameraStream) {
            stopCamera(this._cameraStream);
            this._cameraStream = null;
          }
          
          this._imageBlob = null;
          photoPreview.style.display = 'none';
          cameraPreview.style.display = 'none';
          cameraCaptureButton.style.display = 'none';
          cameraResetButton.style.display = 'none';
          cameraStartButton.disabled = false;
        });
      }
      
      // Gallery button event
      if (galleryButton && galleryInput) {
        galleryButton.addEventListener('click', () => {
          // Reset camera jika sedang aktif
          if (this._cameraStream) {
            stopCamera(this._cameraStream);
            this._cameraStream = null;
          }
          
          // Tampilkan file picker
          galleryInput.click();
        });
        
        galleryInput.addEventListener('change', async (event) => {
          try {
            if (event.target.files && event.target.files[0]) {
              const file = event.target.files[0];
              
              // Process image
              this._imageBlob = await processImageFile(file);
              
              // Show preview
              const imageUrl = URL.createObjectURL(this._imageBlob);
              photoPreview.src = imageUrl;
              photoPreview.style.display = 'block';
              cameraPreview.style.display = 'none';
              cameraCaptureButton.style.display = 'none';
              cameraResetButton.style.display = 'inline-block';
              
              // Nonaktifkan tombol kamera sementara
              cameraStartButton.disabled = true;
            }
          } catch (error) {
            showNotification('Error', error.message, 'error');
          }
        });
      }
      
      // Current location button event
      if (currentLocationButton) {
        currentLocationButton.addEventListener('click', () => {
          this._getCurrentLocation();
        });
      }
      
      // Form submit event
      if (form) {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          
          // Show loading state
          const originalButtonText = submitButton.textContent;
          submitButton.textContent = 'Mengirim...';
          submitButton.disabled = true;
          
          try {
            // Get form values
            const description = document.getElementById('description').value;
            const photo = this._imageBlob;
            const lat = document.getElementById('lat').value;
            const lon = document.getElementById('lon').value;
            
            // Validasi
            if (!description.trim()) {
              throw new Error('Deskripsi cerita tidak boleh kosong');
            }
            
            if (!photo) {
              throw new Error('Silakan ambil atau pilih foto terlebih dahulu');
            }
            
            // Prepare form data dengan nama file yang tetap
            const formData = new FormData();
            formData.append('description', description);
            
            // Pastikan photo memiliki filename
            const filename = 'photo.jpg';
            const photoFile = new File([photo], filename, { type: 'image/jpeg' });
            formData.append('photo', photoFile);
            
            // Add location if available - pastikan format yang benar (angka, bukan string)
            if (lat && lon) {
              formData.append('lat', parseFloat(lat));
              formData.append('lon', parseFloat(lon));
            }
            
            console.log('Mengirim data cerita baru:', {
              description,
              photoSize: photo.size,
              hasLocation: !!(lat && lon)
            });
            
            // Submit story dengan timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            // Tambahkan loading visual
            const alertDiv = document.getElementById('add-story-alert');
            if (alertDiv) {
              alertDiv.className = 'alert alert-info';
              alertDiv.textContent = 'Sedang mengirim cerita...';
              alertDiv.style.display = 'block';
            }
            
            const response = await addStory(formData);
            clearTimeout(timeoutId);
            
            console.log('Respons API addStory:', response);
            
            if (response.error) {
              throw new Error(response.message || 'Gagal menambahkan cerita');
            }
            
            // Show success notification
            showNotification('Berhasil', 'Cerita berhasil ditambahkan', 'success');
            
            // Reset form dan redirect setelah success
            form.reset();
            photoPreview.style.display = 'none';
            this._imageBlob = null;
            this._resetMapMarker();
            
            // Redirect ke home page dengan refresh untuk memastikan data terbaru
            setTimeout(() => {
              window.location.href = '#/';
              window.location.reload();
            }, 1500);
          } catch (error) {
            console.error('Error adding story:', error);
            showNotification('Error', error.message, 'error');
            
            // Tampilkan error di alert box
            const alertDiv = document.getElementById('add-story-alert');
            if (alertDiv) {
              alertDiv.className = 'alert alert-error';
              alertDiv.textContent = error.message;
              alertDiv.style.display = 'block';
            }
            
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          }
        });
      }
    } catch (error) {
      const container = document.querySelector('.container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Terjadi kesalahan saat memuat halaman tambah cerita.</p>
            <p>${error.message || 'Kesalahan tidak diketahui'}</p>
            <p><a href="#/">Kembali ke beranda</a></p>
          </div>
        `;
      }
    }
  }
  
  async _initMap() {
    try {
      const L = await loadMapScript();
      const mapContainer = document.getElementById('map-container');
      
      if (!mapContainer) {
        throw new Error('Map container not found');
      }
      
      // Initialize map centered on Indonesia
      this._map = L.map('map-container').setView([-2.5489, 118.0149], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this._map);
      
      // Add click event to map
      this._map.on('click', (event) => {
        this._updateMarker(event.latlng.lat, event.latlng.lng);
      });
    } catch (error) {
      throw new Error(`Gagal memuat peta: ${error.message}`);
    }
  }
  
  _updateMarker(lat, lng) {
    try {
      // Format coordinates
      const formattedLat = parseFloat(lat).toFixed(6);
      const formattedLng = parseFloat(lng).toFixed(6);
      
      // Store location
      this._location = {
        lat: formattedLat,
        lon: formattedLng
      };
      
      // Update input fields
      document.getElementById('lat').value = formattedLat;
      document.getElementById('lon').value = formattedLng;
      
      // Show coordinates display
      document.getElementById('coordinates-display').style.display = 'block';
      
      // Update location text
      document.getElementById('location-text').textContent = `Lokasi dipilih: ${formattedLat}, ${formattedLng}`;
      
      // Remove previous marker if exists
      if (this._currentMarker) {
        this._map.removeLayer(this._currentMarker);
      }
      
      // Create custom icon
      const customIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
      
      // Add new marker
      this._currentMarker = L.marker([lat, lng], { icon: customIcon })
        .addTo(this._map)
        .bindPopup('Lokasi cerita')
        .openPopup();
    } catch (error) {
      showNotification('Error', `Gagal memperbarui marker: ${error.message}`, 'error');
    }
  }
  
  _resetMapMarker() {
    try {
      // Clear location
      this._location = {
        lat: null,
        lon: null
      };
      
      // Clear marker
      if (this._currentMarker) {
        this._map.removeLayer(this._currentMarker);
        this._currentMarker = null;
      }
      
      // Reset input fields
      document.getElementById('lat').value = '';
      document.getElementById('lon').value = '';
      
      // Hide coordinates display
      document.getElementById('coordinates-display').style.display = 'none';
      
      // Reset location text
      document.getElementById('location-text').textContent = 'Klik pada peta untuk memilih lokasi, atau gunakan lokasi saat ini.';
    } catch (error) {
      console.error('Error resetting map marker:', error);
    }
  }
  
  _getCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation tidak didukung oleh browser Anda');
      }
      
      const locationButton = document.getElementById('current-location-button');
      const originalButtonText = locationButton.textContent;
      locationButton.textContent = 'Mendapatkan Lokasi...';
      locationButton.disabled = true;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update marker on map
          this._updateMarker(latitude, longitude);
          
          // Center map on current location
          this._map.setView([latitude, longitude], 15);
          
          // Reset button
          locationButton.textContent = originalButtonText;
          locationButton.disabled = false;
        },
        (error) => {
          let errorMessage = 'Gagal mendapatkan lokasi: ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Izin lokasi ditolak.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Informasi lokasi tidak tersedia.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Waktu permintaan lokasi habis.';
              break;
            default:
              errorMessage += 'Kesalahan tidak diketahui.';
          }
          
          showNotification('Error', errorMessage, 'error');
          
          // Reset button
          locationButton.textContent = originalButtonText;
          locationButton.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      showNotification('Error', error.message, 'error');
    }
  }
}