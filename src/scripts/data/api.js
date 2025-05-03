import CONFIG from '../config';
import { getAuthorizationHeader, getUserData } from '../utils';

/**
 * Fungsi untuk login
 * @param {Object} loginData - Data untuk login (email dan password)
 * @returns {Promise} Promise hasil operasi login
 */
export const login = async (loginData) => {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error('Error pada login:', error);
    return {
      error: true,
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
    };
  }
};

/**
 * Fungsi untuk register
 * @param {Object} registerData - Data untuk register (nama, email, password)
 * @returns {Promise} Promise hasil operasi register
 */
export const register = async (registerData) => {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error('Error pada register:', error);
    return {
      error: true,
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
    };
  }
};

/**
 * Fungsi untuk mendapatkan daftar cerita
 * @param {Object} options - Opsi untuk pengambilan cerita (page, size, location)
 * @returns {Promise} Promise hasil operasi pengambilan cerita
 */
export const getAllStories = async ({ page = 1, size = 10, location = 0 } = {}) => {
  try {
    let url = `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}`;
    
    if (location) {
      url += '&location=1';
    }
    
    const headers = getAuthorizationHeader();
    
    const response = await fetch(url, {
      headers,
    });

    const responseJson = await response.json();
    
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    
    return responseJson;
  } catch (error) {
    console.error('Error mendapatkan cerita:', error);
    
    // Jika error adalah TypeError dan berkaitan dengan jaringan
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        error: true,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      };
    }
    
    return {
      error: true,
      message: error.message || 'Terjadi kesalahan saat memuat cerita. Periksa koneksi internet Anda.',
    };
  }
};

/**
 * Fungsi untuk mendapatkan detail cerita
 * @param {string} id - ID cerita yang ingin diambil detailnya
 * @returns {Promise} Promise hasil operasi pengambilan detail cerita
 */
export const getStoryDetail = async (id) => {
  try {
    const headers = getAuthorizationHeader();
    
    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      headers,
    });

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error('Error mendapatkan detail cerita:', error);
    return {
      error: true,
      message: 'Terjadi kesalahan saat memuat detail cerita.',
    };
  }
};

/**
 * Fungsi untuk menambahkan cerita baru
 * @param {FormData} formData - FormData berisi data cerita (description, photo, dan opsional lat, lon)
 * @returns {Promise} Promise hasil operasi penambahan cerita
 */
export const addStory = async (formData) => {
  try {
    // Dapatkan token dari userData
    const userData = getUserData();
    
    if (!userData || !userData.token) {
      throw new Error('Token tidak tersedia. Silakan login terlebih dahulu.');
    }
    
    // Log untuk debugging
    console.log('Mengirim cerita dengan data:');
    console.log('- Description tersedia:', formData.has('description'));
    console.log('- Photo tersedia:', formData.has('photo'));
    console.log('- Lokasi tersedia:', formData.has('lat') && formData.has('lon'));
    
    // Buat headers yang tepat untuk FormData
    const headers = {
      'Authorization': `Bearer ${userData.token}`,
      // PENTING: Jangan tambahkan Content-Type untuk FormData
      // Browser akan menambahkan boundary yang tepat
    };
    
    // Cek validitas data sebelum mengirim
    if (!formData.has('description')) {
      throw new Error('Deskripsi cerita tidak boleh kosong');
    }
    
    if (!formData.has('photo')) {
      throw new Error('Foto tidak boleh kosong');
    }
    
    // Kirim request
    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    // Cek status HTTP
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesi telah berakhir. Silakan login kembali.');
      } else if (response.status === 413) {
        throw new Error('Ukuran foto terlalu besar. Maksimal 1MB.');
      } else if (response.status === 400) {
        throw new Error('Data yang dikirim tidak valid. Pastikan format data sudah benar.');
      } else if (response.status === 500) {
        throw new Error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      }
    }
    
    // Parse response
    const responseJson = await response.json();
    
    // Log response untuk debugging
    console.log('Response dari API addStory:', responseJson);
    
    if (responseJson.error) {
      console.error('Error saat menambahkan cerita:', responseJson.message);
      throw new Error(responseJson.message || 'Gagal menambahkan cerita.');
    }
    
    return responseJson;
  } catch (error) {
    // Periksa jenis error
    if (error.name === 'AbortError') {
      return {
        error: true,
        message: 'Permintaan timeout. Mungkin ukuran foto terlalu besar atau koneksi lambat.'
      };
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        error: true,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      };
    }
    
    console.error('Error menambahkan cerita:', error);
    return {
      error: true,
      message: error.message || 'Gagal menambahkan cerita. Silakan coba lagi.',
    };
  }
};