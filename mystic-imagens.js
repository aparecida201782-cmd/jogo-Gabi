// Ilustrações da Operação Mystic Falls (desenhos próprios em SVG, 640x400).
// O navegador mostra direto; o robô de WhatsApp usa as versões em PNG de whatsapp/imagens/
// (gere de novo com `node whatsapp/gerar-imagens.mjs` se mudar algum desenho).

const W = 640, H = 400;
const svg = (corpo, fundo = '#0a0f14') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${fundo}"/>${corpo}</svg>`;

// estrelas com posições fixas (sem sorteio, para o desenho ser sempre igual)
const estrelas = (n, alt = 200) => Array.from({ length: n }, (_, i) => {
  const x = (i * 211.7 + (i * i) % 53) % W, y = ((i * 97.3) % alt + (i * i * 7) % 41) % alt, r = 0.6 + (i % 3) * 0.5;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff" opacity="${0.3 + (i % 4) * 0.15}"/>`;
}).join('');

const lua = (x, y, r = 46) => `
  <defs><radialGradient id="brilho"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#brilho)"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="#f4ecd2"/>
  <circle cx="${x - r * .3}" cy="${y - r * .2}" r="${r * .18}" fill="#ddd3b4"/>
  <circle cx="${x + r * .35}" cy="${y + r * .25}" r="${r * .12}" fill="#ddd3b4"/>
  <circle cx="${x + r * .1}" cy="${y - r * .45}" r="${r * .08}" fill="#ddd3b4"/>`;

// pinheiro em silhueta
const pinho = (x, base, alt, cor = '#05090c') =>
  `<polygon points="${x},${base - alt} ${x - alt * .28},${base - alt * .45} ${x - alt * .16},${base - alt * .45} ${x - alt * .36},${base} ${x + alt * .36},${base} ${x + alt * .16},${base - alt * .45} ${x + alt * .28},${base - alt * .45}" fill="${cor}"/>`;

const neblina = (y, op = .25) =>
  `<defs><linearGradient id="nb${y}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4c0" stop-opacity="0"/><stop offset=".5" stop-color="#9fb4c0" stop-opacity="${op}"/><stop offset="1" stop-color="#9fb4c0" stop-opacity="0"/></linearGradient></defs><rect x="0" y="${y - 40}" width="${W}" height="80" fill="url(#nb${y})"/>`;

const ceuNoite = `<defs><linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070f"/><stop offset="1" stop-color="#1b2a3a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#ceu)"/>`;

const legenda = (t, cor = '#e7c36a') =>
  `<text x="20" y="${H - 18}" font-family="Georgia,serif" font-size="15" fill="${cor}" opacity=".85" letter-spacing="2">${t}</text>`;

