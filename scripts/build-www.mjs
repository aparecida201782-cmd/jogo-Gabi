// Copia os arquivos do jogo para www/, a pasta que o Capacitor empacota no app.
import { rmSync, mkdirSync, cpSync } from 'node:fs';
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of ['index.html', 'abertura.js', 'madrinha.html', 'historia.html', 'neon.html', 'neon.js', 'corrida.html', 'corrida.js', 'turbo.html', 'mystic.html', 'mystic-historia.js', 'mystic-imagens.js', 'videos', 'fotos', 'lib', 'img', 'CNAME']) cpSync(f, `www/${f}`, { recursive: true });
console.log('www/ pronto');
