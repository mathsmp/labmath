/* ============================================================
   auth.js
   Modul autentikasi untuk peserta didik & admin (Guru).
   - Merender form login & register
   - Mengelola sesi login aktif
   - Menampilkan tombol Login/Logout di topbar
   - Memberi callback onChange agar app.js bisa refresh UI
   ============================================================ */

window.Auth = (function () {

  let onChangeCb = null;

  function onChange(cb) { onChangeCb = cb; }
  function notify() { if (onChangeCb) onChangeCb(); }

  /* ---------- kelas dropdown ---------- */
  const KELAS_OPTIONS = [
    'Kelas VIII A', 'Kelas VIII B', 'Kelas VIII C',
    'Kelas VIII D', 'Kelas VIII E', 'Kelas VIII F',
    'Kelas IX A', 'Kelas IX B', 'Kelas IX C', 'Kelas IX D', 'Kelas IX E'
  ];

  /* ---------- nama modul (untuk pesan kontekstual di login) ---------- */
  const MODULE_NAMES = {
    module1: 'Transformasi Geometri',
    module2: 'Bangun Ruang & Jaring-Jaring',
    module3: 'Teorema Pythagoras'
  };

  /* ---------- render form LOGIN ---------- */
  function renderLogin(container) {
    // Cek apakah ada modul yang ditunggu (tamu klik modul lalu diantar ke login)
    const pending = App.consumePendingModule ? App.consumePendingModule() : null;
    const moduleName = pending && MODULE_NAMES[pending];
    // simpan lagi agar setelah submit sukses bisa diantar ke modul itu
    if (pending && App.setPendingModule) App.setPendingModule(pending);

    const contextMsg = moduleName
      ? `<div class="auth-context">🎒 Kamu akan langsung diajak ke <b>Modul ${pending.replace('module','')} — ${moduleName}</b> setelah masuk.</div>`
      : '';

    container.innerHTML = `
      <div class="auth-card">
        <div class="auth-head">
          <div class="auth-icon">🔐</div>
          <h2>Masuk ke Lab Maya</h2>
          <p class="subtitle">Masuk sebagai peserta didik atau Guru untuk mengakses modul pembelajaran dan evaluasi.</p>
        </div>
        ${contextMsg}
        <form id="login-form" class="auth-form" autocomplete="off">
          <div class="control-row">
            <label for="login-username">Username</label>
            <input type="text" id="login-username" placeholder="cth: guru atau nama siswa" required>
          </div>
          <div class="control-row">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" placeholder="Masukkan password" required>
          </div>
          <div class="auth-error" id="login-error"></div>
          <button type="submit" class="btn btn-primary btn-block">Masuk</button>
          <div class="auth-switch-row">
            Belum punya akun?
            <button type="button" class="btn btn-secondary btn-block" id="to-register">Daftar sebagai peserta didik</button>
          </div>
        </form>
      </div>
    `;

    container.querySelector('#login-form').addEventListener('submit', e => {
      e.preventDefault();
      const u = container.querySelector('#login-username').value.trim();
      const p = container.querySelector('#login-password').value;
      const errBox = container.querySelector('#login-error');
      const res = Store.verifyUser(u, p);
      if (!res.ok) {
        errBox.textContent = res.error;
        errBox.style.display = 'block';
        return;
      }
      Store.setSession(res.user.id);
      errBox.style.display = 'none';
      notify();
      const role = res.user.role;
      if (role === 'admin') {
        App.showPage('admin');
        return;
      }
      // kalau ada modul yang ditunggu, antar langsung; kalau tidak, ke Beranda
      const pm = App.consumePendingModule ? App.consumePendingModule() : null;
      if (pm && MODULE_NAMES[pm]) App.showPage(pm);
      else App.showPage('home');
    });

    container.querySelector('#to-register').addEventListener('click', () => {
      // bawa modul yang ditunggu ke halaman daftar
      if (App.consumePendingModule) {
        const pm = App.consumePendingModule();
        if (pm && App.setPendingModule) App.setPendingModule(pm);
      }
      App.showPage('register');
    });
  }

  /* ---------- render form REGISTER ---------- */
  function renderRegister(container) {
    const kelasOpts = KELAS_OPTIONS.map(k => `<option value="${k}">${k}</option>`).join('');
    container.innerHTML = `
      <div class="auth-card">
        <div class="auth-head">
          <div class="auth-icon">📝</div>
          <h2>Daftar Peserta Didik</h2>
          <p class="subtitle">Buat akun untuk menyimpan hasil evaluasi pembelajaranmu. Guru akan dapat melihat progresnya.</p>
        </div>
        <form id="register-form" class="auth-form" autocomplete="off">
          <div class="control-row">
            <label for="reg-name">Nama Lengkap</label>
            <input type="text" id="reg-name" placeholder="cth: Siti Nurhaliza" required>
          </div>
          <div class="control-row">
            <label for="reg-nisn">NISN</label>
            <input type="text" id="reg-nisn" placeholder="cth: 0089234567" required>
          </div>
          <div class="control-row">
            <label for="reg-kelas">Kelas</label>
            <select id="reg-kelas" required>
              <option value="">-- Pilih Kelas --</option>
              ${kelasOpts}
            </select>
          </div>
          <div class="control-row">
            <label for="reg-username">Username (untuk login)</label>
            <input type="text" id="reg-username" placeholder="cth: sitinur" required>
          </div>
          <div class="control-row">
            <label for="reg-password">Password</label>
            <input type="password" id="reg-password" placeholder="Minimal 4 karakter" minlength="4" required>
          </div>
          <div class="control-row">
            <label for="reg-password2">Ulangi Password</label>
            <input type="password" id="reg-password2" placeholder="Ketik ulang password" required>
          </div>
          <div class="auth-error" id="register-error"></div>
          <button type="submit" class="btn btn-primary btn-block">Daftar Sekarang</button>
          <div class="auth-switch">
            Sudah punya akun? <a href="#" id="to-login">Masuk di sini</a>
          </div>
        </form>
      </div>
    `;

    container.querySelector('#register-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = container.querySelector('#reg-name').value.trim();
      const nisn = container.querySelector('#reg-nisn').value.trim();
      const kelas = container.querySelector('#reg-kelas').value;
      const username = container.querySelector('#reg-username').value.trim();
      const password = container.querySelector('#reg-password').value;
      const password2 = container.querySelector('#reg-password2').value;
      const errBox = container.querySelector('#register-error');

      const showErr = msg => { errBox.textContent = msg; errBox.style.display = 'block'; };

      if (!name || !nisn || !kelas || !username || !password) {
        return showErr('Mohon lengkapi semua kolom.');
      }
      if (password.length < 4) {
        return showErr('Password minimal 4 karakter.');
      }
      if (password !== password2) {
        return showErr('Konfirmasi password tidak cocok.');
      }
      const res = Store.addUser({ name, nisn, kelas, username, password, role: 'student' });
      if (!res.ok) {
        return showErr(res.error);
      }
      Store.setSession(res.user.id);
      errBox.style.display = 'none';
      notify();
      // kalau ada modul yang ditunggu, antar langsung; kalau tidak, ke Beranda
      const pm = App.consumePendingModule ? App.consumePendingModule() : null;
      if (pm && MODULE_NAMES[pm]) App.showPage(pm);
      else App.showPage('home');
    });

    container.querySelector('#to-login').addEventListener('click', e => {
      e.preventDefault();
      App.showPage('login');
    });
  }

  /* ---------- tombol logout ---------- */
  function logout() {
    Store.clearSession();
    notify();
    App.showPage('login');
  }

  /* ---------- render greeting setelah register pertama ---------- */
  function currentUserName() {
    const u = Store.getSessionUser();
    return u ? u.name : '';
  }

  return {
    renderLogin, renderRegister, logout, currentUserName, onChange
  };
})();
