/* ============================================================
   storage.js
   Lapisan penyimpanan data berbasis localStorage.
   Menyimpan: daftar akun peserta didik, akun admin (Guru),
   sesi login aktif, dan hasil pengerjaan evaluasi peserta didik.

   Catatan keamanan: karena ini aplikasi statis (GitHub Pages)
   tanpa server, password disimpan dengan hashing sederhana
   (base64 + salt). Ini BUKAN pengganti autentikasi server sungguhan,
   cukup untuk lingkungan pembelajaran / demo SPA.
   ============================================================ */

window.Store = (function () {

  const KEY_USERS = 'lmm_users';        // daftar akun (siswa & guru)
  const KEY_SESSION = 'lmm_session';    // id user yang sedang login
  const KEY_RESULTS = 'lmm_results';    // daftar hasil evaluasi

  /* ---------- util hashing sederhana ---------- */
  function hash(str) {
    // hash non-kriptografis (FNV-1a 32-bit + salt) lalu di-base64
    const salt = 'lmm_2026_salt';
    const s = salt + str + salt;
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return btoa(String(h >>> 0) + ':' + s.length);
  }

  /* ---------- baca / tulis JSON ---------- */
  function readArr(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Store.readArr error', key, e);
      return [];
    }
  }
  function writeArr(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  /* ---------- seed admin default jika belum ada ---------- */
  function seedAdminIfMissing() {
    const users = readArr(KEY_USERS);
    if (!users.some(u => u.role === 'admin')) {
      users.push({
        id: 'admin-001',
        name: 'Guru Matematika',
        username: 'guru',
        passwordHash: hash('guru123'),
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      writeArr(KEY_USERS, users);
    }
  }

  /* ---------- API: USERS ---------- */
  function getUsers() { return readArr(KEY_USERS); }
  function getStudents() {
    return readArr(KEY_USERS).filter(u => u.role === 'student');
  }

  function findUserByUsername(username) {
    return readArr(KEY_USERS).find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  function addUser(user) {
    const users = readArr(KEY_USERS);
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      return { ok: false, error: 'Username sudah digunakan. Silakan pilih yang lain.' };
    }
    user.id = 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    user.passwordHash = hash(user.password);
    delete user.password;
    user.role = user.role || 'student';
    user.createdAt = new Date().toISOString();
    users.push(user);
    writeArr(KEY_USERS, users);
    return { ok: true, user };
  }

  function verifyUser(username, password) {
    const u = findUserByUsername(username);
    if (!u) return { ok: false, error: 'Username tidak ditemukan.' };
    if (u.passwordHash !== hash(password)) return { ok: false, error: 'Password salah.' };
    return { ok: true, user: u };
  }

  /* ---------- API: SESSION ---------- */
  function setSession(userId) {
    localStorage.setItem(KEY_SESSION, userId);
  }
  function clearSession() {
    localStorage.removeItem(KEY_SESSION);
  }
  function getSessionUser() {
    const id = localStorage.getItem(KEY_SESSION);
    if (!id) return null;
    return readArr(KEY_USERS).find(u => u.id === id) || null;
  }

  /* ---------- API: RESULTS (hasil evaluasi) ---------- */
  function getResults() { return readArr(KEY_RESULTS); }

  function getResultsByUser(userId) {
    return readArr(KEY_RESULTS).filter(r => r.userId === userId);
  }

  function addResult(result) {
    const list = readArr(KEY_RESULTS);
    result.id = 'r_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    result.timestamp = new Date().toISOString();
    list.push(result);
    writeArr(KEY_RESULTS, list);
    return result;
  }

  function deleteResult(id) {
    const list = readArr(KEY_RESULTS).filter(r => r.id !== id);
    writeArr(KEY_RESULTS, list);
  }

  function clearAllResults() {
    writeArr(KEY_RESULTS, []);
  }

  /* ---------- API: export CSV untuk admin ---------- */
  function resultsToCSV() {
    const results = getResults();
    const users = getUsers();
    const header = ['Nama', 'NISN', 'Kelas', 'Modul', 'Skor', 'Total', 'Persentase (%)', 'Waktu'];
    const rows = results.map(r => {
      const u = users.find(x => x.id === r.userId) || {};
      const d = new Date(r.timestamp);
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      return [
        u.name || '-',
        u.nisn || '-',
        u.kelas || '-',
        r.module || '-',
        r.score,
        r.total,
        pct,
        d.toLocaleString('id-ID')
      ];
    });
    const esc = v => {
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [header, ...rows].map(row => row.map(esc).join(',')).join('\n');
  }

  // inisialisasi saat pertama kali dimuat
  seedAdminIfMissing();

  return {
    hash,
    getUsers, getStudents, findUserByUsername, addUser, verifyUser,
    setSession, clearSession, getSessionUser,
    getResults, getResultsByUser, addResult, deleteResult, clearAllResults,
    resultsToCSV
  };
})();
