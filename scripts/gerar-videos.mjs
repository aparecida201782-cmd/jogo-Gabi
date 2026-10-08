// Gera os vídeos MP4 de videos/ a partir de scripts/mystic-videos.js (quadros) e de um som feito pelo ffmpeg.
// Precisa do Playwright (npm i -D playwright && npx playwright install chromium) e do ffmpeg instalado.
// Uso: node scripts/gerar-videos.mjs [nome...]
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { VIDEOS, FPS, W, H } from './mystic-videos.js';

const raiz = new URL('..', import.meta.url).pathname;
mkdirSync(join(raiz, 'videos'), { recursive: true });
const nomes = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VIDEOS);

// expressão do ffmpeg (aevalsrc) com os sons de cada vídeo
function trilha(som, dur) {
  const p = ['0'];
  if (som.coracao) {
    const [a, b] = som.coracao;
    p.push(`between(t,${a},${b})*0.9*sin(2*PI*52*t)*(lt(mod(t,0.95),0.12)*exp(-mod(t,0.95)*18)*6+between(mod(t,0.95),0.26,0.38)*exp(-(mod(t,0.95)-0.26)*18)*4)`);
  }
  for (const x of som.estatica || []) p.push(`between(t,${x},${x + 0.35})*0.25*(random(0)*2-1)`);
  for (const x of som.correntes || []) p.push(`between(t,${x},${x + 0.5})*0.18*(random(1)*2-1)*abs(sin(2*PI*14*t))`);
  for (const x of som.sustos || []) p.push(`between(t,${x},${x + 1.2})*exp(-(t-${x})*3)*(0.8*sin(2*PI*38*t)+0.25*(random(2)*2-1))`);
  for (const x of som.sino || []) p.push(`between(t,${x},${x + 2})*exp(-(t-${x})*2.2)*0.25*(sin(2*PI*523*t)+0.5*sin(2*PI*1046*t))`);
  if (som.zumbido) p.push('0.03*sin(2*PI*120*t)');
  return `aevalsrc='${p.join('+')}':s=44100:d=${dur}`;
}

const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: W, height: H } });
// serve os arquivos do repositório num endereço falso (módulos não carregam por file://)
await pagina.route('http://jogo.local/**', rota => {
  const caminho = new URL(rota.request().url()).pathname;
  if (caminho === '/') return rota.fulfill({ contentType: 'text/html', body: `<canvas id="c" width="${W}" height="${H}"></canvas>` });
  rota.fulfill({ contentType: 'text/javascript', body: readFileSync(join(raiz, caminho)) });
});
await pagina.goto('http://jogo.local/');
await pagina.evaluate(async () => {
  const { IMAGENS } = await import('/mystic-imagens.js');
  const { VIDEOS } = await import('/scripts/mystic-videos.js');
  const imgs = {};
  await Promise.all(Object.entries(IMAGENS).map(([k, svg]) => new Promise(ok => {
    const i = new Image(); i.onload = ok; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); imgs[k] = i;
  })));
  await document.fonts.ready;
  window.quadro = (nome, n, fps) => {
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
    VIDEOS[nome].desenhar(ctx, n / fps, imgs, n);
    return c.toDataURL('image/png');
  };
});

for (const nome of nomes) {
  const v = VIDEOS[nome];
  const pasta = mkdtempSync(join(tmpdir(), 'mystic-'));
  const total = Math.round(v.dur * FPS);
  for (let n = 0; n < total; n++) {
    const url = await pagina.evaluate(([a, b, c]) => window.quadro(a, b, c), [nome, n, FPS]);
    writeFileSync(join(pasta, String(n).padStart(4, '0') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  const saida = join(raiz, 'videos', nome + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', join(pasta, '%04d.png'),
    '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=${v.som.vento ?? .1}:d=${v.dur}`,
    '-f', 'lavfi', '-i', trilha(v.som, v.dur),
    '-filter_complex', `[1]lowpass=f=450,volume=1.6[a];[2]volume=1[b];[a][b]amix=inputs=2:normalize=0,afade=t=in:d=0.5,afade=t=out:st=${v.dur - 0.7}:d=0.7,alimiter=limit=0.9[s]`,
    '-map', '0:v', '-map', '[s]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '96k', '-shortest', saida]);
  rmSync(pasta, { recursive: true, force: true });
  console.log('ok', nome, (readFileSync(saida).length / 1024).toFixed(0) + ' kB');
}
await navegador.close();
