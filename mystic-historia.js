// Operação Mystic Falls: a história e as regras do jogo de chat (fanfic de The Vampire Diaries).
// Usado pelo robô de WhatsApp (whatsapp/bot.mjs) e pela versão no navegador (mystic.html).
//
// Cada mensagem é um objeto:
//   { texto }                                    mensagem normal (aceita *negrito*, _itálico_ e ```código``` do WhatsApp)
//   { arquivo: {nome, mime, conteudo}, texto }   arquivo anexado (o texto vira legenda)
//   { audio }                                    "áudio" (no navegador é falado; no WhatsApp vai transcrito)
//   { imagem: 'nome', texto }                    ilustração de mystic-imagens.js (o texto vira legenda)
//   { video: 'nome', texto }                     vídeo de videos/nome.mp4 (o texto vira legenda)
//   { fantasma: true }                           só aparece "digitando..." e para, sem mandar nada
//   { capitulo, titulo, texto }                  cartela de capítulo (no navegador vira um letreiro no meio da conversa)
// e pode ter:
//   espera   milissegundos "digitando..." antes de chegar
//   apagar   milissegundos até a mensagem ser apagada ("🚫 Esta mensagem foi apagada")
//   efeito   'glitch', 'tremor' ou 'sangue' (só no navegador: a tela pisca, treme ou fica vermelha)
//   opcoes   botões de resposta rápida (no WhatsApp vira uma lista no fim da mensagem)
//   repetir  true se a mensagem volta quando a jogadora pede "repetir"
//
// O estado da jogadora é { fase, erros, final, cap2 }:
//   fase 0 = não começou, 1 a 7 = Capítulo 1, 8 a 12 = Capítulo 2, 13 = terminou.
//   final = a escolha da fase 7 ('aliado' ou 'sombra'); ela muda o Capítulo 2.
//   cap2 = true quando o Capítulo 2 já começou (depois do final do Capítulo 1 a fase fica 8 sem cap2).

export const CONTATO = 'Número desconhecido';
export const TOTAL_FASES = 12;
export const FIM = TOTAL_FASES + 1;

// o caderno de pistas (no navegador, botão 📓): o nome de cada fase e a resposta, que só aparece depois de resolvida
export const CADERNO = [
  ['O Grimório Digitalizado', 'Estaca de carvalho branco'],
  ['O SMS dos Salvatore', 'Mystic Grill'],
  ['O Diário de Stefan', 'Ponte Wickery'],
  ['A Caixa de Ferro', '1864'],
  ['O Interrogatório', 'Lucien'],
  ['A Revelação', 'O túmulo embaixo da igreja'],
  ['A Escolha', e => e.final === 'aliado' ? 'Soltar o Lucien' : 'Deixar o Lucien preso'],
  ['O Mapa dos Túneis', 'Poço'],
  ['A Cifra das Três Luas', 'Cemitério'],
  ['As Lápides', 'Fell'],
  ['O Espelho da Cripta', 'Verbena'],
  ['O Feitiço do Eclipse', 'Quietus Aeternum'],
];

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
const m = (texto, espera = D, extra) => ({ texto, espera, ...extra });
const img = (imagem, texto, extra) => ({ imagem, texto, espera: 2000, ...extra });
const vid = (video, texto, extra) => ({ video, texto, espera: 2500, ...extra });
const R = { repetir: true };

export function estadoInicial() {
  return { fase: 0, erros: 0 };
}

// ---------- Fase 1: O Grimório Digitalizado ----------
const FASE1 = [
  { capitulo: 'CAPÍTULO 1', titulo: 'A Bruxa Sem Memória', texto: '🌕 *CAPÍTULO 1*\n_A Bruxa Sem Memória_', espera: 600 },
  m('...', 1500),
  vid('abertura', 'Onde eu acordei.'),
  m('Oi. Não desliga, por favor. Eu não tenho muito tempo.'),
  { fantasma: true, espera: 2500 },
  m('Ele está aqui perto. Eu sinto.', 1500, { apagar: 3500 }),
  m('Acordei agora no chão da floresta, perto da estrada velha. Alguém usou *compulsão* em mim. Não lembro do meu nome inteiro. Só sei que sou uma bruxa... e que hoje é noite de *lua cheia* em Mystic Falls.'),
  m('Antes de esquecer tudo, eu salvei um arquivo de proteção do meu clã no celular. Mas o feitiço de segurança corrompeu quase tudo.'),
  img('grimorio', 'Foi a última coisa que eu vi antes de esquecer.'),
  { arquivo: { nome: 'grimorio_093.xml', mime: 'text/xml', conteudo: GRIMORIO }, texto: '📜 Grimório digitalizado', espera: 2000, repetir: true },
  m('🔎 *Fase 1 de 12: O Grimório Digitalizado*\nAbre o arquivo e procura no meio do código. Tem uma *arma* escondida ali. Qual é?\n\n_Responda aqui com o nome dela. Se travar, mande_ *dica*.', D, R),
];

