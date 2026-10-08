// Robô de WhatsApp da Operação Mystic Falls.
// Conecta um número de WhatsApp (pelo QR code ou código de pareamento) e conversa com quem
// mandar a palavra de início. O progresso de cada pessoa fica salvo em estado.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { responder, estadoInicial, normalizar } from '../mystic-historia.js';

const PASTA = new URL('.', import.meta.url).pathname;
const ARQ_ESTADO = PASTA + 'estado.json';
// Só começa uma partida quem mandar esta frase (assim o robô não responde todo mundo que escrever pro número).
const GATILHO = normalizar(process.env.GATILHO || 'mystic falls');
// Opcional: números que podem jogar, separados por vírgula (ex.: 5585999990000,358401234567).
const PERMITIDOS = (process.env.PERMITIDOS || '').split(',').map(s => s.replace(/\D/g, '')).filter(Boolean);
// Opcional: número do robô para entrar por código de pareamento em vez de QR code.
const NUMERO = (process.env.NUMERO || '').replace(/\D/g, '');

const jogadoras = existsSync(ARQ_ESTADO) ? JSON.parse(readFileSync(ARQ_ESTADO, 'utf8')) : {};
const salvar = () => writeFileSync(ARQ_ESTADO, JSON.stringify(jogadoras, null, 2));
const filas = new Map(); // mensagens de cada pessoa são respondidas uma de cada vez, na ordem

async function enviar(sock, jid, m) {
  await sock.sendPresenceUpdate(m.audio ? 'recording' : 'composing', jid);
  await esperar(m.espera ?? 1500);
  await sock.sendPresenceUpdate('paused', jid);
  if (m.fantasma) return esperar(900); // começou a digitar... e desistiu
  const legenda = (m.texto || '') + (m.opcoes ? `\n\n👉 ${m.opcoes.map(o => '*' + o + '*').join(' ou ')}` : '');
  let conteudo;
  if (m.imagem) {
    conteudo = { image: readFileSync(PASTA + 'imagens/' + m.imagem + '.png'), caption: legenda || undefined };
  } else if (m.arquivo) {
    conteudo = { document: Buffer.from(m.arquivo.conteudo, 'utf8'), mimetype: m.arquivo.mime, fileName: m.arquivo.nome, caption: legenda };
  } else if (m.audio) {
    conteudo = { text: '🎙️ _Áudio (0:' + String(Math.min(59, Math.ceil(m.audio.length / 14))).padStart(2, '0') + ')_\n"' + m.audio + '"' };
  } else {
    conteudo = { text: legenda };
  }
  const enviada = await sock.sendMessage(jid, conteudo);
  // mensagem que some: o WhatsApp mostra "Esta mensagem foi apagada"
  if (m.apagar && enviada) setTimeout(() => sock.sendMessage(jid, { delete: enviada.key }).catch(() => {}), m.apagar);
}

async function tratar(sock, key, texto) {
  const jid = key.remoteJid;
  const numero = jid.split('@')[0].split(':')[0];
  if (PERMITIDOS.length && !PERMITIDOS.includes(numero)) return;
  if (!jogadoras[jid] && !normalizar(texto).includes(GATILHO)) return;
  try {
    await sock.readMessages([key]);
    const { estado, msgs } = responder(jogadoras[jid] || estadoInicial(), texto);
    jogadoras[jid] = estado;
    salvar();
    for (const m of msgs) await enviar(sock, jid, m);
  } catch (err) {
    console.error('Erro ao responder', jid, err);
  }
}

async function ligar() {
  const { state, saveCreds } = await useMultiFileAuthState(PASTA + 'sessao');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Mystic Falls'),
    markOnlineOnConnect: false,
  });
  sock.ev.on('creds.update', saveCreds);

  if (NUMERO && !sock.authState.creds.registered) {
    await esperar(3000);
    const codigo = await sock.requestPairingCode(NUMERO);
    console.log(`\nNo celular do robô: WhatsApp > Aparelhos conectados > Conectar aparelho > Conectar com número de telefone\nCódigo: ${codigo}\n`);
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !NUMERO) {
      console.log('\nNo celular do robô: WhatsApp > Aparelhos conectados > Conectar aparelho, e leia este QR code:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') console.log(`✅ Conectado! Mande "${process.env.GATILHO || 'Mystic Falls'}" para este número para começar o jogo.`);
    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        console.log('O WhatsApp desconectou este aparelho. Apague a pasta whatsapp/sessao e rode de novo para ler outro QR code.');
      } else {
        console.log(`Conexão caiu (${lastDisconnect?.error?.message || codigo}). Tentando de novo em 5 segundos...`);
        setTimeout(ligar, 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      const jid = msg.key.remoteJid;
      if (msg.key.fromMe || !jid || jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter')) continue;
      const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!texto) continue;
      const fila = (filas.get(jid) || Promise.resolve()).then(() => tratar(sock, msg.key, texto));
      filas.set(jid, fila);
    }
  });
}

ligar();
