// Gera os PNGs de whatsapp/imagens/ a partir dos desenhos de mystic-imagens.js.
// Precisa do Playwright: npm i -D playwright && npx playwright install chromium
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { IMAGENS } from '../mystic-imagens.js';

const pasta = new URL('./imagens/', import.meta.url).pathname;
const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
for (const [nome, svg] of Object.entries(IMAGENS)) {
  await pagina.setContent(`<body style="margin:0">${svg}</body>`);
  writeFileSync(pasta + nome + '.png', await pagina.locator('svg').screenshot({ type: 'png' }));
  console.log('ok', nome);
}
await navegador.close();
