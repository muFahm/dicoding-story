import { getStoryDetail } from '../../data/api';
import { parseActivePathname } from '../../routes/url-parser';
import { showFormattedDate, loadMapScript, isUserLoggedIn, debugLog } from '../../utils';

export default class DetailStoryPage {
  constructor() {
    this._story = null;
    this._map = null;
    this._mapError = false;
  }

  async render() {
    return `
      <section class="container">
        <div id="story-detail-container">
          <div class="loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const container = document.getElementById('story-detail-container');
    
    try {
      // Redirect if not logged in
      if (!isUserLoggedIn()) {
        window.location.hash = '#/login';
        return;
      }
      
      const { id } = parseActivePathname();
      
      if (!id) {
        throw new Error('ID cerita tidak valid');
      }
      
      const response = await getStoryDetail(id);
      
      if (response.error) {
        throw new Error(response.message || 'Gagal memuat detail cerita');
      }
      
      this._story = response.story;
      
      if (!this._story) {
        throw new Error('Cerita tidak ditemukan');
      }
      
      this._renderStoryDetail(container);
      
      if (this._story.lat && this._story.lon) {
        try {
          await this._initMap();
        } catch (mapError) {
          debugLog('Map initialization error:', mapError);
          this._mapError = true;
          
          // Update the location display to show coordinates instead of map
          const mapContainer = document.getElementById('story-detail-map');
          if (mapContainer) {
            mapContainer.innerHTML = `
              <div class="alert alert-error">
                <p>Gagal memuat peta. Koordinat lokasi: ${this._story.lat.toFixed(6)}, ${this._story.lon.toFixed(6)}</p>
                <p>Error: ${mapError.message || 'Kesalahan tidak diketahui'}</p>
              </div>
            `;
          }
        }
      }
    } catch (error) {
      debugLog('Error fetching story detail:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          <p>Terjadi kesalahan saat memuat detail cerita.</p>
          <p>${error.message || 'Kesalahan tidak diketahui'}</p>
          <p><a href="#/">Kembali ke beranda</a></p>
        </div>
      `;
    }
  }
  
  _renderStoryDetail(container) {
    try {
      if (!this._story) {
        throw new Error('Data cerita tidak tersedia');
      }
      
      container.innerHTML = `
        <div class="story-detail">
          <img 
            src="${this._story.photoUrl}" 
            alt="Cerita dari ${this._story.name}" 
            class="story-detail-image"
            onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400?text=Gambar+Tidak+Tersedia';"
          >
          <div class="story-detail-content">
            <h1 class="story-detail-title">Cerita dari ${this._story.name}</h1>
            
            <div class="story-detail-meta">
              <span class="story-date">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                ${showFormattedDate(this._story.createdAt)}
              </span>
              
              ${this._story.lat && this._story.lon ? `
                <span class="story-location">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  ${this._mapError 
                    ? `Lokasi: ${this._story.lat.toFixed(6)}, ${this._story.lon.toFixed(6)}`
                    : 'Lokasi tersedia'
                  }
                </span>
              ` : ''}
            </div>
            
            <p class="story-detail-description">${this._story.description || 'Tidak ada deskripsi'}</p>
            
            ${this._story.lat && this._story.lon ? `
              <div id="story-detail-map" class="story-detail-map"></div>
            ` : ''}
            
            <div style="margin-top: 20px;">
              <a href="#/" class="btn">Kembali ke Beranda</a>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      debugLog('Error rendering story detail:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          <p>Terjadi kesalahan saat menampilkan detail cerita.</p>
          <p>${error.message || 'Kesalahan tidak diketahui'}</p>
          <p><a href="#/">Kembali ke beranda</a></p>
        </div>
      `;
    }
  }
  
  async _initMap() {
    try {
      const L = await loadMapScript();
      
      // Check if map container still exists (user might have navigated away)
      const mapContainer = document.getElementById('story-detail-map');
      if (!mapContainer) {
        throw new Error('Map container not found');
      }
      
      this._map = L.map('story-detail-map').setView([this._story.lat, this._story.lon], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this._map);
      
      // Add marker for the story location
      const marker = L.marker([this._story.lat, this._story.lon]).addTo(this._map);
      
      marker.bindPopup(`
        <div>
          <h3>${this._story.name}</h3>
          <p>${this._story.description?.substring(0, 50)}${this._story.description?.length > 50 ? '...' : ''}</p>
        </div>
      `).openPopup();
    } catch (error) {
      debugLog('Error initializing map:', error);
      
      const mapContainer = document.getElementById('story-detail-map');
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="alert alert-error">
            <p>Gagal memuat peta. Koordinat lokasi: ${this._story.lat.toFixed(6)}, ${this._story.lon.toFixed(6)}</p>
            <p>Error: ${error.message || 'Kesalahan tidak diketahui'}</p>
          </div>
        `;
      }
      
      throw error; // Re-throw for the caller to handle
    }
  }
}