// Os vídeos da Operação Mystic Falls, desenhados quadro a quadro num <canvas> de 1280x720.
// scripts/gerar-videos.mjs abre isto num navegador, tira cada quadro e junta tudo em MP4 com o ffmpeg.
// Cada vídeo usa uma ilustração de mystic-imagens.js (desenhada em 640x400) como cenário e põe por cima
// câmera em movimento, neblina em camadas, raios de luz, partículas, granulado de filme e faixas de cinema.

export const W = 1280, H = 720, FPS = 30;
const K = Math.max(W / 640, H / 400); // escala que faz a ilustração cobrir a tela

// ---------- matemática ----------
// número "aleatório" fixo para cada n (os vídeos saem sempre iguais)
const rnd = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = v => { v = lim(v); return v * v * (3 - 2 * v); };
const entre = (t, a, b) => suave((t - a) / (b - a)); // 0 -> 1 entre os tempos a e b
const mix = (a, b, k) => a + (b - a) * k;

// ---------- texturas feitas uma vez (neblina e granulado) ----------
let NEVOA = null, GRAO = [], BUF = null;
function texturas() {
  if (NEVOA) return;
  const N = 256, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d'), im = g.createImageData(N, N);
  const oitavas = [[4, .5], [8, .27], [16, .15], [32, .08]].map(([f, w], o) => ({ f, w, v: Array.from({ length: f * f }, (_, i) => rnd(i * 3.17 + o * 101)) }));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    for (const { f, w, v: a } of oitavas) {
      const fx = x / N * f, fy = y / N * f, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = suave(fx - ix), ty = suave(fy - iy);
      const p = (i, j) => a[((j % f) * f) + (i % f)];
      v += w * mix(mix(p(ix, iy), p(ix + 1, iy), tx), mix(p(ix, iy + 1), p(ix + 1, iy + 1), tx), ty);
    }
    const k = (y * N + x) * 4, al = lim((v - .38) * 2.6);
    im.data[k] = 205; im.data[k + 1] = 218; im.data[k + 2] = 228; im.data[k + 3] = al * 255;
  }
  g.putImageData(im, 0, 0);
  NEVOA = c;
  for (let q = 0; q < 6; q++) {
    const gc = document.createElement('canvas'); gc.width = gc.height = 256;
    const gg = gc.getContext('2d'), gi = gg.createImageData(256, 256);
    for (let i = 0; i < gi.data.length; i += 4) { const v = rnd(i * .37 + q * 999) * 255; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = 255; }
    gg.putImageData(gi, 0, 0); GRAO.push(gc);
  }
  BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H;
}

// ---------- câmera sobre a ilustração ----------
// cam = { x, y, s }: ponto da ilustração (640x400) no centro da tela e o zoom
function cena(ctx, img, cam, filtro) {
  const k = K * cam.s;
  if (filtro) ctx.filter = filtro;
  ctx.drawImage(img, W / 2 - cam.x * k, H / 2 - cam.y * k, 640 * k, 400 * k);
  ctx.filter = 'none';
}
const pt = (cam, x, y) => [W / 2 + (x - cam.x) * K * cam.s, H / 2 + (y - cam.y) * K * cam.s];
const camEntre = (t, a, b, de, ate) => { const k = entre(t, a, b); return { x: mix(de.x, ate.x, k), y: mix(de.y, ate.y, k), s: mix(de.s, ate.s, k) }; };

// ---------- efeitos ----------
// faixa de neblina que desliza (y0..y1 na tela)
function nevoa(ctx, t, y0, y1, alfa, vel, esc = 3, cor) {
  const b = BUF.getContext('2d'), h = y1 - y0, tam = 256 * esc;
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, h + 2);
  const off = ((t * vel) % tam + tam) % tam;
  for (let x = -off - tam; x < W + tam; x += tam) for (let y = 0; y < h; y += tam) b.drawImage(NEVOA, x, y + Math.sin(t * .2) * 6, tam, tam);
  if (cor) { b.globalCompositeOperation = 'source-atop'; b.fillStyle = cor; b.fillRect(0, 0, W, h); }
  b.globalCompositeOperation = 'destination-in';
  const gr = b.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.45, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = gr; b.fillRect(0, 0, W, h);
  b.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = alfa; ctx.drawImage(BUF, 0, 0, W, h, 0, y0, W, h); ctx.restore();
}

