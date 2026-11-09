/* ============================================================
   engine3d.js
   Mesin render 3D sederhana buatan sendiri (tanpa library eksternal).
   Melakukan rotasi, proyeksi ortografik, shading datar, dan
   pengurutan wajah (painter's algorithm) untuk menggambar bangun
   ruang di atas <canvas> 2D biasa.
   ============================================================ */

window.Engine3D = (function () {

  function rotatePoint(p, ax, ay) {
    // rotasi terhadap sumbu X lalu sumbu Y (radian)
    let y = p.y * Math.cos(ax) - p.z * Math.sin(ax);
    let z = p.y * Math.sin(ax) + p.z * Math.cos(ax);
    let x = p.x * Math.cos(ay) + z * Math.sin(ay);
    let z2 = -p.x * Math.sin(ay) + z * Math.cos(ay);
    return { x: x, y: y, z: z2 };
  }

  function project(p, cx, cy, scale) {
    return { x: cx + p.x * scale, y: cy - p.y * scale };
  }

  function normalOf(a, b, c) {
    const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
    const n = {
      x: u.y * v.z - u.z * v.y,
      y: u.z * v.x - u.x * v.z,
      z: u.x * v.y - u.y * v.x
    };
    const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1;
    return { x: n.x / len, y: n.y / len, z: n.z / len };
  }

  function shade(baseColor, normal) {
    const light = { x: 0.4, y: 0.6, z: 0.75 };
    const lenL = Math.sqrt(light.x ** 2 + light.y ** 2 + light.z ** 2);
    const l = { x: light.x / lenL, y: light.y / lenL, z: light.z / lenL };
    let dot = normal.x * l.x + normal.y * l.y + normal.z * l.z;
    let factor = 0.45 + 0.55 * Math.max(0, dot); // 0.45 - 1.0
    const rgb = hexToRgb(baseColor);
    const r = Math.min(255, Math.round(rgb.r * factor));
    const g = Math.min(255, Math.round(rgb.g * factor));
    const b = Math.min(255, Math.round(rgb.b * factor));
    return `rgb(${r},${g},${b})`;
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  /**
   * Render sebuah shape (vertices + faces) ke canvas 2D.
   * shape = { vertices:[{x,y,z}...], faces:[{indices:[...], color:"#hex"}...] }
   */
  function render(ctx, shape, angleX, angleY, opts) {
    opts = opts || {};
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const cx = opts.cx !== undefined ? opts.cx : w / 2;
    const cy = opts.cy !== undefined ? opts.cy : h / 2;
    const scale = opts.scale || 60;
    const strokeColor = opts.strokeColor || '#1A1A1A';
    const showLabels = opts.labels || null; // [{point:{x,y,z}, text:"A"}]

    // rotasi semua vertex
    const rotated = shape.vertices.map(p => rotatePoint(p, angleX, angleY));

    // hitung data wajah: normal, kedalaman rata-rata, titik layar
    const faceData = shape.faces.map(face => {
      const pts3d = face.indices.map(i => rotated[i]);
      const normal = normalOf(pts3d[0], pts3d[1], pts3d[2] || pts3d[0]);
      const avgZ = pts3d.reduce((s, p) => s + p.z, 0) / pts3d.length;
      const pts2d = pts3d.map(p => project(p, cx, cy, scale));
      return { pts2d, normal, avgZ, color: face.color || '#5B8DEF' };
    });

    // urutkan dari yang terjauh (z kecil) ke terdekat (z besar) -> painter's algorithm
    faceData.sort((a, b) => a.avgZ - b.avgZ);

    ctx.clearRect(0, 0, w, h);

    faceData.forEach(f => {
      ctx.beginPath();
      f.pts2d.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = shade(f.color, f.normal);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    if (showLabels) {
      ctx.font = '13px Segoe UI, Arial';
      ctx.fillStyle = '#1F3864';
      showLabels.forEach(l => {
        const rp = rotatePoint(l.point, angleX, angleY);
        const sp = project(rp, cx, cy, scale);
        ctx.fillText(l.text, sp.x + 6, sp.y - 6);
      });
    }
  }

  /* ---------------- Generator bentuk (geometry builders) ---------------- */

  function makeBox(p, l, t, colorScheme) {
    colorScheme = colorScheme || '#5B8DEF';
    const hp = p / 2, hl = l / 2, ht = t / 2;
    const v = [
      { x: -hp, y: -ht, z: -hl }, { x: hp, y: -ht, z: -hl },
      { x: hp, y: -ht, z: hl }, { x: -hp, y: -ht, z: hl },
      { x: -hp, y: ht, z: -hl }, { x: hp, y: ht, z: -hl },
      { x: hp, y: ht, z: hl }, { x: -hp, y: ht, z: hl }
    ];
    const faces = [
      { indices: [0, 1, 2, 3], color: colorScheme },
      { indices: [7, 6, 5, 4], color: colorScheme },
      { indices: [4, 5, 1, 0], color: colorScheme },
      { indices: [3, 2, 6, 7], color: colorScheme },
      { indices: [0, 3, 7, 4], color: colorScheme },
      { indices: [1, 5, 6, 2], color: colorScheme }
    ];
    return { vertices: v, faces: faces };
  }

  function makePrismaSegitiga(s, t, color) {
    color = color || '#5B8DEF';
    const ht = t / 2;
    const r = s / Math.sqrt(3);
    const baseXZ = [0, 1, 2].map(k => {
      const ang = -Math.PI / 2 + k * (2 * Math.PI / 3);
      return { x: r * Math.cos(ang), z: r * Math.sin(ang) };
    });
    const v = [];
    baseXZ.forEach(p => v.push({ x: p.x, y: -ht, z: p.z }));
    baseXZ.forEach(p => v.push({ x: p.x, y: ht, z: p.z }));
    const faces = [
      { indices: [0, 1, 2], color: color },
      { indices: [5, 4, 3], color: color },
      { indices: [0, 1, 4, 3], color: color },
      { indices: [1, 2, 5, 4], color: color },
      { indices: [2, 0, 3, 5], color: color }
    ];
    return { vertices: v, faces: faces };
  }

  function makeLimasSegiempat(s, t, color) {
    color = color || '#5B8DEF';
    const hs = s / 2, ht = t / 2;
    const v = [
      { x: -hs, y: -ht, z: -hs }, { x: hs, y: -ht, z: -hs },
      { x: hs, y: -ht, z: hs }, { x: -hs, y: -ht, z: hs },
      { x: 0, y: ht, z: 0 }
    ];
    const faces = [
      { indices: [0, 1, 2, 3], color: color },
      { indices: [0, 1, 4], color: color },
      { indices: [1, 2, 4], color: color },
      { indices: [2, 3, 4], color: color },
      { indices: [3, 0, 4], color: color }
    ];
    return { vertices: v, faces: faces };
  }

  function makeTabung(r, t, color, N) {
    color = color || '#5B8DEF';
    N = N || 24;
    const ht = t / 2;
    const v = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * 2 * Math.PI;
      v.push({ x: r * Math.cos(ang), y: -ht, z: r * Math.sin(ang) });
    }
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * 2 * Math.PI;
      v.push({ x: r * Math.cos(ang), y: ht, z: r * Math.sin(ang) });
    }
    const faces = [];
    faces.push({ indices: Array.from({ length: N }, (_, i) => i), color: color });
    faces.push({ indices: Array.from({ length: N }, (_, i) => 2 * N - 1 - i), color: color });
    for (let i = 0; i < N; i++) {
      const a = i, b = (i + 1) % N, c = N + (i + 1) % N, d = N + i;
      faces.push({ indices: [a, b, c, d], color: color });
    }
    return { vertices: v, faces: faces };
  }

  function makeKerucut(r, t, color, N) {
    color = color || '#5B8DEF';
    N = N || 24;
    const ht = t / 2;
    const v = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * 2 * Math.PI;
      v.push({ x: r * Math.cos(ang), y: -ht, z: r * Math.sin(ang) });
    }
    const apexIndex = N;
    v.push({ x: 0, y: ht, z: 0 });
    const faces = [];
    faces.push({ indices: Array.from({ length: N }, (_, i) => i), color: color });
    for (let i = 0; i < N; i++) {
      const a = i, b = (i + 1) % N;
      faces.push({ indices: [a, b, apexIndex], color: color });
    }
    return { vertices: v, faces: faces };
  }

  function makeBola(r, color, latSeg, lonSeg) {
    color = color || '#5B8DEF';
    latSeg = latSeg || 10;
    lonSeg = lonSeg || 16;
    const v = [];
    for (let i = 0; i <= latSeg; i++) {
      const theta = (i / latSeg) * Math.PI; // 0 (kutub atas) .. PI (kutub bawah)
      for (let j = 0; j < lonSeg; j++) {
        const phi = (j / lonSeg) * 2 * Math.PI;
        v.push({
          x: r * Math.sin(theta) * Math.cos(phi),
          y: r * Math.cos(theta),
          z: r * Math.sin(theta) * Math.sin(phi)
        });
      }
    }
    const faces = [];
    for (let i = 0; i < latSeg; i++) {
      for (let j = 0; j < lonSeg; j++) {
        const j2 = (j + 1) % lonSeg;
        const a = i * lonSeg + j;
        const b = i * lonSeg + j2;
        const c = (i + 1) * lonSeg + j2;
        const d = (i + 1) * lonSeg + j;
        faces.push({ indices: [a, b, c, d], color: color });
      }
    }
    return { vertices: v, faces: faces };
  }

  return {
    rotatePoint, project, render,
    makeBox, makePrismaSegitiga, makeLimasSegiempat,
    makeTabung, makeKerucut, makeBola
  };
})();
