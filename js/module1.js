/* ============================================================
   module1.js — Transformasi Geometri
   Bidang kartesius 2D dengan segitiga yang bisa direfleksikan,
   ditranslasikan, dirotasikan, dan didilatasikan.
   ============================================================ */

window.Module1 = (function () {

  let canvas, ctx;
  let activeTab = 'refleksi';
  const SCALE = 32; // px per satuan grid

  // Objek dasar (segitiga ABC)
  const BASE_POINTS = [
    { x: 1, y: 1, label: 'A' },
    { x: 4, y: 1, label: 'B' },
    { x: 2, y: 4, label: 'C' }
  ];

  const state = {
    refleksi: { axis: 'x' },
    translasi: { a: 3, b: 2 },
    rotasi: { center: { x: 0, y: 0 }, angle: 90 },
    dilatasi: { center: { x: 0, y: 0 }, k: 1.5 },
    kombinasi: { step: 0, ops: [ { type: 'translasi', a: 2, b: 1 }, { type: 'rotasi', angle: 90 } ] }
  };

  function init() {
    canvas = document.getElementById('m1-canvas');
    ctx = canvas.getContext('2d');
    document.querySelectorAll('#m1-tabs .tabbtn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    switchTab('refleksi');
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('#m1-tabs .tabbtn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    renderControls();
    draw();
  }

  /* ---------------- Transform math ---------------- */
  function reflect(p, axis) {
    if (axis === 'x') return { x: p.x, y: -p.y };
    if (axis === 'y') return { x: -p.x, y: p.y };
    if (axis === 'yx') return { x: p.y, y: p.x };
    if (axis === 'y-x') return { x: -p.y, y: -p.x };
    return p;
  }
  function translate(p, a, b) { return { x: p.x + a, y: p.y + b }; }
  function rotate(p, center, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    const dx = p.x - center.x, dy = p.y - center.y;
    return {
      x: center.x + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: center.y + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  }
  function dilate(p, center, k) {
    return { x: center.x + (p.x - center.x) * k, y: center.y + (p.y - center.y) * k };
  }

  /* ---------------- Drawing helpers ---------------- */
  function toScreen(p) {
    return { x: canvas.width / 2 + p.x * SCALE, y: canvas.height / 2 - p.y * SCALE };
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#E3E8F0';
    ctx.lineWidth = 1;
    const rangeX = Math.ceil(canvas.width / 2 / SCALE);
    const rangeY = Math.ceil(canvas.height / 2 / SCALE);
    for (let i = -rangeX; i <= rangeX; i++) {
      const s1 = toScreen({ x: i, y: -rangeY });
      const s2 = toScreen({ x: i, y: rangeY });
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    }
    for (let j = -rangeY; j <= rangeY; j++) {
      const s1 = toScreen({ x: -rangeX, y: j });
      const s2 = toScreen({ x: rangeX, y: j });
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    }
    // sumbu utama
    ctx.strokeStyle = '#9AA5B5';
    ctx.lineWidth = 1.5;
    const ox = toScreen({ x: -rangeX, y: 0 }), ox2 = toScreen({ x: rangeX, y: 0 });
    ctx.beginPath(); ctx.moveTo(ox.x, ox.y); ctx.lineTo(ox2.x, ox2.y); ctx.stroke();
    const oy = toScreen({ x: 0, y: -rangeY }), oy2 = toScreen({ x: 0, y: rangeY });
    ctx.beginPath(); ctx.moveTo(oy.x, oy.y); ctx.lineTo(oy2.x, oy2.y); ctx.stroke();
  }

  function drawPolygon(points, color, fillAlpha, labelPrefix) {
    ctx.beginPath();
    points.forEach((p, i) => {
      const s = toScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = color + Math.round(fillAlpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '13px Segoe UI, Arial';
    ctx.fillStyle = color;
    points.forEach((p) => {
      const s = toScreen(p);
      ctx.fillText((labelPrefix || '') + (p.label || ''), s.x + 6, s.y - 6);
    });
  }

  function drawDashedLine(p1, p2, color) {
    const s1 = toScreen(p1), s2 = toScreen(p2);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    ctx.restore();
  }

  function drawArrow(from, to, color) {
    const s1 = toScreen(from), s2 = toScreen(to);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
    ctx.beginPath();
    ctx.moveTo(s2.x, s2.y);
    ctx.lineTo(s2.x - 10 * Math.cos(angle - Math.PI / 7), s2.y - 10 * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(s2.x - 10 * Math.cos(angle + Math.PI / 7), s2.y - 10 * Math.sin(angle + Math.PI / 7));
    ctx.closePath(); ctx.fill();
  }

  function markPoint(p, color, label) {
    const s = toScreen(p);
    ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    if (label) { ctx.fillStyle = color; ctx.font = '12px Segoe UI'; ctx.fillText(label, s.x + 6, s.y + 14); }
  }

  function coordTable(container, original, image) {
    let html = '<table class="coord-table"><tr><th>Titik</th><th>Asli</th><th>Bayangan</th></tr>';
    original.forEach((p, i) => {
      const q = image[i];
      html += `<tr><td>${p.label}</td><td>(${p.x.toFixed(1)}, ${p.y.toFixed(1)})</td><td>(${q.x.toFixed(1)}, ${q.y.toFixed(1)})</td></tr>`;
    });
    html += '</table>';
    container.innerHTML += html;
  }

  /* ---------------- Render per tab ---------------- */
  function draw() {
    drawGrid();
    drawPolygon(BASE_POINTS, '#1F3864', 0.35, '');

    if (activeTab === 'refleksi') {
      const axis = state.refleksi.axis;
      const image = BASE_POINTS.map(p => ({ ...reflect(p, axis), label: p.label }));
      let mirrorP1, mirrorP2;
      const R = 6;
      if (axis === 'x') { mirrorP1 = { x: -R, y: 0 }; mirrorP2 = { x: R, y: 0 }; }
      else if (axis === 'y') { mirrorP1 = { x: 0, y: -R }; mirrorP2 = { x: 0, y: R }; }
      else if (axis === 'yx') { mirrorP1 = { x: -R, y: -R }; mirrorP2 = { x: R, y: R }; }
      else { mirrorP1 = { x: -R, y: R }; mirrorP2 = { x: R, y: -R }; }
      drawDashedLine(mirrorP1, mirrorP2, '#B8860B');
      drawPolygon(image, '#B00020', 0.3, "'");
    }

    if (activeTab === 'translasi') {
      const { a, b } = state.translasi;
      const image = BASE_POINTS.map(p => ({ ...translate(p, a, b), label: p.label }));
      drawPolygon(image, '#B00020', 0.3, "'");
      const centroid = { x: (BASE_POINTS[0].x + BASE_POINTS[1].x + BASE_POINTS[2].x) / 3, y: (BASE_POINTS[0].y + BASE_POINTS[1].y + BASE_POINTS[2].y) / 3 };
      drawArrow(centroid, { x: centroid.x + a, y: centroid.y + b }, '#2E7D32');
    }

    if (activeTab === 'rotasi') {
      const { center, angle } = state.rotasi;
      const image = BASE_POINTS.map(p => ({ ...rotate(p, center, angle), label: p.label }));
      drawPolygon(image, '#B00020', 0.3, "'");
      markPoint(center, '#B8860B', 'P');
    }

    if (activeTab === 'dilatasi') {
      const { center, k } = state.dilatasi;
      const image = BASE_POINTS.map(p => ({ ...dilate(p, center, k), label: p.label }));
      drawPolygon(image, '#B00020', 0.3, "'");
      markPoint(center, '#B8860B', 'P');
    }

    if (activeTab === 'kombinasi') {
      const ops = state.kombinasi.ops;
      const step = state.kombinasi.step;
      let pts = BASE_POINTS.map(p => ({ ...p }));
      for (let i = 0; i < step; i++) {
        const op = ops[i];
        pts = pts.map(p => {
          if (op.type === 'translasi') return { ...translate(p, op.a, op.b), label: p.label };
          if (op.type === 'rotasi') return { ...rotate(p, { x: 0, y: 0 }, op.angle), label: p.label };
          return p;
        });
      }
      if (step > 0) drawPolygon(pts, '#B00020', 0.3, "'".repeat(step));
    }
  }

  /* ---------------- Controls per tab ---------------- */
  function renderControls() {
    const panel = document.getElementById('m1-controls');
    panel.innerHTML = '';

    if (activeTab === 'refleksi') {
      panel.innerHTML = `
        <h4>Refleksi (Pencerminan)</h4>
        <div class="control-row">
          <label>Pilih garis cermin</label>
          <select id="m1-axis">
            <option value="x">Sumbu-x</option>
            <option value="y">Sumbu-y</option>
            <option value="yx">Garis y = x</option>
            <option value="y-x">Garis y = -x</option>
          </select>
        </div>
        <div id="m1-coord"></div>
        <div class="info-box">Segitiga biru adalah objek asli. Segitiga merah (A', B', C') adalah bayangan hasil refleksi terhadap garis emas putus-putus.</div>
      `;
      panel.querySelector('#m1-axis').value = state.refleksi.axis;
      panel.querySelector('#m1-axis').addEventListener('change', e => {
        state.refleksi.axis = e.target.value; draw(); updateCoordTable();
      });
      updateCoordTable();
    }

    if (activeTab === 'translasi') {
      panel.innerHTML = `
        <h4>Translasi (Pergeseran)</h4>
        <div class="control-row">
          <label>Komponen a (horizontal): <span class="value-badge" id="m1-a-val">${state.translasi.a}</span></label>
          <input type="range" id="m1-a" min="-5" max="5" step="1" value="${state.translasi.a}">
        </div>
        <div class="control-row">
          <label>Komponen b (vertikal): <span class="value-badge" id="m1-b-val">${state.translasi.b}</span></label>
          <input type="range" id="m1-b" min="-5" max="5" step="1" value="${state.translasi.b}">
        </div>
        <div id="m1-coord"></div>
        <div class="info-box">Vektor translasi: T = (a, b). Anak panah hijau menunjukkan arah &amp; jarak pergeseran.</div>
      `;
      panel.querySelector('#m1-a').addEventListener('input', e => {
        state.translasi.a = parseInt(e.target.value);
        panel.querySelector('#m1-a-val').textContent = state.translasi.a;
        draw(); updateCoordTable();
      });
      panel.querySelector('#m1-b').addEventListener('input', e => {
        state.translasi.b = parseInt(e.target.value);
        panel.querySelector('#m1-b-val').textContent = state.translasi.b;
        draw(); updateCoordTable();
      });
      updateCoordTable();
    }

    if (activeTab === 'rotasi') {
      panel.innerHTML = `
        <h4>Rotasi (Perputaran)</h4>
        <div class="control-row">
          <label>Sudut rotasi (°): <span class="value-badge" id="m1-angle-val">${state.rotasi.angle}</span></label>
          <input type="range" id="m1-angle" min="-270" max="270" step="15" value="${state.rotasi.angle}">
        </div>
        <div class="control-row">
          <label>Titik pusat rotasi P(x, y)</label>
          <div style="display:flex;gap:8px;">
            <input type="number" id="m1-px" value="${state.rotasi.center.x}" style="width:50%">
            <input type="number" id="m1-py" value="${state.rotasi.center.y}" style="width:50%">
          </div>
        </div>
        <div id="m1-coord"></div>
        <div class="info-box">Rotasi positif berlawanan arah jarum jam. Titik emas (P) adalah pusat rotasi.</div>
      `;
      panel.querySelector('#m1-angle').addEventListener('input', e => {
        state.rotasi.angle = parseInt(e.target.value);
        panel.querySelector('#m1-angle-val').textContent = state.rotasi.angle;
        draw(); updateCoordTable();
      });
      panel.querySelector('#m1-px').addEventListener('input', e => {
        state.rotasi.center.x = parseFloat(e.target.value) || 0; draw(); updateCoordTable();
      });
      panel.querySelector('#m1-py').addEventListener('input', e => {
        state.rotasi.center.y = parseFloat(e.target.value) || 0; draw(); updateCoordTable();
      });
      updateCoordTable();
    }

    if (activeTab === 'dilatasi') {
      panel.innerHTML = `
        <h4>Dilatasi (Perkalian/Skala)</h4>
        <div class="control-row">
          <label>Faktor skala k: <span class="value-badge" id="m1-k-val">${state.dilatasi.k}</span></label>
          <input type="range" id="m1-k" min="-3" max="3" step="0.5" value="${state.dilatasi.k}">
        </div>
        <div class="control-row">
          <label>Titik pusat dilatasi P(x, y)</label>
          <div style="display:flex;gap:8px;">
            <input type="number" id="m1-dpx" value="${state.dilatasi.center.x}" style="width:50%">
            <input type="number" id="m1-dpy" value="${state.dilatasi.center.y}" style="width:50%">
          </div>
        </div>
        <div id="m1-coord"></div>
        <div class="info-box">Jika |k| &gt; 1 objek membesar, jika 0 &lt; |k| &lt; 1 objek mengecil, jika k negatif objek berbalik posisi (titik pusat di tengah).</div>
      `;
      panel.querySelector('#m1-k').addEventListener('input', e => {
        state.dilatasi.k = parseFloat(e.target.value);
        panel.querySelector('#m1-k-val').textContent = state.dilatasi.k;
        draw(); updateCoordTable();
      });
      panel.querySelector('#m1-dpx').addEventListener('input', e => {
        state.dilatasi.center.x = parseFloat(e.target.value) || 0; draw(); updateCoordTable();
      });
      panel.querySelector('#m1-dpy').addEventListener('input', e => {
        state.dilatasi.center.y = parseFloat(e.target.value) || 0; draw(); updateCoordTable();
      });
      updateCoordTable();
    }

    if (activeTab === 'kombinasi') {
      const ops = state.kombinasi.ops;
      const descOps = ops.map((op, i) =>
        op.type === 'translasi' ? `${i + 1}. Translasi (${op.a}, ${op.b})` : `${i + 1}. Rotasi ${op.angle}&deg; pusat O(0,0)`
      ).join('<br>');
      panel.innerHTML = `
        <h4>Kombinasi Transformasi</h4>
        <div class="info-box"><b>Urutan operasi:</b><br>${descOps}</div>
        <div class="control-row" style="display:flex;gap:8px;">
          <button class="btn btn-secondary" id="m1-prev-step">&#8592; Mundur</button>
          <button class="btn btn-primary" id="m1-next-step">Lanjut &#8594;</button>
        </div>
        <div class="info-box">Langkah saat ini: <b id="m1-step-label">${state.kombinasi.step}</b> dari ${ops.length}</div>
      `;
      panel.querySelector('#m1-next-step').addEventListener('click', () => {
        if (state.kombinasi.step < ops.length) state.kombinasi.step++;
        panel.querySelector('#m1-step-label').textContent = state.kombinasi.step;
        draw();
      });
      panel.querySelector('#m1-prev-step').addEventListener('click', () => {
        if (state.kombinasi.step > 0) state.kombinasi.step--;
        panel.querySelector('#m1-step-label').textContent = state.kombinasi.step;
        draw();
      });
    }

    if (activeTab === 'kuis1') {
      panel.innerHTML = '<h4>Evaluasi Modul 1</h4><p class="quiz-intro">Kerjakan soal-soal berikut untuk menguji pemahamanmu tentang transformasi geometri. Hasil akan otomatis tersimpan ke akunmu.</p><div id="m1-quiz"></div>';
      renderQuiz(document.getElementById('m1-quiz'), quizQuestions(),
        { module: 'Modul 1', moduleName: 'Transformasi Geometri' });
    }
  }

  function updateCoordTable() {
    const target = document.getElementById('m1-coord');
    if (!target) return;
    target.innerHTML = '';
    let image;
    if (activeTab === 'refleksi') image = BASE_POINTS.map(p => reflect(p, state.refleksi.axis));
    else if (activeTab === 'translasi') image = BASE_POINTS.map(p => translate(p, state.translasi.a, state.translasi.b));
    else if (activeTab === 'rotasi') image = BASE_POINTS.map(p => rotate(p, state.rotasi.center, state.rotasi.angle));
    else if (activeTab === 'dilatasi') image = BASE_POINTS.map(p => dilate(p, state.dilatasi.center, state.dilatasi.k));
    else return;
    coordTable(target, BASE_POINTS, image);
  }

  function quizQuestions() {
    return [
      {
        q: "Titik A(2, 3) dicerminkan terhadap sumbu-x. Bayangannya adalah...",
        options: ["A'(2, -3)", "A'(-2, 3)", "A'(-2, -3)", "A'(3, 2)"],
        correct: 0,
        explain: "Refleksi terhadap sumbu-x mengubah (x, y) menjadi (x, -y)."
      },
      {
        q: "Titik B(1, 4) ditranslasikan oleh vektor (3, -2). Bayangannya adalah...",
        options: ["B'(4, 2)", "B'(-2, 6)", "B'(4, -2)", "B'(1, 2)"],
        correct: 0,
        explain: "Translasi (a,b) menambahkan a ke x dan b ke y: (1+3, 4-2) = (4, 2)."
      },
      {
        q: "Titik C(2, 0) dirotasikan 90° berlawanan arah jarum jam terhadap pusat O(0,0). Bayangannya adalah...",
        options: ["C'(0, 2)", "C'(0, -2)", "C'(-2, 0)", "C'(2, 0)"],
        correct: 0,
        explain: "Rotasi 90° dari (x,y) terhadap O menghasilkan (-y, x): (2,0) → (0, 2)."
      },
      {
        q: "Titik D(3, 2) didilatasikan dengan faktor skala k = 2 terhadap pusat O(0,0). Bayangannya adalah...",
        options: ["D'(6, 4)", "D'(1.5, 1)", "D'(5, 4)", "D'(6, 2)"],
        correct: 0,
        explain: "Dilatasi dengan pusat O mengalikan setiap koordinat dengan k: (3×2, 2×2) = (6, 4)."
      },
      {
        q: "Manakah yang benar tentang dilatasi dengan faktor skala k = -1?",
        options: [
          "Objek berputar 180° terhadap pusat dilatasi (ukuran tetap)",
          "Objek menjadi dua kali lebih besar",
          "Objek menghilang",
          "Objek bergeser ke kanan"
        ],
        correct: 0,
        explain: "k = -1 membuat objek berbalik posisi (seperti rotasi 180°) tanpa mengubah ukurannya."
      }
    ];
  }

  return { init };
})();