// raios de luz saindo de (x,y) entre os ângulos a0 e a1 (radianos)
function raios(ctx, t, x, y, a0, a1, n, comp, cor, alfa, r0 = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = mix(a0, a1, (i + .5) / n) + Math.sin(t * .4 + i * 1.7) * .02, l = .018 + rnd(i * 5.3) * .035;
    const al = alfa * (.45 + .55 * (.5 + .5 * Math.sin(t * .7 + i * 2.1)));
    const gr = ctx.createLinearGradient(x, y, x + Math.cos(a) * comp, y + Math.sin(a) * comp);
    gr.addColorStop(0, cor.replace('A', al)); gr.addColorStop(1, cor.replace('A', 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a - l) * comp, y + Math.sin(a - l) * comp);
    ctx.lineTo(x + Math.cos(a + l) * comp, y + Math.sin(a + l) * comp);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// partículas: poeira, vaga-lumes, brasas...
function particulas(ctx, t, n, sem, area, vel, tam, cor, pisca = 0) {
  const [x0, y0, x1, y1] = area, w = x1 - x0, h = y1 - y0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const r0 = rnd(i + sem), r1 = rnd(i * 2.3 + sem), r2 = rnd(i * 4.1 + sem);
    const x = x0 + (((r0 * w + vel[0] * t * (.5 + r2) + Math.sin(t * .9 + i) * 14) % w) + w) % w;
    const y = y0 + (((r1 * h + vel[1] * t * (.5 + r2) + Math.cos(t * .7 + i * 1.3) * 10) % h) + h) % h;
    const a = pisca ? lim(.5 + .5 * Math.sin(t * (1.5 + r2 * 2) + i * 3) * 1.4) : .35 + .65 * r2;
    const r = tam * (.5 + r2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, cor.replace('A', a)); g.addColorStop(.25, cor.replace('A', a * .35)); g.addColorStop(1, cor.replace('A', 0));
    ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  }
  ctx.restore();
}

