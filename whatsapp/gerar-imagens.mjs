// Gera os PNGs de whatsapp/imagens/ a partir dos desenhos de mystic-imagens.js.
// Precisa do Playwright: npm i -D playwright && npx playwright install chromium
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { imagensEm } from '../mystic-imagens.js';

const pasta = new URL('./imagens/', import.meta.url).pathname;
const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
// português em imagens/, finlandês em imagens/fi/ e inglês em imagens/en/
for (const lg of ['pt', 'fi', 'en']) {
  const destino = pasta + (lg === 'pt' ? '' : lg + '/');
  mkdirSync(destino, { recursive: true });
  for (const [nome, svg] of Object.entries(imagensEm(lg))) {
    await pagina.setContent(`<body style="margin:0">${svg}</body>`);
    writeFileSync(destino + nome + '.png', await pagina.locator('svg').screenshot({ type: 'png' }));
    console.log('ok', lg, nome);
  }
}
await navegador.close();
