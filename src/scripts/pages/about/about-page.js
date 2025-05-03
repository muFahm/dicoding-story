export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Tentang Dicoding Story</h1>
        
        <div class="about-content">
          <p>
            Dicoding Story adalah platform berbagi cerita dan pengalaman seputar Dicoding. 
            Aplikasi ini dibangun sebagai proyek untuk memenuhi submission kelas Dicoding.
          </p>
          
          <h2>Fitur Aplikasi</h2>
          <ul>
            <li>Melihat cerita dari pengguna Dicoding lainnya</li>
            <li>Berbagi cerita Anda sendiri dengan komunitas Dicoding</li>
            <li>Menambahkan lokasi pada cerita Anda</li>
            <li>Melihat lokasi cerita di peta</li>
          </ul>
          
          <h2>Teknologi yang Digunakan</h2>
          <ul>
            <li>HTML, CSS, dan JavaScript</li>
            <li>Arsitektur Single-Page Application (SPA)</li>
            <li>Pola Model-View-Presenter (MVP)</li>
            <li>Leaflet untuk menampilkan peta</li>
            <li>View Transition API untuk transisi halaman yang halus</li>
          </ul>
          
          <h2>Kriteria Proyek</h2>
          <ol>
            <li>Menggunakan Dicoding Story API sebagai sumber data</li>
            <li>Menggunakan arsitektur Single-Page Application</li>
            <li>Menerapkan teknik hash dalam routing</li>
            <li>Menampilkan daftar cerita dengan gambar dan teks</li>
            <li>Menampilkan peta dengan marker untuk cerita</li>
            <li>Fitur tambah cerita baru dengan kamera dan lokasi</li>
            <li>Menerapkan aksesibilitas sesuai standar</li>
            <li>Mengimplementasikan transisi halaman yang halus</li>
          </ol>
          
          <p style="margin-top: 30px;">
            &copy; 2025 - Dibuat dengan ❤️ untuk submission kelas Dicoding
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Tidak ada operasi khusus setelah render
  }
}