const PAREDE = `${Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<rect x="${c * 74 + (r % 2) * 37 - 20}" y="${r * 52}" width="70" height="48" fill="#1c1916" stroke="#0b0a09" stroke-width="4"/>`).join('')).join('')}
    <path d="M160 300 l20 10 l-6 14 l20 6" stroke="#7a8288" stroke-width="5" fill="none"/><path d="M470 300 l-20 12 l8 12 l-22 4" stroke="#7a8288" stroke-width="5" fill="none"/>
    <path d="M196 330 l8 -6 m2 10 l9 -3" stroke="#aab" stroke-width="2"/><path d="M432 328 l-8 -6 m-2 10 l-9 -3" stroke="#aab" stroke-width="2"/>
    <ellipse cx="320" cy="370" rx="200" ry="14" fill="#000" opacity=".5"/>`;
const RECADO = `<text x="320" y="150" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="34" fill="#8a0f1a">Você devia ter</text>
    <text x="320" y="195" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="34" fill="#8a0f1a">confiado em mim.</text>
    ${[[200, 206, 30], [262, 206, 18], [345, 206, 40], [430, 206, 24]].map(([x, y, h]) => `<path d="M${x} ${y} v${h}" stroke="#8a0f1a" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y + h}" r="3" fill="#8a0f1a"/>`).join('')}`;

export const IMAGENS = {
  // Abertura: a floresta perto da estrada velha, lua cheia e o celular aceso no chão
  floresta: svg(`${ceuNoite}${estrelas(60)}${lua(470, 95)}
    ${[30, 90, 150, 560, 615].map((x, i) => pinho(x, 330, 200 + (i % 3) * 40, '#0b151c')).join('')}
    ${neblina(300, .3)}
    ${[-10, 60, 120, 180, 520, 590, 650].map((x, i) => pinho(x, 400, 230 + (i % 2) * 60)).join('')}
    <rect x="0" y="345" width="${W}" height="55" fill="#04070a"/>
    <path d="M220 400 L300 330 L360 330 L460 400 Z" fill="#141c22"/>
    <g transform="translate(300 352) rotate(-12)"><rect x="-16" y="-26" width="32" height="52" rx="5" fill="#111"/><rect x="-13" y="-22" width="26" height="42" rx="2" fill="#7fd1ff"/></g>
    <ellipse cx="300" cy="358" rx="60" ry="14" fill="#7fd1ff" opacity=".18"/>
    ${legenda('MYSTIC FALLS · LUA CHEIA')}`),

  // Fase 1: grimório aberto com vela
  grimorio: svg(`<defs><radialGradient id="vela" cx=".5" cy=".4"><stop offset="0" stop-color="#ffb347" stop-opacity=".45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="#120c08"/><circle cx="520" cy="130" r="260" fill="url(#vela)"/>
    <rect x="0" y="300" width="${W}" height="100" fill="#2a1a10"/>
    <path d="M90 300 Q200 250 320 285 Q440 250 550 300 L550 330 Q440 285 320 318 Q200 285 90 330 Z" fill="#4a2c18"/>
    <path d="M100 295 Q200 235 318 275 L318 310 Q200 275 100 320 Z" fill="#e9dcb8"/>
    <path d="M322 275 Q440 235 540 295 L540 320 Q440 275 322 310 Z" fill="#e3d4ad"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${125 + i * 2} ${285 - i * 6 + 6} Q210 ${255 - i * 6 + 8} 300 ${282 - i * 6 + 6}" stroke="#6b4a2a" stroke-width="2" fill="none" opacity=".55"/>`).join('')}
    <g transform="translate(430 270)" stroke="#8a1c1c" stroke-width="2.5" fill="none"><circle r="26"/><polygon points="0,-26 15.3,21 -24.7,-8 24.7,-8 -15.3,21"/></g>
    <rect x="505" y="150" width="26" height="120" fill="#efe6d0"/><path d="M518 150 q-10 -22 0 -42 q10 20 0 42" fill="#ffcf6a"/><path d="M518 146 q-5 -12 0 -24 q5 12 0 24" fill="#fff4c2"/>
    <path d="M500 270 h36 v8 h-36z" fill="#3a2414"/>
    <text x="170" y="120" font-family="Georgia,serif" font-style="italic" font-size="34" fill="#e7c36a" opacity=".9">Phaesmatos Incendia</text>
    ${legenda('GRIMÓRIO DO CLÃ BENNETT · INTEGRIDADE 31%')}`),

  // Fase 2: celular com o SMS invertido
  sms: svg(`<rect width="${W}" height="${H}" fill="#0c0f18"/>
    <circle cx="320" cy="200" r="220" fill="#2a4a7a" opacity=".18"/>
    <rect x="230" y="30" width="180" height="340" rx="26" fill="#1a1d24" stroke="#3a3f4a" stroke-width="3"/>
    <rect x="242" y="58" width="156" height="290" rx="8" fill="#0f1a24"/>
    <rect x="296" y="40" width="48" height="8" rx="4" fill="#2a2e38"/>
    <text x="320" y="86" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#8fa6b8">Número oculto</text>
    <rect x="254" y="104" width="132" height="58" rx="10" fill="#26384a"/>
    <text x="264" y="128" font-family="monospace" font-size="13" fill="#e8f1f8">LliRg CitsyM</text>
    <text x="264" y="148" font-family="monospace" font-size="13" fill="#e8f1f8">on Erucorp</text>
    <text x="378" y="176" text-anchor="end" font-family="sans-serif" font-size="9" fill="#5f7486">23:47</text>
    <path d="M150 120 q-30 80 0 160" stroke="#c8344a" stroke-width="3" fill="none" opacity=".7"/><path d="M150 280 l-6 -14 m6 14 l12 -8" stroke="#c8344a" stroke-width="3" fill="none" opacity=".7"/>
    <text x="70" y="210" font-family="Georgia,serif" font-size="15" fill="#c8344a" opacity=".8">↺ ao</text><text x="62" y="230" font-family="Georgia,serif" font-size="15" fill="#c8344a" opacity=".8">contrário?</text>
    ${legenda('SMS INTERCEPTADO · CELULAR DE D. SALVATORE', '#8fb4d8')}`),

  // Fase 3: o diário de couro do Stefan e uma pena
  diario: svg(`<rect width="${W}" height="${H}" fill="#1a110c"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#3a2414" opacity=".35"/>
    <g transform="rotate(-6 320 210)">
      <rect x="160" y="70" width="320" height="260" rx="10" fill="#4a2a18"/>
      <rect x="172" y="80" width="300" height="240" rx="6" fill="#5c3520"/>
      <rect x="176" y="84" width="292" height="232" rx="4" fill="none" stroke="#8a5a2e" stroke-width="2" stroke-dasharray="6 5"/>
      <text x="322" y="190" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="#c9a25a" font-style="italic">S. S.</text>
      <text x="322" y="226" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#c9a25a" letter-spacing="6">1864</text>
      <rect x="452" y="150" width="34" height="60" rx="4" fill="#3a2010"/>
    </g>
    <path d="M500 330 Q560 210 610 120" stroke="#e8e0d0" stroke-width="3" fill="none"/>
    <path d="M610 120 Q585 170 560 200 Q590 175 612 125 Z" fill="#e8e0d0" opacity=".85"/>
    <path d="M110 330 l50 -8 l-6 30 z" fill="#d9c9a4" opacity=".9"/>
    ${legenda('DIÁRIO DE STEFAN SALVATORE')}`),

  // Fase 4: a ponte coberta de madeira sobre o rio, à noite, com a caixa de ferro
  ponte: svg(`${ceuNoite}${estrelas(50, 160)}${lua(120, 80, 32)}
    ${[10, 70, 560, 620].map(x => pinho(x, 250, 170, '#0b151c')).join('')}
    <rect x="0" y="250" width="${W}" height="150" fill="#0b1824"/>
    ${[0, 1, 2, 3, 4].map(i => `<path d="M${40 + i * 120} ${300 + (i % 2) * 30} h70" stroke="#f4ecd2" stroke-width="2" opacity=".18"/>`).join('')}
    <polygon points="120,170 320,110 520,170" fill="#3a2414"/>
    <rect x="130" y="170" width="380" height="80" fill="#4a2e1a"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${140 + i * 37}" y="178" width="4" height="72" fill="#2a1a0e"/>`).join('')}
    <rect x="130" y="244" width="380" height="10" fill="#2a1a0e"/>
    <rect x="140" y="254" width="14" height="70" fill="#2a1a0e"/><rect x="486" y="254" width="14" height="70" fill="#2a1a0e"/>
    <text x="320" y="164" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#c9a25a" letter-spacing="4">WICKERY</text>
    ${neblina(255, .35)}
    <g transform="translate(470 300)"><rect x="-22" y="-16" width="44" height="30" rx="3" fill="#4c5560" stroke="#8a96a3"/><rect x="-6" y="-6" width="12" height="14" rx="2" fill="#c9a25a"/></g>
    ${legenda('PONTE WICKERY')}`),

  // Fase 4 (resposta): a caixa de ferro e o cadeado de 4 números
  caixa: svg(`<rect width="${W}" height="${H}" fill="#0d1216"/>
    <ellipse cx="320" cy="330" rx="230" ry="30" fill="#000" opacity=".5"/>
    <rect x="140" y="150" width="360" height="180" rx="8" fill="#4c5560"/>
    <rect x="140" y="130" width="360" height="40" rx="8" fill="#5c6670"/>
    ${[160, 480].map(x => [150, 310].map(y => `<circle cx="${x}" cy="${y}" r="6" fill="#2c3238"/>`).join('')).join('')}
    <rect x="140" y="200" width="360" height="10" fill="#3a4148"/>
    <text x="320" y="160" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="13" fill="#20262c">o ano em que a cidade trancou seus vampiros...</text>
    <g transform="translate(320 250)">
      <path d="M-30 -20 v-30 a30 30 0 0 1 60 0 v30" stroke="#b08a3e" stroke-width="10" fill="none"/>
      <rect x="-70" y="-22" width="140" height="80" rx="10" fill="#c9a25a"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${-58 + i * 30}" y="0" width="24" height="38" rx="3" fill="#1d1d1d"/><text x="${-46 + i * 30}" y="27" text-anchor="middle" font-family="monospace" font-size="22" fill="#f4ecd2">?</text>`).join('')}
    </g>
    ${legenda('CADEADO DE 4 NÚMEROS')}`),

  // Fase 5: três câmeras de segurança do Baile dos Fundadores
  suspeitos: svg(`<rect width="${W}" height="${H}" fill="#050807"/>
    ${[['LIAM', '#f5c542', 'sol'], ['TRISTAN', '#7fb37a', 'cha'], ['LUCIEN', '#1e3a8a', 'anel']].map(([nome, cor, item], i) => {
      const x = 16 + i * 208;
      const extra = item === 'sol'
        ? `<circle cx="${x + 160}" cy="70" r="24" fill="#ffd34a"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<line x1="${x + 160 + Math.cos(k * .785) * 30}" y1="${70 + Math.sin(k * .785) * 30}" x2="${x + 160 + Math.cos(k * .785) * 40}" y2="${70 + Math.sin(k * .785) * 40}" stroke="#ffd34a" stroke-width="3"/>`).join('')}`
        : item === 'cha'
          ? `<g transform="translate(${x + 150} 250)"><path d="M-18 0 h36 l-4 26 h-28z" fill="#e8e0d0"/><path d="M18 6 q12 0 10 10 q-2 8 -12 6" stroke="#e8e0d0" stroke-width="3" fill="none"/><path d="M-6 -6 q-4 -10 2 -18 M6 -6 q-4 -10 2 -18" stroke="#9fd18f" stroke-width="2" fill="none"/></g><text x="${x + 150}" y="300" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#9fd18f">verbena</text>`
          : `<circle cx="${x + 60}" cy="70" r="16" fill="#e8e0d0" opacity=".7"/><g transform="translate(${x + 148} 250)"><circle r="13" fill="none" stroke="#c0c6cc" stroke-width="5"/><ellipse cx="0" cy="-14" rx="9" ry="7" fill="#2b5bd7"/><ellipse cx="-2" cy="-16" rx="3" ry="2" fill="#a8c4ff"/></g>`;
      const fundo = item === 'anel' ? '#0a1020' : item === 'sol' ? '#3a4a2a' : '#2a1e16';
      return `<rect x="${x}" y="20" width="192" height="320" fill="${fundo}"/>
        <circle cx="${x + 96}" cy="150" r="30" fill="#0a0a0a"/>
        <path d="M${x + 46} 300 q0 -100 50 -110 q50 10 50 110z" fill="#0a0a0a"/>
        ${extra}
        <rect x="${x}" y="20" width="192" height="320" fill="none" stroke="#3a3a3a" stroke-width="4"/>
        <circle cx="${x + 16}" cy="38" r="5" fill="#e33"/><text x="${x + 26}" y="42" font-family="monospace" font-size="11" fill="#ddd">CAM ${i + 1}</text>
        <text x="${x + 96}" y="330" text-anchor="middle" font-family="monospace" font-size="16" fill="#f0f0f0" letter-spacing="3">${nome}</text>`;
    }).join('')}
    ${Array.from({ length: 40 }, (_, k) => `<rect x="0" y="${k * 10}" width="${W}" height="1" fill="#fff" opacity=".04"/>`).join('')}
    <text x="20" y="${H - 18}" font-family="monospace" font-size="13" fill="#e33">● REC  BAILE DOS FUNDADORES · MANSÃO LOCKWOOD</text>`),

  // Fase 6: o porão dos Salvatore com correntes de verbena
  porao: svg(`<rect width="${W}" height="${H}" fill="#0b0a09"/>
    ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<rect x="${c * 74 + (r % 2) * 37 - 20}" y="${r * 52}" width="70" height="48" fill="#1c1916" stroke="#0b0a09" stroke-width="4"/>`).join('')).join('')}
    <rect x="250" y="40" width="140" height="70" fill="#2c3a44"/>${[0, 1, 2, 3].map(i => `<rect x="${262 + i * 34}" y="40" width="6" height="70" fill="#111"/>`).join('')}
    <polygon points="250,110 390,110 470,400 170,400" fill="#9fb4c0" opacity=".08"/>
    <path d="M220 330 q50 -150 100 -150 q50 0 100 150 z" fill="#050505"/><circle cx="320" cy="160" r="30" fill="#050505"/>
    ${[[140, 220], [500, 220]].map(([x, y]) => `<path d="M${x} 60 ${Array.from({ length: 8 }, (_, k) => `L${x + (k % 2 ? 8 : -8)} ${60 + k * 22}`).join(' ')} L${x < 320 ? 270 : 370} ${y}" stroke="#7a8288" stroke-width="5" fill="none"/>`).join('')}
    ${[150, 180, 210, 450, 480, 510].map((x, i) => `<path d="M${x} ${120 + i * 9} q4 8 0 14" stroke="#7fb37a" stroke-width="2" fill="none" opacity=".8"/>`).join('')}
    ${legenda('PORÃO DA PENSÃO SALVATORE · CORRENTES DE VERBENA', '#9fd18f')}`),

  // Fase 7: o túmulo embaixo da igreja, velas e a estaca
  cripta: svg(`<defs><radialGradient id="luz"><stop offset="0" stop-color="#ffb347" stop-opacity=".4"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="#0c0a0a"/>
    <path d="M120 400 V170 A200 200 0 0 1 520 170 V400" fill="#1c1716"/>
    <path d="M170 400 V190 A150 150 0 0 1 470 190 V400" fill="#0a0808"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = Math.PI + i * Math.PI / 6; return `<rect x="${320 + Math.cos(a) * 175 - 14}" y="${190 + Math.sin(a) * 175 - 10}" width="28" height="20" fill="#2a2320" transform="rotate(${i * 30 - 90} ${320 + Math.cos(a) * 175} ${190 + Math.sin(a) * 175})"/>`; }).join('')}
    <circle cx="320" cy="250" r="190" fill="url(#luz)"/>
    <rect x="200" y="290" width="240" height="60" fill="#3a3230"/><rect x="190" y="280" width="260" height="16" fill="#4a403c"/>
    <g transform="translate(320 220) rotate(-35)"><rect x="-6" y="-70" width="12" height="130" rx="3" fill="#efe6d0"/><polygon points="-6,60 6,60 0,82" fill="#efe6d0"/></g>
    <circle cx="320" cy="225" r="60" fill="#fff4c2" opacity=".12"/>
    ${[150, 200, 440, 490].map((x, i) => `<rect x="${x - 5}" y="${300 - (i % 2) * 20}" width="10" height="${50 + (i % 2) * 20}" fill="#efe6d0"/><path d="M${x} ${300 - (i % 2) * 20} q-6 -14 0 -26 q6 12 0 26" fill="#ffcf6a"/>`).join('')}
    <text x="320" y="325" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#8a7a70" letter-spacing="6">MDCCCLXIV</text>
    ${legenda('O TÚMULO EMBAIXO DA IGREJA')}`),

  // Final 1: a praça sob a lua cheia, uma figura no campanário
  final_aliado: svg(`${ceuNoite}${estrelas(70)}${lua(320, 110, 70)}
    <rect x="80" y="170" width="80" height="230" fill="#0b141c"/><polygon points="70,170 120,90 170,170" fill="#0b141c"/>
    <rect x="108" y="190" width="24" height="34" rx="12" fill="#e7c36a" opacity=".8"/>
    <path d="M116 150 q4 -12 8 0 l2 18 h-12z" fill="#050505"/>
    ${[[190, 260, 90], [290, 290, 70], [380, 250, 110], [500, 280, 140]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${400 - y}" fill="#0e1922"/>${[0, 1].map(k => `<rect x="${x + 14 + k * (w / 2)}" y="${y + 20}" width="12" height="16" fill="#e7c36a" opacity="${k ? .7 : .35}"/>`).join('')}`).join('')}
    <rect x="0" y="360" width="${W}" height="40" fill="#071017"/>
    <g transform="translate(330 345)"><ellipse rx="40" ry="8" fill="#777" opacity=".5"/><path d="M-14 0 q0 -40 14 -46 q14 6 14 46z" fill="#8a8f94"/><circle cy="-52" r="9" fill="#8a8f94"/></g>
    ${legenda('FINAL 1 · O ALIADO DA NEBLINA')}`),

  // Final 2: o porão vazio, correntes arrebentadas e o recado na parede
  final_sombra: svg(PAREDE + RECADO + `${legenda('FINAL 2 · A SOMBRA NO PORÃO', '#c8344a')}`),

  // a parede do final 2 sem o recado (o vídeo escreve o recado letra por letra)
  parede: svg(PAREDE),
};
