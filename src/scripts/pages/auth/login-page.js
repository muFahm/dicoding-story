import { login } from '../../data/api';
import { saveUserData, isUserLoggedIn, debugLog, showNotification } from '../../utils';

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Login</h1>
        
        <div class="form-container">
          <div id="login-alert" class="alert" style="display: none;"></div>
          
          <form id="login-form">
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="Masukkan email" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                class="form-input" 
                placeholder="Masukkan password" 
                required
              >
            </div>
            
            <div class="form-check" style="margin-bottom: 15px;">
              <input type="checkbox" id="remember-me" class="form-check-input">
              <label for="remember-me" class="form-check-label">Ingat saya</label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="login-button">
              Login
            </button>
          </form>
          
          <p style="margin-top: 20px; text-align: center;">
            Belum punya akun? <a href="#/register">Daftar sekarang</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Redirect if already logged in
    if (isUserLoggedIn()) {
      window.location.hash = '#/';
      return;
    }
    
    const loginForm = document.getElementById('login-form');
    const loginAlert = document.getElementById('login-alert');
    const loginButton = document.getElementById('login-button');
    
    // Auto-focus email input
    document.getElementById('email').focus();
    
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // Show loading state
      const originalButtonText = loginButton.textContent;
      loginButton.textContent = 'Loading...';
      loginButton.disabled = true;
      
      try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        debugLog('Login attempt', { email, rememberMe });
        
        const response = await login({ email, password });
        
        if (response.error) {
          throw new Error(response.message || 'Login gagal');
        }
        
        // Check if login result contains token
        if (!response.loginResult || !response.loginResult.token) {
          throw new Error('Token tidak ditemukan dalam respons login');
        }
        
        // Save user data to local storage
        saveUserData(response.loginResult, rememberMe);
        
        // Show success message and redirect
        loginAlert.className = 'alert alert-success';
        loginAlert.textContent = 'Login berhasil. Mengalihkan...';
        loginAlert.style.display = 'block';
        
        // Gunakan showNotification untuk alert
        showNotification('Berhasil', 'Login berhasil', 'success');
        
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1500);
      } catch (error) {
        debugLog('Login error:', error);
        
        // Show error message
        loginAlert.className = 'alert alert-error';
        loginAlert.textContent = error.message || 'Terjadi kesalahan saat login';
        loginAlert.style.display = 'block';
        
        // Gunakan showNotification untuk alert error
        showNotification('Error', error.message || 'Terjadi kesalahan saat login', 'error');
        
        // Reset button state
        loginButton.textContent = originalButtonText;
        loginButton.disabled = false;
      }
    });
  }
}