// ---------- Fase 2: O SMS dos Salvatore ----------
const FASE2 = [
  m('✨ *Estaca de carvalho branco.* A única arma capaz de matar um *Original*. Se meu clã escondeu isso... alguém muito antigo está vindo.'),
  m('Meu celular vibrou. Interceptei uma mensagem de um número oculto, mandada para o celular do Damon Salvatore.'),
  img('sms', '', { efeito: 'glitch' }),
  m('📱 *SMS interceptado:*\n\n```LliRg CitsyM on Erucorp```', D, R),
  m('🔎 *Fase 2 de 12: O SMS dos Salvatore*\nVampiros mais velhos costumam olhar o mundo de trás para frente. Consegue decifrar *onde* eles vão se encontrar?', D, R),
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
  img('diario', 'O diário estava aberto nesta página.'),
  { texto: DIARIO, espera: 4000, repetir: true },
  m('O Stefan escreve tudo em diários desde 1864. E ele me ensinou uma coisa uma vez: _"o mais importante está sempre no começo"_.', D, R),
  m('A luz do Grill acabou de piscar. Tem alguém me olhando da janela.', 2000, { efeito: 'glitch', apagar: 4000 }),
  m('🔎 *Fase 3 de 12: O Diário de Stefan*\nTem uma palavra escondida nessa página. Que *lugar* ela revela?', D, R),
];

// ---------- Fase 4: A Caixa de Ferro ----------
const FASE4 = [
  m('🌉 *P-O-N-T-E.* A Ponte Wickery! Onde a água passa por baixo da madeira...'),
  vid('ponte', 'Gravei pra você. A neblina está subindo do rio.'),
  m('Estou aqui embaixo da ponte agora. Está muito frio. Achei uma caixa de ferro presa nas pedras, com um cadeado de *4 números*.'),
  img('caixa', '', R),
  m('Tem uma frase riscada na tampa, com letra antiga:\n\n_"O ano em que a cidade trancou seus vampiros embaixo da igreja. Elena Gilbert chegou a Mystic Falls em 2009, cento e quarenta e cinco anos depois."_', D, R),
  m('🔎 *Fase 4 de 12: A Caixa de Ferro*\nQual é o código do cadeado?', D, R),
];

// ---------- Fase 5: O Interrogatório ----------
const FASE5 = [
  m('🔓 *1864.* O ano em que fecharam o túmulo com 27 vampiros dentro... Abriu!'),
  m('Dentro da caixa tinha um bilhete com a *minha letra*:\n\n_"Se você está lendo isto, é porque funcionou. Ele estará no Baile dos Fundadores. Ele usa um anel. Não confie no que você lembra."_'),
  m('Eu escrevi isso para mim mesma??', 1500, { efeito: 'glitch' }),
  { fantasma: true, espera: 2500 },
  m('Invadi as câmeras do Baile dos Fundadores, na mansão Lockwood. Isolei três suspeitos.'),
  vid('cameras', 'As gravações. Olha bem cada um.'),
  img('suspeitos', 'Toque na imagem para ampliar.', R),
  m('🎥 *Suspeito 1: Liam*\nPassou a tarde inteira conversando nos jardins da mansão, sob o sol forte. Usava só uma camiseta, um relógio de plástico e uma pulseira de couro comum.', D, R),
  m('🎥 *Suspeito 2: Tristan*\nEstava sentado no bar. O garçom derramou sem querer *extrato puro de verbena* na xícara de chá dele. Ele bebeu tudo sem fazer careta.', D, R),
  m('🎥 *Suspeito 3: Lucien*\nChegou à noite, depois do pôr do sol. Recusou tudo do buffet. Está sempre com as mãos nos bolsos, mas a câmera ampliou um detalhe: um anel de prata grosso com uma grande pedra azul de *lápis-lazúli*.', D, R),
  m('🔎 *Fase 5 de 12: O Interrogatório*\nUse o que você sabe sobre vampiros. Quem é o vampiro? Mande só o nome.', D, { repetir: true, opcoes: ['Liam', 'Tristan', 'Lucien'] }),
];

// ---------- Fase 6: A Revelação ----------
const FASE6 = [
  m('🩸 *LUCIEN.* O lápis-lazúli protege do sol, e ele recusou a comida. O Liam ficou no sol sem anel e o Tristan bebeu verbena como se fosse chá: os dois são humanos.'),
  m('Avisei o Damon. Ele pegou o Lucien no meio da valsa e prendeu no porão da pensão dos Salvatore, com correntes molhadas de verbena.'),
  vid('porao', 'Ele está acordado. 😨', { efeito: 'tremor' }),
  m('Desci para ver ele. Ele pediu para falar com você. Vou gravar.'),
  { efeito: 'tremor', audio: 'Escuta, caçadora. Eu não sou o seu inimigo. Fui eu que apaguei a memória da bruxa, sim. Mas foi ela que me pediu. Ela escondeu a estaca de carvalho branco num lugar que ninguém pode encontrar... nem ela mesma. Porque esta noite, quem chega a Mystic Falls é um Original. E ele lê pensamentos.', espera: 5000, repetir: true },
  m('Ele está mentindo. Ele tem que estar mentindo.', 1500, { apagar: 3000 }),
  m('Eu... estou começando a lembrar. Ele disse mais uma coisa antes de desmaiar: _"A estaca está onde vinte e sete dormiram por cento e quarenta e cinco anos."_', D, R),
  m('🔎 *Fase 6 de 12: A Revelação*\nOnde eu escondi a estaca?', D, R),
];

