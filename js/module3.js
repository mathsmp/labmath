/* ============================================================
   module3.js — Teorema Pythagoras
   Pembuktian visual, kalkulator sisi, studi kasus, jarak dua
   titik, dan galeri tripel Pythagoras.
   ============================================================ */

window.Module3 = (function () {

  let canvas, ctx;
  let activeTab = 'bukti';
  const GRID_SCALE = 26;

  const state = {
    bukti: { a: 3, b: 4 },
    kalkulator: { mode: 'ab', a: 3, b: 4, c: 5 },
    studikasus: { scenario: 'tangga' },
    jarak: { points: [] },
    galeri: { selected: 0 }
  };

  const triples = [
    { a: 3, b: 4, c: 5 },
    { a: 6, b: 8, c: 10 },
    { a: 5, b: 12, c: 13 },
    { a: 8, b: 15, c: 17 },
    { a: 7, b: 24, c: 25 }
  ];

  const scenarios = {
    tangga: {
      title: 'Tangga Bersandar ke Tembok',
      desc: 'Sebuah tangga sepanjang <b>5 m</b> disandarkan ke tembok. Jarak kaki tangga ke tembok adalah <b>3 m</b>. Berapa tinggi tangga menyentuh tembok?',
      a: 3, c: 5, unknown: 'b', answer: 4, unit: 'm'
    },
    tiang: {
      title: 'Tiang Bendera dengan Tali Penahan',
      desc: 'Sebuah tiang bendera tingginya <b>6 m</b>. Tali penahan diikatkan dari ujung tiang ke tanah pada jarak <b>8 m</b> dari dasar tiang. Berapa panjang tali penahan tersebut?',
      a: 8, b: 6, unknown: 'c', answer: 10, unit: 'm'
    },
    lapangan: {
      title: 'Diagonal Lapangan',
      desc: 'Sebuah lapangan berbentuk persegi panjang berukuran <b>30 m × 40 m</b>. Berapa panjang diagonal lapangan tersebut?',
      a: 30, b: 40, unknown: 'c', answer: 50, unit: 'm'
    }
  };

  function init() {
    canvas = document.getElementById('m3-canvas');
    ctx = canvas.getContext('2d');
    document.querySelectorAll('#m3-tabs .tabbtn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    canvas.addEventListener('click', handleCanvasClick);
    switchTab('bukti');
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('#m3-tabs .tabbtn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    renderControls();
    draw();
  }

  /* ---------------- Util: auto-fit transform ---------------- */
  function fitTransform(points, padding) {
    padding = padding || 40;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = Math.max(0.001, maxX - minX), h = Math.max(0.001, maxY - minY);
    const availW = canvas.width - 2 * padding, availH = canvas.height - 2 * padding;
    const scale = Math.min(availW / w, availH / h);
    const contentW = w * scale, contentH = h * scale;
    const leftMargin = (canvas.width - contentW) / 2;
    const topMargin = (canvas.height - contentH) / 2;
    return function (p) {
      return {
        x: leftMargin + (p.x - minX) * scale,
        y: topMargin + (maxY - p.y) * scale
      };
    };
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FDFEFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawPoly(toScreen, pts, fill, stroke, alpha) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const s = toScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    if (fill) { ctx.globalAlpha = alpha !== undefined ? alpha : 1; ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1; }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  function label(toScreen, p, text, color) {
    const s = toScreen(p);
    ctx.fillStyle = color || '#1F3864';
    ctx.font = '13px Segoe UI, Arial';
    ctx.fillText(text, s.x, s.y);
  }

  /* ---------------- TAB: Pembuktian Visual ---------------- */
  function drawBukti() {
    const { a, b } = state.bukti;
    const c = Math.sqrt(a * a + b * b);
    // titik siku-siku di origin (0,0); kaki a horizontal, kaki b vertikal
    const O = { x: 0, y: 0 }, A = { x: a, y: 0 }, B = { x: 0, y: b };
    // persegi pada sisi a (di bawah)
    const sqA = [O, A, { x: a, y: -a }, { x: 0, y: -a }];
    // persegi pada sisi b (di kiri)
    const sqB = [O, B, { x: -b, y: b }, { x: -b, y: 0 }];
    // persegi pada sisi c (hipotenusa), arah keluar dari segitiga
    const P3 = { x: b, y: a + b }, P4 = { x: a + b, y: a };
    const sqC = [A, B, P3, P4];

    const allPts = [O, A, B, ...sqA, ...sqB, ...sqC];
    const toScreen = fitTransform(allPts, 50);

    clearCanvas();
    drawPoly(toScreen, sqA, '#5B8DEF55', '#5B8DEF');
    drawPoly(toScreen, sqB, '#B8860B55', '#B8860B');
    drawPoly(toScreen, sqC, '#B0002055', '#B00020');
    drawPoly(toScreen, [O, A, B], '#1F386455', '#1F3864');

    label(toScreen, { x: a / 2, y: -a / 2 }, `a² = ${(a * a).toFixed(1)}`, '#2B4C8C');
    label(toScreen, { x: -b / 2, y: b / 2 }, `b² = ${(b * b).toFixed(1)}`, '#B8860B');
    label(toScreen, { x: (b + a + b) / 2 - b * 0.15, y: (a + a + b) / 2 }, `c² = ${(c * c).toFixed(1)}`, '#B00020');
    label(toScreen, { x: a / 2, y: 0.15 }, `a = ${a}`, '#1F3864');
    label(toScreen, { x: -0.55, y: b / 2 }, `b = ${b}`, '#1F3864');
  }

  /* ---------------- TAB: Kalkulator Sisi ---------------- */
  function drawKalkulator() {
    const { mode, a, b, c } = state.kalkulator;
    let A = a, B = b, C = c;
    if (mode === 'ab') C = Math.sqrt(A * A + B * B);
    if (mode === 'ac') B = Math.sqrt(Math.max(0, C * C - A * A));
    if (mode === 'bc') A = Math.sqrt(Math.max(0, C * C - B * B));

    const O = { x: 0, y: 0 }, PA = { x: A, y: 0 }, PB = { x: 0, y: B };
    const toScreen = fitTransform([O, PA, PB], 60);
    clearCanvas();
    drawPoly(toScreen, [O, PA, PB], '#5B8DEF33', '#1F3864');
    label(toScreen, { x: A / 2, y: -0.4 }, `a = ${A.toFixed(2)}`, '#1F3864');
    label(toScreen, { x: -0.9, y: B / 2 }, `b = ${B.toFixed(2)}`, '#1F3864');
    label(toScreen, { x: A / 2 + 0.3, y: B / 2 + 0.3 }, `c = ${C.toFixed(2)}`, '#B00020');

    return { A, B, C };
  }

  /* ---------------- TAB: Studi Kasus ---------------- */
  function drawStudiKasus() {
    const sc = scenarios[state.studikasus.scenario];
    clearCanvas();
    let a = sc.a, b = sc.b, c = sc.c;
    if (sc.unknown === 'b') b = Math.sqrt(c * c - a * a);
    if (sc.unknown === 'c') c = Math.sqrt(a * a + b * b);
    const O = { x: 0, y: 0 }, PA = { x: a, y: 0 }, PB = { x: 0, y: b };
    const toScreen = fitTransform([O, PA, PB], 60);
    drawPoly(toScreen, [O, PA, PB], '#5B8DEF22', '#1F3864');
    label(toScreen, { x: a / 2, y: -0.4 }, sc.unknown === 'a' ? '? ' : `${a} ${sc.unit}`, sc.unknown === 'a' ? '#B00020' : '#1F3864');
    label(toScreen, { x: -0.9, y: b / 2 }, sc.unknown === 'b' ? '?' : `${b.toFixed(1)} ${sc.unit}`, sc.unknown === 'b' ? '#B00020' : '#1F3864');
    label(toScreen, { x: a / 2 + 0.3, y: b / 2 + 0.3 }, sc.unknown === 'c' ? '?' : `${c.toFixed(1)} ${sc.unit}`, sc.unknown === 'c' ? '#B00020' : '#1F3864');
  }

  /* ---------------- TAB: Jarak Dua Titik ---------------- */
  function toScreenGrid(p) {
    return { x: canvas.width / 2 + p.x * GRID_SCALE, y: canvas.height / 2 - p.y * GRID_SCALE };
  }
  function fromScreenGrid(sx, sy) {
    return {
      x: Math.round((sx - canvas.width / 2) / GRID_SCALE),
      y: Math.round((canvas.height / 2 - sy) / GRID_SCALE)
    };
  }

  function drawJarak() {
    clearCanvas();
    ctx.strokeStyle = '#E3E8F0'; ctx.lineWidth = 1;
    const rangeX = Math.floor(canvas.width / 2 / GRID_SCALE);
    const rangeY = Math.floor(canvas.height / 2 / GRID_SCALE);
    for (let i = -rangeX; i <= rangeX; i++) {
      const s1 = toScreenGrid({ x: i, y: -rangeY }), s2 = toScreenGrid({ x: i, y: rangeY });
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    }
    for (let j = -rangeY; j <= rangeY; j++) {
      const s1 = toScreenGrid({ x: -rangeX, y: j }), s2 = toScreenGrid({ x: rangeX, y: j });
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    }
    ctx.strokeStyle = '#9AA5B5'; ctx.lineWidth = 1.5;
    const ox1 = toScreenGrid({ x: -rangeX, y: 0 }), ox2 = toScreenGrid({ x: rangeX, y: 0 });
    ctx.beginPath(); ctx.moveTo(ox1.x, ox1.y); ctx.lineTo(ox2.x, ox2.y); ctx.stroke();
    const oy1 = toScreenGrid({ x: 0, y: -rangeY }), oy2 = toScreenGrid({ x: 0, y: rangeY });
    ctx.beginPath(); ctx.moveTo(oy1.x, oy1.y); ctx.lineTo(oy2.x, oy2.y); ctx.stroke();

    const pts = state.jarak.points;
    pts.forEach((p, i) => {
      const s = toScreenGrid(p);
      ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#B00020'; ctx.fill();
      ctx.fillStyle = '#1F3864'; ctx.font = '13px Segoe UI';
      ctx.fillText(i === 0 ? 'Titik 1' : 'Titik 2', s.x + 8, s.y - 8);
    });

    if (pts.length === 2) {
      const [p1, p2] = pts;
      const helper = { x: p2.x, y: p1.y };
      const s1 = toScreenGrid(p1), sH = toScreenGrid(helper), s2 = toScreenGrid(p2);
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(sH.x, sH.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sH.x, sH.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#2E7D32'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    }
  }

  function handleCanvasClick(e) {
    if (activeTab !== 'jarak') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX, cy = (e.clientY - rect.top) * scaleY;
    const world = fromScreenGrid(cx, cy);
    if (state.jarak.points.length >= 2) state.jarak.points = [];
    state.jarak.points.push(world);
    draw();
    renderControls();
  }

  /* ---------------- TAB: Galeri Tripel ---------------- */
  function drawGaleri() {
    const t = triples[state.galeri.selected];
    const O = { x: 0, y: 0 }, PA = { x: t.a, y: 0 }, PB = { x: 0, y: t.b };
    const toScreen = fitTransform([O, PA, PB], 60);
    clearCanvas();
    drawPoly(toScreen, [O, PA, PB], '#5B8DEF33', '#1F3864');
    label(toScreen, { x: t.a / 2, y: -0.5 }, `a = ${t.a}`, '#1F3864');
    label(toScreen, { x: -1, y: t.b / 2 }, `b = ${t.b}`, '#1F3864');
    label(toScreen, { x: t.a / 2 + 0.4, y: t.b / 2 + 0.4 }, `c = ${t.c}`, '#B00020');
  }

  /* ---------------- Draw dispatcher ---------------- */
  function draw() {
    if (activeTab === 'bukti') drawBukti();
    else if (activeTab === 'kalkulator') drawKalkulator();
    else if (activeTab === 'studikasus') drawStudiKasus();
    else if (activeTab === 'jarak') drawJarak();
    else if (activeTab === 'galeri') drawGaleri();
    else if (activeTab === 'kuis3') clearCanvas();
  }

  /* ---------------- Controls ---------------- */
  function renderControls() {
    const panel = document.getElementById('m3-controls');
    panel.innerHTML = '';

    if (activeTab === 'bukti') {
      const { a, b } = state.bukti;
      const c = Math.sqrt(a * a + b * b);
      panel.innerHTML = `
        <h4>Pembuktian Visual a² + b² = c²</h4>
        <div class="control-row">
          <label>Sisi a: <span class="value-badge" id="m3-a-val">${a}</span></label>
          <input type="range" id="m3-a" min="1" max="6" step="0.5" value="${a}">
        </div>
        <div class="control-row">
          <label>Sisi b: <span class="value-badge" id="m3-b-val">${b}</span></label>
          <input type="range" id="m3-b" min="1" max="6" step="0.5" value="${b}">
        </div>
        <div class="info-box">
          a² = ${(a * a).toFixed(1)}<br>
          b² = ${(b * b).toFixed(1)}<br>
          a² + b² = ${(a * a + b * b).toFixed(1)}<br>
          c² = ${(c * c).toFixed(1)} &nbsp; (c = ${c.toFixed(2)})<br>
          <b>${Math.abs((a * a + b * b) - c * c) < 0.001 ? '✅ Terbukti sama!' : ''}</b>
        </div>
      `;
      panel.querySelector('#m3-a').addEventListener('input', e => {
        state.bukti.a = parseFloat(e.target.value); draw(); renderControls();
      });
      panel.querySelector('#m3-b').addEventListener('input', e => {
        state.bukti.b = parseFloat(e.target.value); draw(); renderControls();
      });
    }

    if (activeTab === 'kalkulator') {
      const { mode, a, b, c } = state.kalkulator;
      panel.innerHTML = `
        <h4>Kalkulator Sisi Segitiga</h4>
        <div class="control-row">
          <label>Sisi yang diketahui</label>
          <select id="m3-mode">
            <option value="ab">a &amp; b diketahui → cari c</option>
            <option value="ac">a &amp; c diketahui → cari b</option>
            <option value="bc">b &amp; c diketahui → cari a</option>
          </select>
        </div>
        <div class="control-row" id="m3-inputs"></div>
        <div class="info-box" id="m3-calc-result"></div>
      `;
      panel.querySelector('#m3-mode').value = mode;
      panel.querySelector('#m3-mode').addEventListener('change', e => {
        state.kalkulator.mode = e.target.value; renderControls(); draw();
      });
      renderKalkulatorInputs(panel);
    }

    if (activeTab === 'studikasus') {
      panel.innerHTML = `
        <h4>Studi Kasus</h4>
        <div class="control-row">
          <label>Pilih skenario</label>
          <select id="m3-scenario">
            <option value="tangga">Tangga Bersandar ke Tembok</option>
            <option value="tiang">Tiang Bendera dengan Tali</option>
            <option value="lapangan">Diagonal Lapangan</option>
          </select>
        </div>
        <div class="info-box" id="m3-scenario-desc"></div>
        <div class="control-row">
          <label>Jawaban kamu (dalam meter)</label>
          <input type="number" id="m3-jawaban" step="0.1">
        </div>
        <button class="btn btn-primary" id="m3-cek">Cek Jawaban</button>
        <div class="info-box" id="m3-jawaban-hasil" style="display:none;"></div>
      `;
      panel.querySelector('#m3-scenario').value = state.studikasus.scenario;
      updateScenarioDesc(panel);
      panel.querySelector('#m3-scenario').addEventListener('change', e => {
        state.studikasus.scenario = e.target.value;
        updateScenarioDesc(panel);
        panel.querySelector('#m3-jawaban-hasil').style.display = 'none';
        draw();
      });
      panel.querySelector('#m3-cek').addEventListener('click', () => {
        const sc = scenarios[state.studikasus.scenario];
        const userVal = parseFloat(panel.querySelector('#m3-jawaban').value);
        const resultBox = panel.querySelector('#m3-jawaban-hasil');
        resultBox.style.display = 'block';
        if (!isNaN(userVal) && Math.abs(userVal - sc.answer) < 0.15) {
          resultBox.innerHTML = `✅ <b>Benar!</b> Jawabannya adalah ${sc.answer} ${sc.unit}.`;
        } else {
          resultBox.innerHTML = `❌ Belum tepat. Jawaban yang benar adalah <b>${sc.answer} ${sc.unit}</b>. Gunakan a² + b² = c².`;
        }
      });
    }

    if (activeTab === 'jarak') {
      const pts = state.jarak.points;
      let info = '<p>Klik dua titik pada grid untuk menghitung jaraknya.</p>';
      if (pts.length === 2) {
        const [p1, p2] = pts;
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        info = `
          <p>Titik 1: (${p1.x}, ${p1.y})<br>Titik 2: (${p2.x}, ${p2.y})</p>
          <p>Δx = ${dx}, Δy = ${dy}</p>
          <p>Jarak = √(Δx² + Δy²)<br>= √(${dx}² + ${dy}²)<br>= √(${(dx * dx)} + ${(dy * dy)})<br>= <b>${dist.toFixed(2)}</b> satuan</p>
        `;
      }
      panel.innerHTML = `
        <h4>Jarak Dua Titik</h4>
        <div class="info-box">${info}</div>
        <button class="btn btn-secondary" id="m3-reset-jarak">🔄 Ulangi</button>
      `;
      panel.querySelector('#m3-reset-jarak').addEventListener('click', () => {
        state.jarak.points = []; draw(); renderControls();
      });
    }

    if (activeTab === 'galeri') {
      const t = triples[state.galeri.selected];
      let btnsHtml = triples.map((tr, i) =>
        `<button class="btn btn-outline ${i === state.galeri.selected ? 'selected' : ''}" data-idx="${i}" style="margin:3px;">${tr.a}-${tr.b}-${tr.c}</button>`
      ).join('');
      panel.innerHTML = `
        <h4>Galeri Tripel Pythagoras</h4>
        <div>${btnsHtml}</div>
        <div class="info-box">
          ${t.a}² + ${t.b}² = ${t.a * t.a} + ${t.b * t.b} = ${t.a * t.a + t.b * t.b}<br>
          ${t.c}² = ${t.c * t.c}<br>
          <b>${t.a * t.a + t.b * t.b === t.c * t.c ? '✅ Cocok — tripel Pythagoras sah!' : ''}</b>
        </div>
      `;
      panel.querySelectorAll('button[data-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.galeri.selected = parseInt(btn.dataset.idx);
          renderControls(); draw();
        });
      });
    }

    if (activeTab === 'kuis3') {
      panel.innerHTML = '<h4>Evaluasi Modul 3</h4><p class="quiz-intro">Kerjakan soal-soal berikut untuk menguji pemahamanmu tentang teorema Pythagoras. Hasil akan otomatis tersimpan ke akunmu.</p><div id="m3-quiz"></div>';
      renderQuiz(document.getElementById('m3-quiz'), quizQuestions(),
        { module: 'Modul 3', moduleName: 'Teorema Pythagoras' });
    }
  }

  function updateScenarioDesc(panel) {
    const sc = scenarios[state.studikasus.scenario];
    panel.querySelector('#m3-scenario-desc').innerHTML = `<b>${sc.title}</b><br>${sc.desc}`;
  }

  function renderKalkulatorInputs(panel) {
    const { mode, a, b, c } = state.kalkulator;
    const target = panel.querySelector('#m3-inputs');
    if (mode === 'ab') {
      target.innerHTML = `
        <label>Sisi a</label><input type="number" id="m3-in1" value="${a}" step="0.1">
        <label style="margin-top:8px;display:block;">Sisi b</label><input type="number" id="m3-in2" value="${b}" step="0.1">
      `;
      target.querySelector('#m3-in1').addEventListener('input', e => { state.kalkulator.a = parseFloat(e.target.value) || 0; draw(); showCalcResult(panel); });
      target.querySelector('#m3-in2').addEventListener('input', e => { state.kalkulator.b = parseFloat(e.target.value) || 0; draw(); showCalcResult(panel); });
    } else if (mode === 'ac') {
      target.innerHTML = `
        <label>Sisi a</label><input type="number" id="m3-in1" value="${a}" step="0.1">
        <label style="margin-top:8px;display:block;">Sisi c (hipotenusa)</label><input type="number" id="m3-in2" value="${c}" step="0.1">
      `;
      target.querySelector('#m3-in1').addEventListener('input', e => { state.kalkulator.a = parseFloat(e.target.value) || 0; draw(); showCalcResult(panel); });
      target.querySelector('#m3-in2').addEventListener('input', e => { state.kalkulator.c = parseFloat(e.target.value) || 0; draw(); showCalcResult(panel); });
    } else {
      target.innerHTML = `
        <label>Sisi b</label><input type="number" id="m3-in1" value="${b}" step="0.1">
        <label style="margin-top:8px;display:block;">Sisi c (hipotenusa)</label><input type="number" id="m3-in2" value="${c}" step="0.1">
      `;
      target.querySelector('#m3-in1').addEventListener('input', e => { state.kalkulator.b = parseFloat(e.target.value) || 0; draw(); showCalcResult(panel); });
      target.querySelector('#m3-in2').addEventListener('input', e => { state.kalkulator.c = parseFloat(e.target.value) || 0; draw(); showCalcResult(panel); });
    }
    showCalcResult(panel);
  }

  function showCalcResult(panel) {
    const result = drawKalkulator();
    draw();
    panel.querySelector('#m3-calc-result').innerHTML =
      `a = ${result.A.toFixed(2)} &nbsp; b = ${result.B.toFixed(2)} &nbsp; c = ${result.C.toFixed(2)}`;
  }

  function quizQuestions() {
    return [
      {
        q: "Sebuah segitiga siku-siku memiliki sisi a = 6 cm dan b = 8 cm. Berapa panjang sisi miringnya (c)?",
        options: ["10 cm", "14 cm", "48 cm", "100 cm"],
        correct: 0,
        explain: "c = √(a²+b²) = √(36+64) = √100 = 10 cm."
      },
      {
        q: "Sebuah pohon menjulang dan bayangannya di tanah sepanjang 9 m saat jarak miring dari ujung bayangan ke puncak pohon adalah 15 m. Berapa tinggi pohon tersebut?",
        options: ["12 m", "6 m", "18 m", "24 m"],
        correct: 0,
        explain: "tinggi = √(15² - 9²) = √(225-81) = √144 = 12 m."
      },
      {
        q: "Diagonal sebuah lapangan berukuran 30 m × 40 m adalah...",
        options: ["50 m", "70 m", "35 m", "1200 m"],
        correct: 0,
        explain: "diagonal = √(30²+40²) = √(900+1600) = √2500 = 50 m."
      },
      {
        q: "Manakah dari berikut ini yang MERUPAKAN tripel Pythagoras?",
        options: ["9, 12, 15", "5, 6, 7", "4, 5, 6", "10, 11, 12"],
        correct: 0,
        explain: "9² + 12² = 81+144 = 225 = 15². Ini adalah kelipatan dari tripel 3-4-5."
      },
      {
        q: "Sebuah tangga sepanjang 13 m disandarkan ke tembok. Jika jarak kaki tangga ke tembok 5 m, berapa tinggi tangga menyentuh tembok?",
        options: ["12 m", "8 m", "18 m", "169 m"],
        correct: 0,
        explain: "tinggi = √(13² - 5²) = √(169-25) = √144 = 12 m."
      }
    ];
  }

  return { init };
})();
