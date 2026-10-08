// Os vídeos da Operação Mystic Falls, desenhados quadro a quadro num <canvas> de 640x400.
// scripts/gerar-videos.mjs abre isto num navegador, tira cada quadro e junta tudo em MP4 com o ffmpeg.
// Cada vídeo usa uma ilustração de mystic-imagens.js como fundo e anima por cima.

export const W = 640, H = 400, FPS = 25;

// número "aleatório" fixo para cada n (os vídeos saem sempre iguais)
const rnd = n => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = v => { v = lim(v); return v * v * (3 - 2 * v); };
// 0 -> 1 entre os tempos a e b
const entre = (t, a, b) => suave((t - a) / (b - a));

function zoom(ctx, img, t, dur, de, ate) {
  const k = suave(t / dur);
  const s = de.s + (ate.s - de.s) * k, cx = de.x + (ate.x - de.x) * k, cy = de.y + (ate.y - de.y) * k;
  ctx.drawImage(img, W / 2 - cx * s, H / 2 - cy * s, W * s, H * s);
}

function neblina(ctx, t, y, forca = .25, vel = 18) {
  for (let i = 0; i < 9; i++) {
    const x = ((i * 113 + t * vel * (1 + (i % 3) * .4)) % (W + 300)) - 150;
    const g = ctx.createRadialGradient(x, y + Math.sin(i + t * .5) * 12, 0, x, y, 160);
    g.addColorStop(0, `rgba(170,190,200,${forca})`);
    g.addColorStop(1, 'rgba(170,190,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 170, y - 170, 340, 340);
  }
}

function granulado(ctx, quadro, forca = .06) {
  for (let i = 0; i < 260; i++) {
    const v = rnd(quadro * 977 + i) > .5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${forca * rnd(i + quadro)})`;
    ctx.fillRect(rnd(quadro + i * 3.1) * W, rnd(quadro * 1.7 + i) * H, 2, 2);
  }
}

function vinheta(ctx, forca = .7) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function letreiro(ctx, texto, alfa, y = H - 34, cor = '#f4ecd2', tam = 20) {
  if (alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.font = `italic ${tam}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  const w = ctx.measureText(texto).width;
  ctx.fillRect(W / 2 - w / 2 - 12, y - tam, w + 24, tam + 14);
  ctx.fillStyle = cor;
  ctx.fillText(texto, W / 2, y);
  ctx.restore();
}

function olhos(ctx, x, y, abertura, brilho) {
  if (abertura <= 0) return;
  ctx.save();
  for (const dx of [-11, 11]) {
    const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, 26);
    g.addColorStop(0, `rgba(255,40,40,${.55 * brilho})`); g.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x + dx - 26, y - 26, 52, 52);
    ctx.fillStyle = `rgba(255,${60 + 80 * brilho},${60 + 40 * brilho},1)`;
    ctx.beginPath(); ctx.ellipse(x + dx, y, 6, 3.2 * abertura, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export const VIDEOS = {
  // Fase 4: a neblina passando embaixo da Ponte Wickery e um brilho nas pedras
  ponte: {
    dur: 8, fundo: 'ponte',
    som: { vento: .22, agua: true, sustos: [5.2] },
    desenhar(ctx, t, img) {
      zoom(ctx, img.ponte, t, 8, { s: 1, x: 320, y: 200 }, { s: 1.55, x: 440, y: 285 });
      neblina(ctx, t, 270, .22, 22);
      neblina(ctx, t + 40, 330, .16, -14);
      const b = entre(t, 4.8, 5.4) * (1 - entre(t, 6.2, 7.5));
      if (b > 0) {
        const g = ctx.createRadialGradient(470, 318, 0, 470, 318, 90 * b + 10);
        g.addColorStop(0, `rgba(255,220,130,${.8 * b})`); g.addColorStop(1, 'rgba(255,220,130,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      vinheta(ctx, .75);
      letreiro(ctx, 'Tem alguma coisa presa nas pedras...', entre(t, 5.6, 6.2));
    },
  },

  // Fase 5: as gravações das três câmeras do Baile dos Fundadores
  cameras: {
    dur: 10, fundo: 'suspeitos',
    som: { vento: .05, estatica: [0, 3.2, 6.4], zumbido: true, sustos: [8.2] },
    desenhar(ctx, t, img, quadro) {
      const cam = t < 3.2 ? 0 : t < 6.4 ? 1 : 2, t0 = [0, 3.2, 6.4][cam];
      const sx = 16 + cam * 208, k = t - t0;
      const z = cam === 2 ? 1 + entre(k, 1.2, 3) * 1.6 : 1 + k * .03;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      // recorte de cada câmera sem os letreiros do desenho (y de 48 a 298);
      // a câmera 3 aproxima no anel azul (x=148, y=202 dentro do recorte)
      const fx = cam === 2 ? 96 + (148 - 96) * entre(k, 1.2, 3) : 96, fy = cam === 2 ? 125 + (200 - 125) * entre(k, 1.2, 3) : 125;
      const esc = (H / 250) * z, meia = 96 * H / 250;
      ctx.save();
      ctx.beginPath(); ctx.rect(W / 2 - meia, 0, meia * 2, H); ctx.clip();
      ctx.filter = 'grayscale(.75) contrast(1.2) brightness(.9)';
      ctx.drawImage(img.suspeitos, sx, 48, 192, 250, W / 2 - fx * esc, H / 2 - fy * esc, 192 * esc, 250 * esc);
      ctx.filter = 'none';
      if (cam === 2 && k > 2.4) { // o brilho azul do lápis-lazúli
        const p = .5 + .5 * Math.sin((k - 2.4) * 9);
        const ax = W / 2 + (148 - fx) * esc, ay = H / 2 + (202 - fy) * esc;
        const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, 70);
        g.addColorStop(0, `rgba(70,120,255,${.75 * p})`); g.addColorStop(1, 'rgba(70,120,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W / 2 - meia, H); ctx.fillRect(W / 2 + meia, 0, W, H);
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y, W, 1.5); }
      granulado(ctx, quadro, .2);
      // troca de câmera com chiado
      if (k < .35) { for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${rnd(quadro * 31 + i) * .6})`; ctx.fillRect(0, rnd(quadro + i) * H, W, 2 + rnd(i) * 8); } }
      ctx.font = 'bold 13px monospace'; ctx.fillStyle = '#eee'; ctx.textAlign = 'left';
      if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#e33'; ctx.beginPath(); ctx.arc(W / 2 - meia + 14, 26, 5, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#eee'; ctx.fillText('REC  CAM ' + (cam + 1), W / 2 - meia + 24, 31);
      const s = 12 + Math.floor(t), q = String(Math.floor((t % 1) * 25)).padStart(2, '0');
      ctx.textAlign = 'right'; ctx.fillText(`21:47:${String(s).padStart(2, '0')}:${q}`, W / 2 + meia - 10, 31);
      ctx.textAlign = 'center'; ctx.fillText(['LIAM · JARDIM', 'TRISTAN · BAR', 'LUCIEN · SALÃO'][cam], W / 2, H - 18);
      if (cam === 2) letreiro(ctx, 'Zoom: anel de prata... pedra azul.', entre(k, 2.6, 3.0), H - 46, '#a8c4ff', 17);
    },
  },

  // Fase 6: o porão, a luz piscando e dois olhos vermelhos que se abrem no escuro
  porao: {
    dur: 9, fundo: 'porao',
    som: { vento: .08, coracao: [3.5, 9], correntes: [1.4, 2.6], sustos: [5.6] },
    desenhar(ctx, t, img, quadro) {
      const tremor = t > 1.3 && t < 3 ? (rnd(quadro) - .5) * 5 : 0;
      ctx.save(); ctx.translate(tremor, 0);
      zoom(ctx, img.porao, t, 9, { s: 1.05, x: 320, y: 210 }, { s: 1.7, x: 320, y: 175 });
      ctx.restore();
      // lâmpada falhando
      const falha = (rnd(Math.floor(t * 9)) > .78 && t < 5) || (t > 5.2 && t < 5.45);
      ctx.fillStyle = `rgba(0,0,0,${falha ? .82 : .25 + .1 * Math.sin(t * 3)})`; ctx.fillRect(0, 0, W, H);
      const ab = entre(t, 5.5, 6.1), esc = 1.05 + (1.7 - 1.05) * suave(t / 9);
      const ox = W / 2, oy = H / 2 + (160 - (210 + (175 - 210) * suave(t / 9))) * esc;
      olhos(ctx, ox, oy, ab, .6 + .4 * Math.sin(t * 4));
      vinheta(ctx, .9);
      granulado(ctx, quadro, .1);
      letreiro(ctx, '"Eu sei que você está aí, caçadora."', entre(t, 7, 7.5), H - 34, '#ff9a9a');
    },
  },

  // Final 1: a lua cheia sobre a praça, a cidade a salvo
  final_aliado: {
    dur: 8, fundo: 'final_aliado',
    som: { vento: .12, sino: [1, 3.2, 5.4] },
    desenhar(ctx, t, img, quadro) {
      zoom(ctx, img.final_aliado, t, 8, { s: 1.5, x: 330, y: 300 }, { s: 1, x: 320, y: 200 });
      for (let i = 0; i < 30; i++) {
        const a = .5 + .5 * Math.sin(t * 3 + i * 1.7);
        ctx.fillStyle = `rgba(255,255,240,${a * .8})`;
        ctx.fillRect(rnd(i) * W, rnd(i + 99) * 140, 2, 2);
      }
      neblina(ctx, t, 360, .14, 10);
      vinheta(ctx, .55);
      letreiro(ctx, 'Mystic Falls está a salvo.', entre(t, 4.5, 5.3), H / 2 + 120, '#f4ecd2', 24);
    },
  },

  // Final 2: o recado escrito com sangue aparecendo letra por letra
  final_sombra: {
    dur: 9, fundo: 'parede',
    som: { vento: .1, coracao: [0, 9], sustos: [7.2] },
    desenhar(ctx, t, img, quadro) {
      zoom(ctx, img.parede, t, 9, { s: 1.15, x: 320, y: 220 }, { s: 1.35, x: 320, y: 175 });
      const s = 1.15 + .2 * suave(t / 9), cy = 220 + (175 - 220) * suave(t / 9);
      const Y = y => H / 2 + (y - cy) * s;
      ctx.save();
      ctx.font = `italic ${34 * s}px Georgia, serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#8a0f1a';
      const linhas = [['Você devia ter', 150, 1, 3.4], ['confiado em mim.', 195, 3.6, 6.4]];
      for (const [txt, y, a, b] of linhas) {
        const n = Math.floor(txt.length * lim((t - a) / (b - a)));
        const w = ctx.measureText(txt).width;
        ctx.fillText(txt.slice(0, n), W / 2 - w / 2, Y(y));
      }
      ctx.restore();
      if (t > 6.6) for (const [x, h] of [[200, 30], [262, 18], [345, 40], [430, 24]]) {
        const k = entre(t, 6.6, 8.2);
        ctx.fillStyle = '#8a0f1a';
        ctx.fillRect(W / 2 + (x - 320) * s - 1.5, Y(206), 3, h * s * k);
      }
      const pisca = t > 7.2 && t < 7.5;
      ctx.fillStyle = `rgba(120,0,10,${pisca ? .5 : .12})`; ctx.fillRect(0, 0, W, H);
      vinheta(ctx, .85);
      granulado(ctx, quadro, .08);
    },
  },
};