// ---------- Fase 7: A Escolha ----------
const FASE7 = [
  m('⚰️ *O túmulo embaixo da igreja!* Onde os 27 vampiros ficaram presos desde 1864.'),
  vid('cripta', 'As velas acenderam sozinhas.'),
  m('Estou aqui. Tem velas que acenderam sozinhas quando eu entrei. Atrás de uma pedra solta... achei. A *estaca de carvalho branco*. Está quente na minha mão.'),
  m('E agora eu lembro de TUDO. Meu nome é *Bonnie Bennett*. O Original que está vindo se chama *Silas*, e ele quer a estaca para destruir os outros. O Lucien jurou proteger meu segredo em troca da própria liberdade.', 4000, { efeito: 'glitch' }),
  m('O Damon mandou mensagem: _"O vampiro do porão está acordando. Mato ou solto?"_\n\nSe a gente soltar o Lucien, ele pode lutar do nosso lado... ou trair a gente. Se ficar preso, a cidade fica mais segura hoje, mas a gente enfrenta o Silas sozinhas.', D, R),
  m('🔎 *Fase 7 de 12: A Escolha*\nVocê decide, caçadora. *Soltar* o Lucien ou deixar *preso*?', D, { repetir: true, opcoes: ['Soltar', 'Preso'] }),
];

const FINAL_ALIADO = [
  m('🔓 Mandei o Damon *soltar* o Lucien.', 2000),
  m('À meia-noite, o Silas apareceu na praça. Ele entrou na minha cabeça e procurou a estaca... mas ela não estava lá. O Lucien estava com ela, escondido no campanário.'),
  m('Quando o Silas virou as costas, o Lucien pulou. Um golpe só. O Original virou pedra no meio da praça, debaixo da lua cheia. 🌕'),
  vid('final_aliado', ''),
  m('O Lucien me devolveu a estaca, fez uma reverência e sumiu na neblina. Acho que ganhamos um amigo.'),
  m('🌕 *Mystic Falls está a salvo. Obrigada, caçadora.*\n\n— Bonnie Bennett'),
  m('🏆 *FIM DO CAPÍTULO 1: O Aliado da Neblina*\nVocê confiou em quem ninguém confiaria, e salvou a cidade.\n\n_...mas pedra não dura para sempre._', 1500),
  { fantasma: true, espera: 2500 },
  m('Caçadora... você ainda está aí? Aconteceu uma coisa. 🌑', 2500, { efeito: 'glitch', opcoes: ['Capítulo 2 ▶'] }),
];

const FINAL_SOMBRA = [
  m('🔒 Mandei o Damon deixar o Lucien *preso*.', 2000),
  m('À meia-noite, o Silas apareceu na praça. Eu fiquei com a estaca e com a cabeça cheia de feitiços para ele não ler meus pensamentos. Phaesmatos... Phaesmatos...'),
  m('Eu e o Damon conseguimos encurralar ele na Ponte Wickery. Cravei a estaca. O Original virou pedra e caiu no rio. 🌊'),
  m('Mas quando voltamos para a pensão... o porão estava vazio. As correntes estavam arrebentadas. E na parede, escrito com sangue...', D, { efeito: 'sangue' }),
  vid('final_sombra', ''),
  m('🌑 *A cidade está a salvo... por enquanto.*\n\n— Bonnie Bennett'),
  m('🏆 *FIM DO CAPÍTULO 1: A Sombra no Porão*\nVocê salvou Mystic Falls, mas ganhou um inimigo.\n\n_...e inimigos voltam._', 1500),
  { fantasma: true, espera: 2500 },
  m('Caçadora... você ainda está aí? Aconteceu uma coisa. 🌑', 2500, { efeito: 'glitch', opcoes: ['Capítulo 2 ▶'] }),
];

// ================= CAPÍTULO 2: O Eclipse de Sangue =================
// As fases são funções porque a história muda conforme a escolha da fase 7 (e.final).
const aliado = e => e.final === 'aliado';

