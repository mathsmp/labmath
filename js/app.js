/* ============================================================
   app.js — Router SPA utama, modal panduan, autentikasi,
   dashboard Guru, dan greeting setelah evaluasi.

   Pembaruan:
   - Routing halaman: home, login, register, admin, module1-3
   - Proteksi: tab Evaluasi (kuis1/2/3) butuh login siswa
   - Topbar menampilkan tombol Login/Daftar atau info user aktif
   - Dashboard Guru: statistik, filter, tabel hasil & siswa, export CSV
   ============================================================ */

(function () {
  // modul yang ditunggu setelah login (agar tamu langsung diantar ke modul pilihannya)
  let pendingModule = null;
  function setPendingModule(m) { pendingModule = m; }
  function consumePendingModule() { const m = pendingModule; pendingModule = null; return m; }

  // ekspos agar auth.js bisa panggil
  window.App = { showPage, consumePendingModule, setPendingModule };

  const guides = {
    module1: {
      title: 'Panduan Modul 1: Transformasi Geometri',
      body: `
        <ol>
          <li>Pilih salah satu jenis transformasi pada tab di atas kanvas: Refleksi, Translasi, Rotasi, Dilatasi, atau Kombinasi.</li>
          <li>Gunakan dropdown/slider pada panel kanan untuk mengubah parameter (garis cermin, vektor pergeseran, sudut putar, atau faktor skala).</li>
          <li>Perhatikan bagaimana segitiga merah (bayangan) berubah mengikuti parameter yang kamu atur.</li>
          <li>Cek tabel koordinat untuk melihat angka pastinya.</li>
          <li>Setelah memahami semua jenis transformasi, coba kerjakan tab <b>Evaluasi</b>.</li>
        </ol>
      `
    },
    module2: {
      title: 'Panduan Modul 2: Bangun Ruang & Jaring-Jaring',
      body: `
        <ol>
          <li>Pilih salah satu bangun ruang pada galeri di atas.</li>
          <li><b>Seret (drag) kanvas dengan mouse atau jari</b> untuk memutar bangun dan melihatnya dari berbagai sisi.</li>
          <li>Ubah ukuran (sisi, jari-jari, tinggi) menggunakan slider di panel kanan, dan lihat luas permukaan & volume berubah otomatis.</li>
          <li>Buka tab <b>Jaring-Jaring</b> untuk melihat bentuk 2D bangun tersebut jika "dibuka".</li>
          <li>Coba tab <b>Simulasi Volume</b> untuk melihat animasi pengisian volume.</li>
          <li>Selesaikan tab <b>Evaluasi</b> setelah memahami materi.</li>
        </ol>
      `
    },
    module3: {
      title: 'Panduan Modul 3: Teorema Pythagoras',
      body: `
        <ol>
          <li>Pada tab <b>Pembuktian Visual</b>, ubah panjang sisi a dan b lalu perhatikan bahwa luas persegi a² + b² selalu sama dengan luas persegi c².</li>
          <li>Gunakan tab <b>Kalkulator Sisi</b> untuk menghitung sisi yang belum diketahui jika dua sisi lain sudah diketahui.</li>
          <li>Coba tab <b>Studi Kasus</b> untuk menerapkan Pythagoras pada masalah sehari-hari.</li>
          <li>Pada tab <b>Jarak Dua Titik</b>, klik dua titik di grid untuk melihat cara menghitung jaraknya.</li>
          <li>Jelajahi tab <b>Galeri Tripel</b> untuk melihat pola bilangan tripel Pythagoras.</li>
          <li>Uji pemahamanmu di tab <b>Evaluasi</b>.</li>
        </ol>
      `
    }
  };

  const PROTECTED_PAGES = ['admin'];
  const MODULE_PAGES = ['module1', 'module2', 'module3'];

  function showPage(pageId) {
    // proteksi halaman admin: hanya guru
    if (PROTECTED_PAGES.indexOf(pageId) !== -1) {
      const u = Store.getSessionUser();
      if (!u || u.role !== 'admin') {
        alert('Halaman Dashboard Guru hanya untuk akun Guru. Silakan login sebagai Guru.');
        pageId = 'login';
      }
    }
    // proteksi modul pembelajaran: harus masuk/daftar dulu.
    // Tanpa alert — tamu langsung diantar ke halaman login, dan modul pilihannya
    // diingat di pendingModule supaya setelah login langsung dibuka (tanpa balik Beranda).
    if (MODULE_PAGES.indexOf(pageId) !== -1) {
      const u = Store.getSessionUser();
      if (!u) {
        pendingModule = pageId;
        pageId = 'login';
      }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.target === pageId));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'login') {
      Auth.renderLogin(document.getElementById('login-mount'));
    } else if (pageId === 'register') {
      Auth.renderRegister(document.getElementById('register-mount'));
    } else if (pageId === 'admin') {
      renderAdminDashboard();
    } else if (pageId === 'home') {
      renderHomeExtras();
    }
  }

  /* ---------- Scroll ke section di Beranda (untuk menu anchor) ---------- */
  function scrollToSection(anchorId) {
    const home = document.getElementById('page-home');
    if (home && !home.classList.contains('active')) {
      showPage('home');
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
    } else {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openGuide(moduleId) {
    const g = guides[moduleId];
    if (!g) return;
    document.getElementById('guide-title').textContent = g.title;
    document.getElementById('guide-body').innerHTML = g.body;
    document.getElementById('guide-modal').classList.add('show');
  }

  function closeGuide() {
    document.getElementById('guide-modal').classList.remove('show');
  }

  /* ---------- Greeting modal ---------- */
  function closeGreeting() {
    document.getElementById('greeting-modal').classList.remove('show');
    const c = document.getElementById('confetti-canvas');
    if (c) c.style.display = 'none';
  }

  /* ---------- Topbar auth area ---------- */
  function renderAuthArea() {
    const area = document.getElementById('auth-area');
    const user = Store.getSessionUser();
    if (!user) {
      area.innerHTML = `
        <button class="navbtn auth-btn" id="topbar-login">Masuk</button>
        <button class="navbtn auth-btn auth-register" id="topbar-register">Daftar</button>
      `;
      area.querySelector('#topbar-login').addEventListener('click', () => showPage('login'));
      area.querySelector('#topbar-register').addEventListener('click', () => showPage('register'));
    } else {
      const roleLabel = user.role === 'admin' ? '👨\u200d🏫 Guru' : '\uD83C\uDF92 ' + (user.kelas || 'Peserta Didik');
      const dashBtn = user.role === 'admin'
        ? `<button class="navbtn auth-btn" id="topbar-dashboard">📊 Dashboard</button>`
        : '';
      area.innerHTML = `
        <div class="user-chip" title="${escapeHtml(user.name + ' (' + user.username + ')')}">
          <span class="user-avatar">${escapeHtml((user.name || '?').charAt(0).toUpperCase())}</span>
          <span class="user-meta">
            <span class="user-name">${escapeHtml(user.name)}</span>
            <span class="user-role">${escapeHtml(roleLabel)}</span>
          </span>
        </div>
        ${dashBtn}
        <button class="navbtn auth-btn auth-logout" id="topbar-logout">Keluar</button>
      `;
      const logoutBtn = area.querySelector('#topbar-logout');
      if (logoutBtn) logoutBtn.addEventListener('click', () => {
        if (confirm('Yakin ingin keluar dari akun?')) Auth.logout();
      });
      const dashB = area.querySelector('#topbar-dashboard');
      if (dashB) dashB.addEventListener('click', () => showPage('admin'));
    }

    const banner = document.getElementById('guest-banner');
    const prog = document.getElementById('student-progress');
    if (banner) banner.style.display = (!user) ? 'flex' : 'none';
    if (prog) prog.style.display = (user && user.role === 'student') ? 'block' : 'none';
  }

  /* ---------- Banner & kartu progres siswa ---------- */
  function renderHomeExtras() {
    renderAuthArea();
    const user = Store.getSessionUser();
    const banner = document.getElementById('guest-banner');
    if (banner) {
      banner.style.display = user ? 'none' : 'flex';
      const bl = document.getElementById('banner-login');
      const br = document.getElementById('banner-register');
      if (bl) bl.onclick = () => showPage('login');
      if (br) br.onclick = () => showPage('register');
    }
    const prog = document.getElementById('student-progress');
    if (prog) {
      prog.style.display = (user && user.role === 'student') ? 'block' : 'none';
      if (user && user.role === 'student') renderStudentProgress(prog);
    }
    // tampilkan kunci pada tombol modul jika belum login
    const isGuest = !user;
    document.querySelectorAll('.menu-card .open-module').forEach(btn => {
      btn.innerHTML = isGuest ? '🔒 Login dulu' : 'Mulai →';
    });
  }

  function renderStudentProgress(container) {
    const user = Store.getSessionUser();
    if (!user) return;
    const results = Store.getResultsByUser(user.id);
    const modules = [
      { key: 'Modul 1', name: 'Transformasi Geometri' },
      { key: 'Modul 2', name: 'Bangun Ruang & Jaring-Jaring' },
      { key: 'Modul 3', name: 'Teorema Pythagoras' }
    ];
    const bestFor = mKey => {
      const arr = results.filter(r => r.module === mKey);
      if (!arr.length) return null;
      const best = arr.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a));
      const pct = best.total > 0 ? Math.round((best.score / best.total) * 100) : 0;
      return { best, pct, attempts: arr.length };
    };
    const cards = modules.map(m => {
      const r = bestFor(m.key);
      let body;
      if (!r) {
        body = `<div class="sp-status">Belum dikerjakan</div>`;
      } else {
        const cls = r.pct >= 80 ? 'good' : (r.pct >= 60 ? 'mid' : 'low');
        body = `
          <div class="sp-score ${cls}">${r.best.score}/${r.best.total}</div>
          <div class="sp-pct ${cls}">${r.pct}%</div>
          <div class="sp-att">${r.attempts}× percobaan</div>
        `;
      }
      return `
        <div class="sp-card">
          <h4>${escapeHtml(m.key)}</h4>
          <p class="sp-name">${escapeHtml(m.name)}</p>
          ${body}
        </div>`;
    }).join('');
    container.innerHTML = `
      <div class="sp-head">
        <h3>📈 Progres Evaluasimu, ${escapeHtml(user.name)}</h3>
        <p>Skor terbaikmu di tiap modul. Kerjakan ulang untuk meningkatkan hasil!</p>
      </div>
      <div class="sp-grid">${cards}</div>
    `;
  }

  /* ---------- Dashboard Guru ---------- */
  function renderAdminDashboard() {
    const allResults = Store.getResults();
    const allStudents = Store.getStudents();

    renderAdminStats();

    const kelasSet = [...new Set(allStudents.map(s => s.kelas).filter(Boolean))].sort();
    const kelasSel = document.getElementById('filter-kelas');
    kelasSel.innerHTML = '<option value="">Semua Kelas</option>' +
      kelasSet.map(k => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`).join('');

    applyAdminFilter();

    const sb = document.getElementById('admin-students-body');
    sb.innerHTML = allStudents.length ? allStudents.map((s, i) => {
      const cnt = allResults.filter(r => r.userId === s.id).length;
      const d = new Date(s.createdAt);
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.nisn || '-')}</td>
          <td>${escapeHtml(s.kelas || '-')}</td>
          <td>${escapeHtml(s.username)}</td>
          <td>${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td><span class="badge">${cnt}× evaluasi</span></td>
        </tr>`;
    }).join('') : `<tr><td colspan="7" class="empty">Belum ada peserta didik terdaftar.</td></tr>`;
  }

  function renderAdminStats() {
    const allResults = Store.getResults();
    const allStudents = Store.getStudents();
    const totalAttempts = allResults.length;
    const totalStudents = allStudents.length;
    const avgPct = totalAttempts > 0
      ? Math.round(allResults.reduce((s, r) => s + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / totalAttempts)
      : 0;
    const passedCount = allResults.filter(r => r.total > 0 && (r.score / r.total) >= 0.8).length;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-card"><div class="stat-num">${totalStudents}</div><div class="stat-label">Peserta Didik</div></div>
      <div class="stat-card"><div class="stat-num">${totalAttempts}</div><div class="stat-label">Total Evaluasi Dikerjakan</div></div>
      <div class="stat-card"><div class="stat-num">${avgPct}%</div><div class="stat-label">Rata-rata Skor</div></div>
      <div class="stat-card"><div class="stat-num">${passRate}%</div><div class="stat-label">Tingkat Lulus (≥80%)</div></div>
    `;
  }

  function applyAdminFilter() {
    const mod = document.getElementById('filter-module').value;
    const kelas = document.getElementById('filter-kelas').value;
    const q = document.getElementById('filter-search').value.trim().toLowerCase();
    const users = Store.getUsers();
    let results = Store.getResults();

    results = results.map(r => {
      const u = users.find(x => x.id === r.userId) || {};
      return {
        ...r,
        name: u.name || '-',
        nisn: u.nisn || '-',
        kelas: u.kelas || '-'
      };
    });
    if (mod) results = results.filter(r => r.module === mod);
    if (kelas) results = results.filter(r => (r.kelas || '') === kelas);
    if (q) results = results.filter(r =>
      (r.name || '').toLowerCase().indexOf(q) !== -1 ||
      (r.nisn || '').toLowerCase().indexOf(q) !== -1
    );
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const body = document.getElementById('admin-table-body');
    if (!results.length) {
      body.innerHTML = `<tr><td colspan="9" class="empty">Belum ada data hasil evaluasi yang cocok dengan filter.</td></tr>`;
      return;
    }
    body.innerHTML = results.map((r, i) => {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      const cls = pct >= 80 ? 'good' : (pct >= 60 ? 'mid' : 'low');
      const d = new Date(r.timestamp);
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.nisn)}</td>
          <td>${escapeHtml(r.kelas)}</td>
          <td>${escapeHtml(r.module)}</td>
          <td>${r.score} / ${r.total}</td>
          <td><span class="badge ${cls}">${pct}%</span></td>
          <td>${d.toLocaleString('id-ID')}</td>
          <td><button class="btn btn-outline btn-sm" data-del="${r.id}">Hapus</button></td>
        </tr>`;
    }).join('');

    body.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Hapus data hasil evaluasi ini?')) {
          Store.deleteResult(btn.dataset.del);
          applyAdminFilter();
          renderAdminStats();
        }
      });
    });
  }

  /* ---------- proteksi tab evaluasi ---------- */
  function guardQuizTabs() {
    document.querySelectorAll('.tabbtn').forEach(btn => {
      const t = btn.dataset.tab;
      if (!t) return;
      if (['kuis1', 'kuis2', 'kuis3'].indexOf(t) !== -1) {
        btn.addEventListener('click', e => {
          const user = Store.getSessionUser();
          if (!user) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (confirm('Untuk mengerjakan evaluasi dan menyimpan skor, kamu harus login sebagai peserta didik. Mau login sekarang?')) {
              showPage('login');
            }
          }
        }, true);
      }
    });
  }

  /* ---------- export CSV ---------- */
  function exportCSV() {
    const csv = Store.resultsToCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasil_evaluasi_labmaya_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------- util ---------- */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  /* ---------- init ---------- */
  function init() {
    document.querySelectorAll('.navbtn').forEach(btn => {
      const tgt = btn.dataset.target;
      const anchor = btn.dataset.anchor;
      if (tgt) btn.addEventListener('click', () => showPage(tgt));
      else if (anchor) btn.addEventListener('click', () => scrollToSection(anchor));
    });
    document.getElementById('nav-home').addEventListener('click', () => showPage('home'));
    document.querySelectorAll('.open-module').forEach(btn => {
      btn.addEventListener('click', () => showPage(btn.dataset.target));
    });
    // tombol "Lihat Modul ↓" di hero: scroll halus ke section modul
    const heroSee = document.getElementById('hero-see-modules');
    if (heroSee) heroSee.addEventListener('click', () => {
      const heading = document.querySelector('.section-heading');
      if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.querySelectorAll('.btn-guide').forEach(btn => {
      btn.addEventListener('click', () => openGuide(btn.dataset.guide));
    });
    document.getElementById('guide-close').addEventListener('click', closeGuide);
    document.getElementById('guide-ok').addEventListener('click', closeGuide);
    document.getElementById('guide-modal').addEventListener('click', e => {
      if (e.target.id === 'guide-modal') closeGuide();
    });

    document.getElementById('greet-close').addEventListener('click', closeGreeting);
    document.getElementById('greet-ok').addEventListener('click', closeGreeting);
    document.getElementById('greet-review').addEventListener('click', () => {
      closeGreeting();
      showPage('home');
    });
    document.getElementById('greeting-modal').addEventListener('click', e => {
      if (e.target.id === 'greeting-modal') closeGreeting();
    });

    const fmod = document.getElementById('filter-module');
    const fkelas = document.getElementById('filter-kelas');
    const fsearch = document.getElementById('filter-search');
    if (fmod) fmod.addEventListener('change', applyAdminFilter);
    if (fkelas) fkelas.addEventListener('change', applyAdminFilter);
    if (fsearch) fsearch.addEventListener('input', applyAdminFilter);
    const refresh = document.getElementById('admin-refresh');
    if (refresh) refresh.addEventListener('click', renderAdminDashboard);
    const exportBtn = document.getElementById('admin-export');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);

    Auth.onChange(() => { renderAuthArea(); });

    guardQuizTabs();

    showPage('home');

    Module1.init();
    Module2.init();
    Module3.init();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
