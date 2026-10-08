// Joga a Operação Mystic Falls aqui no terminal, sem WhatsApp, para testar a história.
import { createInterface } from 'node:readline/promises';
import { responder, estadoInicial } from '../mystic-historia.js';

const rl = createInterface({ input: process.stdin, output: process.stdout });
let estado = estadoInicial();
console.log('Escreva "Mystic Falls" para começar (Ctrl+C sai).');
for (;;) {
  const texto = await rl.question('> ');
  const r = responder(estado, texto);
  estado = r.estado;
  for (const m of r.msgs) {
    if (m.arquivo) console.log(`[arquivo ${m.arquivo.nome}]\n${m.arquivo.conteudo}`);
    console.log(m.audio ? `🎙️ "${m.audio}"` : m.texto, '\n');
  }
}