// ---------- Fase 8: O Mapa dos Túneis ----------
const FASE8 = e => [
  { capitulo: 'CAPÍTULO 2', titulo: 'O Eclipse de Sangue', texto: '🩸 *CAPÍTULO 2*\n_O Eclipse de Sangue_', espera: 800 },
  m('Sou eu, a Bonnie. Desta vez eu lembro de tudo. 😅', 2000),
  m('Faz uma semana que o Silas virou pedra. E hoje à noite tem *eclipse de sangue*: a lua cheia vai ficar vermelha. Minha avó dizia que, no eclipse, feitiço velho fica fraco.'),
  vid('eclipse', 'A lua começou a ficar vermelha. 🌕➡️🔴'),
  aliado(e)
    ? m('A estátua de pedra do Silas *sumiu da praça*. O Lucien jura que não foi ele. Ele está procurando pela cidade, mas não acha nem rastro.')
    : m('O Damon mergulhou no rio para conferir... a estátua de pedra do Silas *sumiu do fundo do rio*. E o Lucien continua solto por aí. 😰'),
  m('No lugar dela deixaram um mapa velho dos túneis que passam embaixo de Mystic Falls, com um recado escrito à mão: _"Siga as coordenadas, bruxinha."_', D, { efeito: 'glitch' }),
  img('mapa', 'Toque para ampliar. A letra é a coluna, o número é a linha.', R),
  m('📜 No verso do mapa, riscado com carvão:\n\n```C4 · A2 · E5 · B1```', D, R),
  m('🔎 *Fase 8 de 12: O Mapa dos Túneis*\nAche as letras das coordenadas no mapa e junte. Para *onde* levaram a estátua?', D, R),
];

// ---------- Fase 9: A Cifra das Três Luas ----------
const FASE9 = () => [
  m('🪣 *O POÇO!* O poço velho da fazenda dos Lockwood. Foi lá que uma vez prenderam o Stefan, com água de verbena.'),
  m('Cheguei. A estátua não está aqui... mas tem marcas no chão, como se alguém tivesse arrastado uma coisa muito pesada até a beira do poço.'),
  { fantasma: true, espera: 2000 },
  m('Tem alguém respirando lá embaixo.', 1500, { apagar: 3000, efeito: 'tremor' }),
  img('poco', 'Gravaram letras na pedra do poço.', R),
  m('🪨 Gravado na pedra:\n\n```FHPLWHULR```', D, R),
  m('Embaixo tem o símbolo do meu clã: *três luas*. Minha avó Sheila me ensinou: _"Para ler o que os Bennett escondem, ande três passos para trás no alfabeto."_', D, R),
  m('🔎 *Fase 9 de 12: A Cifra das Três Luas*\nVolte cada letra *3 casas* no alfabeto (F vira C...). Que lugar está escrito?', D, R),
];

// ---------- Fase 10: As Lápides ----------
const FASE10 = () => [
  m('⚰️ *CEMITÉRIO!* O cemitério velho de Mystic Falls. Claro. Onde mais?'),
  vid('cemiterio', 'Os corvos não param de gritar.'),
  m('Estou no portão. A lua já está quase toda vermelha. Tem cinco lápides antigas, uma do lado da outra, bem no meio do nevoeiro.'),
  img('lapides', 'Toque para ampliar e olhar cada lápide.', R),
  m('Preso no portão, outro bilhete com a mesma letra do mapa:\n\n_"Ele dorme ao lado de um Salvatore. A pedra dele não tem anjo. E ele não é um Salvatore."_', D, R),
  m('🔎 *Fase 10 de 12: As Lápides*\nOlhe as cinco lápides e as três regras. Qual é a lápide certa? Mande o *nome da família*.', D, R),
];

// ---------- Fase 11: O Espelho da Cripta ----------
const FASE11 = e => [
  m('🪦 *FELL!* Empurrei a lápide dos Fell e ela se arrastou sozinha... tinha uma escada descendo para uma cripta.', D, { efeito: 'tremor' }),
  img('estatua', 'Achei. 😨'),
  m('A estátua do Silas está aqui embaixo. *Rachando.* Sai uma luz vermelha de dentro das rachaduras, igual à cor da lua lá fora.'),
  ...(aliado(e)
    ? [m('Tinha uma mulher de capuz fazendo um feitiço em volta da estátua. Uma *Viajante*. Quando ela me viu, gritou, e as velas apagaram.', D, { efeito: 'glitch' }),
       m('Mas o Lucien chegou correndo pela escada e segurou ela. _"Vai, bruxa! Eu cuido dela!"_ Ainda bem que você mandou soltar ele. 🙏')]
    : [m('E encostado na parede, de braços cruzados, estava ele. *O Lucien.*', D, { efeito: 'sangue' }),
       { audio: 'Olá de novo, caçadora. Vocês me deixaram acorrentado no escuro. Então eu vou acordar o Silas... e vou deixar ele cuidar de vocês por mim.', espera: 4000, efeito: 'tremor', repetir: true },
       m('Foi ele. E foi por nossa causa. 😔', 1800, { apagar: 3500 })]),
  m('Na parede tem um espelho velho, todo manchado. E no espelho... uma frase escrita *ao contrário*.', D, R),
  img('espelho', 'Leia como se estivesse no espelho.', R),
  m('🔎 *Fase 11 de 12: O Espelho da Cripta*\nLeia a frase. O que eu tenho que jogar na estátua para ela parar de rachar?', D, R),
];

