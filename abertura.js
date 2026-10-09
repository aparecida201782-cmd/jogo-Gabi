// Vídeo de abertura da Galáxia da Gabi: a capitã Gabi recebe o José na nave Estrela Rosa
// e, no fim, a Super Madrinha chega voando para a festa com os supergatos Mimi e Branquinho
// (e o Ilo, o cachorro do José, que não se dá muito bem com eles).
// É um "filminho" desenhado no canvas (fica nítido em qualquer tela e não pesa no download).
// Passa sozinho uma vez por visita; o botão "Ver a chegada do José" passa de novo.
(() => {
  const DUR = 44;
  const filme = document.getElementById('filme');
  const cv = document.getElementById('filme-tela');
  const ctx = cv.getContext('2d');
  const legenda = document.getElementById('filme-legenda');
  const barra = document.getElementById('filme-barra');
  const btSom = document.getElementById('filme-som');
  const btPular = document.getElementById('filme-pular');
  const btRever = document.getElementById('rever');

  let W = 0, H = 0, u = 1, VW = 0, VH = 0, estrelas = [];
  let inicio = 0, rodando = false, ultimoT = 0;

  function medir() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    // unidade da cena: a ação cabe em ~700 de largura (celular em pé) e ~720 de altura
    u = Math.min(W / 700, H / 720);
    VW = W / u; VH = H / u;
    estrelas = Array.from({ length: 260 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), c: Math.random() }));
  }

  // ---------- ajudantes ----------
  const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const prog = (t, a, b) => lim((t - a) / (b - a));
  const suave = x => x * x * (3 - 2 * x);
  const mola = x => 1 - Math.pow(1 - x, 3);
  const mix = (a, b, x) => a + (b - a) * x;
  const PELE = '#ffe0cf';

  function elipse(x, y, rx, ry, cor, rot = 0) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
  }
  function brilho(x, y, r, cor) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function coracao(x, y, s, cor) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = cor;
    ctx.beginPath(); ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-14, -4, -8, -16, 0, -8);
    ctx.bezierCurveTo(8, -16, 14, -4, 0, 6);
    ctx.fill(); ctx.restore();
  }
  function estrelinha(x, y, r, cor, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = cor; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); }
    ctx.fill(); ctx.restore();
  }

  // ---------- personagens (mesmas cores dos retratos do jogo da Madrinha) ----------
  // quem: 'gabi' (cabelo comprido escuro, blusa azul), 'jose' (menorzinho, cabelo claro, blusa verde) ou 'ana' (a Madrinha)
  function rosto(x, y, s, quem, o = {}) {
    const cabelo = { gabi: '#6b4428', jose: '#a8784a', ana: '#4a2818' }[quem];
    const longo = quem !== 'jose';
    const blusa = quem === 'gabi' ? '#7cc4ff' : '#3fae5a';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (o.corpo !== false) {
      elipse(0, 58, 34, 26, blusa);
      if (quem === 'gabi') estrelinha(0, 56, 9, '#ffc93c', 0); else { ctx.fillStyle = '#ffc93c'; ctx.font = '900 16px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('J', 0, 63); }
    }
    if (longo) { ctx.fillStyle = cabelo; ctx.beginPath(); ctx.moveTo(-27, -4); ctx.quadraticCurveTo(-32, 44, -16, 46); ctx.lineTo(16, 46); ctx.quadraticCurveTo(32, 44, 27, -4); ctx.fill(); }
    elipse(0, 0, 24, 27, PELE);
    ctx.fillStyle = cabelo; ctx.beginPath();
    ctx.moveTo(-25, 2); ctx.quadraticCurveTo(-25, -32, 0, -32); ctx.quadraticCurveTo(25, -32, 25, 2);
    ctx.quadraticCurveTo(14, -16, 0, -16); ctx.quadraticCurveTo(-14, -16, -25, 2); ctx.fill();
    if (quem === 'jose') { ctx.beginPath(); ctx.moveTo(-6, -31); ctx.quadraticCurveTo(-2, -42, 6, -40); ctx.quadraticCurveTo(0, -36, 2, -30); ctx.fill(); }
    if (quem === 'gabi') { estrelinha(17, -20, 6, '#ff4fa3', .3); }
    // olhos: abertos piscando, ou fechadinhos de alegria
    ctx.fillStyle = '#2a2a3a'; ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    if (o.feliz) {
      for (const ex of [-9, 9]) { ctx.beginPath(); ctx.arc(ex, 4, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    } else {
      const pisca = o.pisca ? .25 : 1;
      for (const ex of [-9, 9]) { elipse(ex + (o.olhar || 0), 3, 3.2, 3.6 * pisca, '#2a2a3a'); elipse(ex + 1 + (o.olhar || 0), 1.6, 1, 1 * pisca, '#fff'); }
    }
    elipse(-15, 11, 4.5, 3, 'rgba(255,140,140,.55)'); elipse(15, 11, 4.5, 3, 'rgba(255,140,140,.55)');
    ctx.beginPath();
    if (o.boca === 'o') { elipse(0, 15, 4, 5, '#b3405a'); }
    else { ctx.arc(0, 11, 7, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- naves ----------
  // nave-mãe Estrela Rosa (da Gabi): disco grande com cúpula de vidro
  function naveMae(x, y, s, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    brilho(0, 30, 260, 'rgba(255,79,163,.18)');
    // cúpula com a Gabi dentro
    const vidro = ctx.createLinearGradient(0, -110, 0, -10);
    vidro.addColorStop(0, 'rgba(180,240,255,.55)'); vidro.addColorStop(1, 'rgba(56,232,255,.18)');
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -14, 92, 92, 0, Math.PI, 0); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#1a1446'; ctx.fillRect(-100, -120, 200, 120);
    const aceno = o.aceno ? Math.sin(t * 9) * .5 : 0;
    // bracinho acenando
    if (o.aceno) { ctx.save(); ctx.translate(24, -22); ctx.rotate(-1.1 + aceno); elipse(0, -18, 7, 20, '#7cc4ff'); elipse(0, -38, 8, 8, PELE); ctx.restore(); }
    rosto(0, -52, 1.05, 'gabi', { pisca: (t % 3.2) < .12, olhar: o.olhar || 0, boca: o.boca });
    ctx.fillStyle = vidro; ctx.fillRect(-100, -120, 200, 120);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-40, -70, 12, 30, .6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // disco
    const casco = ctx.createLinearGradient(0, -20, 0, 70);
    casco.addColorStop(0, '#ffb3dc'); casco.addColorStop(.45, '#d94f9e'); casco.addColorStop(1, '#5a1f6e');
    ctx.fillStyle = casco; ctx.beginPath(); ctx.ellipse(0, 10, 210, 52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a1450'; ctx.beginPath(); ctx.ellipse(0, 36, 120, 30, 0, 0, Math.PI); ctx.fill();
    // luzinhas que correm em volta
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + t * 1.4, lx = Math.cos(a) * 190, ly = 14 + Math.sin(a) * 40;
      if (Math.sin(a) < -.2) continue;
      const cor = ['#ffc93c', '#38e8ff', '#3dffb4'][i % 3];
      brilho(lx, ly, 16, cor + '99'); elipse(lx, ly, 5, 4, cor);
    }
    // nome no casco
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '900 15px Orbitron, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ESTRELA ROSA', 0, -2);
    // porta do hangar (lado direito), abre com o tempo o.porta 0..1
    const p = o.porta || 0;
    ctx.fillStyle = '#1a0a2a'; ctx.beginPath(); ctx.ellipse(150, 22, 30, 16 * p + .5, 0, 0, Math.PI * 2); ctx.fill();
    if (p > 0) brilho(150, 22, 40 * p, 'rgba(255,240,170,.8)');
    // motores
    for (const mx of [-110, 0, 110]) brilho(mx, 62, 26 + Math.sin(t * 20 + mx) * 4, 'rgba(56,232,255,.8)');
    ctx.restore();
  }

  // foguetinho do José: verde, com janela redonda
  function foguete(x, y, s, ang, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    // fogo
    const f = 1 + Math.sin(t * 40) * .18;
    if (o.fogo !== false) {
      brilho(-62, 0, 46 * f, 'rgba(255,170,40,.9)');
      ctx.fillStyle = '#ffdf6a'; ctx.beginPath(); ctx.moveTo(-40, -10); ctx.quadraticCurveTo(-80 * f, 0, -40, 10); ctx.fill();
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.moveTo(-40, -5); ctx.quadraticCurveTo(-60 * f, 0, -40, 5); ctx.fill();
    }
    // asas
    ctx.fillStyle = '#ff4fa3';
    ctx.beginPath(); ctx.moveTo(-30, -16); ctx.lineTo(-48, -36); ctx.lineTo(-8, -16); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-30, 16); ctx.lineTo(-48, 36); ctx.lineTo(-8, 16); ctx.fill();
    // corpo
    const g = ctx.createLinearGradient(0, -22, 0, 22);
    g.addColorStop(0, '#b8ffcb'); g.addColorStop(.5, '#3fae5a'); g.addColorStop(1, '#1d6a33');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-42, -18); ctx.lineTo(18, -20); ctx.quadraticCurveTo(62, -12, 70, 0); ctx.quadraticCurveTo(62, 12, 18, 20); ctx.lineTo(-42, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffc93c'; ctx.fillRect(-36, -18, 8, 36);
    // janela com o José
    ctx.save(); ctx.beginPath(); ctx.arc(18, 0, 15, 0, Math.PI * 2); ctx.fillStyle = '#1a1446'; ctx.fill(); ctx.clip();
    ctx.rotate(-ang); rosto(0, 4, .42, 'jose', { corpo: false, boca: o.boca });
    ctx.restore();
    ctx.strokeStyle = '#eaf6ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(18, 0, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Super Madrinha: roupa azul, saia e botas vermelhas, capa vermelha e o escudo com M no peito.
  // Pés em (0,0); voando = deitada no ar com o braço esticado para a frente.
  function superMadrinha(x, y, s, t, voando) {
    const AZUL = '#2f6fe0', VERM = '#e0384f', OURO = '#ffc93c';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (voando) ctx.rotate(Math.PI / 2);
    const onda = Math.sin(t * 9) * 8;
    // capa (voando ela fica esticada para trás)
    ctx.fillStyle = '#b8203a';
    ctx.beginPath(); ctx.moveTo(-20, -104);
    if (voando) { ctx.quadraticCurveTo(-34, -40, -26 + onda, 30); ctx.lineTo(26 + onda, 36); ctx.quadraticCurveTo(34, -40, 20, -104); }
    else { ctx.quadraticCurveTo(-50, -50, -58 + onda, -6); ctx.lineTo(54 + onda, -4); ctx.quadraticCurveTo(48, -50, 20, -104); }
    ctx.fill();
    // pernas e botas
    ctx.fillStyle = AZUL; ctx.fillRect(-14, -58, 11, 32); ctx.fillRect(3, -58, 11, 32);
    ctx.fillStyle = VERM;
    ctx.beginPath(); ctx.roundRect(-16, -30, 14, 30, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, -30, 14, 30, 4); ctx.fill();
    // saia com cinto dourado
    ctx.beginPath(); ctx.moveTo(-17, -66); ctx.lineTo(17, -66); ctx.lineTo(24, -50); ctx.lineTo(-24, -50); ctx.fill();
    ctx.fillStyle = OURO; ctx.fillRect(-17, -69, 34, 5);
    // corpo azul
    ctx.fillStyle = AZUL; ctx.beginPath(); ctx.roundRect(-19, -108, 38, 42, 10); ctx.fill();
    // braços: voando, um esticado para a frente (para cima, antes de girar); em pé, mãos na cintura
    ctx.strokeStyle = AZUL; ctx.lineWidth = 9; ctx.lineCap = 'round';
    if (voando) {
      ctx.beginPath(); ctx.moveTo(14, -100); ctx.lineTo(12, -150); ctx.stroke(); elipse(12, -154, 6, 6, PELE);
      ctx.beginPath(); ctx.moveTo(-14, -100); ctx.lineTo(-16, -70); ctx.stroke(); elipse(-16, -66, 5, 5, PELE);
    } else {
      for (const l of [-1, 1]) { ctx.beginPath(); ctx.moveTo(l * 17, -102); ctx.lineTo(l * 32, -84); ctx.lineTo(l * 18, -70); ctx.stroke(); elipse(l * 18, -70, 5, 5, PELE); }
    }
    // escudo com M
    ctx.fillStyle = OURO; ctx.beginPath(); ctx.moveTo(-12, -102); ctx.lineTo(12, -102); ctx.lineTo(15, -94); ctx.lineTo(0, -78); ctx.lineTo(-15, -94); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = VERM; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = VERM; ctx.font = '900 13px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M', 0, -88);
    // cabeça
    ctx.save(); ctx.translate(0, -132); if (voando) ctx.rotate(-Math.PI / 2 + .4);
    rosto(0, 0, .72, 'ana', { corpo: false, pisca: (t % 2.8) < .1, boca: voando ? null : (t * 6 % 2 < 1 && ((t > 25.2 && t < 27) || (t > 38.4 && t < 41)) ? 'o' : null) });
    ctx.restore();
    ctx.restore();
  }

  // Os gatos da Madrinha, de capa: o Mimi (branco, grandão e mandão, olhos de sono)
  // e o Branquinho (amarelinho, menor e super gordo, olhos azuis e coleira azul, amigão).
  // Sentados com as patinhas em (0,0); voando = deitados no ar, cabeça para a frente.
  const fotos = {};
  for (const n of ['mimi', 'branquinho']) { const i = new Image(); i.src = `fotos/${n}-q.jpg`; fotos[n] = i; }
  function gato(x, y, s, t, quem, o = {}) {
    const mimi = quem === 'mimi';
    const pelo = mimi ? '#fbfbf6' : '#fde6c8', ponta = mimi ? '#f4c4cf' : '#e39a55';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (o.voando) ctx.rotate(Math.PI / 2);
    const arrepio = o.arrepio || 0;
    if (arrepio) { const tr = Math.sin(t * 60) * arrepio * 1.5; ctx.translate(tr, 0); ctx.scale(1 + arrepio * .12, 1 + arrepio * .14); }
    const onda = Math.sin(t * 9 + (mimi ? 0 : 2)) * 5;
    const rx = mimi ? 36 : 44, ry = mimi ? 38 : 33, hy = -ry * 2 - 12;
    // capa: o Mimi de roxo, o Branquinho de vermelho
    ctx.fillStyle = mimi ? '#8a3fe0' : '#d42f4a';
    ctx.beginPath(); ctx.moveTo(-16, hy + 20);
    if (o.voando) { ctx.quadraticCurveTo(-30, -20, -24 + onda, 26); ctx.lineTo(24 + onda, 30); }
    else { ctx.quadraticCurveTo(-46, -30, -44 + onda, 0); ctx.lineTo(44 + onda, 0); }
    ctx.quadraticCurveTo(30, -30, 16, hy + 20); ctx.fill();
    // rabo
    ctx.strokeStyle = mimi ? '#eeeee8' : ponta; ctx.lineWidth = arrepio ? 14 : 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(rx - 8, -8); ctx.quadraticCurveTo(rx + 26, -10 + Math.sin(t * 3) * 6, rx + 14, -50 - arrepio * 14); ctx.stroke();
    // pelo arrepiado (quando o Ilo late)
    if (arrepio) {
      ctx.fillStyle = pelo;
      for (let i = 0; i < 14; i++) { const a = Math.PI + i / 13 * Math.PI, bx = Math.cos(a) * rx, by = -ry + Math.sin(a) * ry;
        ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx + Math.cos(a) * 14 * arrepio, by + Math.sin(a) * 14 * arrepio); ctx.lineTo(bx + 6, by); ctx.fill(); }
    }
    // corpo gordinho, barriga e patinhas
    elipse(0, -ry, rx, ry, pelo);
    elipse(0, -ry * .8, rx * .55, ry * .6, mimi ? 'rgba(255,190,205,.35)' : 'rgba(255,255,255,.5)');
    elipse(-14, -5, 10, 7, pelo); elipse(14, -5, 10, 7, pelo);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, -ry, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    // orelhas
    for (const l of [-1, 1]) {
      ctx.fillStyle = mimi ? pelo : ponta; ctx.beginPath(); ctx.moveTo(l * 24, hy - 2); ctx.lineTo(l * 20, hy - 34); ctx.lineTo(l * 4, hy - 18); ctx.fill();
      ctx.fillStyle = '#ffb3c4'; ctx.beginPath(); ctx.moveTo(l * 20, hy - 6); ctx.lineTo(l * 18, hy - 26); ctx.lineTo(l * 9, hy - 16); ctx.fill();
    }
    // cabeça (o Branquinho tem a carinha alaranjada no meio)
    elipse(0, hy, 28, 24, pelo);
    if (!mimi) { brilho(0, hy + 2, 20, 'rgba(227,154,85,.7)'); ctx.fillStyle = '#1f7ad8'; ctx.beginPath(); ctx.roundRect(-20, hy + 19, 40, 7, 3); ctx.fill(); elipse(0, hy + 29, 4, 4, '#ffc93c'); }
    // olhos
    ctx.strokeStyle = '#3a3040'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const olho = mimi ? '#9fb8d8' : '#4f86d6';
    for (const l of [-1, 1]) {
      const ex = l * 10, ey = hy - 2;
      if (o.feliz) { ctx.beginPath(); ctx.arc(ex, ey + 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); continue; }
      if (mimi && !arrepio) {
        // Mimi: olhinhos meio fechados de quem manda em tudo, e as sobrancelhas bravas
        elipse(ex, ey + 1, 5, 2.4, olho); ctx.beginPath(); ctx.moveTo(ex - 6, ey - 1); ctx.lineTo(ex + 6, ey - 1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex - l * 6, ey - 8); ctx.lineTo(ex + l * 5, ey - 4); ctx.stroke();
      } else {
        const r = arrepio ? 6.5 : 5.5;
        elipse(ex, ey, r, r, olho); elipse(ex, ey, r * .45, r * (arrepio ? .9 : .7), '#1a1a28'); elipse(ex + 1.6, ey - 1.8, 1.5, 1.5, '#fff');
      }
    }
    // focinho, boca e bigodes
    ctx.fillStyle = '#f08aa0'; ctx.beginPath(); ctx.moveTo(-3.5, hy + 6); ctx.lineTo(3.5, hy + 6); ctx.lineTo(0, hy + 10); ctx.fill();
    if (o.boca || arrepio) { elipse(0, hy + 15, 5, 5, '#7a2a3a'); ctx.fillStyle = '#fff'; ctx.fillRect(-4, hy + 11, 2, 3); ctx.fillRect(2, hy + 11, 2, 3); }
    else { ctx.beginPath(); ctx.arc(-3, hy + 11, 3, 0, Math.PI); ctx.arc(3, hy + 11, 3, 0, Math.PI); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(80,70,80,.55)'; ctx.lineWidth = 1.2;
    for (const l of [-1, 1]) for (const d of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(l * 9, hy + 9); ctx.lineTo(l * 32, hy + 7 + d * 1.5); ctx.stroke(); }
    ctx.restore();
  }

  // Ilo, o cachorro do José: parece um poodle marronzinho
  function ilo(x, y, s, t, latindo) {
    ctx.save(); ctx.translate(x, y); ctx.scale(-s, s);
    const C = '#9a6440', E = '#7a4a2c', pulo = latindo ? Math.abs(Math.sin(t * 12)) * 6 : 0;
    ctx.translate(0, -pulo);
    for (const [px, py, r] of [[-22, -6, 8], [-8, -6, 8], [14, -6, 8], [26, -6, 8]]) elipse(px, py, r * .8, r, E);
    for (const [px, py, r] of [[-18, -26, 17], [0, -30, 19], [18, -28, 17], [-34, -40, 9]]) elipse(px, py, r, r, C);
    // cabeça com o topete enroladinho
    elipse(28, -56, 17, 16, C);
    for (const [px, py] of [[18, -72], [28, -76], [38, -72]]) elipse(px, py, 8, 8, C);
    elipse(16, -50, 7, 13, E, .3);
    elipse(42, -50, 9, 7, '#b8805a');
    elipse(48, -52, 3.5, 3, '#1a1010');
    elipse(32, -60, 2.6, 3, '#1a1010');
    if (latindo) { elipse(44, -43, 5, 4, '#7a2a3a'); elipse(44, -40, 3, 4, '#ff7a9a'); }
    ctx.restore();
    if (latindo && Math.sin(t * 12) > 0) {
      ctx.save(); ctx.fillStyle = '#fff'; ctx.font = '900 20px Orbitron, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('AU AU!', x - 20 * s, y - 100 * s); ctx.restore();
    }
  }

  // foto de verdade do gato num porta-retrato torto
  function polaroide(x, y, ang, img, nome, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(ang); ctx.scale(.7 + a * .3, .7 + a * .3);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-72, -82, 152, 178);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(-78, -88, 156, 180);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, -68, -78, 136, 136);
    else { ctx.fillStyle = '#ddd'; ctx.fillRect(-68, -78, 136, 136); }
    ctx.fillStyle = '#3a2a50'; ctx.font = '900 17px Orbitron, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(nome, 0, 80);
    ctx.restore();
  }

  function planeta(x, y, r, t) {
    ctx.save(); ctx.translate(x, y);
    brilho(0, 0, r * 1.8, 'rgba(176,107,255,.25)');
    ctx.strokeStyle = 'rgba(255,201,60,.55)'; ctx.lineWidth = r * .09;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * .42, -.3, Math.PI, Math.PI * 2); ctx.stroke();
    const g = ctx.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r);
    g.addColorStop(0, '#ffd1f0'); g.addColorStop(.5, '#b06bff'); g.addColorStop(1, '#2a1260');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * .42, -.3, 0, Math.PI); ctx.stroke();
    ctx.restore();
  }

  // ---------- fundo ----------
  function ceu(t, warp) {
    ctx.fillStyle = '#02030c'; ctx.fillRect(0, 0, W, H);
    const neb = ctx.createRadialGradient(W * .3, H * .3, 0, W * .3, H * .3, Math.max(W, H) * .8);
    neb.addColorStop(0, 'rgba(176,107,255,.22)'); neb.addColorStop(.5, 'rgba(56,40,140,.12)'); neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
    const neb2 = ctx.createRadialGradient(W * .85, H * .8, 0, W * .85, H * .8, Math.max(W, H) * .6);
    neb2.addColorStop(0, 'rgba(255,79,163,.16)'); neb2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.max(W, H) * .7;
    for (const s of estrelas) {
      // em dobra espacial as estrelas viram riscos saindo do centro
      s.z -= (.002 + warp * .03);
      if (s.z <= .02) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; }
      const px = cx + s.x / s.z * R * .25, py = cy + s.y / s.z * R * .25;
      const cor = s.c < .15 ? '255,201,60' : s.c < .3 ? '56,232,255' : '255,255,255';
      const a = lim(1.2 - s.z);
      if (warp > .05) {
        const z2 = s.z + .05 * warp * 4;
        const qx = cx + s.x / z2 * R * .25, qy = cy + s.y / z2 * R * .25;
        ctx.strokeStyle = `rgba(${cor},${a})`; ctx.lineWidth = (1 - s.z) * 2.5 + .5;
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${cor},${a * (.7 + Math.sin(t * 2 + s.c * 30) * .3)})`;
        const r = (1 - s.z) * 2 + .4; ctx.fillRect(px, py, r, r);
      }
    }
  }

  // ---------- legendas ----------
  // [começo, fim, legenda em português, legenda em finlandês (também falada, para o José)]
  const FALAS = [
    [1.2, 4.2, '', 'Gabin galaksi esittää: Josén saapuminen!'],
    [4.6, 8.4, 'Na nave <b>Estrela Rosa</b>, a capitã <b class="g">Gabi</b> recebe um chamado no rádio…', 'Estrela Rosa -aluksella kapteeni Gabi saa radiokutsun…'],
    [8.6, 11.2, '<b class="g">Gabi:</b> “Estrela Rosa para José: pode vir, maninho!” 📡', 'Gabi: ”Tule vain, pikkuveli!”'],
    [11.4, 15, '<b class="j">José:</b> “Tô chegando! Olha minha manobra! Vrummm!” 🚀', 'José: ”Tulossa! Katso temppuani! Vrummm!”'],
    [15.2, 18.6, '<b class="g">Gabi:</b> “Raio trator ligado… pouso perfeito!” ✨', 'Gabi: ”Vetosäde päällä… täydellinen lasku!”'],
    [18.8, 22.4, 'Bem-vindo à Galáxia da Gabi, <b class="j">José</b>! 💛', 'Tervetuloa Gabin galaksiin, José!'],
    [22.6, 25, '<b class="j">José:</b> “Ué… quem é aquela voando lá fora?” 👀', 'José: ”Häh… kuka tuolla ulkona lentää?”'],
    [25.2, 27.2, 'É um cometa? É um foguete? É a <b class="m">SUPER MADRINHA</b>! 🦸‍♀️', 'Onko se komeetta? Raketti? Se on Superkummitäti!'],
    [27.4, 30.4, 'E com ela, os supergatos: o <b class="m">Mimi</b>, o mandão, e o <b class="m">Branquinho</b>, o amigão! 🐱🐱', 'Ja hänen kanssaan superkissat: pomo Mimi ja kaveri Branquinho!'],
    [30.6, 33, '<b class="m">Mimi:</b> “Miau! Aqui quem manda sou eu!” 😼', 'Mimi: ”Miau! Täällä minä määrään!”'],
    [33.2, 35.4, '<b class="m">Branquinho:</b> “Miau, José! Vamos brincar?” 🐾', 'Branquinho: ”Miau, José! Leikitäänkö?”'],
    [35.6, 38.2, '<b class="j">Ilo:</b> “Au au!” 🐶 Ih… os gatos não gostam muito do Ilo!', 'Ilo: ”Hau hau!” Voi ei… kissat eivät oikein tykkää Ilosta!'],
    [38.4, 42.5, '<b class="m">Super Madrinha:</b> “Calma, turma! Na galáxia todo mundo é amigo!” 💛', 'Superkummitäti: ”Rauhassa, porukka! Galaksissa kaikki ovat ystäviä!”'],
  ];
  const html = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  let falaAtual = -1;
  function mostrarFala(t) {
    const i = FALAS.findIndex(([a, b]) => t >= a && t < b);
    if (i === falaAtual) return;
    falaAtual = i;
    legenda.classList.remove('on');
    if (i < 0) return;
    const [, , pt, fi] = FALAS[i];
    if (pt) { legenda.innerHTML = pt + `<span class="fi" lang="fi">${html(fi)}</span>`; void legenda.offsetWidth; legenda.classList.add('on'); }
    falarFi();
  }
  // narração em finlandês quando o som está ligado
  function falarFi() {
    if (somLigado && falaAtual >= 0 && window.puhu) puhu(FALAS[falaAtual][3].replace(/^(Gabi|José|Superkummitäti|Mimi|Branquinho): /, ''));
  }

  // ---------- cenas ----------
  function quadro(t) {
    const warp = t < 4.4 ? suave(prog(t, 0, 1.2)) * (1 - suave(prog(t, 3.2, 4.4))) : 0;
    ceu(t, warp);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(u, u);

    if (t < 4.6) {
      // abertura: dobra espacial e o título
      const a = prog(t, 1, 1.8) * (1 - prog(t, 3.8, 4.5));
      ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.font = '700 15px Orbitron, sans-serif'; ctx.fillStyle = '#3dffb4';
      ctx.fillText('A   G A L Á X I A   D A   G A B I   A P R E S E N T A', 0, -60);
      const tam = Math.min(64, VW / 9);
      ctx.font = `900 ${tam}px Orbitron, sans-serif`;
      const g = ctx.createLinearGradient(-VW / 3, 0, VW / 3, 0);
      g.addColorStop(0, '#ffc93c'); g.addColorStop(.5, '#ff4fa3'); g.addColorStop(1, '#38e8ff');
      ctx.fillStyle = g; ctx.shadowColor = 'rgba(176,107,255,.8)'; ctx.shadowBlur = 30;
      ctx.fillText('A CHEGADA', 0, 10 + (1 - a) * 10);
      ctx.fillText('DO JOSÉ', 0, 10 + tam * 1.05 + (1 - a) * 10);
      ctx.shadowBlur = 0;
      ctx.font = `700 ${Math.min(26, VW / 22)}px Orbitron, sans-serif`; ctx.fillStyle = '#a9e6ff';
      ctx.fillText('GABIN GALAKSI ESITTÄÄ:', 0, 10 + tam * 2.1);
      ctx.fillText('JOSÉN SAAPUMINEN', 0, 10 + tam * 2.1 + Math.min(34, VW / 17));
      ctx.globalAlpha = 1;
    } else if (t < 19) {
      // espaço aberto: planeta, nave-mãe e o foguetinho do José
      const ent = mola(prog(t, 4.4, 7));
      planeta(mix(VW * .6, VW * .28, prog(t, 4.4, 19)), -VH * .28, 70, t);
      const mx = mix(VW / 2 + 260, -70, ent), my = 40 + Math.sin(t * 1.3) * 8;
      const porta = suave(prog(t, 14.6, 15.6)) * (1 - suave(prog(t, 18, 18.8)));
      const falaGabi = t > 8.6 && t < 11.2 && (t * 6 % 2) < 1;
      naveMae(mx, my, 1, t, { aceno: t > 8.4 && t < 15, porta, olhar: t > 11 ? 3 : 0, boca: falaGabi ? 'o' : null });

      if (t > 10.2) {
        // trajeto do José: chega lá de longe, faz um looping e entra no raio trator
        const hx = mx + 150, hy = my + 22;
        let fx, fy, fs, ang;
        const k = prog(t, 10.2, 13.2);
        if (t < 13.2) {
          const ax = VW / 2 + 80, ay = -VH / 2 - 60, bx = 210, by = -130;
          const e = suave(k);
          fx = mix(ax, bx, e); fy = mix(ay, by, e) + Math.sin(e * Math.PI) * 60;
          fs = mix(.25, .85, e);
          ang = Math.atan2(by - ay, bx - ax);
        } else if (t < 15) {
          // looping de alegria
          const l = suave(prog(t, 13.2, 15)) * Math.PI * 2;
          // círculo que começa e termina em (210,-130), indo para a direita no topo
          fx = 210 + Math.sin(l) * 90; fy = -60 - Math.cos(l) * 70;
          fs = .85; ang = Math.atan2(Math.sin(l) * 70, Math.cos(l) * 90);
        } else {
          // raio trator puxa o foguete para o hangar
          const r = suave(prog(t, 15.2, 18));
          const sx = 210, sy = -130;
          fx = mix(sx, hx + 40, r); fy = mix(sy, hy - 6, r);
          fs = mix(.85, .2, r); ang = mix(Math.atan2(-1, 1), Math.PI * .95, r);
        }
        if (t > 15) {
          const b = suave(prog(t, 15, 15.6)) * (1 - suave(prog(t, 18, 18.6)));
          ctx.save(); ctx.globalAlpha = b * (.55 + Math.sin(t * 14) * .1);
          const g = ctx.createLinearGradient(hx, hy, 210, -130);
          g.addColorStop(0, 'rgba(255,240,170,.9)'); g.addColorStop(1, 'rgba(56,232,255,.15)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx - 18, hy); ctx.lineTo(hx + 18, hy);
          ctx.lineTo(260, -110); ctx.lineTo(160, -150); ctx.closePath(); ctx.fill();
          for (let i = 0; i < 6; i++) {
            const q = ((t * .9 + i / 6) % 1);
            elipse(mix(210, hx, q), mix(-130, hy, q), mix(40, 12, q), mix(14, 5, q), 'rgba(255,255,255,.35)', -.6);
          }
          ctx.restore();
        }
        // rastro brilhante
        if (t < 15.4) for (let i = 1; i <= 8; i++) brilho(fx - Math.cos(ang) * i * 14 * fs, fy - Math.sin(ang) * i * 14 * fs, (10 - i) * 2.4 * fs, `rgba(255,201,60,${.35 - i * .04})`);
        if (t < 18.1) foguete(fx, fy, fs, ang, t, { fogo: t < 15.4, boca: t > 11.4 && t < 15 && (t * 6 % 2) < 1 ? 'o' : null });
      }
    } else {
      // dentro da nave: o abraço
      const k = mola(prog(t, 19, 20.6));
      const junto = suave(prog(t, 20.4, 21.4));
      ctx.fillStyle = '#120a2a'; ctx.fillRect(-VW / 2, -VH / 2, VW, VH);
      ctx.fillStyle = '#2a1450'; ctx.fillRect(-VW / 2, 200, VW, VH);
      // no celular em pé a tela é alta: desce a cena para o meio
      ctx.translate(0, Math.max(0, (VH - 720) * .25));
      const chega = prog(t, 22.6, 25.2), dentro = t >= 25.2;
      // janelão redondo mostrando o espaço
      ctx.save(); ctx.beginPath(); ctx.arc(0, -40, 230, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#05061a'; ctx.fillRect(-240, -280, 480, 480);
      for (let i = 0; i < 60; i++) { const sx = ((i * 97) % 460) - 230, sy = ((i * 53) % 460) - 270; ctx.fillStyle = `rgba(255,255,255,${.4 + (i % 5) * .12})`; ctx.fillRect(sx, sy, 2, 2); }
      planeta(120, -150, 50, t);
      // a Super Madrinha passa voando lá fora, cada vez mais perto
      if (chega > 0 && !dentro) {
        const e = suave(chega);
        const vx = mix(-260, 40, e), vy = mix(-200, -40, e) + Math.sin(e * 7) * 14;
        for (let i = 1; i <= 7; i++) brilho(vx - i * 16 * mix(.3, 1, e), vy - i * 10 * mix(.3, 1, e), (9 - i) * 3, `rgba(255,79,163,${.3 - i * .035})`);
        const sc = mix(.25, 1.1, e);
        ctx.save(); ctx.translate(vx, vy); ctx.rotate(.55);
        gato(-70 * sc, -60 * sc + Math.sin(t * 4) * 4, sc * .55, t, 'mimi', { voando: true });
        gato(-50 * sc, 70 * sc + Math.sin(t * 4 + 1) * 4, sc * .45, t, 'branquinho', { voando: true });
        superMadrinha(0, 0, sc, t, true); ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = '#b06bff'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, -40, 236, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(56,232,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -40, 246, 0, Math.PI * 2); ctx.stroke();
      // painel com luzinhas
      ctx.fillStyle = '#2a1450'; ctx.fillRect(-VW / 2, 200, VW, VH);
      // ela entra na nave com um clarão e fica atrás dos dois, mãos na cintura
      if (dentro) {
        const pouso = mola(prog(t, 25.2, 25.9));
        brilho(0, -20, 260 * (1 - prog(t, 25.2, 26.4)) + 1, 'rgba(255,240,200,.7)');
        superMadrinha(0, mix(-260, 215, pouso), 2.6, t, false);
      }
      for (let i = -8; i <= 8; i++) { const on = Math.sin(t * 5 + i) > 0; elipse(i * 40, 230, 6, 6, on ? ['#ffc93c', '#38e8ff', '#3dffb4', '#ff4fa3'][(i + 8) % 4] : '#3a2a60'); }

      // quando a Super Madrinha pousa, os dois abrem espaço para ela no meio
      const abre = suave(prog(t, 25.2, 25.9));
      const dist = mix(mix(150, 46, junto), 178, abre);
      const gx = mix(-VW / 2 - 120, -dist, k), jx = mix(VW / 2 + 120, dist, k);
      const pulo = junto >= 1 && (t < 22.6 || (t > 25.4 && t < 35.6) || t > 39.4) ? Math.abs(Math.sin(t * (t > 25.4 ? 8 : 5))) * (t > 25.4 ? 16 : 10) : 0;
      // bracinhos do abraço
      if (junto > 0 && abre < 1) {
        ctx.save(); ctx.globalAlpha = junto * (1 - abre);
        ctx.strokeStyle = '#7cc4ff'; ctx.lineWidth = 22; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(gx + 10, 150 - pulo); ctx.quadraticCurveTo(jx, 110 - pulo, jx + 40, 150 - pulo); ctx.stroke();
        ctx.restore();
      }
      const espia = chega > 0 && !dentro;
      rosto(gx, 70 - pulo, 2.3, 'gabi', { feliz: junto > .6 && !espia, pisca: (t % 2.6) < .1, olhar: espia ? -3 : 0, boca: espia ? 'o' : null });
      rosto(jx, 100 - pulo, 1.95, 'jose', { feliz: junto > .6 && !espia, pisca: (t % 3.1) < .1, olhar: espia ? -3 : 0, boca: espia ? 'o' : null });
      if (junto > 0 && abre < 1) {
        ctx.save(); ctx.globalAlpha = junto * (1 - abre);
        ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 18; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(jx - 10, 160 - pulo); ctx.quadraticCurveTo(gx, 130 - pulo, gx - 40, 160 - pulo); ctx.stroke();
        ctx.restore();
      }
      // os supergatos pousam na frente da Madrinha; o Ilo chega latindo e eles se assustam
      if (dentro) {
        const pg = mola(prog(t, 25.5, 26.3));
        const susto = suave(prog(t, 35.6, 36)) * (1 - suave(prog(t, 38.6, 39.4)));
        const calma = t > 39.4;
        const fala = (a, b) => t > a && t < b && (t * 6 % 2) < 1;
        gato(-74, mix(-300, 232, pg), 1.9, t, 'mimi', { arrepio: susto, boca: fala(30.6, 33), feliz: calma });
        // o Branquinho pula no colo da Madrinha de medo
        const colo = suave(prog(t, 35.7, 36.2)) * (1 - suave(prog(t, 39, 39.6)));
        gato(mix(72, 30, colo), mix(mix(-300, 232, mola(prog(t, 25.7, 26.5))), 40, colo), 1.45, t, 'branquinho', { arrepio: susto * .6, boca: fala(33.2, 35.4), feliz: calma || (t > 33.2 && t < 35.4 && !fala(33.2, 35.4)) });
        if (t > 35.4) ilo(mix(VW / 2 + 80, Math.min(300, VW / 2 - 70), mola(prog(t, 35.4, 36))), 222, 1.5, t, t < 38.4);
        // as fotos de verdade dos dois
        const fa = suave(prog(t, 27.4, 28.2)) * (1 - suave(prog(t, 35, 35.6)));
        const pxF = Math.min(VW / 2 - 105, 440), pyF = VW > 1000 ? -120 : -440;
        polaroide(-pxF, pyF, -.12, fotos.mimi, 'MIMI', fa);
        polaroide(pxF, pyF + 20, .1, fotos.branquinho, 'BRANQUINHO', fa);
      }
      // corações e estrelinhas subindo
      for (let i = 0; i < 64; i++) {
        const nasc = i < 16 ? 20.8 + i * .22 : i < 40 ? 25.4 + (i - 16) * .2 : 39.4 + (i - 40) * .12; if (t < nasc) continue;
        const q = (t - nasc) / 3.2; if (q > 1) continue;
        const x = Math.sin(i * 2.3) * 220, y = 80 - q * 380;
        ctx.globalAlpha = 1 - q;
        if (i % 2) coracao(x + Math.sin(t * 3 + i) * 12, y, 1.6, ['#ff4fa3', '#ffc93c', '#ff7ab8'][i % 3]);
        else estrelinha(x, y, 9, ['#ffc93c', '#38e8ff', '#3dffb4'][i % 3], t * 2 + i);
        ctx.globalAlpha = 1;
      }
      // faixa de boas-vindas
      const fb = mola(prog(t, 21.6, 22.6)) * (1 - suave(prog(t, 22.4, 22.9))) + mola(prog(t, 39.6, 40.4));
      if (fb > 0) {
        ctx.save(); ctx.translate(0, -250 + (1 - fb) * -200);
        const larg = Math.min(600, VW - 40);
        ctx.fillStyle = '#ff4fa3'; ctx.beginPath(); ctx.roundRect(-larg / 2, -40, larg, 84, 18); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `900 ${Math.min(26, larg / 18)}px Orbitron, sans-serif`;
        ctx.fillText(t > 30 ? 'FAMÍLIA NA GALÁXIA!' : 'BEM-VINDO, JOSÉ!', 0, -4);
        ctx.fillStyle = '#fff6c8';
        ctx.fillText(t > 30 ? 'PERHE GALAKSISSA!' : 'TERVETULOA, JOSÉ!', 0, 28);
        ctx.restore();
      }
    }
    ctx.restore();

    // tarja de cinema e fades
    const tarja = Math.min(H * .08, 60) * (1 - prog(t, DUR - 1.5, DUR));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, tarja); ctx.fillRect(0, H - tarja, W, tarja);
    const corte = Math.max(1 - prog(t, 0, .8), Math.max(0, 1 - Math.abs(t - 19) / .35), prog(t, DUR - 1.2, DUR));
    if (corte > 0) { ctx.fillStyle = `rgba(2,3,12,${corte})`; ctx.fillRect(0, 0, W, H); }
    if (Math.abs(t - 25.2) < .3) { ctx.fillStyle = `rgba(255,255,255,${(.3 - Math.abs(t - 25.2)) * 2.4})`; ctx.fillRect(0, 0, W, H); }
    if (Math.abs(t - 19) < .3) { ctx.fillStyle = `rgba(255,255,255,${(.3 - Math.abs(t - 19)) * 1.5})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- som (só depois de tocar no botão, que é a regra dos navegadores) ----------
  let AC = null, mestre = null, somLigado = false, ultimaBatida = -1;
  const disparados = new Set();
  function ligarSom() {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      if (!mestre) { mestre = AC.createGain(); mestre.gain.value = window.temVozFi?.() ? .3 : .5; mestre.connect(AC.destination); }
      somLigado = true; btSom.textContent = '🔊 Som · Ääni';
      // a voz finlandesa só pode começar depois de um toque: começa já com a fala da cena atual
      falarFi(); btSom.setAttribute('aria-pressed', 'true');
    } catch { btSom.hidden = true; }
  }
  function desligarSom() { somLigado = false; window.hiljaa?.(); btSom.textContent = '🔇 Ligar som · Ääni'; btSom.setAttribute('aria-pressed', 'false'); }
  function nota(freq, quando, dur, vol, tipo = 'triangle') {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipo; o.frequency.value = freq; o.connect(g); g.connect(mestre);
    g.gain.setValueAtTime(0, quando); g.gain.linearRampToValueAtTime(vol, quando + .02); g.gain.exponentialRampToValueAtTime(.0005, quando + dur);
    o.start(quando); o.stop(quando + dur + .05);
  }
  function ruido(quando, dur, vol, de, ate) {
    const n = AC.sampleRate * dur, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(de, quando); f.frequency.exponentialRampToValueAtTime(ate, quando + dur);
    g.gain.setValueAtTime(0, quando); g.gain.linearRampToValueAtTime(vol, quando + dur * .3); g.gain.linearRampToValueAtTime(0, quando + dur);
    src.connect(f); f.connect(g); g.connect(mestre); src.start(quando);
  }
  function miau(quando, f0, dur) {
    const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; fl.type = 'bandpass'; fl.Q.value = 3;
    o.frequency.setValueAtTime(f0, quando); o.frequency.linearRampToValueAtTime(f0 * 1.5, quando + dur * .35); o.frequency.linearRampToValueAtTime(f0 * .8, quando + dur);
    fl.frequency.setValueAtTime(900, quando); fl.frequency.linearRampToValueAtTime(1800, quando + dur * .4); fl.frequency.linearRampToValueAtTime(700, quando + dur);
    g.gain.setValueAtTime(0, quando); g.gain.linearRampToValueAtTime(.18, quando + .06); g.gain.linearRampToValueAtTime(0, quando + dur);
    o.connect(fl); fl.connect(g); g.connect(mestre); o.start(quando); o.stop(quando + dur + .05);
  }
  function latido(quando) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(420, quando); o.frequency.exponentialRampToValueAtTime(180, quando + .14);
    g.gain.setValueAtTime(.1, quando); g.gain.exponentialRampToValueAtTime(.001, quando + .16);
    o.connect(g); g.connect(mestre); o.start(quando); o.stop(quando + .2);
    ruido(quando, .12, .2, 1200, 600);
  }
  // música: arpejo alegre de 4 acordes (Dó, Lá menor, Fá, Sol) em colcheias
  const ACORDES = [[261.6, 329.6, 392, 523.2], [220, 261.6, 329.6, 440], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392]];
  const EVENTOS = [[0, 'dobra'], [10.2, 'foguete'], [13.2, 'looping'], [15.1, 'raio'], [18.9, 'abraco'], [21.6, 'festa'], [22.8, 'voo'], [25.2, 'super'], [30.6, 'miauMimi'], [33.2, 'miauBranquinho'], [35.6, 'latido'], [36, 'chiado'], [39.4, 'festa2']];
  function sons(t) {
    if (!somLigado || !AC) return;
    const agora = AC.currentTime;
    const b = Math.floor(t / .25);
    if (b !== ultimaBatida && t < DUR - 1) {
      ultimaBatida = b;
      const ac = ACORDES[Math.floor(b / 8) % 4];
      nota(ac[[0, 1, 2, 3, 2, 1, 2, 3][b % 8]] * (t > 19 ? 2 : 1), agora, .3, .05);
      if (b % 8 === 0) { nota(ac[0] / 2, agora, 2, .07, 'sine'); nota(ac[1] / 2, agora, 2, .04, 'sine'); }
    }
    for (const [quando, nome] of EVENTOS) {
      if (t < quando || t > quando + .5 || disparados.has(nome)) continue;
      disparados.add(nome);
      if (nome === 'dobra') ruido(agora, 4, .35, 200, 3000);
      if (nome === 'foguete') ruido(agora, 3, .25, 3000, 300);
      if (nome === 'looping') { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(300, agora); o.frequency.exponentialRampToValueAtTime(900, agora + .9); o.frequency.exponentialRampToValueAtTime(300, agora + 1.8); g.gain.setValueAtTime(.08, agora); g.gain.linearRampToValueAtTime(0, agora + 1.8); o.connect(g); g.connect(mestre); o.start(agora); o.stop(agora + 1.9); }
      if (nome === 'raio') { for (let i = 0; i < 6; i++) nota(440 + i * 110, agora + i * .4, .6, .04, 'sine'); }
      if (nome === 'abraco') [523.2, 659.3, 784, 1046.5].forEach((f, i) => nota(f, agora + i * .12, 1.4, .08));
      if (nome === 'miauMimi') miau(agora, 380, 1);
      if (nome === 'miauBranquinho') { miau(agora, 620, .7); miau(agora + .6, 700, .5); }
      if (nome === 'latido') for (let i = 0; i < 4; i++) { latido(agora + i * .45); }
      if (nome === 'chiado') ruido(agora, .9, .25, 5000, 2500);
      if (nome === 'festa2') [523.2, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => nota(f, agora + i * .1, .9, .07));
      if (nome === 'voo') ruido(agora, 2.4, .3, 400, 4000);
      if (nome === 'super') [392, 523.2, 659.3, 784, 659.3, 784, 1046.5].forEach((f, i) => nota(f, agora + i * .14 + (i > 4 ? .14 : 0), i === 6 ? 1.6 : .3, .09, 'square'));
      if (nome === 'festa') [784, 988, 1175, 1568, 1318.5, 1568].forEach((f, i) => nota(f, agora + i * .1, .5, .05, 'square'));
    }
  }

  // ---------- controle do filme ----------
  function passo(ms) {
    if (!rodando) return;
    const t = (ms - inicio) / 1000;
    if (t >= DUR) { fechar(); return; }
    // se a aba ficou escondida, não pula pedaços do som: só recomeça a contar daqui
    if (t - ultimoT > .5) { inicio += (t - ultimoT) * 1000; requestAnimationFrame(passo); return; }
    ultimoT = t;
    quadro(t); mostrarFala(t); sons(t);
    barra.style.transform = `scaleX(${t / DUR})`;
    requestAnimationFrame(passo);
  }
  function abrir() {
    medir(); falaAtual = -1; ultimaBatida = -1; disparados.clear(); ultimoT = 0;
    legenda.classList.remove('on');
    filme.hidden = false; filme.classList.remove('saindo');
    document.body.classList.add('com-filme');
    rodando = true;
    requestAnimationFrame(ms => { inicio = ms; passo(ms); });
    btPular.focus({ preventScroll: true });
  }
  function fechar() {
    if (!rodando) return;
    rodando = false;
    filme.classList.add('saindo');
    document.body.classList.remove('com-filme');
    setTimeout(() => { if (!rodando) filme.hidden = true; }, 600);
    if (AC && AC.state === 'running') AC.suspend().catch(() => {});
    window.hiljaa?.();
  }

  addEventListener('resize', () => { if (rodando) medir(); });
  btPular.onclick = fechar;
  btSom.onclick = () => { if (somLigado) desligarSom(); else ligarSom(); };
  filme.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
  btRever.onclick = () => { if (AC && AC.state === 'suspended' && somLigado) AC.resume(); abrir(); };

  // passa sozinho uma vez por visita (voltar de um jogo para cá não repete o filme)
  let jaViu = false;
  try { jaViu = sessionStorage.getItem('viu-abertura') === '1'; sessionStorage.setItem('viu-abertura', '1'); } catch {}
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!jaViu && !calmo) abrir();
})();
