import { register } from '../../data/api';
import { isUserLoggedIn, debugLog } from '../../utils';

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Daftar Akun</h1>
        
        <div class="form-container">
          <div id="register-alert" class="alert" style="display: none;"></div>
          
          <form id="register-form">
            <div class="form-group">
              <label for="name" class="form-label">Nama</label>
              <input 
                type="text" 
                id="name" 
                class="form-input" 
                placeholder="Masukkan nama" 
                required
              >
            </div>
            
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
                placeholder="Minimal 8 karakter" 
                minlength="8"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="password-confirm" class="form-label">Konfirmasi Password</label>
              <input 
                type="password" 
                id="password-confirm" 
                class="form-input" 
                placeholder="Konfirmasi password" 
                minlength="8"
                required
              >
            </div>
            
            <button type="submit" class="btn btn-block" id="register-button">
              Daftar
            </button>
          </form>
          
          <p style="margin-top: 20px; text-align: center;">
            Sudah punya akun? <a href="#/login">Login</a>
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
    
    const registerForm = document.getElementById('register-form');
    const registerAlert = document.getElementById('register-alert');
    const registerButton = document.getElementById('register-button');
    
    // Auto-focus name input
    document.getElementById('name').focus();
    
    // Add real-time password validation
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('password-confirm');
    
    function validatePassword() {
      if (password.value !== passwordConfirm.value) {
        passwordConfirm.setCustomValidity('Password dan konfirmasi password tidak sama');
      } else {
        passwordConfirm.setCustomValidity('');
      }
    }
    
    password.addEventListener('change', validatePassword);
    passwordConfirm.addEventListener('keyup', validatePassword);
    
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // Show loading state
      const originalButtonText = registerButton.textContent;
      registerButton.textContent = 'Loading...';
      registerButton.disabled = true;
      
      try {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        
        // Validate password match
        if (password !== passwordConfirm) {
          throw new Error('Password dan konfirmasi password tidak sama');
        }
        
        // Validate password length
        if (password.length < 8) {
          throw new Error('Password harus minimal 8 karakter');
        }
        
        debugLog('Register attempt', { name, email });
        
        const response = await register({ name, email, password });
        
        if (response.error) {
          throw new Error(response.message || 'Registrasi gagal');
        }
        
        // Show success message and redirect to login
        registerAlert.className = 'alert alert-success';
        registerAlert.textContent = 'Registrasi berhasil. Silakan login.';
        registerAlert.style.display = 'block';
        
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      } catch (error) {
        debugLog('Register error:', error);
        
        // Show error message
        registerAlert.className = 'alert alert-error';
        registerAlert.textContent = error.message || 'Terjadi kesalahan saat pendaftaran';
        registerAlert.style.display = 'block';
        
        // Reset button state
        registerButton.textContent = originalButtonText;
        registerButton.disabled = false;
        
        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}