// ---------- Fase 12: O Feitiço do Eclipse ----------
export const GRIMORIO_COMPLETO = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ARQUIVO DE PROTEÇÃO DO CLÃ BENNETT :: INTEGRIDADE 100% -->
<GrimoireData>
  <Spell id="091">
    <Incantamentum>Ascendo Superous</Incantamentum>
    <Lua>Cheia</Lua>
    <Component>Vela_Branca</Component>
    <Efeito>Levantar objetos</Efeito>
  </Spell>
  <Spell id="093">
    <Incantamentum>Phaesmatos Incendia</Incantamentum>
    <Lua>Cheia</Lua>
    <Component>Sal</Component>
    <Efeito>Acender fogo</Efeito>
  </Spell>
  <Spell id="101">
    <Incantamentum>Sanguinem Lunae</Incantamentum>
    <Lua>De_Sangue</Lua>
    <Component>Verbena</Component>
    <Efeito>Despertar</Efeito>
    <!-- NUNCA usar perto de pedra encantada -->
  </Spell>
  <Spell id="105">
    <Incantamentum>Silentium Petra</Incantamentum>
    <Lua>Cheia</Lua>
    <Component>Verbena</Component>
    <Efeito>Selar</Efeito>
  </Spell>
  <Spell id="108">
    <Incantamentum>Quietus Aeternum</Incantamentum>
    <Lua>De_Sangue</Lua>
    <Component>Verbena</Component>
    <Efeito>Selar</Efeito>
  </Spell>
  <Spell id="112">
    <Incantamentum>Motus Obscura</Incantamentum>
    <Lua>De_Sangue</Lua>
    <Component>Sal</Component>
    <Efeito>Selar</Efeito>
  </Spell>
