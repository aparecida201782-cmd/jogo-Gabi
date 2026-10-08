// Operação Mystic Falls: a história e as regras do jogo de chat (fanfic de The Vampire Diaries).
// Usado pelo robô de WhatsApp (whatsapp/bot.mjs) e pela versão no navegador (mystic.html).
//
// Cada mensagem é um objeto:
//   { texto }                                    mensagem normal (aceita *negrito*, _itálico_ e ```código``` do WhatsApp)
//   { arquivo: {nome, mime, conteudo}, texto }   arquivo anexado (o texto vira legenda)
//   { audio }                                    "áudio" (no navegador é falado; no WhatsApp vai transcrito)
// e pode ter `espera` (milissegundos "digitando..." antes de chegar).
//
// O estado da jogadora é { fase, erros, final }:
//   fase 0 = não começou, 1 a 7 = fases, 8 = terminou (final = 'aliado' ou 'sombra').

export const CONTATO = 'Número desconhecido';
export const TOTAL_FASES = 7;

export const GRIMORIO = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ARQUIVO DE PROTEÇÃO DO CLÃ BENNETT :: INTEGRIDADE 31% -->
<GrimoireData>
  <Spell id="091">
    <Incantamentum>Ascendo Superous</Incantamentum>
    <Component>Vela_Branca</Component>
    <Status>Corrompido</Status>
  </Spell>
  <Spell id="093">
    <Incantamentum>Phaesmatos Incendia</Incantamentum>
    <Component>Sal</Component>
    <ArmaSecreta>Estaca_de_Carvalho_Branco</ArmaSecreta>
    <Status>Corrompido</Status>
  </Spell>
  <Spell id="097">
    <Incantamentum>Motus</Incantamentum>
    <Component>%%#ERRO#%%</Component>
    <Status>Ilegivel</Status>
  </Spell>
</GrimoireData>
`;

const D = 3000; // tempo "digitando..." padrão (3 segundos)

// tira acentos, pontuação, sublinhados e maiúsculas: "Estaca_de_Carvalho!" -> "estaca de carvalho"
export function normalizar(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const tem = (t, ...palavras) => palavras.some(p => t.includes(p));
const m = (texto, espera = D) => ({ texto, espera });

export function estadoInicial() {
  return { fase: 0, erros: 0 };
}

// ---------- Fase 1: O Grimório Digitalizado ----------
const FASE1 = [
  m('...', 1500),
  m('Oi. Não desliga, por favor. Eu não tenho muito tempo.'),
  m('Acordei agora no chão da floresta, perto da estrada velha. Alguém usou *compulsão* em mim. Não lembro do meu nome inteiro. Só sei que sou uma bruxa... e que hoje é noite de *lua cheia* em Mystic Falls.'),
  m('Antes de esquecer tudo, eu salvei um arquivo de proteção do meu clã no celular. Mas o feitiço de segurança corrompeu quase tudo.'),
  { arquivo: { nome: 'grimorio_093.xml', mime: 'text/xml', conteudo: GRIMORIO }, texto: '📜 Grimório digitalizado', espera: 2000 },
  m('🔎 *Fase 1 de 7: O Grimório Digitalizado*\nAbre o arquivo e procura no meio do código. Tem uma *arma* escondida ali. Qual é?\n\n_Responda aqui com o nome dela. Se travar, mande_ *dica*.'),
];

// ---------- Fase 2: O SMS dos Salvatore ----------
const FASE2 = [
  m('✨ *Estaca de carvalho branco.* A única arma capaz de matar um *Original*. Se meu clã escondeu isso... alguém muito antigo está vindo.'),
  m('Meu celular vibrou. Interceptei uma mensagem de um número oculto, mandada para o celular do Damon Salvatore.'),
  m('📱 *SMS interceptado:*\n\n```LliRg CitsyM on Erucorp```'),
  m('🔎 *Fase 2 de 7: O SMS dos Salvatore*\nVampiros mais velhos costumam olhar o mundo de trás para frente. Consegue decifrar *onde* eles vão se encontrar?'),
];

// ---------- Fase 3: O Diário de Stefan ----------
const DIARIO = `📖 _Diário de Stefan Salvatore — 10 de setembro_