function brilho(ctx, x, y, r, cor, alfa) {
  if (alfa <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, cor.replace('A', alfa)); g.addColorStop(.3, cor.replace('A', alfa * .35)); g.addColorStop(1, cor.replace('A', 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  // reflexo de lente (estrela de 4 pontas), só nos clarões fortes
  if (alfa < .6) { ctx.restore(); return; }
  ctx.globalAlpha = alfa * .6; ctx.fillStyle = cor.replace('A', 1);
  const l = Math.min(r, 140);
  ctx.fillRect(x - l * 1.3, y - 1, l * 2.6, 2); ctx.fillRect(x - 1, y - l * .6, 2, l * 1.2);
  ctx.restore();
}

// cor de cinema: azul nas sombras, quente nas luzes
function cor(ctx, sombra, luz, forca = .35) {
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = forca;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sombra); g.addColorStop(1, luz);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

function vinheta(ctx, forca = .75) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function grao(ctx, q, forca = .07) {
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = forca;
  const p = ctx.createPattern(GRAO[q % GRAO.length], 'repeat');
  ctx.fillStyle = p; ctx.translate(rnd(q) * 256, rnd(q + 1) * 256); ctx.fillRect(-256, -256, W + 512, H + 512);
  ctx.restore();
  // risquinhos de filme velho
  if (rnd(q * 7.7) > .9) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(rnd(q) * W, 0, 1.5, H); }
}

function faixas(ctx, k) { // faixas pretas de cinema
  const h = H * .1 * k;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
}

function escuro(ctx, a) { if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${lim(a)})`; ctx.fillRect(0, 0, W, H); } }

// letreiro de legenda (dentro da faixa de baixo)
function legenda(ctx, texto, alfa, corTexto = '#f4ecd2') {
  if (alfa <= 0) return;
  ctx.save(); ctx.globalAlpha = alfa;
  ctx.font = 'italic 34px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12;
  ctx.fillStyle = corTexto; ctx.fillText(texto, W / 2, H - H * .05);
  ctx.restore();
}

// cartela de título com letras aparecendo uma a uma
function cartela(ctx, t, a, b, linha1, linha2, corDestaque = '#e7c36a') {
  const al = entre(t, a, a + .4) * (1 - entre(t, b - .5, b));
  if (al <= 0) return;
  ctx.save(); ctx.globalAlpha = al; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const n = Math.floor(linha1.length * lim((t - a) / 1.2));
  ctx.font = '600 22px "Courier New", monospace'; ctx.fillStyle = corDestaque;
  ctx.shadowColor = corDestaque; ctx.shadowBlur = 14;
  ctx.fillText(linha1.slice(0, n) + (n < linha1.length && Math.floor(t * 4) % 2 ? '▌' : ''), W / 2, H / 2 - 26);
  if (linha2) {
    ctx.shadowBlur = 24; ctx.font = '400 64px Georgia, "Times New Roman", serif'; ctx.fillStyle = '#f4ecd2';
    ctx.globalAlpha = al * entre(t, a + .8, a + 1.6);
    ctx.fillText(linha2, W / 2, H / 2 + 34);
  }
  ctx.restore();
}

function olhos(ctx, x, y, esc, abertura, forca) {
  if (abertura <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const dx of [-11, 11]) {
    const cx = x + dx * esc;
    const g = ctx.createRadialGradient(cx, y, 0, cx, y, 34 * esc);
    g.addColorStop(0, `rgba(255,40,30,${.7 * forca})`); g.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 34 * esc, y - 34 * esc, 68 * esc, 68 * esc);
    ctx.fillStyle = `rgba(255,${120 + 100 * forca},${90 + 60 * forca},1)`;
    ctx.beginPath(); ctx.ellipse(cx, y, 6.5 * esc, 3.4 * esc * abertura, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function tremer(ctx, q, forca) { if (forca > 0) ctx.translate((rnd(q * 1.3) - .5) * forca, (rnd(q * 2.9) - .5) * forca); }


// ---------- paisagem desenhada direto no vídeo (floresta, lua, rio, ponte) ----------
function ceuNoite(ctx, oy = 0) {
  const g = ctx.createLinearGradient(0, oy - H * .3, 0, oy + H);
  g.addColorStop(0, '#02030a'); g.addColorStop(.55, '#0b1626'); g.addColorStop(1, '#1d3346');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function estrelasCeu(ctx, t, n, sem, oy = 0, yMax = H * .7) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i + sem) * W, y = rnd(i * 1.9 + sem) * (yMax + 400) - 400 + oy, r = .6 + rnd(i * 3.3) * 1.4;
    if (y < -5 || y > H) continue;
    const a = .35 + .65 * lim(.5 + .5 * Math.sin(t * (1 + rnd(i) * 2) + i));
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, r, r);
  }
}
function lua(ctx, t, x, y, r) {
  brilho(ctx, x, y, r * 6, 'rgba(244,236,210,A)', .22);
  ctx.save();
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
  g.addColorStop(0, '#fffbea'); g.addColorStop(.7, '#e8dfc2'); g.addColorStop(1, '#bfb48f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .45;
  ctx.drawImage(NEVOA, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
  ctx.restore();
}
// pinheiro com galhos recortados
function pinheiro(ctx, x, base, h, cor, sem) {
  ctx.fillStyle = cor;
  ctx.fillRect(x - h * .018, base - h * .12, h * .036, h * .12);
  const n = 9;
  ctx.beginPath();
  ctx.moveTo(x, base - h);
  for (let i = 1; i <= n; i++) { // lado direito descendo em degraus
    const k = i / n, y = base - h + k * h * .92, w = h * .34 * k * (.85 + rnd(sem + i) * .3);
    ctx.lineTo(x + w, y); ctx.lineTo(x + w * .45, y - h * .015);
  }
  for (let i = n; i >= 1; i--) {
    const k = i / n, y = base - h + k * h * .92, w = h * .34 * k * (.85 + rnd(sem + i * 7) * .3);
    ctx.lineTo(x - w * .45, y - h * .015); ctx.lineTo(x - w, y);
  }
  ctx.closePath(); ctx.fill();
}
function fileira(ctx, n, sem, y, hMin, hMax, cor, dx = 0, xMin = -80, xMax = W + 80) {
  for (let i = 0; i < n; i++) {
    const x = mix(xMin, xMax, (i + rnd(i + sem) * .8) / n) + dx;
    pinheiro(ctx, x, y + rnd(i * 2 + sem) * 20, mix(hMin, hMax, rnd(i * 5 + sem)), cor, sem + i * 13);
  }
}


// ---------- fotos (cenas realistas geradas no Canva, em fotos/) ----------
// cam = { x, y, s }: ponto da foto (0 a 1) no centro da tela e o zoom. Devolve uma função que
// converte um ponto da foto (u, v de 0 a 1) para a tela, para pôr luzes e efeitos no lugar certo.
function foto(ctx, img, cam, filtro) {
  const k = Math.max(W / img.width, H / img.height) * cam.s, w = img.width * k, h = img.height * k;
  const dx = lim(W / 2 - cam.x * w, W - w, 0), dy = lim(H / 2 - cam.y * h, H - h, 0);
  if (filtro) ctx.filter = filtro;
  ctx.drawImage(img, dx, dy, w, h);
  ctx.filter = 'none';
  return (u, v) => [dx + u * w, dy + v * h];
}
const fotoCam = (t, a, b, de, ate) => camEntre(t, a, b, de, ate);

// ---------- os vídeos ----------
export const VIDEOS = {
  // Abertura: a câmera desce da lua cheia até o celular aceso no chão da floresta (foto)
  abertura: {
    dur: 11, fundo: 'floresta', poster: 'floresta',
    som: { drone: .9, vento: .3, sustos: [3.4], sussurro: [7], toque: [5.2, 5.9, 7.6, 8.3] },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = fotoCam(t, .3, 7, { x: .58, y: .14, s: 1.7 }, { x: .5, y: .72, s: 1.2 });
      const z = { ...cam, s: cam.s + entre(t, 7, 11) * .25 };
      const P = foto(ctx, img.f_floresta, z, 'contrast(1.08) saturate(1.05)');
      const [lx, ly] = P(.587, .075);
      brilho(ctx, lx, ly, 300, 'rgba(210,230,255,A)', .18 + .04 * Math.sin(t * 1.3));
      raios(ctx, t, lx, ly, Math.PI * .35, Math.PI * .7, 7, 1000, 'rgba(190,215,255,A)', .05, 40);
      nevoa(ctx, t, H * .35, H * .85, .32, 18, 3.4, 'rgba(150,180,210,1)');
      nevoa(ctx, t + 9, H * .6, H, .28, -11, 2.6, 'rgba(120,150,180,1)');
      // a tela do celular pulsando e vibrando quando chega a mensagem
      const toque = [5.2, 5.9, 7.6, 8.3].some(a => t > a && t < a + .35);
      const [cx, cy] = P(.5, .75);
      brilho(ctx, cx + (toque ? (rnd(q) - .5) * 8 : 0), cy, 330, 'rgba(90,190,255,A)', .22 + .14 * Math.sin(t * 4) + (toque ? .2 : 0));
      particulas(ctx, t, 40, 3, [0, 0, W, H], [5, 7], 1.4, 'rgba(210,225,255,A)');
      cor(ctx, '#0b2b4a', '#3a2410', .3);
      vinheta(ctx, .8);
      escuro(ctx, 1 - entre(t, 0, 1.8));
      escuro(ctx, entre(t, 3.3, 3.45) * (1 - entre(t, 3.45, 3.9)) * .6);
      cartela(ctx, t, 1.2, 4.6, '23:47 · MYSTIC FALLS, VIRGÍNIA', 'Operação Mystic Falls');
      faixas(ctx, 1);
      legenda(ctx, 'Uma mensagem de um número desconhecido...', entre(t, 8.6, 9) * (1 - entre(t, 10.6, 11)));
      grao(ctx, q, .07);
    },
  },

  // Fase 4: a Ponte Wickery de noite (foto), a neblina no rio e a caixa de ferro brilhando nas pedras
  ponte: {
    dur: 11, fundo: 'ponte', poster: 'ponte',
    som: { drone: .7, vento: .25, agua: true, sustos: [6.6], brilho: [6.5] },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = fotoCam(t, 0, 10.5, { x: .45, y: .45, s: 1.05 }, { x: .76, y: .86, s: 2.1 });
      ctx.save();
      tremer(ctx, q, 8 * entre(t, 6.5, 6.6) * (1 - entre(t, 6.6, 7.3)));
      const P = foto(ctx, img.f_ponte, cam, 'contrast(1.06)');
      const [lx, ly] = P(.338, .142);
      brilho(ctx, lx, ly, 260 * cam.s, 'rgba(200,235,240,A)', .16 + .05 * Math.sin(t));
      // as lanternas dentro da ponte tremendo
      for (const [u, v, i] of [[.505, .42, 0], [.8, .32, 1], [.68, .4, 2]]) {
        const [x, y] = P(u, v);
        brilho(ctx, x, y, 90 * cam.s, 'rgba(255,170,80,A)', .25 + .12 * Math.sin(t * 9 + i * 3) + .06 * rnd(Math.floor(t * 12) + i));
      }
      // brilho da lua mexendo na água
      for (let i = 0; i < 60; i++) {
        const [x, y] = P(.22 + rnd(i) * .38, .7 + rnd(i * 3) * .28);
        const a = lim(Math.sin(t * 2.6 + i * 2.3) * 1.6 - .5) * .35;
        if (a > 0) { ctx.fillStyle = `rgba(210,235,240,${a})`; ctx.fillRect(x, y, (8 + rnd(i) * 24) * cam.s, 1.5 * cam.s); }
      }
      const [ny] = [P(0, .68)[1]];
      nevoa(ctx, t, ny - H * .25, ny + H * .2, .45, 24, 3.4, 'rgba(150,200,210,1)');
      nevoa(ctx, t + 6, ny - H * .05, H, .3, -14, 2.4, 'rgba(120,170,185,1)');
      const [bx, by] = P(.765, .9);
      const flash = entre(t, 6.3, 6.6) * (1 - entre(t, 7, 9.5));
      brilho(ctx, bx, by - 20, 420 * flash + 20, 'rgba(255,205,120,A)', .85 * flash);
      particulas(ctx, t, 26, 9, [0, 0, W, H], [6, -4], 1.6, 'rgba(255,240,210,A)', 1);
      ctx.restore();
      cor(ctx, '#0a3040', '#4a2a10', .3);
      vinheta(ctx, .75);
      escuro(ctx, 1 - entre(t, 0, 1.2));
      cartela(ctx, t, .6, 3.8, 'PONTE WICKERY · 23:58', '');
      faixas(ctx, 1);
      legenda(ctx, 'Tem alguma coisa presa nas pedras...', entre(t, 7.6, 8) * (1 - entre(t, 10.5, 11)));
      grao(ctx, q, .07);
    },
  },

  // Fase 5: as gravações das três câmeras do Baile dos Fundadores, com o "ampliar" no anel
  cameras: {
    dur: 12, fundo: 'suspeitos', poster: 'suspeitos',
    som: { drone: .4, vento: 0, estatica: [0, 3.4, 6.8, 8.6, 9.2, 9.8], zumbido: true, bipes: [8.6, 9.2, 9.8], sustos: [10.4] },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = t < 3.4 ? 0 : t < 6.8 ? 1 : 2, t0 = [0, 3.4, 6.8][cam], k = t - t0;
      const sx = 16 + cam * 208;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      // recorte da câmera (sem os letreiros do desenho) e o ponto de foco
      const foco = cam === 2 ? { x: mix(96, 148, entre(k, 1.6, 3.2)), y: mix(125, 200, entre(k, 1.6, 3.2)) } : { x: 96 + Math.sin(k) * 4, y: 125 };
      const z = cam === 2 ? 1 + entre(k, 1.6, 3.2) * 2.4 : 1.05 + k * .03;
      const esc = (H / 250) * z;
      // "ampliar": imagem pixelada que vai ficando nítida em degraus
      const px = cam === 2 && k > 1.6 && k < 3.8 ? [1, 18, 10, 5, 2][Math.min(4, Math.floor((k - 1.6) / .45))] : 1;
      const b = BUF.getContext('2d');
      b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
      b.filter = 'grayscale(.8) contrast(1.35) brightness(.95)';
      b.imageSmoothingEnabled = true;
      b.drawImage(img.suspeitos, sx, 48, 192, 250, (W / 2 - foco.x * esc) / px, (H / 2 - foco.y * esc) / px, 192 * esc / px, 250 * esc / px);
      b.filter = 'none';
      ctx.save();
      ctx.imageSmoothingEnabled = px === 1;
      // leve separação de cores de câmera velha
      ctx.globalAlpha = 1; ctx.drawImage(BUF, 0, 0, W / px, H / px, 0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .12;
      ctx.drawImage(BUF, 0, 0, W / px, H / px, 3, 0, W, H);
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
      if (cam === 2 && k > 3.8) { // o lápis-lazúli brilhando
        const [ax, ay] = [W / 2 + (148 - foco.x) * esc, H / 2 + (200 - foco.y) * esc];
        brilho(ctx, ax, ay - 10, 260, 'rgba(70,120,255,A)', (.45 + .3 * Math.sin((k - 3.8) * 8)));
      }
      ctx.fillStyle = 'rgba(40,255,140,.05)'; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 3) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, y, W, 1); }
      // faixa de interferência rolando
      const fy = ((t * 140) % (H + 200)) - 100;
      ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(0, fy, W, 60);
      grao(ctx, q, .22);
      if (k < .35 || (cam === 2 && [1.6, 2.05, 2.5, 2.95].some(x => k > x && k < x + .08))) {
        for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${rnd(q * 31 + i) * .5})`; ctx.fillRect(0, rnd(q + i) * H, W, 2 + rnd(i + q) * 10); }
      }
      vinheta(ctx, .9);
      // textos da câmera
      ctx.font = 'bold 26px "Courier New", monospace'; ctx.textBaseline = 'top';
      if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(52, 50, 10, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#e8e8e8'; ctx.textAlign = 'left'; ctx.fillText('REC   CAM ' + (cam + 1), 72, 38);
      const s = 12 + Math.floor(t), fr = String(Math.floor((t % 1) * 30)).padStart(2, '0');
      ctx.textAlign = 'right'; ctx.fillText(`21:47:${String(s).padStart(2, '0')}:${fr}`, W - 40, 38);
      ctx.textAlign = 'left'; ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText(['JARDIM · MANSÃO LOCKWOOD', 'BAR · MANSÃO LOCKWOOD', 'SALÃO · MANSÃO LOCKWOOD'][cam], 40, H - 64);
      ctx.textAlign = 'right'; ctx.fillText(['SUSPEITO: LIAM', 'SUSPEITO: TRISTAN', 'SUSPEITO: LUCIEN'][cam], W - 40, H - 64);
      if (cam === 2 && k > 1.6 && k < 3.8) {
        ctx.textAlign = 'center'; ctx.font = 'bold 30px "Courier New", monospace'; ctx.fillStyle = '#7dffb0';
        ctx.fillText(`AMPLIANDO ${Math.min(400, Math.round(100 + (k - 1.6) * 140))}%`, W / 2, 96);
      }
      if (cam === 2 && k > 4) legenda(ctx, 'Anel de prata... pedra de lápis-lazúli.', entre(k, 4, 4.4), '#a8c4ff');
    },
  },

  // Fase 6: o porão (foto), a luz da janelinha falhando e os olhos vermelhos que se abrem no escuro
  porao: {
    dur: 11, fundo: 'porao', poster: 'porao',
    som: { drone: 1, vento: .06, coracao: [3, 11], correntes: [1.4, 2.4, 3.1], sustos: [6.2], sussurro: [8.2] },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = fotoCam(t, 0, 10.5, { x: .5, y: .45, s: 1.05 }, { x: .72, y: .55, s: 2.4 });
      ctx.save();
      tremer(ctx, q, (t > 1.3 && t < 3.3 ? 4 : 0) + 10 * entre(t, 6.1, 6.2) * (1 - entre(t, 6.2, 6.9)));
      const P = foto(ctx, img.f_porao, cam, 'contrast(1.1)');
      const [jx, jy] = P(.56, .2);
      const falha = (rnd(Math.floor(t * 10)) > .8 && t < 5.6) || (t > 5.9 && t < 6.2);
      brilho(ctx, jx, jy, 200 * cam.s, 'rgba(170,215,255,A)', falha ? .02 : .2);
      // poeira dentro do feixe de luz
      const [bx0, by0] = P(.53, .25), [bx1, by1] = P(.68, .78);
      particulas(ctx, t, 60, 21, [Math.min(bx0, bx1) - 40, by0, Math.max(bx0, bx1) + 40, by1], [3, 7], 1.3, 'rgba(210,230,255,A)');
      escuro(ctx, falha ? .8 : .1 + .06 * Math.sin(t * 3));
      const [ox, oy] = P(.715, .515);
      olhos(ctx, ox, oy, .9 * cam.s, entre(t, 6.15, 6.7), .65 + .35 * Math.sin(t * 5));
      ctx.restore();
      cor(ctx, '#082a30', '#3a0808', .35);
      vinheta(ctx, .9);
      escuro(ctx, 1 - entre(t, 0, 1));
      escuro(ctx, entre(t, 10.2, 10.6));
      faixas(ctx, 1);
      legenda(ctx, '"Eu sei que você está aí, caçadora."', entre(t, 8, 8.4) * (1 - entre(t, 10, 10.3)), '#ff9a9a');
      grao(ctx, q, .08);
    },
  },

  // Fase 7: o túmulo embaixo da igreja (foto), as velas acendendo e a estaca brilhando
  cripta: {
    dur: 10, fundo: 'cripta', poster: 'cripta',
    som: { drone: .9, vento: .1, velas: [1.2, 1.9, 2.6, 3.3], brilho: [5.5], sino: [8] },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = fotoCam(t, 0, 10, { x: .5, y: .38, s: 1.12 }, { x: .53, y: .62, s: 1.85 });
      const P = foto(ctx, img.f_cripta, cam, `brightness(${mix(.35, 1, entre(t, 1, 3.6))}) contrast(1.08)`);
      // as velas acendem em grupos e ficam tremendo
      const velas = [[.03, .26, 1.2], [.055, .29, 1.2], [.085, .28, 1.2], [.115, .3, 1.2], [.42, .25, 1.9], [.445, .24, 1.9], [.465, .26, 1.9],
        [.6, .38, 2.6], [.66, .35, 2.6], [.69, .4, 2.6], [.91, .3, 3.3], [.955, .27, 3.3], [.985, .3, 3.3]];
      velas.forEach(([u, v, a], i) => {
        const [x, y] = P(u, v);
        const f = entre(t, a, a + .2) * (.75 + .25 * Math.sin(t * 13 + i * 4) + .1 * rnd(Math.floor(t * 15) + i));
        brilho(ctx, x, y, 110 * cam.s, 'rgba(255,175,90,A)', .32 * f);
      });
      const [ex, ey] = P(.53, .63);
      brilho(ctx, ex, ey, 520 * entre(t, 5.3, 6) + 10, 'rgba(255,235,190,A)', .5 * entre(t, 5.3, 6) * (.85 + .15 * Math.sin(t * 4)));
      particulas(ctx, t, 50, 41, [W * .25, H * .2, W * .8, H * .8], [0, -12], 1.4, 'rgba(255,215,150,A)', 1);
      cor(ctx, '#1a1030', '#5a3010', .3);
      vinheta(ctx, .8);
      escuro(ctx, 1 - entre(t, 0, .8));
      faixas(ctx, 1);
      legenda(ctx, 'A estaca de carvalho branco.', entre(t, 6.8, 7.2) * (1 - entre(t, 9.5, 10)));
      grao(ctx, q, .07);
    },
  },

  // Final 1: a praça da cidade sob a lua cheia (foto), os lampiões e a neblina
  final_aliado: {
    dur: 10, fundo: 'final_aliado', poster: 'final_aliado',
    som: { drone: .6, vento: .15, sino: [1.5, 3.7, 5.9], acorde: 6.5 },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = fotoCam(t, 0, 10, { x: .5, y: .78, s: 1.6 }, { x: .5, y: .45, s: 1.04 });
      const P = foto(ctx, img.f_praca, cam, 'contrast(1.05) saturate(1.05)');
      const [lx, ly] = P(.49, .12);
      brilho(ctx, lx, ly, 380 * cam.s, 'rgba(255,250,235,A)', .2 + .05 * Math.sin(t * 1.5));
      raios(ctx, t, lx, ly, 0, Math.PI * 2, 18, 900, 'rgba(255,248,225,A)', .03, 70 * cam.s);
      [[.27, .6], [.415, .69], [.59, .69], [.71, .68], [.825, .66], [.94, .63], [.035, .3], [.34, .26]].forEach(([u, v], i) => {
        const [x, y] = P(u, v);
        brilho(ctx, x, y, 80 * cam.s, 'rgba(255,190,100,A)', .2 + .07 * Math.sin(t * 6 + i * 2));
      });
      nevoa(ctx, t, P(0, .7)[1] - H * .15, H, .35, 12, 3.2, 'rgba(170,180,210,1)');
      particulas(ctx, t, 30, 77, [0, 0, W, H], [4, -10], 1.4, 'rgba(255,235,190,A)', 1);
      cor(ctx, '#0a2040', '#4a3010', .25);
      vinheta(ctx, .6);
      escuro(ctx, 1 - entre(t, 0, 1.2));
      cartela(ctx, t, 6, 10.2, 'FINAL 1 · O ALIADO DA NEBLINA', 'Mystic Falls está a salvo.');
      faixas(ctx, 1);
      grao(ctx, q, .06);
    },
  },

  // Final 2: o recado escrito com sangue aparecendo letra por letra
  final_sombra: {
    dur: 11, fundo: 'parede', poster: 'parede',
    som: { drone: 1, vento: .1, coracao: [0, 11], arranhar: [1, 3.7], sustos: [7.4] },
    desenhar(ctx, t, img, q) {
      texturas();
      const cam = camEntre(t, 0, 11, { x: 320, y: 230, s: 1.2 }, { x: 320, y: 172, s: 1.55 });
      ctx.save(); tremer(ctx, q, 10 * entre(t, 7.4, 7.5) * (1 - entre(t, 7.5, 8.2)));
      cena(ctx, img.parede, cam, 'brightness(.8) contrast(1.2)');
      const esc = K * cam.s;
      ctx.font = `italic ${34 * esc}px Georgia, "Times New Roman", serif`; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#7a0a14'; ctx.shadowColor = 'rgba(160,0,20,.6)'; ctx.shadowBlur = 8;
      for (const [txt, y, a, b] of [['Você devia ter', 150, 1, 3.6], ['confiado em mim.', 195, 3.8, 6.8]]) {
        const w = ctx.measureText(txt).width, [x0, yy] = pt(cam, 320, y);
        const k = lim((t - a) / (b - a));
        if (k <= 0) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - w / 2, yy - 50 * esc, w * k, 70 * esc); ctx.clip();
        ctx.textAlign = 'center'; ctx.fillText(txt, x0, yy);
        ctx.restore();
      }
      ctx.shadowBlur = 0;
      for (const [x, h, a] of [[200, 34, 6.9], [262, 20, 7.2], [345, 46, 7.0], [430, 26, 7.6]]) {
        const k = entre(t, a, a + 2.2); if (k <= 0) continue;
        const [dx, dy] = pt(cam, x, 206);
        ctx.fillStyle = '#7a0a14'; ctx.fillRect(dx - 2.5, dy, 5, h * esc * k);
        ctx.beginPath(); ctx.arc(dx, dy + h * esc * k, 4.5, 0, 7); ctx.fill();
      }
      ctx.restore();
      const pulso = entre(t, 7.4, 7.5) * (1 - entre(t, 7.5, 8.4));
      ctx.fillStyle = `rgba(150,0,15,${.15 + .45 * pulso})`; ctx.fillRect(0, 0, W, H);
      cor(ctx, '#1a0a10', '#3a0808', .5);
      vinheta(ctx, .95);
      escuro(ctx, 1 - entre(t, 0, .8));
      legenda(ctx, 'FINAL 2 · A SOMBRA NO PORÃO', entre(t, 8.8, 9.3), '#ff8a8a');
      faixas(ctx, 1);
      grao(ctx, q, .1);
    },
  },
};
