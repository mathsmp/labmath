/* ============================================================
   module2.js — Bangun Ruang & Jaring-Jaring
   Menggunakan Engine3D (engine3d.js) untuk render bangun ruang,
   plus gambar jaring-jaring 2D dan simulasi pengisian volume.
   ============================================================ */

window.Module2 = (function () {

  let canvas, ctx;
  let activeShape = 'kubus';
  let activeTab = 'model3d';
  let angleX = -0.4, angleY = 0.6;
  let dragging = false, lastX = 0, lastY = 0;
  let autoRotate = true;

  const dims = {
    kubus: { s: 3 },
    balok: { p: 4, l: 2.5, t: 2 },
    prisma: { s: 3, t: 3 },
    limas: { s: 3, t: 3.5 },
    tabung: { r: 1.5, t: 3 },
    kerucut: { r: 1.5, t: 3 },
    bola: { r: 1.8 }
  };

  const COLOR = '#5B8DEF';

  function init() {
    canvas = document.getElementById('m2-canvas');
    ctx = canvas.getContext('2d');

    document.querySelectorAll('#m2-gallery .gallery-item').forEach(btn => {
      btn.addEventListener('click', () => {
        activeShape = btn.dataset.shape;
        document.querySelectorAll('#m2-gallery .gallery-item').forEach(b => b.classList.toggle('active', b === btn));
        activeTab = 'model3d';
        document.querySelectorAll('#m2-tabs .tabbtn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'model3d'));
        renderControls();
      });
    });

    document.querySelectorAll('#m2-tabs .tabbtn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('#m2-tabs .tabbtn').forEach(b => b.classList.toggle('active', b === btn));
        renderControls();
      });
    });

    attachDragEvents();
    renderControls();
    loop();
  }

  function attachDragEvents() {
    canvas.addEventListener('mousedown', e => { dragging = true; autoRotate = false; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      angleY += dx * 0.01; angleX += dy * 0.01;
      angleX = Math.max(-1.4, Math.min(1.4, angleX));
      lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener('touchstart', e => {
      dragging = true; autoRotate = false;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
      angleY += dx * 0.01; angleX += dy * 0.01;
      angleX = Math.max(-1.4, Math.min(1.4, angleX));
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }, { passive: true });
    canvas.addEventListener('touchend', () => dragging = false);
  }

  function buildShape() {
    const d = dims[activeShape];
    if (activeShape === 'kubus') return Engine3D.makeBox(d.s, d.s, d.s, COLOR);
    if (activeShape === 'balok') return Engine3D.makeBox(d.p, d.l, d.t, COLOR);
    if (activeShape === 'prisma') return Engine3D.makePrismaSegitiga(d.s, d.t, COLOR);
    if (activeShape === 'limas') return Engine3D.makeLimasSegiempat(d.s, d.t, COLOR);
    if (activeShape === 'tabung') return Engine3D.makeTabung(d.r, d.t, COLOR);
    if (activeShape === 'kerucut') return Engine3D.makeKerucut(d.r, d.t, COLOR);
    if (activeShape === 'bola') return Engine3D.makeBola(d.r, COLOR);
    return Engine3D.makeBox(2, 2, 2, COLOR);
  }

  function loop() {
    if (activeTab === 'model3d' || activeTab === 'volume') {
      if (autoRotate && !dragging) angleY += 0.004;
      const shape = buildShape();
      Engine3D.render(ctx, shape, angleX, angleY, { scale: computeScale() });
    }
    requestAnimationFrame(loop);
  }

  function computeScale() {
    // sesuaikan skala tampilan berdasarkan ukuran bangun agar selalu pas di kanvas
    const d = dims[activeShape];
    let approxRadius = 3;
    if (activeShape === 'kubus') approxRadius = d.s * 0.9;
    else if (activeShape === 'balok') approxRadius = Math.max(d.p, d.l, d.t) * 0.8;
    else if (activeShape === 'prisma' || activeShape === 'limas') approxRadius = Math.max(d.s, d.t) * 0.8;
    else if (activeShape === 'tabung' || activeShape === 'kerucut') approxRadius = Math.max(d.r * 2, d.t) * 0.8;
    else if (activeShape === 'bola') approxRadius = d.r * 1.3;
    return Math.min(90, 180 / approxRadius);
  }

  /* ---------------- Rumus luas permukaan & volume ---------------- */
  function calcFormulas() {
    const d = dims[activeShape];
    if (activeShape === 'kubus') {
      const s = d.s;
      return { luas: 6 * s * s, volume: s * s * s, rumusLuas: '6 × s²', rumusVolume: 's³' };
    }
    if (activeShape === 'balok') {
      const { p, l, t } = d;
      return { luas: 2 * (p * l + p * t + l * t), volume: p * l * t, rumusLuas: '2(pl + pt + lt)', rumusVolume: 'p × l × t' };
    }
    if (activeShape === 'prisma') {
      const { s, t } = d;
      const luasAlas = (Math.sqrt(3) / 4) * s * s;
      const keliling = 3 * s;
      return {
        luas: 2 * luasAlas + keliling * t,
        volume: luasAlas * t,
        rumusLuas: '(2 × Luas alas) + (Keliling alas × tinggi)',
        rumusVolume: 'Luas alas × tinggi'
      };
    }
    if (activeShape === 'limas') {
      const { s, t } = d;
      const tinggiSisiMiring = Math.sqrt(t * t + (s / 2) * (s / 2));
      return {
        luas: s * s + 4 * (0.5 * s * tinggiSisiMiring),
        volume: (1 / 3) * s * s * t,
        rumusLuas: 's² + 4 × (½ × s × tinggi sisi miring)',
        rumusVolume: '⅓ × s² × t'
      };
    }
    if (activeShape === 'tabung') {
      const { r, t } = d;
      return {
        luas: 2 * Math.PI * r * r + 2 * Math.PI * r * t,
        volume: Math.PI * r * r * t,
        rumusLuas: '2πr² + 2πrt',
        rumusVolume: 'πr²t'
      };
    }
    if (activeShape === 'kerucut') {
      const { r, t } = d;
      const s = Math.sqrt(r * r + t * t);
      return {
        luas: Math.PI * r * r + Math.PI * r * s,
        volume: (1 / 3) * Math.PI * r * r * t,
        rumusLuas: 'πr² + πrs (s = garis pelukis)',
        rumusVolume: '⅓ × πr² × t'
      };
    }
    if (activeShape === 'bola') {
      const { r } = d;
      return { luas: 4 * Math.PI * r * r, volume: (4 / 3) * Math.PI * r * r * r, rumusLuas: '4πr²', rumusVolume: '4/3 × πr³' };
    }
    return { luas: 0, volume: 0, rumusLuas: '-', rumusVolume: '-' };
  }

  /* ---------------- Gambar jaring-jaring 2D ---------------- */
  function drawNet() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FDFEFF'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1F3864'; ctx.fillStyle = '#5B8DEF88'; ctx.lineWidth = 2;
    ctx.font = '12px Segoe UI';
    const d = dims[activeShape];
    const unit = 28;
    const cx = w / 2, cy = h / 2;

    function rect(x, y, rw, rh, label) {
      ctx.fillRect(x, y, rw, rh);
      ctx.strokeRect(x, y, rw, rh);
      ctx.fillStyle = '#1F3864';
      ctx.fillText(label, x + rw / 2 - 10, y + rh / 2 + 4);
      ctx.fillStyle = '#5B8DEF88';
    }
    function circle(x, y, rad, label) {
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1F3864';
      ctx.fillText(label, x - 10, y + 4);
      ctx.fillStyle = '#5B8DEF88';
    }
    function triangle(pts, label) {
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const cxT = (pts[0].x + pts[1].x + pts[2].x) / 3;
      const cyT = (pts[0].y + pts[1].y + pts[2].y) / 3;
      ctx.fillStyle = '#1F3864'; ctx.fillText(label, cxT - 10, cyT); ctx.fillStyle = '#5B8DEF88';
    }

    if (activeShape === 'kubus' || activeShape === 'balok') {
      const p = unit * (activeShape === 'kubus' ? d.s : d.p);
      const l = unit * (activeShape === 'kubus' ? d.s : d.l);
      const t = unit * (activeShape === 'kubus' ? d.s : d.t);
      // layout salib (cross)
      rect(cx - p / 2, cy - t / 2 - l, p, l, 'Atas');
      rect(cx - p / 2, cy - t / 2, p, t, 'Depan');
      rect(cx - p / 2, cy + t / 2, p, l, 'Bawah');
      rect(cx - p / 2 - l, cy - t / 2, l, t, 'Kiri');
      rect(cx + p / 2, cy - t / 2, l, t, 'Kanan');
      rect(cx - p / 2, cy + t / 2 + l, p, l, 'Belakang');
    }

    if (activeShape === 'prisma') {
      const s = unit * d.s, t = unit * d.t;
      const h3 = (Math.sqrt(3) / 2) * s;
      // 3 persegi panjang berjajar + 2 segitiga
      rect(cx - 1.5 * s, cy - t / 2, s, t, 'Sisi 1');
      rect(cx - 0.5 * s, cy - t / 2, s, t, 'Sisi 2');
      rect(cx + 0.5 * s, cy - t / 2, s, t, 'Sisi 3');
      triangle([
        { x: cx - 1.5 * s, y: cy - t / 2 },
        { x: cx - 0.5 * s, y: cy - t / 2 },
        { x: cx - s, y: cy - t / 2 - h3 }
      ], 'Alas');
      triangle([
        { x: cx - 1.5 * s, y: cy + t / 2 },
        { x: cx - 0.5 * s, y: cy + t / 2 },
        { x: cx - s, y: cy + t / 2 + h3 }
      ], 'Tutup');
    }

    if (activeShape === 'limas') {
      const s = unit * d.s;
      const tinggiSisi = Math.sqrt(Math.pow(unit * d.t, 2) + Math.pow(s / 2, 2));
      rect(cx - s / 2, cy - s / 2, s, s, 'Alas');
      triangle([{ x: cx - s / 2, y: cy - s / 2 }, { x: cx + s / 2, y: cy - s / 2 }, { x: cx, y: cy - s / 2 - tinggiSisi }], 'Sisi');
      triangle([{ x: cx + s / 2, y: cy - s / 2 }, { x: cx + s / 2, y: cy + s / 2 }, { x: cx + s / 2 + tinggiSisi, y: cy }], 'Sisi');
      triangle([{ x: cx + s / 2, y: cy + s / 2 }, { x: cx - s / 2, y: cy + s / 2 }, { x: cx, y: cy + s / 2 + tinggiSisi }], 'Sisi');
      triangle([{ x: cx - s / 2, y: cy + s / 2 }, { x: cx - s / 2, y: cy - s / 2 }, { x: cx - s / 2 - tinggiSisi, y: cy }], 'Sisi');
    }

    if (activeShape === 'tabung') {
      const r = unit * d.r, t = unit * d.t;
      const keliling = 2 * Math.PI * r;
      rect(cx - keliling / 2, cy - t / 2, keliling, t, 'Selimut (2πr × t)');
      circle(cx, cy - t / 2 - r - 6, r, 'Tutup');
      circle(cx, cy + t / 2 + r + 6, r, 'Alas');
    }

    if (activeShape === 'kerucut') {
      const r = unit * d.r, t = unit * d.t;
      const slant = Math.sqrt(r * r + t * t);
      const sudutSektor = (r / slant) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, slant, -Math.PI / 2 - sudutSektor / 2, -Math.PI / 2 + sudutSektor / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1F3864'; ctx.fillText('Selimut (juring)', cx - 35, cy - slant / 2);
      circle(cx, cy + slant + r + 10, r, 'Alas');
    }

    if (activeShape === 'bola') {
      ctx.fillStyle = '#1F3864';
      ctx.font = '14px Segoe UI';
      ctx.fillText('Bola tidak memiliki jaring-jaring datar sederhana,', cx - 190, cy - 10);
      ctx.fillText('karena permukaannya melengkung merata di segala arah.', cx - 210, cy + 14);
    }
  }

  /* ---------------- Simulasi volume (animasi pengisian) ---------------- */
  function runVolumeSimulation(container) {
    const f = calcFormulas();
    const fillBar = container.querySelector('#m2-fill-bar');
    const counter = container.querySelector('#m2-fill-counter');
    let progress = 0;
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      progress = Math.min(1, (now - start) / duration);
      fillBar.style.height = (progress * 100) + '%';
      counter.textContent = (progress * f.volume).toFixed(2);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- Panel kontrol per tab ---------------- */
  function renderControls() {
    const panel = document.getElementById('m2-controls');
    const hint = document.getElementById('m2-hint');
    panel.innerHTML = '';
    hint.style.display = (activeTab === 'model3d') ? 'block' : 'none';

    const f = calcFormulas();
    const dimInputsHtml = dimensionInputsHtml();

    if (activeTab === 'model3d') {
      panel.innerHTML = `
        <h4>${shapeName()}</h4>
        ${dimInputsHtml}
        <div class="info-box" id="m2-info-box">
          <b>Luas Permukaan</b> = ${f.rumusLuas}<br>
          = <b><span id="m2-luas-val">${f.luas.toFixed(2)}</span></b> satuan²<br><br>
          <b>Volume</b> = ${f.rumusVolume}<br>
          = <b><span id="m2-volume-val">${f.volume.toFixed(2)}</span></b> satuan³
        </div>
      `;
      attachDimensionEvents(panel, () => {
        const nf = calcFormulas();
        panel.querySelector('#m2-luas-val').textContent = nf.luas.toFixed(2);
        panel.querySelector('#m2-volume-val').textContent = nf.volume.toFixed(2);
      });
    }

    if (activeTab === 'jaring') {
      panel.innerHTML = `
        <h4>Jaring-Jaring ${shapeName()}</h4>
        ${dimInputsHtml}
        <div class="info-box">Perhatikan bagaimana sisi-sisi bangun ruang ini jika "dibuka" akan membentuk bidang datar (jaring-jaring) di atas.</div>
      `;
      attachDimensionEvents(panel, drawNet);
      drawNet();
    }

    if (activeTab === 'volume') {
      panel.innerHTML = `
        <h4>Simulasi Pengisian Volume</h4>
        ${dimInputsHtml}
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:10px;">
          <div style="width:60px;height:140px;border:2px solid #1F3864;border-radius:6px;position:relative;overflow:hidden;background:#EDF1F8;">
            <div id="m2-fill-bar" style="position:absolute;bottom:0;left:0;width:100%;height:0%;background:#5B8DEF;transition:height 0.05s linear;"></div>
          </div>
          <div>
            <div style="font-size:0.85rem;color:var(--muted);">Volume terisi:</div>
            <div style="font-size:1.3rem;font-weight:700;color:var(--navy);"><span id="m2-fill-counter">0.00</span> satuan³</div>
          </div>
        </div>
        <button class="btn btn-primary" id="m2-fill-btn" style="margin-top:12px;">▶ Isi Cairan</button>
        <div class="info-box">Volume total: <b><span id="m2-volume-total-val">${f.volume.toFixed(2)}</span></b> satuan³ (${f.rumusVolume})</div>
      `;
      attachDimensionEvents(panel, () => {
        const nf = calcFormulas();
        const totalEl = panel.querySelector('#m2-volume-total-val');
        if (totalEl) totalEl.textContent = nf.volume.toFixed(2);
      });
      panel.querySelector('#m2-fill-btn').addEventListener('click', () => runVolumeSimulation(panel));
    }

    if (activeTab === 'kuis2') {
      panel.innerHTML = '<h4>Evaluasi Modul 2</h4><p class="quiz-intro">Kerjakan soal-soal berikut untuk menguji pemahamanmu tentang bangun ruang. Hasil akan otomatis tersimpan ke akunmu.</p><div id="m2-quiz"></div>';
      renderQuiz(document.getElementById('m2-quiz'), quizQuestions(),
        { module: 'Modul 2', moduleName: 'Bangun Ruang & Jaring-Jaring' });
    }
  }

  function shapeName() {
    const names = {
      kubus: 'Kubus', balok: 'Balok', prisma: 'Prisma Segitiga', limas: 'Limas Segiempat',
      tabung: 'Tabung', kerucut: 'Kerucut', bola: 'Bola'
    };
    return names[activeShape];
  }

  function dimensionInputsHtml() {
    const d = dims[activeShape];
    if (activeShape === 'kubus') return sliderHtml('s', 'Sisi (s)', d.s, 1, 6, 0.5);
    if (activeShape === 'balok') return sliderHtml('p', 'Panjang (p)', d.p, 1, 6, 0.5) + sliderHtml('l', 'Lebar (l)', d.l, 1, 6, 0.5) + sliderHtml('t', 'Tinggi (t)', d.t, 1, 6, 0.5);
    if (activeShape === 'prisma') return sliderHtml('s', 'Sisi alas (s)', d.s, 1, 6, 0.5) + sliderHtml('t', 'Tinggi (t)', d.t, 1, 6, 0.5);
    if (activeShape === 'limas') return sliderHtml('s', 'Sisi alas (s)', d.s, 1, 6, 0.5) + sliderHtml('t', 'Tinggi (t)', d.t, 1, 6, 0.5);
    if (activeShape === 'tabung' || activeShape === 'kerucut') return sliderHtml('r', 'Jari-jari (r)', d.r, 0.5, 3, 0.25) + sliderHtml('t', 'Tinggi (t)', d.t, 1, 6, 0.5);
    if (activeShape === 'bola') return sliderHtml('r', 'Jari-jari (r)', d.r, 0.5, 3, 0.25);
    return '';
  }

  function sliderHtml(key, label, val, min, max, step) {
    return `
      <div class="control-row">
        <label>${label}: <span class="value-badge" id="m2-${key}-val">${val}</span></label>
        <input type="range" id="m2-${key}" min="${min}" max="${max}" step="${step}" value="${val}">
      </div>
    `;
  }

  function attachDimensionEvents(panel, extraCallback) {
    const d = dims[activeShape];
    Object.keys(d).forEach(key => {
      const input = panel.querySelector('#m2-' + key);
      if (!input) return;
      input.addEventListener('input', e => {
        d[key] = parseFloat(e.target.value);
        panel.querySelector('#m2-' + key + '-val').textContent = d[key];
        if (extraCallback) extraCallback();
      });
    });
  }

  function quizQuestions() {
    return [
      {
        q: "Sebuah kotak kado berbentuk balok berukuran 20 cm × 15 cm × 10 cm. Berapa luas kertas kado minimal yang dibutuhkan untuk membungkusnya?",
        options: ["1300 cm²", "3000 cm²", "650 cm²", "1500 cm²"],
        correct: 0,
        explain: "Luas permukaan balok = 2(pl+pt+lt) = 2(300+200+150) = 2(650) = 1300 cm²."
      },
      {
        q: "Sebuah tangki air berbentuk tabung dengan jari-jari 7 m dan tinggi 10 m. Berapa kapasitas volumenya? (π ≈ 22/7)",
        options: ["1540 m³", "770 m³", "220 m³", "3080 m³"],
        correct: 0,
        explain: "Volume tabung = πr²t = (22/7) × 7² × 10 = 22 × 7 × 10 = 1540 m³."
      },
      {
        q: "Sebuah topi ulang tahun berbentuk kerucut memiliki jari-jari alas 6 cm dan tinggi 8 cm. Berapa panjang garis pelukisnya?",
        options: ["10 cm", "14 cm", "48 cm", "100 cm"],
        correct: 0,
        explain: "Garis pelukis s = √(r² + t²) = √(36+64) = √100 = 10 cm."
      },
      {
        q: "Jika sebuah kubus memiliki panjang sisi dua kali lipat dari kubus lain, maka volumenya menjadi...",
        options: ["8 kali lebih besar", "2 kali lebih besar", "4 kali lebih besar", "16 kali lebih besar"],
        correct: 0,
        explain: "Volume kubus sebanding dengan pangkat 3 dari sisi: (2s)³ = 8s³, jadi 8 kali lebih besar."
      },
      {
        q: "Sebuah kaleng minuman berbentuk tabung memiliki alas dan tinggi yang sama dengan sebuah kerucut. Perbandingan volume kerucut terhadap tabung adalah...",
        options: ["1 : 3", "1 : 2", "2 : 3", "1 : 1"],
        correct: 0,
        explain: "Volume kerucut = ⅓ × Volume tabung jika alas dan tinggi sama, sehingga perbandingannya 1 : 3."
      }
    ];
  }

  return { init };
})();