Perdi a conta de quantas noites passei acordado.
O nevoeiro voltou a cobrir a estrada perto do rio.
Ninguém na cidade lembra do que aconteceu ali em maio.
Talvez seja melhor assim. Algumas memórias doem demais.
Esta noite eu volto lá. Se eu não voltar, procurem onde a água passa por baixo da madeira.`;

const FASE3 = [
  m('🍔 *"Procure no Mystic Grill."* Fui até lá correndo.'),
  m('O Damon não estava. Mas o Matt, que trabalha no bar, me entregou uma página arrancada de um diário. Disse que alguém deixou no balcão com o *meu nome*.'),
  { texto: DIARIO, espera: 4000 },
  m('O Stefan escreve tudo em diários desde 1864. E ele me ensinou uma coisa uma vez: _"o mais importante está sempre no começo"_.'),
  m('🔎 *Fase 3 de 7: O Diário de Stefan*\nTem uma palavra escondida nessa página. Que *lugar* ela revela?'),
];

// ---------- Fase 4: A Caixa de Ferro ----------
const FASE4 = [
  m('🌉 *P-O-N-T-E.* A Ponte Wickery! Onde a água passa por baixo da madeira...'),
  m('Estou aqui embaixo da ponte agora. Está muito frio. Achei uma caixa de ferro presa nas pedras, com um cadeado de *4 números*.'),
  m('Tem uma frase riscada na tampa, com letra antiga:\n\n_"O ano em que a cidade trancou seus vampiros embaixo da igreja. Elena Gilbert chegou a Mystic Falls em 2009, cento e quarenta e cinco anos depois."_'),
  m('🔎 *Fase 4 de 7: A Caixa de Ferro*\nQual é o código do cadeado?'),
];

// ---------- Fase 5: O Interrogatório ----------
const FASE5 = [
  m('🔓 *1864.* O ano em que fecharam o túmulo com 27 vampiros dentro... Abriu!'),
  m('Dentro da caixa tinha um bilhete com a *minha letra*:\n\n_"Se você está lendo isto, é porque funcionou. Ele estará no Baile dos Fundadores. Ele usa um anel. Não confie no que você lembra."_'),
  m('Eu escrevi isso para mim mesma?? Invadi as câmeras do Baile dos Fundadores, na mansão Lockwood. Isolei três suspeitos.'),
  m('🎥 *Suspeito 1: Liam*\nPassou a tarde inteira conversando nos jardins da mansão, sob o sol forte. Usava só uma camiseta, um relógio de plástico e uma pulseira de couro comum.'),
  m('🎥 *Suspeito 2: Tristan*\nEstava sentado no bar. O garçom derramou sem querer *extrato puro de verbena* na xícara de chá dele. Ele bebeu tudo sem fazer careta.'),
  m('🎥 *Suspeito 3: Lucien*\nChegou à noite, depois do pôr do sol. Recusou tudo do buffet. Está sempre com as mãos nos bolsos, mas a câmera ampliou um detalhe: um anel de prata grosso com uma grande pedra azul de *lápis-lazúli*.'),
  m('🔎 *Fase 5 de 7: O Interrogatório*\nUse o que você sabe sobre vampiros. Quem é o vampiro? Mande só o nome.'),
];

// ---------- Fase 6: A Revelação ----------
const FASE6 = [
  m('🩸 *LUCIEN.* O lápis-lazúli protege do sol, e ele recusou a comida. O Liam ficou no sol sem anel e o Tristan bebeu verbena como se fosse chá: os dois são humanos.'),
  m('Avisei o Damon. Ele pegou o Lucien no meio da valsa e prendeu no porão da pensão dos Salvatore, com correntes molhadas de verbena.'),
  m('Desci para ver ele. Ele pediu para falar com você. Vou gravar.'),
  { audio: 'Escuta, caçadora. Eu não sou o seu inimigo. Fui eu que apaguei a memória da bruxa, sim. Mas foi ela que me pediu. Ela escondeu a estaca de carvalho branco num lugar que ninguém pode encontrar... nem ela mesma. Porque esta noite, quem chega a Mystic Falls é um Original. E ele lê pensamentos.', espera: 5000 },
  m('Eu... estou começando a lembrar. Ele disse mais uma coisa antes de desmaiar: _"A estaca está onde vinte e sete dormiram por cento e quarenta e cinco anos."_'),
  m('🔎 *Fase 6 de 7: A Revelação*\nOnde eu escondi a estaca?'),
];

// ---------- Fase 7: A Escolha ----------
const FASE7 = [
  m('⚰️ *O túmulo embaixo da igreja!* Onde os 27 vampiros ficaram presos desde 1864.'),
  m('Estou aqui. Tem velas que acenderam sozinhas quando eu entrei. Atrás de uma pedra solta... achei. A *estaca de carvalho branco*. Está quente na minha mão.'),
  m('E agora eu lembro de TUDO. Meu nome é *Bonnie Bennett*. O Original que está vindo se chama *Silas*, e ele quer a estaca para destruir os outros. O Lucien jurou proteger meu segredo em troca da própria liberdade.'),
  m('O Damon mandou mensagem: _"O vampiro do porão está acordando. Mato ou solto?"_\n\nSe a gente soltar o Lucien, ele pode lutar do nosso lado... ou trair a gente. Se ficar preso, a cidade fica mais segura hoje, mas a gente enfrenta o Silas sozinhas.'),
  m('🔎 *Fase 7 de 7: A Escolha*\nVocê decide, caçadora. *Soltar* o Lucien ou deixar *preso*?'),
];

const FINAL_ALIADO = [
  m('🔓 Mandei o Damon *soltar* o Lucien.', 2000),
  m('À meia-noite, o Silas apareceu na praça. Ele entrou na minha cabeça e procurou a estaca... mas ela não estava lá. O Lucien estava com ela, escondido no campanário.'),
  m('Quando o Silas virou as costas, o Lucien pulou. Um golpe só. O Original virou pedra no meio da praça, debaixo da lua cheia. 🌕'),
  m('O Lucien me devolveu a estaca, fez uma reverência e sumiu na neblina. Acho que ganhamos um amigo.'),
  m('🌕 *Mystic Falls está a salvo. Obrigada, caçadora.*\n\n— Bonnie Bennett'),
  m('🏆 *FINAL 1 de 2: O Aliado da Neblina*\nVocê confiou em quem ninguém confiaria, e salvou a cidade.\n\nMande *reiniciar* para descobrir o outro final.', 1500),
];

const FINAL_SOMBRA = [
  m('🔒 Mandei o Damon deixar o Lucien *preso*.', 2000),
  m('À meia-noite, o Silas apareceu na praça. Eu fiquei com a estaca e com a cabeça cheia de feitiços para ele não ler meus pensamentos. Phaesmatos... Phaesmatos...'),
  m('Eu e o Damon conseguimos encurralar ele na Ponte Wickery. Cravei a estaca. O Original virou pedra e caiu no rio. 🌊'),
  m('Mas quando voltamos para a pensão... o porão estava vazio. As correntes estavam arrebentadas. E na parede, escrito com sangue: _"Você devia ter confiado em mim."_'),
  m('🌑 *A cidade está a salvo... por enquanto.*\n\n— Bonnie Bennett'),
  m('🏆 *FINAL 2 de 2: A Sombra no Porão*\nVocê salvou Mystic Falls, mas ganhou um inimigo.\n\nMande *reiniciar* para descobrir o outro final.', 1500),
];

const FASES = { 1: FASE1, 2: FASE2, 3: FASE3, 4: FASE4, 5: FASE5, 6: FASE6, 7: FASE7 };
// o que é reenviado quando a jogadora pede "repetir"
const PISTAS = { 1: FASE1.slice(-2), 2: FASE2.slice(-2), 3: FASE3.slice(-3), 4: FASE4.slice(-2), 5: FASE5.slice(-4), 6: FASE6.slice(-3), 7: FASE7.slice(-2) };

const DICAS = {
  1: ['Não é o feitiço nem o ingrediente. Procure uma etiqueta com a palavra *Arma*.',
      'Olha o feitiço de id *093*, na linha <ArmaSecreta>. Os sublinhados ( _ ) são espaços.'],
  2: ['Leia a frase inteira começando pela última letra: o "p" de "Erucorp" é a primeira letra da resposta.',
      'Ao contrário fica "Procure no Mystic ____". Qual é o lugar?'],
  3: ['"O mais importante está sempre no começo"... no começo de cada *linha*.',
      'Junte a primeira letra de cada uma das 5 linhas do diário: P, O, N...'],
  4: ['É uma conta de menos: 2009 − 145.',
      'O resultado começa com 18...'],
  5: ['Vampiro no sol só sobrevive com um anel de lápis-lazúli. E verbena queima vampiros.',
      'Quem chegou só à noite, não comeu nada e esconde um anel azul?'],
  6: ['"Vinte e sete dormiram por 145 anos": é o mesmo lugar da frase da caixa de ferro.',
      'Os 27 vampiros ficaram trancados num túmulo embaixo de uma construção da cidade. Qual?'],
  7: ['Não tem resposta errada aqui. Escreva *soltar* ou *preso*.',
      'Escreva *soltar* ou *preso*.'],
};

const AJUDA = [m('Comandos: *dica* (uma ajudinha), *repetir* (ver a pista de novo), *reiniciar* (começar do zero).', 800)];

function dica(e) {
  const lista = DICAS[e.fase];
  return m('💡 ' + lista[Math.min(Math.max(e.erros - 1, 0), lista.length - 1)], 1500);
}

function avancar(fase) {
  return { estado: { fase, erros: 0 }, msgs: FASES[fase] };
}

// Recebe o estado e o que a jogadora escreveu; devolve o novo estado e as mensagens de resposta.
export function responder(estado, mensagem) {
  const t = normalizar(mensagem);
  const e = { ...estadoInicial(), ...estado };

  if (tem(t, 'reiniciar', 'recomecar') || e.fase === 0) return avancar(1);
  if (e.fase === 8) return { estado: e, msgs: [m('Você já terminou a Operação Mystic Falls' + (e.final === 'aliado' ? ' com o *Final 1: O Aliado da Neblina*. 🌕' : ' com o *Final 2: A Sombra no Porão*. 🌑') + '\nMande *reiniciar* para jogar de novo e tentar o outro final.', 1200)] };
  if (t === 'ajuda' || t === 'menu') return { estado: e, msgs: AJUDA };
  if (t === 'repetir') return { estado: e, msgs: PISTAS[e.fase] };
  if (t === 'dica') {
    const novo = { ...e, erros: e.erros + 1 };
    return { estado: novo, msgs: [dica(novo)] };
  }

  const errou = (texto) => {
    const novo = { ...e, erros: e.erros + 1 };
    const msgs = [m(texto, 2000)];
    if (novo.erros >= 2) msgs.push(dica(novo));
    return { estado: novo, msgs };
  };
  const errouAudio = (fala) => ({ estado: { ...e, erros: e.erros + 1 }, msgs: [m('🚨 Errado! Escuta isso:', 1000), { audio: fala, espera: 2500 }] });

  switch (e.fase) {
    case 1:
      if (tem(t, 'carvalho branco')) return avancar(2);
      if (tem(t, 'carvalho')) return errou('Quase! Carvalho... mas de qual cor? A cor importa.');
      if (/\bsal\b/.test(t)) return errou('Sal é só o *componente* do feitiço. Eu preciso da *arma*.');
      if (tem(t, 'phaesmatos', 'incendia')) return errou('Isso é o *feitiço*, não a arma. Continua procurando no código.');
      if (tem(t, 'estaca')) return errou('Uma estaca, sim! Mas não é qualquer uma. Leia o nome inteiro.');
      return errou('Não... o selo continua fechado. 🔒 Olha o arquivo de novo.');

    case 2:
      if (tem(t, 'grill')) return avancar(3);
      if (tem(t, 'mystic')) return errou('Mystic... o quê? Mystic Falls é a cidade toda. Eu preciso do *lugar*.');
      return errou('Não faz sentido ainda. 🔁 Tenta ler de trás para frente.');

    case 3:
      if (tem(t, 'ponte', 'wickery')) return avancar(4);
      if (tem(t, 'rio', 'estrada')) return errou('Perto, mas não é isso. A palavra está escondida, não escrita. 👀');
      return errou('Não... reli a página três vezes e não é isso.');

    case 4:
      if (/\b1864\b/.test(t)) return avancar(5);
      if (/\b\d{4}\b/.test(t)) return errou('🔒 *Clac.* O cadeado não abriu. Confere a conta.');
      return errou('O cadeado só aceita *4 números*.');

    case 5: {
      const nomes = ['liam', 'tristan', 'lucien'].filter(n => t.includes(n));
      if (nomes.length > 1) return { estado: e, msgs: [m('Calma! Escolha só *um* suspeito.', 1200)] };
      if (nomes[0] === 'lucien') return avancar(6);
      if (nomes[0] === 'liam') return errouAudio('Não! O Liam passou a tarde inteira no sol forte, e não usava anel nenhum. Um vampiro sem anel de lápis-lazúli teria virado cinza. Pense de novo!');
      if (nomes[0] === 'tristan') return errouAudio('Não! O Tristan bebeu verbena pura e nem fez careta. Verbena queima vampiros por dentro. Ele é humano. Pense de novo!');
      return { estado: e, msgs: [m('Me diga o nome: *Liam*, *Tristan* ou *Lucien*?', 1200)] };
    }

    case 6:
      if (tem(t, 'tumulo', 'cripta', 'igreja', 'tumba')) return avancar(7);
      if (tem(t, 'ponte', 'grill', 'porao', 'mansao')) return errou('Não, eu já estive aí essa noite. É um lugar *mais antigo*.');
      return errou('Não... pensa nos 27 vampiros de 1864.');

    case 7:
      if (tem(t, 'soltar', 'solta', 'libert', 'confi', 'perdo')) return { estado: { fase: 8, erros: 0, final: 'aliado' }, msgs: FINAL_ALIADO };
      if (tem(t, 'preso', 'prender', 'mata')) return { estado: { fase: 8, erros: 0, final: 'sombra' }, msgs: FINAL_SOMBRA };
      return { estado: e, msgs: [m('O Damon está esperando! *Soltar* ou *preso*?', 1200)] };
  }
  return { estado: e, msgs: AJUDA };
}
