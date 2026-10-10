// Gera os vídeos MP4 de videos/ a partir de scripts/mystic-videos.js (quadros) e de um som feito pelo ffmpeg.
// Precisa do Playwright (npm i -D playwright && npx playwright install chromium) e do ffmpeg instalado.
// Uso: node scripts/gerar-videos.mjs [--lingua fi|en] [nome...]
// Em finlandês e inglês os vídeos saem como videos/nome_fi.mp4 e videos/nome_en.mp4.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { VIDEOS, FPS, W, H } from './mystic-videos.js';

const raiz = new URL('..', import.meta.url).pathname;
mkdirSync(join(raiz, 'videos'), { recursive: true });
const args = process.argv.slice(2);
const iL = args.indexOf('--lingua'), LINGUA = iL >= 0 ? args.splice(iL, 2)[1] : 'pt';
const nomes = args.length ? args : Object.keys(VIDEOS);

// expressão do ffmpeg (aevalsrc) com os sons de cada vídeo
function trilha(som, dur) {
  const p = ['0'];
  const ev = (lista, d, expr) => { for (const x of [].concat(lista || [])) p.push(`between(t,${x},${x + d})*(${expr.replaceAll('X', x)})`); };
  // som grave de fundo (duas notas quase iguais que "batem" e dão arrepio)
  if (som.drone) p.push(`${som.drone}*(0.07*sin(2*PI*55*t)+0.06*sin(2*PI*55.6*t)+0.035*sin(2*PI*82.4*t)+0.02*sin(2*PI*110.3*t))*(0.75+0.25*sin(2*PI*0.13*t))*min(1,t/2)`);
  if (som.coracao) {
    const [a, b] = som.coracao;
    p.push(`between(t,${a},${b})*0.9*sin(2*PI*50*t)*(lt(mod(t,0.85),0.12)*exp(-mod(t,0.85)*18)*6+between(mod(t,0.85),0.24,0.36)*exp(-(mod(t,0.85)-0.24)*18)*4)`);
  }
  if (som.agua) p.push('0.05*(random(5)*2-1)*(0.6+0.4*sin(2*PI*0.3*t))');
  if (som.zumbido) p.push('0.025*sin(2*PI*120*t)+0.01*sin(2*PI*240*t)');
  ev(som.estatica, .35, '0.22*(random(0)*2-1)');
  ev(som.correntes, .5, '0.2*(random(1)*2-1)*abs(sin(2*PI*14*t))');
  ev(som.sustos, 1.6, 'exp(-(t-X)*2.6)*(0.9*sin(2*PI*36*t)+0.5*sin(2*PI*72*t)*exp(-(t-X)*8)+0.3*(random(2)*2-1)*exp(-(t-X)*10))');
  ev(som.sino, 3, 'exp(-(t-X)*1.6)*0.22*(sin(2*PI*523*t)+0.5*sin(2*PI*1046*t)+0.3*sin(2*PI*1569*t))');
  ev(som.toque, .5, '0.12*sin(2*PI*880*t)*lt(mod(t-X,0.25),0.12)');
  ev(som.bipes, .12, '0.15*sin(2*PI*1400*t)');
  ev(som.brilho, 2.5, 'exp(-(t-X)*1.8)*0.12*(sin(2*PI*1318*t)+sin(2*PI*1760*t)+sin(2*PI*2637*t))*(0.5+0.5*sin(2*PI*9*t))');
  ev(som.velas, .5, 'exp(-(t-X)*6)*0.3*(random(3)*2-1)');
  ev(som.sussurro, 2.2, 'sin(PI*(t-X)/2.2)*0.16*(random(4)*2-1)*(0.5+0.5*sin(2*PI*5*t))');
  ev(som.arranhar, 2.8, '0.08*(random(6)*2-1)*abs(sin(2*PI*7*t))');
  if (som.acorde !== undefined) { const x = som.acorde; p.push(`between(t,${x},${dur})*min(1,(t-${x})/1.5)*0.05*(sin(2*PI*261.6*t)+sin(2*PI*329.6*t)+sin(2*PI*392*t)+0.6*sin(2*PI*523.2*t))`); }
  return `aevalsrc='${p.join('+')}':s=44100:d=${dur}`;
}

const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: W, height: H } });
pagina.setDefaultTimeout(120000);
// serve os arquivos do repositório num endereço falso (módulos não carregam por file://)
await pagina.route('http://jogo.local/**', rota => {
  const caminho = new URL(rota.request().url()).pathname;
  if (caminho === '/') return rota.fulfill({ contentType: 'text/html', body: `<canvas id="c" width="${W}" height="${H}"></canvas>` });
  rota.fulfill({ contentType: caminho.endsWith('.jpg') ? 'image/jpeg' : 'text/javascript', body: readFileSync(join(raiz, decodeURIComponent(caminho))) });
});
await pagina.goto('http://jogo.local/');
await pagina.evaluate(async lingua => {
  const IMAGENS = (await import('/mystic-imagens.js')).imagensEm(lingua);
  const { VIDEOS, definirLingua } = await import('/scripts/mystic-videos.js');
  definirLingua(lingua);
  const imgs = {};
  await Promise.all(Object.entries(IMAGENS).map(([k, svg]) => new Promise(ok => {
    // sem os letreiros do canto (o vídeo põe os dele)
    const limpo = svg.replace(/<text x="20" y="382"[^>]*>[^<]*<\/text>/g, '');
    const i = new Image(); i.onload = ok; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(limpo); imgs[k] = i;
  })));
  // as fotos realistas de fotos/ (geradas no Canva) ficam como imgs.f_nome
  await Promise.all(['floresta', 'ponte', 'porao', 'cripta', 'praca'].map(nome => new Promise(ok => {
    const i = new Image(); i.onload = ok; i.onerror = ok; i.src = '/fotos/' + nome + '.jpg'; imgs['f_' + nome] = i;
  })));
  await document.fonts.ready;
  window.quadro = (nome, n, fps) => {
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
    VIDEOS[nome].desenhar(ctx, n / fps, imgs, n);
    return c.toDataURL('image/jpeg', 0.93);
  };
}, LINGUA);

for (const nome of nomes) {
  const v = VIDEOS[nome];
  const pasta = mkdtempSync(join(tmpdir(), 'mystic-'));
  const total = Math.round(v.dur * FPS);
  for (let n = 0; n < total; n++) {
    const url = await pagina.evaluate(([a, b, c]) => window.quadro(a, b, c), [nome, n, FPS]);
    writeFileSync(join(pasta, String(n).padStart(4, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  }
  const saida = join(raiz, 'videos', nome + (LINGUA === 'pt' ? '' : '_' + LINGUA) + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', join(pasta, '%04d.jpg'),
    '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=${v.som.vento ?? .1}:d=${v.dur}`,
    '-f', 'lavfi', '-i', trilha(v.som, v.dur),
    '-filter_complex', `[1]lowpass=f=420,volume=1.6[a];[2]aecho=0.8:0.6:90|170:0.35|0.22,volume=1[b];[a][b]amix=inputs=2:normalize=0,highpass=f=28,afade=t=in:d=0.6,afade=t=out:st=${v.dur - 0.8}:d=0.8,alimiter=limit=0.9[s]`,
    '-map', '0:v', '-map', '[s]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-crf', '23', '-preset', 'slow', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '96k', '-shortest', saida]);
  rmSync(pasta, { recursive: true, force: true });
  console.log('ok', nome, (readFileSync(saida).length / 1024).toFixed(0) + ' kB');
}
await navegador.close();
