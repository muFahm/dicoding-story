import { getAllStories } from "../../data/api";
import {
  showFormattedDate,
  loadMapScript,
  isUserLoggedIn,
  debugLog,
  showNotification,
} from "../../utils";

export default class HomePage {
  constructor() {
    this._stories = [];
    this._map = null;
    this._markers = [];
    this._mapError = false;
    this._page = 1;
    this._isLoading = false;
    this._hasMoreData = true;
    this._storiesPerPage = 5; // Jumlah stories per page
    this._scrollHandler = null; // Untuk menyimpan reference ke scroll handler
  }

  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Cerita Terbaru</h1>
        
        <div class="map-container" id="stories-map"></div>
        
        <div id="stories-container" class="stories-container">
          <div class="loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
        
        <div id="load-more-container" style="text-align: center; margin-top: 20px; display: none;">
          <button id="load-more-button" class="btn btn-primary">Muat Lebih Banyak</button>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storiesContainer = document.getElementById("stories-container");
    const mapContainer = document.getElementById("stories-map");
    const loadMoreContainer = document.getElementById("load-more-container");
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");

    try {
      if (!isUserLoggedIn()) {
        if (storiesContainer) {
          storiesContainer.innerHTML = `
            <div class="alert alert-error">
              <p>Anda perlu <a href="#/login">login</a> untuk melihat cerita.</p>
              <p>Belum punya akun? <a href="#/register">Daftar sekarang</a>.</p>
            </div>
          `;
        }
        if (mapContainer) {
          mapContainer.style.display = "none";
        }
        return;
      }

      const loadMoreButton = document.getElementById("load-more-button");
      if (loadMoreButton) {
        loadMoreButton.addEventListener("click", () => {
          this._loadMoreStories();
        });
      }

      this._setupInfiniteScroll();
      await this._loadStories();

      try {
        await this._initMap();
      } catch (mapError) {
        debugLog("Map initialization error:", mapError);
        this._mapError = true;
        if (mapContainer) {
          mapContainer.innerHTML = `
            <div class="alert alert-error">
              <p>Gagal memuat peta. Mohon periksa koneksi internet Anda.</p>
              <p>Error: ${mapError.message || "Tidak diketahui"}</p>
            </div>
          `;
        }
      }
    } catch (error) {
      debugLog("Error in home page:", error);
      if (storiesContainer) {
        storiesContainer.innerHTML = `
          <div class="alert alert-error">
            <p>Terjadi kesalahan saat memuat cerita.</p>
            <p>${error.message || "Kesalahan tidak diketahui"}</p>
          </div>
        `;
      }
      if (mapContainer) {
        mapContainer.style.display = "none";
      }
    }
  }

  async _loadStories() {
    if (this._isLoading) return;

    this._isLoading = true;
    const storiesContainer = document.getElementById("stories-container");
    const loadMoreContainer = document.getElementById("load-more-container");

    try {
      // Show loading indicator if this is the first page
      if (this._page === 1) {
        if (storiesContainer) {
          storiesContainer.innerHTML = `
            <div class="loading">
              <div class="loading-spinner"></div>
            </div>
          `;
        }
      } else {
        // Add loading indicator at the bottom
        if (loadMoreContainer) {
          const loadingIndicator = document.createElement("div");
          loadingIndicator.className = "loading";
          loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
          loadingIndicator.id = "load-more-spinner";
          loadMoreContainer.appendChild(loadingIndicator);
        }
      }

      // Tambahkan log untuk debugging
      console.log(
        `Memuat cerita halaman ${this._page} dengan ukuran ${this._storiesPerPage}`
      );

      // Fetch stories with better error handling
      const response = await getAllStories({
        page: this._page,
        size: this._storiesPerPage,
        location: 1,
      });

      // Tambahkan log untuk debugging response
      console.log("Response API:", response);

      // Check for API error
      if (response.error) {
        throw new Error(response.message || "Gagal memuat cerita");
      }

      // Check if listStory exists and is an array
      if (!response.listStory || !Array.isArray(response.listStory)) {
        console.error("Format respons API tidak valid:", response);
        throw new Error("Format data cerita tidak valid");
      }

      const newStories = response.listStory;

      // PERBAIKAN: Filter cerita baru untuk menghapus duplikat
      const existingIds = new Set(this._stories.map((story) => story.id));
      const uniqueNewStories =
        this._page > 1
          ? newStories.filter((story) => !existingIds.has(story.id))
          : newStories;

      console.log(
        `Ditemukan ${
          newStories.length - uniqueNewStories.length
        } cerita duplikat`
      );

      // Gabungkan cerita jika bukan halaman pertama
      if (this._page === 1) {
        this._stories = uniqueNewStories;
      } else {
        this._stories = [...this._stories, ...uniqueNewStories];
      }

      // Periksa apakah masih ada data tambahan
      this._hasMoreData = newStories.length === this._storiesPerPage;

      // Render cerita
      if (this._stories.length > 0) {
        await this._renderStories(this._page > 1, uniqueNewStories);

        if (loadMoreContainer) {
          if (this._hasMoreData) {
            loadMoreContainer.style.display = "block";
          } else {
            loadMoreContainer.style.display = "none";
          }
        }
      } else {
        if (storiesContainer) {
          storiesContainer.innerHTML = `
            <div class="alert alert-info">
              <p>Belum ada cerita yang tersedia.</p>
              <p>Jadilah yang pertama <a href="#/add">berbagi cerita</a>!</p>
            </div>
          `;
        }
        if (loadMoreContainer) {
          loadMoreContainer.style.display = "none";
        }
      }

      // Perbarui marker di peta
      if (this._map && !this._mapError) {
        await this._updateMapMarkers();
      }
    } catch (error) {
      console.error("Error loading stories:", error);

      if (this._page === 1 && storiesContainer) {
        storiesContainer.innerHTML = `
          <div class="alert alert-error">
            <p>Terjadi kesalahan saat memuat cerita.</p>
            <p>${error.message || "Kesalahan tidak diketahui"}</p>
            <button onclick="window.location.reload()" class="btn btn-small">Coba Lagi</button>
          </div>
        `;
      } else {
        showNotification("Error", "Gagal memuat cerita tambahan", "error");
      }
    } finally {
      this._isLoading = false;

      // Hapus loading spinner
      const spinner = document.getElementById("load-more-spinner");
      if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
    }
  }

  _setupInfiniteScroll() {
    // Gunakan throttling untuk menghindari terlalu banyak event
    let isThrottled = false;

    const scrollHandler = () => {
      // Jika dalam loading state, tidak ada data lagi, atau throttled, hentikan
      if (this._isLoading || !this._hasMoreData || isThrottled) return;

      // Throttle scroll event
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, 300);

      // Periksa apakah container masih ada
      const loadMoreButton = document.getElementById("load-more-button");
      const storiesContainer = document.getElementById("stories-container");

      if (!loadMoreButton || !storiesContainer) {
        // Container tidak ada lagi, hapus event listener
        window.removeEventListener("scroll", this._scrollHandler);
        return;
      }

      // Hitung jarak ke bawah halaman
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Jika pengguna mendekati bawah halaman, muat lebih banyak cerita
      if (scrollY + windowHeight >= documentHeight - 300) {
        this._loadMoreStories();
      }
    };

    // Simpan handler untuk bisa dihapus nanti
    this._scrollHandler = scrollHandler;

    // Tambahkan scroll handler
    window.addEventListener("scroll", this._scrollHandler);
  }

  async _loadMoreStories() {
    // Periksa apakah masih dalam loading state atau tidak ada data lagi
    if (this._isLoading || !this._hasMoreData) return;

    try {
      // Periksa apakah container masih ada sebelum mencoba memuat lebih banyak data
      const loadMoreContainer = document.getElementById("load-more-container");
      const storiesContainer = document.getElementById("stories-container");

      if (!loadMoreContainer || !storiesContainer) {
        console.warn("Container tidak ditemukan, membatalkan loadMore");
        return;
      }

      // Increment page dan load more stories
      this._page++;
      await this._loadStories();
    } catch (error) {
      // Jika error, revert page increment
      this._page--;
      console.error("Error loading more stories:", error);
    }
  }

  async _renderStories(append = false, newStories = []) {
    const storiesContainer = document.getElementById("stories-container");

    if (!storiesContainer) {
      console.warn("Stories container tidak ditemukan");
      return;
    }

    if (!this._stories || !this._stories.length) {
      storiesContainer.innerHTML = "<p>Tidak ada cerita untuk ditampilkan.</p>";
      return;
    }

    try {
      // Use Set to track unique story IDs
      const storiesToRender = append ? newStories : this._stories;

      const uniqueStoryIds = new Set();
      const uniqueStories = [];

      // Filter out duplicates based on ID
      storiesToRender.forEach((story) => {
        if (story && story.id && !uniqueStoryIds.has(story.id)) {
          uniqueStoryIds.add(story.id);
          uniqueStories.push(story);
        }
      });

      // Create HTML for stories
      const storiesHTML = uniqueStories
        .map((story) => {
          // Check if story has all required fields
          if (!story || !story.name || !story.photoUrl) {
            console.log("Story data is incomplete:", story);
            return "";
          }

          return `
          <article class="story-card" data-id="${story.id}">
            <div class="story-image-container">
              <img 
                src="${story.photoUrl}" 
                alt="Cerita dari ${story.name}" 
                class="story-image"
                onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia';"
                loading="lazy"
              >
            </div>
            <div class="story-content">
              <h2 class="story-title">${story.name}</h2>
              <p class="story-meta">${showFormattedDate(story.createdAt)}</p>
              <p class="story-description">${
                story.description
                  ? story.description.length > 100
                    ? story.description.substring(0, 100) + "..."
                    : story.description
                  : "Tidak ada deskripsi"
              }</p>
              ${
                story.lat && story.lon
                  ? `
                <div class="story-location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  ${
                    this._mapError
                      ? `Lokasi: ${parseFloat(story.lat).toFixed(
                          6
                        )}, ${parseFloat(story.lon).toFixed(6)}`
                      : "Lokasi tersedia"
                  }
                </div>
              `
                  : ""
              }
              <div class="story-more">
                <a href="#/story/${story.id}" class="btn">Lihat Detail</a>
              </div>
            </div>
          </article>
        `;
        })
        .join("");

      // Update the DOM
      if (append) {
        // If appending, create a container to hold new items
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = storiesHTML;

        // Append each new element with animation
        Array.from(tempContainer.children).forEach((child) => {
          child.style.opacity = "0";
          child.style.transform = "translateY(20px)";
          storiesContainer.appendChild(child);

          // Trigger animation
          setTimeout(() => {
            child.style.transition = "opacity 0.5s, transform 0.5s";
            child.style.opacity = "1";
            child.style.transform = "translateY(0)";
          }, 10);
        });
      } else {
        // First page render (clear old content)
        storiesContainer.innerHTML = storiesHTML;
      }
    } catch (error) {
      console.error("Error rendering stories:", error);
      storiesContainer.innerHTML = `
        <div class="alert alert-error">
          <p>Terjadi kesalahan saat menampilkan cerita.</p>
          <p>${error.message || "Kesalahan tidak diketahui"}</p>
          <button onclick="window.location.reload()" class="btn btn-small">Coba Lagi</button>
        </div>
      `;
    }
  }

  // Fix duplikat _initMap, gunakan yang lebih lengkap
  async _initMap() {
    try {
      const mapContainer = document.getElementById("stories-map");

      if (!mapContainer) {
        console.warn("Map container tidak ditemukan");
        return;
      }

      // Pastikan map container memiliki dimensi
      if (mapContainer.clientHeight === 0) {
        mapContainer.style.height = "400px";
      }

      // Periksa apakah map sudah diinisialisasi
      if (this._map) {
        // Jika sudah ada map, lakukan invalidate size untuk refresh
        this._map.invalidateSize();
        return;
      }

      // Inisialisasi leaflet dengan timeout untuk memastikan container sudah dirender
      const L = await loadMapScript();

      // Tunggu sedikit untuk memastikan DOM sudah dirender
      await new Promise((resolve) => setTimeout(resolve, 100));

      this._map = L.map(mapContainer, {
        center: [-2.5489, 118.0149], // Centered on Indonesia
        zoom: 5,
        zoomControl: true,
      });

      // Set tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this._map);

      // Tambahkan event listener untuk resize window
      window.addEventListener("resize", () => {
        if (this._map) {
          this._map.invalidateSize();
        }
      });

      // Tambahkan event listener untuk tab visibility
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this._map) {
          setTimeout(() => this._map.invalidateSize(), 200);
        }
      });

      await this._updateMapMarkers();
    } catch (error) {
      console.error("Error initializing map:", error);
      this._mapError = true;
      const mapContainer = document.getElementById("stories-map");
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="alert alert-error">
            <p>Gagal memuat peta. Mohon periksa koneksi internet Anda.</p>
            <p>Error: ${error.message || "Tidak diketahui"}</p>
          </div>
        `;
      }
    }
  }

  async _updateMapMarkers() {
    if (!this._map || this._mapError) return;

    // Remove old markers
    this._markers.forEach((marker) => marker.remove());
    this._markers = [];

    // Custom icon untuk marker
    const customIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    this._stories.forEach((story) => {
      if (story.lat && story.lon) {
        // Pastikan lat dan lon adalah angka yang valid
        const validLat = parseFloat(story.lat);
        const validLon = parseFloat(story.lon);

        if (!isNaN(validLat) && !isNaN(validLon)) {
          const marker = L.marker([validLat, validLon], { icon: customIcon });

          marker.bindPopup(`
            <div class="map-popup">
              <h3>${story.name}</h3>
              <p>${
                story.description
                  ? story.description.substring(0, 100) + "..."
                  : "Tidak ada deskripsi"
              }</p>
              <a href="#/story/${
                story.id
              }" class="btn btn-small">Lihat Detail</a>
            </div>
          `);

          marker.addTo(this._map);
          this._markers.push(marker);
        } else {
          debugLog("Invalid coordinates for story:", story.id);
        }
      }
    });

    // Fit map to show all markers if there are any
    if (this._markers.length > 0) {
      const group = L.featureGroup(this._markers);
      this._map.fitBounds(group.getBounds(), { padding: [30, 30] });
    }
  }

  cleanup() {
    // Hapus event listener jika ada
    if (this._scrollHandler) {
      window.removeEventListener("scroll", this._scrollHandler);
      this._scrollHandler = null;
    }

    // Bersihkan map jika ada
    if (this._map) {
      this._map.remove();
      this._map = null;
    }

    this._markers = [];

    console.log("HomePage resources cleaned up");
  }
}