</GrimoireData>
`;

const FASE12 = e => [
  m('🌿 *VERBENA!* Joguei o saquinho de verbena que eu carrego sempre. A pedra chiou e soltou fumaça... e as rachaduras pararam de crescer.', D, { efeito: 'glitch' }),
  aliado(e)
    ? m('A Viajante fugiu pela escada, e o Lucien foi atrás dela. Agora sou só eu e a estátua.')
    : m('O Lucien deu um passo para trás. A verbena queima ele também. Mas ele não vai embora: está esperando a lua ficar toda vermelha.'),
  m('Mas a verbena só segura por pouco tempo. Para selar o Silas *para sempre*, eu preciso falar o feitiço certo antes do eclipse acabar. ⏳'),
  m('Agora que minha memória voltou, o arquivo do meu clã também voltou inteiro. Olha:'),
  { arquivo: { nome: 'grimorio_completo.xml', mime: 'text/xml', conteudo: GRIMORIO_COMPLETO }, texto: '📜 Grimório Bennett · 100%', espera: 2000, repetir: true },
  m('Cuidado: tem feitiço aí que *acorda* em vez de selar. Eu preciso de um que:\n• funcione na *lua de sangue*\n• use *verbena* (é o que eu tenho aqui)\n• *sele* a pedra', D, R),
  m('🔎 *Fase 12 de 12: O Feitiço do Eclipse*\nQual feitiço eu falo? Mande o nome dele.', D, R),
];

const FIM_ALIADO = [
  m('✨ *QUIETUS AETERNUM!*', 1500, { efeito: 'tremor' }),
  m('Falei três vezes, com a mão na pedra. As rachaduras brilharam muito forte... e depois foram se apagando, uma por uma.'),
  vid('selo', ''),
  m('O Lucien voltou com a Viajante amarrada com corda de verbena. Ela contou que queria o Silas acordado para quebrar todos os feitiços do mundo. Agora ela vai ficar presa no túmulo dos 27, pelo menos até a próxima lua.'),
  m('Lá fora, a lua voltou a ser branca. 🌕 O Lucien me deu um anel de lápis-lazúli de presente: _"Para a caçadora. Caso um dia ela precise andar com vampiros no sol."_'),
  m('Obrigada, caçadora. Sem você eu ainda estaria acordando no chão da floresta sem lembrar meu próprio nome. 💜\n\n— Bonnie Bennett'),
  m('🏆 *FINAL A: Amigos de Sangue*\nVocê terminou os 2 capítulos da Operação Mystic Falls! Confiou no Lucien e ganhou um aliado para sempre.\n\nMande *reiniciar* e escolha *preso* na fase 7 para ver o outro capítulo 2.', 1500, { opcoes: ['reiniciar'] }),
];

const FIM_SOMBRA = [
  m('✨ *QUIETUS AETERNUM!*', 1500, { efeito: 'tremor' }),
  m('Falei três vezes, com a mão na pedra. O Lucien pulou em cima de mim para me parar... mas o feitiço já estava feito.'),
  vid('selo', ''),
  m('A luz vermelha saiu da estátua de uma vez só e empurrou o Lucien contra a parede. A pedra do Silas ficou lisinha, sem nenhuma rachadura. *Selado para sempre.*'),
  m('O Lucien ficou olhando para mim um tempão. Depois disse: _"Talvez vocês tivessem razão de não confiar em mim."_ E foi embora pela escada, devagar. Sem ameaça nenhuma.', D, { apagar: 9000 }),
  m('Lá fora, a lua voltou a ser branca. 🌕 Acho que ele não volta. Acho.'),
  m('Obrigada, caçadora. Sem você eu ainda estaria acordando no chão da floresta sem lembrar meu próprio nome. 💜\n\n— Bonnie Bennett'),
  m('🏆 *FINAL B: A Lua Branca*\nVocê terminou os 2 capítulos da Operação Mystic Falls! Selou o Silas sozinha, mesmo com um inimigo no escuro.\n\nMande *reiniciar* e escolha *soltar* na fase 7 para ver o outro capítulo 2.', 1500, { opcoes: ['reiniciar'] }),
];

const FASES = { 1: FASE1, 2: FASE2, 3: FASE3, 4: FASE4, 5: FASE5, 6: FASE6, 7: FASE7, 8: FASE8, 9: FASE9, 10: FASE10, 11: FASE11, 12: FASE12 };
const msgsDaFase = (fase, e) => typeof FASES[fase] === 'function' ? FASES[fase](e) : FASES[fase];
// o que é reenviado quando a jogadora pede "repetir"
const pistas = (fase, e) => msgsDaFase(fase, e).filter(x => x.repetir).map(({ apagar, efeito, ...x }) => ({ ...x, espera: 1200 }));

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
  8: ['*C4*: ache a coluna C (em cima) e desça até a linha 4. Que letra está ali?',
      'C4 = P, A2 = O... faltam E5 e B1. É um lugar com água lá no fundo.'],
  9: ['F volta três: F → E → D → *C*. H volta três: H → G → F → *E*. Continue assim.',
      'Começa com C-E-M-I... É um lugar com lápides.'],
  10: ['Primeiro, risque as lápides que têm anjo em cima. Depois, risque os Salvatore.',
       'Sobrou só uma lápide que fica do lado de um Salvatore. Qual é o nome escrito nela?'],
  11: ['Leia cada palavra de trás para frente, da direita para a esquerda. Ou vire o celular na frente de um espelho de verdade! 🪞',
       'É "a erva roxa que queima os vampiros". Lembra o que o Tristan bebeu no chá?'],
  12: ['Risque os feitiços da lua *cheia*. Depois risque os que não usam *verbena*.',
       'Sobram dois feitiços: um *desperta* e o outro *sela*. Qual sela?'],
};

// nomes da série que a jogadora pode mandar a qualquer momento (não contam como erro)
const SEGREDOS = {
  damon: () => [m('O Damon? Ele está me ajudando... eu acho. Com o Damon nunca dá para ter certeza. 😏', 1800)],
  stefan: () => [m('O Stefan sumiu desde ontem. A última coisa que ele deixou foi aquele diário.', 1800)],
  elena: () => [m('A Elena está segura em casa. Pelo menos foi o que ela disse.', 1800, { apagar: 4000 })],
  katherine: () => [m('Katherine?? Se ela estiver na cidade, estamos todas perdidas.', 1500, { efeito: 'glitch' })],
  klaus: () => [m('Não. Diga. Esse. Nome. 🩸', 1500, { efeito: 'sangue' })],
  caroline: () => [m('A Caroline está organizando o Baile dos Fundadores, claro. Ela organiza tudo nesta cidade. ✨', 1800)],
  matt: () => [m('O Matt é o único humano normal desta cidade. Ele merece férias. 🍔', 1800)],
  tyler: () => [m('O Tyler fica trancado no porão dos Lockwood toda lua cheia. Ele diz que é "coisa de família". 🐺', 1800)],
  alaric: () => [m('O professor Saltzman sabe mais de vampiros do que de história. E ele dá aula de história. 📚', 1800)],
  sheila: () => [m('Minha avó Sheila. Tudo o que eu sei de magia, ela que me ensinou. 🕯️', 1800)],
  bonnie: (e) => e.fase >= 7
    ? [m('Sim. Sou eu. Bonnie Bennett. 🔥', 1500)]
    : [m('...', 2000), m('Como você sabe esse nome? Ele me dá arrepio, mas eu não lembro de onde.', 2500, { efeito: 'glitch' })],
  lucien: (e) => e.fase >= 8
    ? [m(aliado(e) ? 'O Lucien está do nosso lado agora. Ainda acho estranho dizer isso. 🤝' : 'Não fala o nome dele. Eu sinto que ele está ouvindo. 👁️', 1800, aliado(e) ? {} : { efeito: 'glitch' })]
    : e.fase >= 6 ? [m('Ele está no porão. Acorrentado. Pelo menos por enquanto.', 1800)] : null,
  silas: (e) => e.fase >= 7 ? [m(e.fase >= 8 ? 'Ele é pedra agora. Mas pedra pode rachar...' : 'Ele está chegando. Eu sinto a magia dele daqui.', 1800, { efeito: 'tremor' })] : null,
  viajante: (e) => e.fase >= 11 && aliado(e) ? [m('Os Viajantes são bruxos que odeiam qualquer magia que não seja deles. E ela queria o Silas acordado.', 1800)] : null,
  'quem e voce': (e) => [m(e.fase >= 7 ? 'Bonnie Bennett. Agora eu lembro.' : 'Eu queria saber. Só sei que sou uma bruxa. E que preciso de você.', 2000)],
};

const AJUDA = [m('Comandos: *dica* (uma ajudinha), *repetir* (ver a pista de novo), *reiniciar* (começar do zero).', 800)];

function dica(e) {
  const lista = DICAS[e.fase];
  return m('💡 ' + lista[Math.min(Math.max(e.erros - 1, 0), lista.length - 1)], 1500);
}

function avancar(fase, e = {}) {
  const estado = { fase, erros: 0 };
  if (e.final) estado.final = e.final;
  if (fase >= 8) estado.cap2 = true;
  return { estado, msgs: msgsDaFase(fase, estado) };
}

// Recebe o estado e o que a jogadora escreveu; devolve o novo estado e as mensagens de resposta.
export function responder(estado, mensagem) {
  const t = normalizar(mensagem);
  const e = { ...estadoInicial(), ...estado };

  if (tem(t, 'reiniciar', 'recomecar') || e.fase === 0) return avancar(1);
  // terminou o Capítulo 1: qualquer mensagem abre o Capítulo 2 (vale também para quem terminou a versão antiga do jogo)
  if (e.fase === 8 && !e.cap2) return avancar(8, e);
  if (e.fase >= FIM) return { estado: e, msgs: [m('Você já terminou a Operação Mystic Falls' + (aliado(e) ? ' com o *Final A: Amigos de Sangue*. 🤝' : ' com o *Final B: A Lua Branca*. 🌕') + '\nMande *reiniciar* para jogar de novo e escolher diferente na fase 7: o Capítulo 2 muda!', 1200, { opcoes: ['reiniciar'] })] };
  if (t === 'ajuda' || t === 'menu') return { estado: e, msgs: AJUDA };
  const segredo = SEGREDOS[t] || SEGREDOS[t.replace(/^(e |o |a |cade |e o |e a )+/, '')];
  const msgsSegredo = segredo && segredo(e);
  if (msgsSegredo) return { estado: e, msgs: msgsSegredo };
  if (t === 'repetir') return { estado: e, msgs: pistas(e.fase, e) };
  if (t === 'dica') {
    const novo = { ...e, erros: e.erros + 1 };
    return { estado: novo, msgs: [dica(novo)] };
  }

  const errou = (texto, extra) => {
    const novo = { ...e, erros: e.erros + 1 };
    const msgs = [m(texto, 2000, extra)];
    if (novo.erros >= 2) msgs.push(dica(novo));
    return { estado: novo, msgs };
  };
  const errouAudio = (fala) => ({ estado: { ...e, erros: e.erros + 1 }, msgs: [m('🚨 Errado! Escuta isso:', 1000), { audio: fala, espera: 2500 }] });

  switch (e.fase) {
    case 1:
      if (tem(t, 'carvalho branco')) return avancar(2, e);
      if (tem(t, 'carvalho')) return errou('Quase! Carvalho... mas de qual cor? A cor importa.');
      if (/\bsal\b/.test(t)) return errou('Sal é só o *componente* do feitiço. Eu preciso da *arma*.');
      if (tem(t, 'phaesmatos', 'incendia')) return errou('Isso é o *feitiço*, não a arma. Continua procurando no código.');
      if (tem(t, 'estaca')) return errou('Uma estaca, sim! Mas não é qualquer uma. Leia o nome inteiro.');
      return errou('Não... o selo continua fechado. 🔒 Olha o arquivo de novo.');

    case 2:
      if (tem(t, 'grill')) return avancar(3, e);
      if (tem(t, 'mystic')) return errou('Mystic... o quê? Mystic Falls é a cidade toda. Eu preciso do *lugar*.');
      return errou('Não faz sentido ainda. 🔁 Tenta ler de trás para frente.');

    case 3:
      if (tem(t, 'ponte', 'wickery')) return avancar(4, e);
      if (tem(t, 'rio', 'estrada')) return errou('Perto, mas não é isso. A palavra está escondida, não escrita. 👀');
      return errou('Não... reli a página três vezes e não é isso.');

    case 4:
      if (/\b1864\b/.test(t)) return avancar(5, e);
      if (/\b\d{4}\b/.test(t)) return errou('🔒 *Clac.* O cadeado não abriu. Confere a conta.');
      return errou('O cadeado só aceita *4 números*.');

    case 5: {
      const nomes = ['liam', 'tristan', 'lucien'].filter(n => t.includes(n));
      if (nomes.length > 1) return { estado: e, msgs: [m('Calma! Escolha só *um* suspeito.', 1200)] };
      if (nomes[0] === 'lucien') return avancar(6, e);
      if (nomes[0] === 'liam') return errouAudio('Não! O Liam passou a tarde inteira no sol forte, e não usava anel nenhum. Um vampiro sem anel de lápis-lazúli teria virado cinza. Pense de novo!');
      if (nomes[0] === 'tristan') return errouAudio('Não! O Tristan bebeu verbena pura e nem fez careta. Verbena queima vampiros por dentro. Ele é humano. Pense de novo!');
      return { estado: e, msgs: [m('Me diga o nome: *Liam*, *Tristan* ou *Lucien*?', 1200)] };
    }

    case 6:
      if (tem(t, 'tumulo', 'cripta', 'igreja', 'tumba')) return avancar(7, e);
      if (tem(t, 'ponte', 'grill', 'porao', 'mansao')) return errou('Não, eu já estive aí essa noite. É um lugar *mais antigo*.');
      return errou('Não... pensa nos 27 vampiros de 1864.');

    case 7:
      if (tem(t, 'soltar', 'solta', 'libert', 'confi', 'perdo')) return { estado: { fase: 8, erros: 0, final: 'aliado' }, msgs: FINAL_ALIADO };
      if (tem(t, 'preso', 'prender', 'mata')) return { estado: { fase: 8, erros: 0, final: 'sombra' }, msgs: FINAL_SOMBRA };
      return { estado: e, msgs: [m('O Damon está esperando! *Soltar* ou *preso*?', 1200)] };

    case 8:
      if (/\bpo[cs]o\b/.test(t)) return avancar(9, e);
      if (/^[a-z ]*$/.test(t) && t.replace(/ /g, '').length === 4) return errou('Hmm, essas letras não formam um lugar que eu conheça. Confere de novo no mapa: *letra* é a coluna, *número* é a linha.');
      if (tem(t, 'tunel', 'tuneis')) return errou('A estátua passou pelos túneis, sim. Mas para onde ela *foi*? Junte as letras.');
      return errou('Não... 🗺️ Ache cada coordenada no mapa. A primeira é *C4*.');

    case 9:
      if (tem(t, 'cemiterio')) return avancar(10, e);
      if (tem(t, 'fhplwhulr')) return errou('Isso é o que está gravado. Eu preciso do que está *escondido* nele. Volta 3 letras.');
      if (/^ce/.test(t)) return errou('Começou certo! C, E... continua voltando 3 letras em cada uma.');
      return errou('Não... a pedra continua sem sentido. 🌙🌙🌙 Volte *três* letras em cada uma.');

    case 10:
      if (/\bfell\b/.test(t) || /\b(5|cinco|quinta|ultima)\b/.test(t)) return avancar(11, e);
      if (tem(t, 'salvatore')) return errou('O bilhete disse: *"ele não é um Salvatore"*. 😉');
      if (tem(t, 'lockwood', 'gilbert') || /\b(1|3|um|tres|primeira|terceira)\b/.test(t)) return errou('Essa lápide tem um *anjo* em cima. Olha de novo!');
      return errou('Não... nenhuma pedra se mexeu. Mande o *nome da família* escrito na lápide.');

    case 11:
      if (tem(t, 'verbena')) return avancar(12, e);
      if (tem(t, 'sal', 'agua', 'fogo', 'estaca')) return errou('Não é isso que o espelho diz. Leia de novo: é uma *erva roxa*.');
      return errou('A pedra rachou mais um pouco! 😱 Leia a frase do espelho de trás para frente.', { efeito: 'tremor' });

    case 12:
      if (tem(t, 'quietus', 'aeternum') || /\b108\b/.test(t)) return { estado: { fase: FIM, erros: 0, final: e.final, cap2: true }, msgs: aliado(e) ? FIM_ALIADO : FIM_SOMBRA };
      if (tem(t, 'sanguinem', 'lunae') || /\b101\b/.test(t)) return errou('NÃO!! Esse *desperta*! A pedra começou a tremer! 😱 Leia o <Efeito>.', { efeito: 'sangue' });
      if (tem(t, 'silentium', 'petra') || /\b105\b/.test(t)) return errou('Esse sela, mas só funciona na lua *cheia*. A lua lá fora está *de sangue*!');
      if (tem(t, 'motus', 'obscura') || /\b112\b/.test(t)) return errou('Esse usa *sal*, e eu só tenho verbena aqui.');
      if (tem(t, 'ascendo', 'phaesmatos', 'incendia') || /\b(091|093|91|93)\b/.test(t)) return errou('Esse é da lua *cheia*. Hoje a lua está vermelha!');
      return errou('Não sei esse feitiço... ⏳ Procure no grimório o nome que está em <Incantamentum>.');
  }
  return { estado: e, msgs: AJUDA };
}
