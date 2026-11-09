/* ============================================================
   quiz.js
   Komponen evaluasi/kuis pilihan ganda yang bisa dipakai ulang
   di Modul 1, 2, dan 3.
   questions = [{ q:"...", options:["...","..."], correct:0, explain:"..." }]

   Pembaruan:
   - Mencatat skor akhir ke Store (localStorage) untuk pengguna
     yang sedang login.
   - Menampilkan modal greeting konfeti setelah seluruh soal
     terjawab, dengan pesan personal sesuai capaian.
   ============================================================ */

window.renderQuiz = function renderQuiz(container, questions, quizMeta) {
  container.innerHTML = '';
  const state = questions.map(() => ({ answered: false, correct: null }));

  // quizMeta = { module:"Modul 1", moduleName:"Transformasi Geometri" }
  quizMeta = quizMeta || {};

  const wrap = document.createElement('div');

  questions.forEach((item, qi) => {
    const qBox = document.createElement('div');
    qBox.className = 'quiz-q';

    const qText = document.createElement('p');
    qText.className = 'qtext';
    qText.textContent = `${qi + 1}. ${item.q}`;
    qBox.appendChild(qText);

    const feedback = document.createElement('div');
    feedback.className = 'quiz-feedback';

    item.options.forEach((optText, oi) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'quiz-opt';
      optBtn.textContent = optText;
      optBtn.addEventListener('click', () => {
        if (state[qi].answered) return;
        state[qi].answered = true;
        const isCorrect = oi === item.correct;
        state[qi].correct = isCorrect;
        optBtn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          const correctBtn = qBox.querySelectorAll('.quiz-opt')[item.correct];
          correctBtn.classList.add('correct');
        }
        feedback.style.display = 'block';
        feedback.innerHTML = (isCorrect ? '✅ <b>Benar!</b> ' : '❌ <b>Belum tepat.</b> ') + item.explain;
        updateScore();
      });
      qBox.appendChild(optBtn);
    });

    qBox.appendChild(feedback);
    wrap.appendChild(qBox);
  });

  const scoreBox = document.createElement('div');
  scoreBox.className = 'quiz-score';
  wrap.appendChild(scoreBox);

  // melacak apakah hasil sudah pernah disimpan (hindari duplikat -- simpan sekali di akhir)
  let saved = false;

  function updateScore() {
    const answered = state.filter(s => s.answered).length;
    const correct = state.filter(s => s.correct).length;
    if (answered === questions.length) {
      scoreBox.textContent = `Skor kamu: ${correct} / ${questions.length} benar 🎉`;
      scoreBox.classList.add('done');
      if (!saved) {
        saved = true;
        finalizeAndGreet(correct, questions.length);
      }
    } else {
      scoreBox.textContent = `Terjawab: ${answered} / ${questions.length}`;
    }
  }

  /* ---------- simpan hasil + tampilkan greeting ---------- */
  function finalizeAndGreet(correct, total) {
    const user = Store.getSessionUser();

    // simpan ke storage kalau ada user login & bukan admin
    if (user && user.role !== 'admin') {
      Store.addResult({
        userId: user.id,
        userName: user.name,
        nisn: user.nisn,
        kelas: user.kelas,
        module: quizMeta.module || 'Modul',
        moduleName: quizMeta.moduleName || '',
        score: correct,
        total: total
      });
    }

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    let title, message, emoji;
    const name = user ? user.name : 'Sobat';
    if (pct === 100) {
      title = 'Sempurna! 🏆';
      emoji = '🌟';
      message = `Hebat sekali ${name}! Kamu menjawab semua soal dengan benar. Pemahamanmu tentang ${quizMeta.moduleName || 'materi ini'} benar-benar mantap!`;
    } else if (pct >= 80) {
      title = 'Kerja Bagus! 🎉';
      emoji = '👏';
      message = `Selamat ${name}! Skor ${correct}/${total} (${pct}%) menunjukkan kamu sudah memahami ${quizMeta.moduleName || 'materi ini'} dengan baik. Sedikit lagi menuju sempurna!`;
    } else if (pct >= 60) {
      title = 'Lumayan! Semangat Ya 💪';
      emoji = '📚';
      message = `${name}, kamu mendapat ${correct}/${total} (${pct}%). Coba pelajari kembali ${quizMeta.moduleName || 'materi ini'} dan ulangi evaluasi. Kamu pasti bisa lebih baik!`;
    } else {
      title = 'Terus Berlatih Ya 🌱';
      emoji = '✏️';
      message = `Jangan menyerah ${name}! Skor ${correct}/${total} (${pct}%) berarti ada yang masih perlu dipelajari ulang dari ${quizMeta.moduleName || 'materi ini'}. Buka kembali panduan dan simulasi, lalu coba sekali lagi.`;
    }

    showGreetingModal({ title, message, emoji, correct, total, pct, moduleName: quizMeta.moduleName || '' });
  }

  function showGreetingModal(info) {
    const modal = document.getElementById('greeting-modal');
    if (!modal) return; // modal harus ada di index.html

    modal.querySelector('#greet-emoji').textContent = info.emoji;
    modal.querySelector('#greet-title').textContent = info.title;
    modal.querySelector('#greet-body').innerHTML = info.message;
    modal.querySelector('#greet-score').innerHTML =
      `Skor: <b>${info.correct} / ${info.total}</b> &nbsp;·&nbsp; <b>${info.pct}%</b>`;
    const modWrap = modal.querySelector('#greet-module-wrap');
    if (info.moduleName && modWrap) {
      modal.querySelector('#greet-module').textContent = info.moduleName;
      modWrap.style.display = 'block';
    } else if (modWrap) {
      modWrap.style.display = 'none';
    }
    modal.classList.add('show');
    launchConfetti();
  }

  function launchConfetti() {
    // efek konfeti sederhana dengan canvas overlay
    const c = document.getElementById('confetti-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    c.style.display = 'block';
    const colors = ['#1F3864', '#B8860B', '#5B8DEF', '#2E7D32', '#B00020', '#FFD54F'];
    const pieces = [];
    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * c.width,
        y: -20 - Math.random() * c.height * 0.4,
        r: 4 + Math.random() * 6,
        c: colors[Math.floor(Math.random() * colors.length)],
        vx: -1 + Math.random() * 2,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4
      });
    }
    let frame = 0;
    const maxFrames = 240;
    function anim() {
      ctx.clearRect(0, 0, c.width, c.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(anim);
      } else {
        ctx.clearRect(0, 0, c.width, c.height);
        c.style.display = 'none';
      }
    }
    anim();
  }

  updateScore();

  container.appendChild(wrap);
}
