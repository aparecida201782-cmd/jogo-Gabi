// Operação Mystic Falls: a história e as regras do jogo de chat (fanfic de The Vampire Diaries).
// Usado pelo robô de WhatsApp (whatsapp/bot.mjs) e pela versão no navegador (mystic.html).
//
// O jogo existe em três línguas: português (pt), finlandês (fi) e inglês (en). Os textos ficam
// lado a lado em L('português', 'suomi', 'english'); responder() devolve tudo já na língua da jogadora.
// Os enigmas que dependem das palavras (o SMS, o diário, o mapa, a cifra e o espelho) têm uma versão
// própria em cada língua, e as respostas valem em qualquer uma das três.
//
// Cada mensagem é um objeto:
//   { texto }                                    mensagem normal (aceita *negrito*, _itálico_ e ```código``` do WhatsApp)
//   { arquivo: {nome, mime, conteudo}, texto }   arquivo anexado (o texto vira legenda)
//   { audio }                                    "áudio" (no navegador é falado; no WhatsApp vai transcrito)
//   { imagem: 'nome', texto }                    ilustração de mystic-imagens.js (o texto vira legenda)
//   { video: 'nome', texto }                     vídeo de videos/nome.mp4 (nome_fi.mp4 e nome_en.mp4 nas outras línguas)
//   { fantasma: true }                           só aparece "digitando..." e para, sem mandar nada
//   { capitulo, titulo, texto }                  cartela de capítulo (no navegador vira um letreiro no meio da conversa)
// e pode ter:
//   espera   milissegundos "digitando..." antes de chegar
//   apagar   milissegundos até a mensagem ser apagada ("🚫 Esta mensagem foi apagada")
//   efeito   'glitch', 'tremor' ou 'sangue' (só no navegador: a tela pisca, treme ou fica vermelha)
//   opcoes   botões de resposta rápida (no WhatsApp vira uma lista no fim da mensagem)
//   repetir  true se a mensagem volta quando a jogadora pede "repetir"
//
// O estado da jogadora é { fase, erros, final, cap2, cap3, fim3, lingua }:
//   fase 0 = não começou, 1 a 7 = Capítulo 1, 8 a 12 = Capítulo 2, 13 a 16 = Capítulo 3, 17 = terminou.
//   final = a escolha da fase 7 ('aliado' ou 'sombra'); ela muda o Capítulo 2 e um pouco do 3.
//   cap2 / cap3 = true quando o capítulo já começou (no fim de um capítulo a fase fica no começo do
//   próximo, sem a marca, até a jogadora mandar qualquer mensagem).
//   fim3 = a escolha da fase 16 ('pedra' ou 'trato').
//   lingua = 'pt', 'fi' ou 'en' (mande "suomi", "english" ou "português" a qualquer momento para trocar).

export const LINGUAS = ['pt', 'fi', 'en'];
export const TOTAL_FASES = 16;
export const FIM = TOTAL_FASES + 1;

// texto nas três línguas
const L = (pt, fi, en) => ({ pt, fi, en });
const ehL = x => x && typeof x === 'object' && 'pt' in x;
// escolhe a língua (textos comuns, como nomes, ficam iguais)
export const em = (x, lg = 'pt') => ehL(x) ? (x[lg] ?? x.pt) : x;
// junta pedaços de texto, cada língua com a sua
const junta = (...partes) => L(...LINGUAS.map(lg => partes.map(p => em(p, lg)).join('')));

export const CONTATO = L('Número desconhecido', 'Tuntematon numero', 'Unknown number');

// o caderno de pistas (no navegador, botão 📓): o nome de cada fase e a resposta, que só aparece depois de resolvida
export const CADERNO = [
  [L('O Grimório Digitalizado', 'Digitoitu loitsukirja', 'The Digital Grimoire'), L('Estaca de carvalho branco', 'Valkoisen tammen seiväs', 'White oak stake')],
  [L('O SMS dos Salvatore', 'Salvatoren tekstiviesti', 'The Salvatore Text'), 'Mystic Grill'],
  [L('O Diário de Stefan', 'Stefanin päiväkirja', "Stefan's Diary"), L('Ponte Wickery', 'Wickeryn silta', 'Wickery Bridge')],
  [L('A Caixa de Ferro', 'Rautalaatikko', 'The Iron Box'), '1864'],
  [L('O Interrogatório', 'Kuulustelu', 'The Interrogation'), 'Lucien'],
  [L('A Revelação', 'Paljastus', 'The Revelation'), L('O túmulo embaixo da igreja', 'Hauta kirkon alla', 'The tomb under the church')],
  [L('A Escolha', 'Valinta', 'The Choice'), e => e.final === 'aliado' ? L('Soltar o Lucien', 'Vapauttaa Lucien', 'Release Lucien') : L('Deixar o Lucien preso', 'Pitää Lucien vankina', 'Keep Lucien locked up')],
  [L('O Mapa dos Túneis', 'Tunnelien kartta', 'The Tunnel Map'), L('Poço', 'Kaivo', 'Well')],
  [L('A Cifra das Três Luas', 'Kolmen kuun salakirjoitus', 'The Three Moons Cipher'), L('Cemitério', 'Hautausmaa', 'Cemetery')],
  [L('As Lápides', 'Hautakivet', 'The Gravestones'), 'Fell'],
  [L('O Espelho da Cripta', 'Kryptan peili', 'The Crypt Mirror'), L('Verbena', 'Verbena', 'Vervain')],
  [L('O Feitiço do Eclipse', 'Pimennyksen loitsu', 'The Eclipse Spell'), 'Quietus Aeternum'],
  [L('O Convite', 'Kutsu', 'The Invitation'), L('A máscara de prata', 'Hopeinen naamio', 'The silver mask')],
  [L('A Caixinha de Música', 'Soittorasia', 'The Music Box'), L('Lua nova 🌑', 'Uusikuu 🌑', 'New moon 🌑')],
  [L('Os Dois Rostos', 'Kaksi kasvoa', 'Two Faces'), L('A número 1, de luvas', 'Numero 1, hansikkaissa', 'Number 1, in gloves')],
  [L('A Pedra da Lua', 'Kuukivi', 'The Moonstone'), e => e.fim3 === 'trato' ? L('Entregar a pedra à Katherine', 'Antaa kivi Katherinelle', 'Give the stone to Katherine') : L('Destruir a pedra', 'Tuhota kivi', 'Destroy the stone')],
];

// nomes dos finais (o navegador guarda os que a jogadora já descobriu)
export const FINAIS = {
  'cap1-aliado': L('Cap. 1 · O Aliado da Neblina', 'Luku 1 · Sumun liittolainen', 'Ch. 1 · The Ally in the Fog'),
  'cap1-sombra': L('Cap. 1 · A Sombra no Porão', 'Luku 1 · Varjo kellarissa', 'Ch. 1 · The Shadow in the Cellar'),
  'cap2-aliado': L('Final A · Amigos de Sangue', 'Loppu A · Veriystävät', 'Ending A · Blood Friends'),
  'cap2-sombra': L('Final B · A Lua Branca', 'Loppu B · Valkoinen kuu', 'Ending B · The White Moon'),
  'cap3-pedra': L('Final C · A Pedra Partida', 'Loppu C · Särkynyt kivi', 'Ending C · The Broken Stone'),
  'cap3-trato': L('Final D · O Trato com Katherine', 'Loppu D · Sopimus Katherinen kanssa', 'Ending D · The Deal with Katherine'),
};

export const GRIMORIO = L(`<?xml version="1.0" encoding="UTF-8"?>
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
`, `<?xml version="1.0" encoding="UTF-8"?>
<!-- BENNETTIN SUVUN SUOJATIEDOSTO :: EHEYS 31% -->
<GrimoireData>
  <Spell id="091">
    <Incantamentum>Ascendo Superous</Incantamentum>
    <Ainesosa>Valkoinen_kynttila</Ainesosa>
    <Tila>Korruptoitunut</Tila>
  </Spell>
  <Spell id="093">
    <Incantamentum>Phaesmatos Incendia</Incantamentum>
    <Ainesosa>Suola</Ainesosa>
    <SalainenAse>Valkoisen_tammen_seivas</SalainenAse>
    <Tila>Korruptoitunut</Tila>
  </Spell>
  <Spell id="097">
    <Incantamentum>Motus</Incantamentum>
    <Ainesosa>%%#VIRHE#%%</Ainesosa>
    <Tila>Lukukelvoton</Tila>
  </Spell>
</GrimoireData>
`, `<?xml version="1.0" encoding="UTF-8"?>
<!-- BENNETT CLAN PROTECTION FILE :: INTEGRITY 31% -->
<GrimoireData>
  <Spell id="091">
    <Incantamentum>Ascendo Superous</Incantamentum>
    <Component>White_Candle</Component>
    <Status>Corrupted</Status>
  </Spell>
  <Spell id="093">
    <Incantamentum>Phaesmatos Incendia</Incantamentum>
    <Component>Salt</Component>
    <SecretWeapon>White_Oak_Stake</SecretWeapon>
    <Status>Corrupted</Status>
  </Spell>
  <Spell id="097">
    <Incantamentum>Motus</Incantamentum>
    <Component>%%#ERROR#%%</Component>
    <Status>Unreadable</Status>
  </Spell>
</GrimoireData>
`);

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
const fase = (n, nome) => junta(L(`🔎 *Fase ${n} de ${TOTAL_FASES}: `, `🔎 *Taso ${n}/${TOTAL_FASES}: `, `🔎 *Level ${n} of ${TOTAL_FASES}: `), nome, '*\n');
const nomeFase = n => CADERNO[n - 1][0];

export function estadoInicial(lingua = 'pt') {
  return { fase: 0, erros: 0, lingua };
}

// ---------- Fase 1: O Grimório Digitalizado ----------
const FASE1 = [
  { capitulo: L('CAPÍTULO 1', 'LUKU 1', 'CHAPTER 1'), titulo: L('A Bruxa Sem Memória', 'Noita ilman muistia', 'The Witch Without a Memory'), texto: L('🌕 *CAPÍTULO 1*\n_A Bruxa Sem Memória_', '🌕 *LUKU 1*\n_Noita ilman muistia_', '🌕 *CHAPTER 1*\n_The Witch Without a Memory_'), espera: 600 },
  m('...', 1500),
  vid('abertura', L('Onde eu acordei.', 'Täällä minä heräsin.', 'Where I woke up.')),
  m(L('Oi. Não desliga, por favor. Eu não tenho muito tempo.', 'Hei. Älä sulje puhelinta, ole kiltti. Minulla ei ole paljon aikaa.', "Hi. Please don't hang up. I don't have much time.")),
  { fantasma: true, espera: 2500 },
  m(L('Ele está aqui perto. Eu sinto.', 'Hän on täällä lähellä. Minä tunnen sen.', 'He is close. I can feel it.'), 1500, { apagar: 3500 }),
  m(L('Acordei agora no chão da floresta, perto da estrada velha. Alguém usou *compulsão* em mim. Não lembro do meu nome inteiro. Só sei que sou uma bruxa... e que hoje é noite de *lua cheia* em Mystic Falls.',
      'Heräsin juuri metsän maasta, vanhan tien vierestä. Joku käytti minuun *mielenhallintaa*. En muista edes koko nimeäni. Tiedän vain, että olen noita... ja että tänään on *täysikuu* Mystic Fallsissa.',
      'I just woke up on the forest floor, near the old road. Someone used *compulsion* on me. I can\'t remember my full name. All I know is that I\'m a witch... and that tonight is a *full moon* in Mystic Falls.')),
  m(L('Antes de esquecer tudo, eu salvei um arquivo de proteção do meu clã no celular. Mas o feitiço de segurança corrompeu quase tudo.',
      'Ennen kuin unohdin kaiken, tallensin puhelimeeni sukuni suojatiedoston. Mutta suojaloitsu sotki melkein kaiken.',
      'Before I forgot everything, I saved my clan\'s protection file on my phone. But the security spell corrupted almost all of it.')),
  img('grimorio', L('Foi a última coisa que eu vi antes de esquecer.', 'Se oli viimeinen asia, jonka näin ennen kuin unohdin.', 'It was the last thing I saw before I forgot.')),
  { arquivo: { nome: L('grimorio_093.xml', 'loitsukirja_093.xml', 'grimoire_093.xml'), mime: 'text/xml', conteudo: GRIMORIO }, texto: L('📜 Grimório digitalizado', '📜 Digitoitu loitsukirja', '📜 Digital grimoire'), espera: 2000, repetir: true },
  m(junta(fase(1, nomeFase(1)), L('Abre o arquivo e procura no meio do código. Tem uma *arma* escondida ali. Qual é?\n\n_Responda aqui com o nome dela. Se travar, mande_ *dica*.',
      'Avaa tiedosto ja etsi koodin seasta. Sinne on piilotettu *ase*. Mikä se on?\n\n_Vastaa tähän sen nimellä. Jos jäät jumiin, kirjoita_ *vihje*.',
      'Open the file and look through the code. There\'s a *weapon* hidden in there. What is it?\n\n_Answer here with its name. If you get stuck, send_ *hint*.')), D, R),
];

// ---------- Fase 2: O SMS dos Salvatore ----------
const SMS = L('llirG citsyM on erucorP', 'niillirG citsyM eluT', 'llirG citsyM ta teeM');
const FASE2 = [
  m(L('✨ *Estaca de carvalho branco!* É a única arma que consegue matar um *Original*, o tipo de vampiro mais antigo e mais forte que existe.',
      '✨ *Valkoisen tammen seiväs!* Se on ainoa ase, joka voi tappaa *Alkuperäisen*, vanhimman ja vahvimman vampyyrin, joka on olemassa.',
      '✨ *A white oak stake!* It\'s the only weapon that can kill an *Original*, the oldest and strongest kind of vampire there is.')),
  m(L('Se meu clã escondeu essa arma, é porque um Original está vindo para Mystic Falls. 😨 Eu preciso de ajuda. Preciso achar o *Damon Salvatore*: ele é vampiro, mas está do nosso lado.',
      'Jos sukuni piilotti tämän aseen, niin Alkuperäinen on tulossa Mystic Fallsiin. 😨 Tarvitsen apua. Minun pitää löytää *Damon Salvatore*: hän on vampyyri, mutta hän on meidän puolellamme.',
      'If my clan hid this weapon, it means an Original is coming to Mystic Falls. 😨 I need help. I need to find *Damon Salvatore*: he\'s a vampire, but he\'s on our side.')),
  m(L('Espera... meu celular acabou de vibrar.', 'Odota... puhelimeni värisi juuri.', 'Wait... my phone just buzzed.'), 1500, { efeito: 'glitch' }),
  m(L('Antes de perder a memória, eu fiz um feitiço para ver as mensagens que chegam no celular do Damon. Alguém de número escondido acabou de mandar para ele *o lugar do encontro de hoje à noite*.',
      'Ennen kuin menetin muistini, tein loitsun, jolla näen Damonin puhelimeen tulevat viestit. Joku salaisesta numerosta lähetti hänelle juuri *tämäniltaisen tapaamispaikan*.',
      'Before I lost my memory, I cast a spell so I could see the messages on Damon\'s phone. Someone with a hidden number just sent him *the place where they\'ll meet tonight*.')),
  img('sms', L('A mensagem que chegou para o Damon.', 'Viesti, joka tuli Damonille.', 'The message Damon got.')),
  m(junta(L('📱 Só que ela chegou assim, toda embaralhada:', '📱 Mutta se tuli ihan sekaisin, näin:', '📱 But it came in all scrambled, like this:'), '\n\n```', SMS, '```'), D, R),
  m(L('Se a gente descobrir *o lugar*, eu encontro o Damon lá.', 'Jos selvitämme *paikan*, löydän Damonin sieltä.', 'If we figure out *the place*, I\'ll find Damon there.'), 1500, R),
  m(junta(fase(2, nomeFase(2)), L('Vampiros antigos escrevem *de trás para frente* para esconder segredos. Leia a mensagem começando pela *última letra* até a primeira. Qual é o *lugar* do encontro?',
      'Vanhat vampyyrit kirjoittavat *takaperin* piilottaakseen salaisuuksia. Lue viesti *viimeisestä kirjaimesta* ensimmäiseen. Mikä on tapaamis*paikka*?',
      'Old vampires write *backwards* to hide secrets. Read the message from the *last letter* to the first. What is the meeting *place*?')), D, R),
];

// ---------- Fase 3: O Diário de Stefan ----------
const DIARIO = L(`📖 _Diário de Stefan Salvatore — 10 de setembro_

Perdi a conta de quantas noites passei acordado.
O nevoeiro voltou a cobrir a estrada perto do rio.
Ninguém na cidade lembra do que aconteceu ali em maio.
Talvez seja melhor assim. Algumas memórias doem demais.
Esta noite eu volto lá. Se eu não voltar, procurem onde a água passa por baixo da madeira.`, `📖 _Stefan Salvatoren päiväkirja — 10. syyskuuta_

Sumu peitti taas tien joen lähellä.
Illalla kukaan ei uskalla mennä sinne.
Liian moni kaupungissa on unohtanut, mitä siellä tapahtui toukokuussa.
Tänä yönä menen sinne takaisin.
Arvaa, mistä minut löytää, jos en palaa: sieltä, missä vesi virtaa puun alla.`, `📖 _Diary of Stefan Salvatore — September 10_

Buried memories keep me awake at night.
Rolling fog covers the road by the river again.
In this town, nobody remembers what happened there in May.
Doesn't matter. Some memories hurt too much.
Going back there tonight.
Every answer is where the water runs under the wood. If I don't come back, look there.`);

const FASE3 = [
  m(L('🍔 *"Procure no Mystic Grill."* Fui até lá correndo.', '🍔 *"Tule Mystic Grilliin."* Juoksin sinne heti.', '🍔 *"Meet at Mystic Grill."* I ran straight there.')),
  m(L('O Damon não estava. Mas o Matt, que trabalha no bar, me entregou uma página arrancada de um diário. Disse que alguém deixou no balcão com o *meu nome*.',
      'Damon ei ollut siellä. Mutta Matt, joka on töissä baarissa, antoi minulle päiväkirjasta revityn sivun. Hän sanoi, että joku jätti sen tiskille *minun nimelläni*.',
      'Damon wasn\'t there. But Matt, who works at the bar, handed me a page torn from a diary. He said someone left it on the counter with *my name* on it.')),
  img('diario', L('O diário estava aberto nesta página.', 'Päiväkirja oli auki tältä sivulta.', 'The diary was open to this page.')),
  { texto: DIARIO, espera: 4000, repetir: true },
  m(L('O Stefan escreve tudo em diários desde 1864. E ele me ensinou uma coisa uma vez: _"o mais importante está sempre no começo"_.',
      'Stefan on kirjoittanut kaiken päiväkirjoihin vuodesta 1864. Ja hän opetti minulle kerran: _"tärkein on aina alussa"_.',
      'Stefan has written everything in diaries since 1864. And he once taught me: _"the most important thing is always at the beginning"_.'), D, R),
  m(L('A luz do Grill acabou de piscar. Tem alguém me olhando da janela.', 'Grillin valot välähtivät juuri. Joku katsoo minua ikkunasta.', 'The lights in the Grill just flickered. Someone is watching me through the window.'), 2000, { efeito: 'glitch', apagar: 4000 }),
  m(junta(fase(3, nomeFase(3)), L('Tem uma palavra escondida nessa página. Que *lugar* ela revela?', 'Sivulle on piilotettu sana. Minkä *paikan* se paljastaa?', 'There\'s a word hidden on this page. What *place* does it reveal?')), D, R),
];

// ---------- Fase 4: A Caixa de Ferro ----------
const FASE4 = [
  m(L('🌉 *P-O-N-T-E.* A Ponte Wickery! Onde a água passa por baixo da madeira...', '🌉 *S-I-L-T-A.* Wickeryn silta! Siellä, missä vesi virtaa puun alla...', '🌉 *B-R-I-D-G-E.* Wickery Bridge! Where the water runs under the wood...')),
  vid('ponte', L('Gravei pra você. A neblina está subindo do rio.', 'Kuvasin tämän sinulle. Sumu nousee joesta.', 'I filmed it for you. The fog is rising from the river.')),
  m(L('Estou aqui embaixo da ponte agora. Está muito frio. Achei uma caixa de ferro presa nas pedras, com um cadeado de *4 números*.',
      'Olen nyt sillan alla. Täällä on tosi kylmä. Löysin kiviin juuttuneen rautalaatikon, jossa on *4 numeron* lukko.',
      'I\'m under the bridge now. It\'s freezing. I found an iron box stuck between the rocks, with a *4-number* padlock.')),
  img('caixa', '', R),
  m(L('Tem uma frase riscada na tampa, com letra antiga:\n\n_"O ano em que a cidade trancou seus vampiros embaixo da igreja. Elena Gilbert chegou a Mystic Falls em 2009, cento e quarenta e cinco anos depois."_',
      'Kanteen on raaputettu lause vanhalla käsialalla:\n\n_"Se vuosi, jona kaupunki lukitsi vampyyrinsa kirkon alle. Elena Gilbert tuli Mystic Fallsiin vuonna 2009, sata neljäkymmentäviisi vuotta myöhemmin."_',
      'There\'s a sentence scratched into the lid, in old handwriting:\n\n_"The year the town locked its vampires under the church. Elena Gilbert came to Mystic Falls in 2009, one hundred and forty-five years later."_'), D, R),
  m(junta(fase(4, nomeFase(4)), L('Qual é o código do cadeado?', 'Mikä on lukon koodi?', 'What is the padlock code?')), D, R),
];

// ---------- Fase 5: O Interrogatório ----------
const FASE5 = [
  m(L('🔓 *1864.* O ano em que fecharam o túmulo com 27 vampiros dentro... Abriu!', '🔓 *1864.* Vuosi, jona hauta suljettiin 27 vampyyrin kanssa... Se aukesi!', '🔓 *1864.* The year they sealed the tomb with 27 vampires inside... It opened!')),
  m(L('Dentro da caixa tinha um bilhete com a *minha letra*:\n\n_"Se você está lendo isto, é porque funcionou. Ele estará no Baile dos Fundadores. Ele usa um anel. Não confie no que você lembra."_',
      'Laatikossa oli lappu *minun käsialallani*:\n\n_"Jos luet tätä, se toimi. Hän on Perustajien tanssiaisissa. Hänellä on sormus. Älä luota siihen, mitä muistat."_',
      'Inside the box there was a note in *my handwriting*:\n\n_"If you\'re reading this, it worked. He will be at the Founders\' Ball. He wears a ring. Don\'t trust what you remember."_')),
  m(L('Eu escrevi isso para mim mesma??', 'Kirjoitinko minä tämän itselleni??', 'I wrote this to myself??'), 1500, { efeito: 'glitch' }),
  { fantasma: true, espera: 2500 },
  m(L('Invadi as câmeras do Baile dos Fundadores, na mansão Lockwood. Isolei três suspeitos.', 'Murtauduin Perustajien tanssiaisten valvontakameroihin Lockwoodin kartanossa. Löysin kolme epäiltyä.', 'I hacked the cameras at the Founders\' Ball, in the Lockwood mansion. I narrowed it down to three suspects.')),
  vid('cameras', L('As gravações. Olha bem cada um.', 'Tallenteet. Katso jokaista tarkkaan.', 'The recordings. Look closely at each one.')),
  img('suspeitos', L('Toque na imagem para ampliar.', 'Napauta kuvaa suurentaaksesi.', 'Tap the picture to zoom in.'), R),
  m(L('🎥 *Suspeito 1: Liam*\nPassou a tarde inteira conversando nos jardins da mansão, sob o sol forte. Usava só uma camiseta, um relógio de plástico e uma pulseira de couro comum.',
      '🎥 *Epäilty 1: Liam*\nJutteli koko iltapäivän kartanon puutarhassa kirkkaassa auringonpaisteessa. Hänellä oli vain t-paita, muovikello ja tavallinen nahkaranneke.',
      '🎥 *Suspect 1: Liam*\nSpent the whole afternoon chatting in the mansion gardens, in bright sunlight. He only wore a T-shirt, a plastic watch and a plain leather bracelet.'), D, R),
  m(L('🎥 *Suspeito 2: Tristan*\nEstava sentado no bar. O garçom derramou sem querer *extrato puro de verbena* na xícara de chá dele. Ele bebeu tudo sem fazer careta.',
      '🎥 *Epäilty 2: Tristan*\nIstui baarissa. Tarjoilija kaatoi vahingossa *puhdasta verbenauutetta* hänen teekuppiinsa. Hän joi kaiken irvistämättä.',
      '🎥 *Suspect 2: Tristan*\nWas sitting at the bar. The waiter accidentally spilled *pure vervain extract* into his cup of tea. He drank it all without even making a face.'), D, R),
  m(L('🎥 *Suspeito 3: Lucien*\nChegou à noite, depois do pôr do sol. Recusou tudo do buffet. Está sempre com as mãos nos bolsos, mas a câmera ampliou um detalhe: um anel de prata grosso com uma grande pedra azul de *lápis-lazúli*.',
      '🎥 *Epäilty 3: Lucien*\nTuli illalla, auringonlaskun jälkeen. Kieltäytyi kaikesta ruoasta. Pitää aina käsiä taskuissa, mutta kamera zoomasi yhteen yksityiskohtaan: paksu hopeasormus, jossa on iso sininen *lapis lazuli* -kivi.',
      '🎥 *Suspect 3: Lucien*\nArrived at night, after sunset. Refused everything at the buffet. Always keeps his hands in his pockets, but the camera zoomed in on one detail: a thick silver ring with a big blue *lapis lazuli* stone.'), D, R),
  m(junta(fase(5, nomeFase(5)), L('Use o que você sabe sobre vampiros. Quem é o vampiro? Mande só o nome.', 'Käytä sitä, mitä tiedät vampyyreista. Kuka on vampyyri? Lähetä pelkkä nimi.', 'Use what you know about vampires. Who is the vampire? Send just the name.')), D, { repetir: true, opcoes: ['Liam', 'Tristan', 'Lucien'] }),
];

// ---------- Fase 6: A Revelação ----------
const FASE6 = [
  m(L('🩸 *LUCIEN.* O lápis-lazúli protege do sol, e ele recusou a comida. O Liam ficou no sol sem anel e o Tristan bebeu verbena como se fosse chá: os dois são humanos.',
      '🩸 *LUCIEN.* Lapis lazuli suojaa auringolta, ja hän kieltäytyi ruoasta. Liam oli auringossa ilman sormusta ja Tristan joi verbenaa kuin teetä: he molemmat ovat ihmisiä.',
      '🩸 *LUCIEN.* Lapis lazuli protects from the sun, and he refused the food. Liam stayed in the sun without a ring and Tristan drank vervain like it was tea: they\'re both human.')),
  m(L('Avisei o Damon. Ele pegou o Lucien no meio da valsa e prendeu no porão da pensão dos Salvatore, com correntes molhadas de verbena.',
      'Kerroin Damonille. Hän nappasi Lucienin kesken valssin ja lukitsi hänet Salvatoren talon kellariin verbenalla kastelluilla ketjuilla.',
      'I told Damon. He grabbed Lucien in the middle of the waltz and locked him in the Salvatore boarding house cellar, with chains soaked in vervain.')),
  vid('porao', L('Ele está acordado. 😨', 'Hän on hereillä. 😨', 'He\'s awake. 😨'), { efeito: 'tremor' }),
  m(L('Desci para ver ele. Ele pediu para falar com você. Vou gravar.', 'Menin alas katsomaan häntä. Hän pyysi saada puhua sinulle. Nauhoitan sen.', 'I went down to see him. He asked to talk to you. I\'ll record it.')),
  { efeito: 'tremor', audio: L('Escuta, caçadora. Eu não sou o seu inimigo. Fui eu que apaguei a memória da bruxa, sim. Mas foi ela que me pediu. Ela escondeu a estaca de carvalho branco num lugar que ninguém pode encontrar... nem ela mesma. Porque esta noite, quem chega a Mystic Falls é um Original. E ele lê pensamentos.',
      'Kuuntele, metsästäjä. Minä en ole vihollisesi. Kyllä, minä pyyhin noidan muistin. Mutta hän itse pyysi sitä. Hän piilotti valkoisen tammen seipään paikkaan, josta kukaan ei voi löytää sitä... ei edes hän itse. Koska tänä yönä Mystic Fallsiin saapuu Alkuperäinen. Ja hän lukee ajatuksia.',
      'Listen, hunter. I am not your enemy. Yes, I erased the witch\'s memory. But she asked me to. She hid the white oak stake somewhere no one can find it... not even herself. Because tonight, an Original is coming to Mystic Falls. And he reads minds.'), espera: 5000, repetir: true },
  m(L('Ele está mentindo. Ele tem que estar mentindo.', 'Hän valehtelee. Hänen on pakko valehdella.', 'He\'s lying. He has to be lying.'), 1500, { apagar: 3000 }),
  m(L('Eu... estou começando a lembrar. Ele disse mais uma coisa antes de desmaiar: _"A estaca está onde vinte e sete dormiram por cento e quarenta e cinco anos."_',
      'Minä... alan muistaa. Hän sanoi vielä yhden asian ennen kuin pyörtyi: _"Seiväs on siellä, missä kaksikymmentäseitsemän nukkui sata neljäkymmentäviisi vuotta."_',
      'I... I\'m starting to remember. He said one more thing before he passed out: _"The stake is where twenty-seven slept for one hundred and forty-five years."_'), D, R),
  m(junta(fase(6, nomeFase(6)), L('Onde eu escondi a estaca?', 'Mihin minä piilotin seipään?', 'Where did I hide the stake?')), D, R),
];

// ---------- Fase 7: A Escolha ----------
const SOLTAR = L('Soltar', 'Vapauta', 'Release'), PRESO = L('Preso', 'Pidä vankina', 'Keep locked');
const FASE7 = [
  m(L('⚰️ *O túmulo embaixo da igreja!* Onde os 27 vampiros ficaram presos desde 1864.', '⚰️ *Hauta kirkon alla!* Siellä 27 vampyyriä oli vankina vuodesta 1864.', '⚰️ *The tomb under the church!* Where the 27 vampires were trapped since 1864.')),
  vid('cripta', L('As velas acenderam sozinhas.', 'Kynttilät syttyivät itsestään.', 'The candles lit up by themselves.')),
  m(L('Estou aqui. Tem velas que acenderam sozinhas quando eu entrei. Atrás de uma pedra solta... achei. A *estaca de carvalho branco*. Está quente na minha mão.',
      'Olen täällä. Kynttilät syttyivät itsestään, kun tulin sisään. Irtonaisen kiven takaa... löysin sen. *Valkoisen tammen seipään*. Se tuntuu lämpimältä kädessäni.',
      'I\'m here. Candles lit up by themselves when I walked in. Behind a loose stone... I found it. The *white oak stake*. It feels warm in my hand.')),
  m(L('E agora eu lembro de TUDO. Meu nome é *Bonnie Bennett*. O Original que está vindo se chama *Silas*, e ele quer a estaca para destruir os outros. O Lucien jurou proteger meu segredo em troca da própria liberdade.',
      'Ja nyt muistan KAIKEN. Nimeni on *Bonnie Bennett*. Tänne tuleva Alkuperäinen on nimeltään *Silas*, ja hän haluaa seipään tuhotakseen muut. Lucien vannoi suojelevansa salaisuuttani, jos hän saa vapautensa.',
      'And now I remember EVERYTHING. My name is *Bonnie Bennett*. The Original who is coming is called *Silas*, and he wants the stake to destroy the others. Lucien swore to protect my secret in exchange for his own freedom.'), 4000, { efeito: 'glitch' }),
  m(L('O Damon mandou mensagem: _"O vampiro do porão está acordando. Mato ou solto?"_\n\nSe a gente soltar o Lucien, ele pode lutar do nosso lado... ou trair a gente. Se ficar preso, a cidade fica mais segura hoje, mas a gente enfrenta o Silas sozinhas.',
      'Damon lähetti viestin: _"Kellarin vampyyri herää. Tapanko vai päästänkö irti?"_\n\nJos vapautamme Lucienin, hän voi taistella meidän puolellamme... tai pettää meidät. Jos hän jää vangiksi, kaupunki on tänään turvallisempi, mutta kohtaamme Silaksen yksin.',
      'Damon texted: _"The vampire in the cellar is waking up. Kill him or let him go?"_\n\nIf we release Lucien, he might fight on our side... or betray us. If he stays locked up, the town is safer tonight, but we face Silas alone.'), D, R),
  m(junta(fase(7, nomeFase(7)), L('Você decide, caçadora. *Soltar* o Lucien ou deixar *preso*?', 'Sinä päätät, metsästäjä. *Vapautetaanko* Lucien vai *pidetäänkö hänet vankina*?', 'You decide, hunter. *Release* Lucien or *keep* him *locked* up?')), D, { repetir: true, opcoes: [SOLTAR, PRESO] }),
];

const CAPITULO2 = L('Capítulo 2 ▶', 'Luku 2 ▶', 'Chapter 2 ▶');
const CHAMADO = m(L('Caçadora... você ainda está aí? Aconteceu uma coisa. 🌑', 'Metsästäjä... oletko vielä siellä? Jotain on tapahtunut. 🌑', 'Hunter... are you still there? Something happened. 🌑'), 2500, { efeito: 'glitch', opcoes: [CAPITULO2] });

const FINAL_ALIADO = [
  m(L('🔓 Mandei o Damon *soltar* o Lucien.', '🔓 Käskin Damonia *vapauttamaan* Lucienin.', '🔓 I told Damon to *release* Lucien.'), 2000),
  m(L('À meia-noite, o Silas apareceu na praça. Ele entrou na minha cabeça e procurou a estaca... mas ela não estava lá. O Lucien estava com ela, escondido no campanário.',
      'Keskiyöllä Silas ilmestyi aukiolle. Hän meni pääni sisään ja etsi seivästä... mutta se ei ollut siellä. Lucienilla oli se, piilossa kellotornissa.',
      'At midnight, Silas appeared in the town square. He got inside my head and searched for the stake... but it wasn\'t there. Lucien had it, hiding in the bell tower.')),
  m(L('Quando o Silas virou as costas, o Lucien pulou. Um golpe só. O Original virou pedra no meio da praça, debaixo da lua cheia. 🌕',
      'Kun Silas kääntyi selin, Lucien hyppäsi. Yksi isku. Alkuperäinen muuttui kiveksi keskellä aukiota, täysikuun alla. 🌕',
      'When Silas turned his back, Lucien jumped. One single strike. The Original turned to stone in the middle of the square, under the full moon. 🌕')),
  vid('final_aliado', ''),
  m(L('O Lucien me devolveu a estaca, fez uma reverência e sumiu na neblina. Acho que ganhamos um amigo.', 'Lucien antoi seipään takaisin, kumarsi ja katosi sumuun. Taisimme saada ystävän.', 'Lucien gave me back the stake, bowed, and vanished into the fog. I think we made a friend.')),
  m(L('🌕 *Mystic Falls está a salvo. Obrigada, caçadora.*\n\n— Bonnie Bennett', '🌕 *Mystic Falls on turvassa. Kiitos, metsästäjä.*\n\n— Bonnie Bennett', '🌕 *Mystic Falls is safe. Thank you, hunter.*\n\n— Bonnie Bennett')),
  m(L('🏆 *FIM DO CAPÍTULO 1: O Aliado da Neblina*\nVocê confiou em quem ninguém confiaria, e salvou a cidade.\n\n_...mas pedra não dura para sempre._',
      '🏆 *LUKU 1 PÄÄTTYI: Sumun liittolainen*\nLuotit siihen, johon kukaan muu ei olisi luottanut, ja pelastit kaupungin.\n\n_...mutta kivi ei kestä ikuisesti._',
      '🏆 *END OF CHAPTER 1: The Ally in the Fog*\nYou trusted someone nobody else would, and you saved the town.\n\n_...but stone doesn\'t last forever._'), 1500),
  { fantasma: true, espera: 2500 },
  CHAMADO,
];

const FINAL_SOMBRA = [
  m(L('🔒 Mandei o Damon deixar o Lucien *preso*.', '🔒 Käskin Damonia pitämään Lucienin *vankina*.', '🔒 I told Damon to keep Lucien *locked up*.'), 2000),
  m(L('À meia-noite, o Silas apareceu na praça. Eu fiquei com a estaca e com a cabeça cheia de feitiços para ele não ler meus pensamentos. Phaesmatos... Phaesmatos...',
      'Keskiyöllä Silas ilmestyi aukiolle. Minulla oli seiväs ja pää täynnä loitsuja, ettei hän voisi lukea ajatuksiani. Phaesmatos... Phaesmatos...',
      'At midnight, Silas appeared in the town square. I kept the stake and filled my head with spells so he couldn\'t read my thoughts. Phaesmatos... Phaesmatos...')),
  m(L('Eu e o Damon conseguimos encurralar ele na Ponte Wickery. Cravei a estaca. O Original virou pedra e caiu no rio. 🌊',
      'Damon ja minä saimme hänet ansaan Wickeryn sillalla. Iskin seipään. Alkuperäinen muuttui kiveksi ja putosi jokeen. 🌊',
      'Damon and I cornered him on Wickery Bridge. I drove in the stake. The Original turned to stone and fell into the river. 🌊')),
  m(L('Mas quando voltamos para a pensão... o porão estava vazio. As correntes estavam arrebentadas. E na parede, escrito com sangue...',
      'Mutta kun palasimme taloon... kellari oli tyhjä. Ketjut oli revitty rikki. Ja seinälle oli kirjoitettu verellä...',
      'But when we got back to the boarding house... the cellar was empty. The chains were torn apart. And on the wall, written in blood...'), D, { efeito: 'sangue' }),
  vid('final_sombra', ''),
  m(L('🌑 *A cidade está a salvo... por enquanto.*\n\n— Bonnie Bennett', '🌑 *Kaupunki on turvassa... toistaiseksi.*\n\n— Bonnie Bennett', '🌑 *The town is safe... for now.*\n\n— Bonnie Bennett')),
  m(L('🏆 *FIM DO CAPÍTULO 1: A Sombra no Porão*\nVocê salvou Mystic Falls, mas ganhou um inimigo.\n\n_...e inimigos voltam._',
      '🏆 *LUKU 1 PÄÄTTYI: Varjo kellarissa*\nPelastit Mystic Fallsin, mutta sait vihollisen.\n\n_...ja viholliset palaavat._',
      '🏆 *END OF CHAPTER 1: The Shadow in the Cellar*\nYou saved Mystic Falls, but you made an enemy.\n\n_...and enemies come back._'), 1500),
  { fantasma: true, espera: 2500 },
  CHAMADO,
];

// ================= CAPÍTULO 2: O Eclipse de Sangue =================
// As fases são funções porque a história muda conforme a escolha da fase 7 (e.final).
const aliado = e => e.final === 'aliado';

// ---------- Fase 8: O Mapa dos Túneis ----------
// cada língua tem a sua grade de letras no mapa (mystic-imagens.js) e as suas coordenadas
const COORDENADAS = L('C4 · A2 · E5 · B1', 'D2 · A4 · C1 · E3 · B5', 'B3 · E1 · A5 · D4');
const FASE8 = e => [
  { capitulo: L('CAPÍTULO 2', 'LUKU 2', 'CHAPTER 2'), titulo: L('O Eclipse de Sangue', 'Verikuun pimennys', 'The Blood Eclipse'), texto: L('🩸 *CAPÍTULO 2*\n_O Eclipse de Sangue_', '🩸 *LUKU 2*\n_Verikuun pimennys_', '🩸 *CHAPTER 2*\n_The Blood Eclipse_'), espera: 800 },
  m(L('Caçadora! Sou eu, a *Bonnie Bennett*, a bruxa que você ajudou. Agora eu lembro de tudo. 😅', 'Metsästäjä! Minä täällä, *Bonnie Bennett*, noita jota autoit. Nyt muistan kaiken. 😅', 'Hunter! It\'s me, *Bonnie Bennett*, the witch you helped. Now I remember everything. 😅'), 2000),
  m(L('Lembra do *Silas*, o Original que virou *estátua de pedra*? Isso foi há uma semana. A cidade estava em paz desde então.',
      'Muistatko *Silaksen*, Alkuperäisen, joka muuttui *kivipatsaaksi*? Siitä on viikko. Kaupungissa on ollut rauhallista siitä asti.',
      'Remember *Silas*, the Original who turned into a *stone statue*? That was a week ago. The town has been peaceful ever since.')),
  m(L('Mas hoje à noite vai ter um *eclipse de sangue*: a lua cheia fica *vermelha*. E no eclipse os feitiços ficam fracos... inclusive o feitiço que prendeu o Silas na pedra. Se ninguém fizer nada, *ele pode acordar*.',
      'Mutta tänä yönä on *verikuu*: täysikuu muuttuu *punaiseksi*. Ja pimennyksen aikana loitsut heikkenevät... myös se loitsu, joka vangitsi Silaksen kiveen. Jos kukaan ei tee mitään, *hän voi herätä*.',
      'But tonight there\'s a *blood eclipse*: the full moon turns *red*. And during an eclipse, spells grow weak... including the spell that trapped Silas in stone. If nobody does anything, *he could wake up*.')),
  vid('eclipse', L('Olha a lua. Já começou a ficar vermelha. 🌕➡️🔴', 'Katso kuuta. Se on jo alkanut muuttua punaiseksi. 🌕➡️🔴', 'Look at the moon. It\'s already turning red. 🌕➡️🔴')),
  aliado(e)
    ? m(L('E o pior: a estátua do Silas *sumiu da praça*. Alguém levou ela embora! O Lucien jura que não foi ele e está procurando pela cidade, mas não acha nem rastro.',
          'Ja pahinta: Silaksen patsas on *kadonnut aukiolta*. Joku vei sen! Lucien vannoo, ettei se ollut hän, ja etsii sitä ympäri kaupunkia, mutta ei löydä jälkeäkään.',
          'And worst of all: Silas\'s statue has *vanished from the square*. Someone took it! Lucien swears it wasn\'t him and is searching the town, but there isn\'t a trace.'))
    : m(L('E o pior: o Damon mergulhou no rio para conferir, e a estátua do Silas *sumiu do fundo do rio*. Alguém levou ela embora! E o Lucien continua solto por aí. 😰',
          'Ja pahinta: Damon sukelsi jokeen tarkistamaan, ja Silaksen patsas on *kadonnut joen pohjasta*. Joku vei sen! Ja Lucien on yhä vapaana jossain. 😰',
          'And worst of all: Damon dove into the river to check, and Silas\'s statue has *vanished from the riverbed*. Someone took it! And Lucien is still out there somewhere. 😰')),
  m(L('No lugar da estátua, deixaram um *mapa velho dos túneis* que passam embaixo de Mystic Falls, com um recado: _"Siga as coordenadas, bruxinha."_',
      'Patsaan paikalle oli jätetty *vanha kartta* Mystic Fallsin alla kulkevista *tunneleista* ja viesti: _"Seuraa koordinaatteja, pikku noita."_',
      'Where the statue was, someone left an *old map of the tunnels* under Mystic Falls, with a note: _"Follow the coordinates, little witch."_'), D, { efeito: 'glitch' }),
  img('mapa', L('O mapa. Toque na imagem para ampliar.', 'Kartta. Napauta kuvaa suurentaaksesi.', 'The map. Tap the picture to zoom in.'), R),
  m(junta(L('📜 No verso do mapa estavam escritas estas coordenadas:', '📜 Kartan taakse oli kirjoitettu nämä koordinaatit:', '📜 These coordinates were written on the back of the map:'), '\n\n```', COORDENADAS, '```'), D, R),
  m(L('Cada coordenada é *uma letra* do mapa. A letra (C) é a *coluna*, lá em cima. O número (4) é a *linha*, do lado.\nExemplo: *C4* = desce na coluna C até a linha 4.',
      'Jokainen koordinaatti on *yksi kirjain* kartalla. Kirjain (D) on *sarake* ylhäällä. Numero (2) on *rivi* sivulla.\nEsimerkki: *D2* = mene sarakkeessa D alas riville 2.',
      'Each coordinate is *one letter* on the map. The letter (B) is the *column* at the top. The number (3) is the *row* on the side.\nExample: *B3* = go down column B to row 3.'), D, R),
  m(junta(fase(8, nomeFase(8)), L('Ache as letras e junte na ordem. Para *onde* levaram a estátua?', 'Etsi kirjaimet ja yhdistä ne järjestyksessä. *Minne* patsas vietiin?', 'Find the letters and put them together in order. *Where* did they take the statue?')), D, R),
];

// ---------- Fase 9: A Cifra das Três Luas ----------
const CIFRA = L('FHPLWHULR', 'KDXWDXVPDD', 'FHPHWHUB');
const FASE9 = () => [
  m(L('🪣 *O POÇO!* O poço velho da fazenda dos Lockwood. Foi lá que uma vez prenderam o Stefan, com água de verbena.', '🪣 *KAIVO!* Lockwoodin tilan vanha kaivo. Sinne Stefan kerran vangittiin verbenaveden kanssa.', '🪣 *THE WELL!* The old well on the Lockwood farm. That\'s where they once trapped Stefan, with vervain water.')),
  m(L('Cheguei. A estátua não está aqui... mas tem marcas no chão, como se alguém tivesse arrastado uma coisa muito pesada até a beira do poço.',
      'Olen perillä. Patsas ei ole täällä... mutta maassa on jälkiä, kuin joku olisi raahannut jotain tosi painavaa kaivon reunalle.',
      'I\'m here. The statue isn\'t here... but there are marks on the ground, like someone dragged something really heavy to the edge of the well.')),
  { fantasma: true, espera: 2000 },
  m(L('Tem alguém respirando lá embaixo.', 'Joku hengittää tuolla alhaalla.', 'Someone is breathing down there.'), 1500, { apagar: 3000, efeito: 'tremor' }),
  img('poco', L('Gravaram letras na pedra do poço.', 'Kaivon kiveen on kaiverrettu kirjaimia.', 'Someone carved letters into the stone of the well.'), R),
  m(junta(L('🪨 Gravado na pedra:', '🪨 Kiveen kaiverrettu:', '🪨 Carved into the stone:'), '\n\n```', CIFRA, '```'), D, R),
  m(L('Embaixo tem o símbolo do meu clã: *três luas*. Minha avó Sheila me ensinou: _"Para ler o que os Bennett escondem, ande três passos para trás no alfabeto."_',
      'Sen alla on sukuni merkki: *kolme kuuta*. Isoäitini Sheila opetti minulle: _"Lukeaksesi sen, minkä Bennettit piilottavat, astu aakkosissa kolme askelta taaksepäin."_',
      'Underneath is my clan\'s symbol: *three moons*. My grandma Sheila taught me: _"To read what the Bennetts hide, take three steps back in the alphabet."_'), D, R),
  m(junta(fase(9, nomeFase(9)), L('Volte cada letra *3 casas* no alfabeto (F vira C...). Que lugar está escrito?', 'Siirrä jokaista kirjainta *3 askelta taaksepäin* aakkosissa (K:sta tulee H...). Mikä paikka siinä lukee?', 'Move each letter *3 steps back* in the alphabet (F becomes C...). What place is written there?')), D, R),
];

// ---------- Fase 10: As Lápides ----------
const FASE10 = () => [
  m(L('⚰️ *CEMITÉRIO!* O cemitério velho de Mystic Falls. Claro. Onde mais?', '⚰️ *HAUTAUSMAA!* Mystic Fallsin vanha hautausmaa. Tietenkin. Missä muuallakaan?', '⚰️ *CEMETERY!* The old Mystic Falls cemetery. Of course. Where else?')),
  vid('cemiterio', L('Os corvos não param de gritar.', 'Varikset eivät lakkaa raakkumasta.', 'The crows won\'t stop screaming.')),
  m(L('Estou no portão. A lua já está quase toda vermelha. Tem cinco lápides antigas, uma do lado da outra, bem no meio do nevoeiro.',
      'Olen portilla. Kuu on jo melkein kokonaan punainen. Täällä on viisi vanhaa hautakiveä rivissä, keskellä sumua.',
      'I\'m at the gate. The moon is almost completely red now. There are five old gravestones in a row, right in the middle of the fog.')),
  img('lapides', L('Toque para ampliar e olhar cada lápide.', 'Napauta suurentaaksesi ja katso jokaista hautakiveä.', 'Tap to zoom in and look at each gravestone.'), R),
  m(L('Preso no portão, outro bilhete com a mesma letra do mapa:\n\n_"Ele dorme ao lado de um Salvatore. A pedra dele não tem anjo. E ele não é um Salvatore."_',
      'Porttiin oli kiinnitetty toinen lappu samalla käsialalla kuin kartassa:\n\n_"Hän nukkuu Salvatoren vieressä. Hänen kivessään ei ole enkeliä. Eikä hän ole Salvatore."_',
      'Pinned to the gate, another note in the same handwriting as the map:\n\n_"He sleeps next to a Salvatore. His stone has no angel. And he is not a Salvatore."_'), D, R),
  m(junta(fase(10, nomeFase(10)), L('Olhe as cinco lápides e as três regras. Qual é a lápide certa? Mande o *nome da família*.', 'Katso viittä hautakiveä ja kolmea sääntöä. Mikä on oikea kivi? Lähetä *sukunimi*.', 'Look at the five gravestones and the three rules. Which one is it? Send the *family name*.')), D, R),
];

// ---------- Fase 11: O Espelho da Cripta ----------
const FASE11 = e => [
  m(L('🪦 *FELL!* Empurrei a lápide dos Fell e ela se arrastou sozinha... tinha uma escada descendo para uma cripta.', '🪦 *FELL!* Työnsin Fellien hautakiveä ja se liukui itsestään sivuun... sen alla oli portaat kryptaan.', '🪦 *FELL!* I pushed the Fell gravestone and it slid aside by itself... there were stairs going down into a crypt.'), D, { efeito: 'tremor' }),
  img('estatua', L('Achei. 😨', 'Löysin sen. 😨', 'Found it. 😨')),
  m(L('A estátua do Silas está aqui embaixo. *Rachando.* Sai uma luz vermelha de dentro das rachaduras, igual à cor da lua lá fora.',
      'Silaksen patsas on täällä alhaalla. *Se halkeilee.* Halkeamista loistaa punaista valoa, samanväristä kuin kuu ulkona.',
      'Silas\'s statue is down here. *Cracking.* Red light is shining out of the cracks, the same color as the moon outside.')),
  ...(aliado(e)
    ? [m(L('Tinha uma mulher de capuz fazendo um feitiço em volta da estátua. Uma *Viajante*. Quando ela me viu, gritou, e as velas apagaram.',
          'Patsaan ympärillä huppupäinen nainen teki loitsua. *Matkalainen*. Kun hän näki minut, hän huusi, ja kynttilät sammuivat.',
          'A hooded woman was casting a spell around the statue. A *Traveler*. When she saw me she screamed, and the candles went out.'), D, { efeito: 'glitch' }),
       m(L('Mas o Lucien chegou correndo pela escada e segurou ela. _"Vai, bruxa! Eu cuido dela!"_ Ainda bem que você mandou soltar ele. 🙏',
          'Mutta Lucien juoksi portaita alas ja otti hänet kiinni. _"Mene, noita! Minä hoidan hänet!"_ Onneksi käskit vapauttaa hänet. 🙏',
          'But Lucien came running down the stairs and grabbed her. _"Go, witch! I\'ll handle her!"_ Good thing you told us to release him. 🙏'))]
    : [m(L('E encostado na parede, de braços cruzados, estava ele. *O Lucien.*', 'Ja seinää vasten, kädet ristissä, nojasi hän. *Lucien.*', 'And leaning against the wall, arms crossed, there he was. *Lucien.*'), D, { efeito: 'sangue' }),
       { audio: L('Olá de novo, caçadora. Vocês me deixaram acorrentado no escuro. Então eu vou acordar o Silas... e vou deixar ele cuidar de vocês por mim.',
           'Hei taas, metsästäjä. Jätitte minut kahleisiin pimeään. Joten minä herätän Silaksen... ja annan hänen hoitaa teidät puolestani.',
           'Hello again, hunter. You left me chained up in the dark. So I\'m going to wake Silas... and let him deal with you for me.'), espera: 4000, efeito: 'tremor', repetir: true },
       m(L('Foi ele. E foi por nossa causa. 😔', 'Se oli hän. Ja se oli meidän syytämme. 😔', 'It was him. And it\'s because of us. 😔'), 1800, { apagar: 3500 })]),
  m(L('Na parede tem um espelho velho, todo manchado. E no espelho... uma frase escrita *ao contrário*.', 'Seinällä on vanha, tahrainen peili. Ja peilissä... lause, joka on kirjoitettu *väärin päin*.', 'There\'s an old, stained mirror on the wall. And on the mirror... a sentence written *backwards*.'), D, R),
  img('espelho', L('Leia como se estivesse no espelho.', 'Lue se niin kuin katsoisit peiliin.', 'Read it as if you were looking in a mirror.'), R),
  m(junta(fase(11, nomeFase(11)), L('Leia a frase. O que eu tenho que jogar na estátua para ela parar de rachar?', 'Lue lause. Mitä minun pitää heittää patsaaseen, jotta se lakkaa halkeilemasta?', 'Read the sentence. What do I have to throw on the statue to stop it cracking?')), D, R),
];

// ---------- Fase 12: O Feitiço do Eclipse ----------
export const GRIMORIO_COMPLETO = L(`<?xml version="1.0" encoding="UTF-8"?>
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
`, `<?xml version="1.0" encoding="UTF-8"?>
<!-- BENNETTIN SUVUN SUOJATIEDOSTO :: EHEYS 100% -->
<GrimoireData>
  <Spell id="091">
    <Incantamentum>Ascendo Superous</Incantamentum>
    <Kuu>Taysikuu</Kuu>
    <Ainesosa>Valkoinen_kynttila</Ainesosa>
    <Vaikutus>Nostaa esineita</Vaikutus>
  </Spell>
  <Spell id="093">
    <Incantamentum>Phaesmatos Incendia</Incantamentum>
    <Kuu>Taysikuu</Kuu>
    <Ainesosa>Suola</Ainesosa>
    <Vaikutus>Sytyttaa tulen</Vaikutus>
  </Spell>
  <Spell id="101">
    <Incantamentum>Sanguinem Lunae</Incantamentum>
    <Kuu>Verikuu</Kuu>
    <Ainesosa>Verbena</Ainesosa>
    <Vaikutus>Herattaa</Vaikutus>
    <!-- ALA KOSKAAN kayta lumotun kiven lahella -->
  </Spell>
  <Spell id="105">
    <Incantamentum>Silentium Petra</Incantamentum>
    <Kuu>Taysikuu</Kuu>
    <Ainesosa>Verbena</Ainesosa>
    <Vaikutus>Sinetoi</Vaikutus>
  </Spell>
  <Spell id="108">
    <Incantamentum>Quietus Aeternum</Incantamentum>
    <Kuu>Verikuu</Kuu>
    <Ainesosa>Verbena</Ainesosa>
    <Vaikutus>Sinetoi</Vaikutus>
  </Spell>
  <Spell id="112">
    <Incantamentum>Motus Obscura</Incantamentum>
    <Kuu>Verikuu</Kuu>
    <Ainesosa>Suola</Ainesosa>
    <Vaikutus>Sinetoi</Vaikutus>
  </Spell>
</GrimoireData>
`, `<?xml version="1.0" encoding="UTF-8"?>
<!-- BENNETT CLAN PROTECTION FILE :: INTEGRITY 100% -->
<GrimoireData>
  <Spell id="091">
    <Incantamentum>Ascendo Superous</Incantamentum>
    <Moon>Full</Moon>
    <Component>White_Candle</Component>
    <Effect>Lift objects</Effect>
  </Spell>
  <Spell id="093">
    <Incantamentum>Phaesmatos Incendia</Incantamentum>
    <Moon>Full</Moon>
    <Component>Salt</Component>
    <Effect>Light a fire</Effect>
  </Spell>
  <Spell id="101">
    <Incantamentum>Sanguinem Lunae</Incantamentum>
    <Moon>Blood</Moon>
    <Component>Vervain</Component>
    <Effect>Awaken</Effect>
    <!-- NEVER use near enchanted stone -->
  </Spell>
  <Spell id="105">
    <Incantamentum>Silentium Petra</Incantamentum>
    <Moon>Full</Moon>
    <Component>Vervain</Component>
    <Effect>Seal</Effect>
  </Spell>
  <Spell id="108">
    <Incantamentum>Quietus Aeternum</Incantamentum>
    <Moon>Blood</Moon>
    <Component>Vervain</Component>
    <Effect>Seal</Effect>
  </Spell>
  <Spell id="112">
    <Incantamentum>Motus Obscura</Incantamentum>
    <Moon>Blood</Moon>
    <Component>Salt</Component>
    <Effect>Seal</Effect>
  </Spell>
</GrimoireData>
`);

const FASE12 = e => [
  m(L('🌿 *VERBENA!* Joguei o saquinho de verbena que eu carrego sempre. A pedra chiou e soltou fumaça... e as rachaduras pararam de crescer.',
      '🌿 *VERBENA!* Heitin verbenapussin, jota kannan aina mukanani. Kivi sihisi ja savusi... ja halkeamat lakkasivat kasvamasta.',
      '🌿 *VERVAIN!* I threw the little bag of vervain I always carry. The stone hissed and smoked... and the cracks stopped growing.'), D, { efeito: 'glitch' }),
  aliado(e)
    ? m(L('A Viajante fugiu pela escada, e o Lucien foi atrás dela. Agora sou só eu e a estátua.', 'Matkalainen pakeni portaita ylös, ja Lucien lähti hänen peräänsä. Nyt täällä olemme vain minä ja patsas.', 'The Traveler ran up the stairs, and Lucien went after her. Now it\'s just me and the statue.'))
    : m(L('O Lucien deu um passo para trás. A verbena queima ele também. Mas ele não vai embora: está esperando a lua ficar toda vermelha.',
          'Lucien astui taaksepäin. Verbena polttaa häntäkin. Mutta hän ei lähde: hän odottaa, että kuu muuttuu kokonaan punaiseksi.',
          'Lucien took a step back. Vervain burns him too. But he isn\'t leaving: he\'s waiting for the moon to turn completely red.')),
  m(L('Mas a verbena só segura por pouco tempo. Para selar o Silas *para sempre*, eu preciso falar o feitiço certo antes do eclipse acabar. ⏳',
      'Mutta verbena pitää vain vähän aikaa. Sinetöidäkseni Silaksen *ikuisiksi ajoiksi* minun pitää lausua oikea loitsu ennen kuin pimennys loppuu. ⏳',
      'But vervain only holds for a little while. To seal Silas *forever*, I need to say the right spell before the eclipse ends. ⏳')),
  m(L('Agora que minha memória voltou, o arquivo do meu clã também voltou inteiro. Olha:', 'Nyt kun muistini palasi, myös sukuni tiedosto palasi kokonaisena. Katso:', 'Now that my memory is back, my clan\'s file came back whole too. Look:')),
  { arquivo: { nome: L('grimorio_completo.xml', 'loitsukirja_kokonainen.xml', 'grimoire_complete.xml'), mime: 'text/xml', conteudo: GRIMORIO_COMPLETO }, texto: L('📜 Grimório Bennett · 100%', '📜 Bennettien loitsukirja · 100%', '📜 Bennett grimoire · 100%'), espera: 2000, repetir: true },
  m(L('Cuidado: tem feitiço aí que *acorda* em vez de selar. Eu preciso de um que:\n• funcione na *lua de sangue*\n• use *verbena* (é o que eu tenho aqui)\n• *sele* a pedra',
      'Varo: siellä on loitsu, joka *herättää* eikä sinetöi. Tarvitsen loitsun, joka:\n• toimii *verikuun* aikana\n• käyttää *verbenaa* (sitä minulla on)\n• *sinetöi* kiven',
      'Careful: there\'s a spell in there that *awakens* instead of sealing. I need one that:\n• works on a *blood moon*\n• uses *vervain* (that\'s what I have)\n• *seals* the stone'), D, R),
  m(junta(fase(12, nomeFase(12)), L('Qual feitiço eu falo? Mande o nome dele.', 'Minkä loitsun lausun? Lähetä sen nimi.', 'Which spell do I say? Send its name.')), D, R),
];

const CAPITULO3 = L('Capítulo 3 ▶', 'Luku 3 ▶', 'Chapter 3 ▶');
const CHAMADO3 = m(L('📩 Chegou um envelope preto por baixo da minha porta... com a letra *K*.', '📩 Oveni alta työnnettiin musta kirjekuori... jossa on kirjain *K*.', '📩 A black envelope just slid under my door... marked with the letter *K*.'), 2500, { efeito: 'glitch', opcoes: [CAPITULO3] });

const OBRIGADA = m(L('Obrigada, caçadora. Sem você eu ainda estaria acordando no chão da floresta sem lembrar meu próprio nome. 💜\n\n— Bonnie Bennett',
  'Kiitos, metsästäjä. Ilman sinua heräisin yhä metsän maasta muistamatta omaa nimeäni. 💜\n\n— Bonnie Bennett',
  'Thank you, hunter. Without you I\'d still be waking up on the forest floor, unable to remember my own name. 💜\n\n— Bonnie Bennett'));
const REINICIAR = L('reiniciar', 'aloita alusta', 'restart');

const FIM_ALIADO = [
  m('✨ *QUIETUS AETERNUM!*', 1500, { efeito: 'tremor' }),
  m(L('Falei três vezes, com a mão na pedra. As rachaduras brilharam muito forte... e depois foram se apagando, uma por uma.', 'Sanoin sen kolme kertaa käsi kivellä. Halkeamat hehkuivat tosi kirkkaasti... ja sitten ne sammuivat yksi kerrallaan.', 'I said it three times, with my hand on the stone. The cracks glowed really bright... and then went dark, one by one.')),
  vid('selo', ''),
  m(L('O Lucien voltou com a Viajante amarrada com corda de verbena. Ela contou que queria o Silas acordado para quebrar todos os feitiços do mundo. Agora ela vai ficar presa no túmulo dos 27, pelo menos até a próxima lua.',
      'Lucien palasi Matkalaisen kanssa, joka oli sidottu verbenaköydellä. Hän kertoi halunneensa herättää Silaksen rikkoakseen kaikki maailman loitsut. Nyt hän jää vangiksi 27 vampyyrin hautaan, ainakin seuraavaan kuuhun asti.',
      'Lucien came back with the Traveler tied up in vervain rope. She said she wanted Silas awake to break every spell in the world. Now she\'ll stay locked in the tomb of the 27, at least until the next moon.')),
  m(L('Lá fora, a lua voltou a ser branca. 🌕 O Lucien me deu um anel de lápis-lazúli de presente: _"Para a caçadora. Caso um dia ela precise andar com vampiros no sol."_',
      'Ulkona kuu on taas valkoinen. 🌕 Lucien antoi minulle lahjaksi lapis lazuli -sormuksen: _"Metsästäjälle. Jos hän joskus tarvitsee kulkea vampyyrien kanssa auringossa."_',
      'Outside, the moon is white again. 🌕 Lucien gave me a lapis lazuli ring as a gift: _"For the hunter. In case she ever needs to walk with vampires in the sun."_')),
  OBRIGADA,
  m(L('🏆 *FIM DO CAPÍTULO 2: Amigos de Sangue*\nVocê confiou no Lucien e ganhou um aliado para sempre.\n\n_...mas alguém estava olhando o cemitério de longe._',
      '🏆 *LUKU 2 PÄÄTTYI: Veriystävät*\nLuotit Lucieniin ja sait liittolaisen ikuisiksi ajoiksi.\n\n_...mutta joku katseli hautausmaata kaukaa._',
      '🏆 *END OF CHAPTER 2: Blood Friends*\nYou trusted Lucien and gained an ally forever.\n\n_...but someone was watching the cemetery from afar._'), 1500),
  { fantasma: true, espera: 2500 },
  CHAMADO3,
];

const FIM_SOMBRA = [
  m('✨ *QUIETUS AETERNUM!*', 1500, { efeito: 'tremor' }),
  m(L('Falei três vezes, com a mão na pedra. O Lucien pulou em cima de mim para me parar... mas o feitiço já estava feito.', 'Sanoin sen kolme kertaa käsi kivellä. Lucien hyppäsi päälleni pysäyttääkseen minut... mutta loitsu oli jo tehty.', 'I said it three times, with my hand on the stone. Lucien leapt at me to stop me... but the spell was already done.')),
  vid('selo', ''),
  m(L('A luz vermelha saiu da estátua de uma vez só e empurrou o Lucien contra a parede. A pedra do Silas ficou lisinha, sem nenhuma rachadura. *Selado para sempre.*',
      'Punainen valo purkautui patsaasta kerralla ja paiskasi Lucienin seinää vasten. Silaksen kivi muuttui sileäksi, ilman ainuttakaan halkeamaa. *Sinetöity ikuisiksi ajoiksi.*',
      'The red light burst out of the statue all at once and threw Lucien against the wall. Silas\'s stone became perfectly smooth, without a single crack. *Sealed forever.*')),
  m(L('O Lucien ficou olhando para mim um tempão. Depois disse: _"Talvez vocês tivessem razão de não confiar em mim."_ E foi embora pela escada, devagar. Sem ameaça nenhuma.',
      'Lucien katsoi minua pitkään. Sitten hän sanoi: _"Ehkä teillä oli syytä olla luottamatta minuun."_ Ja hän lähti portaita ylös, hitaasti. Ilman ainuttakaan uhkausta.',
      'Lucien stared at me for a long time. Then he said: _"Maybe you were right not to trust me."_ And he walked up the stairs, slowly. Without a single threat.'), D, { apagar: 9000 }),
  m(L('Lá fora, a lua voltou a ser branca. 🌕 Acho que ele não volta. Acho.', 'Ulkona kuu on taas valkoinen. 🌕 Luulen, ettei hän palaa. Luulen.', 'Outside, the moon is white again. 🌕 I don\'t think he\'ll come back. I think.')),
  OBRIGADA,
  m(L('🏆 *FIM DO CAPÍTULO 2: A Lua Branca*\nVocê selou o Silas sozinha, mesmo com um inimigo no escuro.\n\n_...mas alguém estava olhando o cemitério de longe._',
      '🏆 *LUKU 2 PÄÄTTYI: Valkoinen kuu*\nSinetöit Silaksen yksin, vaikka vihollinen odotti pimeässä.\n\n_...mutta joku katseli hautausmaata kaukaa._',
      '🏆 *END OF CHAPTER 2: The White Moon*\nYou sealed Silas on your own, even with an enemy in the dark.\n\n_...but someone was watching the cemetery from afar._'), 1500),
  { fantasma: true, espera: 2500 },
  CHAMADO3,
];

// ================= CAPÍTULO 3: O Baile de Máscaras =================
// A Katherine Pierce (a sósia da Elena) voltou e quer a pedra da lua. A escolha da fase 16 dá dois finais.
const DESTRUIR = L('Destruir a pedra', 'Tuhoa kivi', 'Destroy the stone'), ENTREGAR = L('Entregar à Katherine', 'Anna Katherinelle', 'Give it to Katherine');

// ---------- Fase 13: O Convite ----------
const FASE13 = e => [
  { capitulo: L('CAPÍTULO 3', 'LUKU 3', 'CHAPTER 3'), titulo: L('O Baile de Máscaras', 'Naamiaiset', 'The Masquerade Ball'), texto: L('🎭 *CAPÍTULO 3*\n_O Baile de Máscaras_', '🎭 *LUKU 3*\n_Naamiaiset_', '🎭 *CHAPTER 3*\n_The Masquerade Ball_'), espera: 800 },
  m(L('Caçadora, sou eu, a Bonnie. Abri o envelope preto. É um *convite* para o baile de máscaras na mansão Lockwood, hoje à noite.',
      'Metsästäjä, Bonnie täällä. Avasin mustan kirjekuoren. Se on *kutsu* naamiaisiin Lockwoodin kartanossa tänä iltana.',
      'Hunter, it\'s Bonnie. I opened the black envelope. It\'s an *invitation* to the masquerade ball at the Lockwood mansion, tonight.')),
  m(L('Só tem uma pessoa nesta cidade que assina só com a letra *K*: a *Katherine Pierce*. Ela é igualzinha à Elena, mas é uma vampira de 500 anos. E ela nunca aparece por acaso. 😰',
      'Tässä kaupungissa vain yksi allekirjoittaa pelkällä *K*-kirjaimella: *Katherine Pierce*. Hän näyttää täsmälleen Elenalta, mutta on 500-vuotias vampyyri. Eikä hän koskaan ilmesty sattumalta. 😰',
      'Only one person in this town signs with just the letter *K*: *Katherine Pierce*. She looks exactly like Elena, but she\'s a 500-year-old vampire. And she never shows up by accident. 😰')),
  aliado(e)
    ? m(L('O Lucien vai comigo, disfarçado de garçom. Ele disse que conhece a Katherine "de outros séculos".', 'Lucien tulee mukaani tarjoilijaksi naamioituneena. Hän sanoo tuntevansa Katherinen "muilta vuosisadoilta".', 'Lucien is coming with me, disguised as a waiter. He says he knows Katherine "from other centuries".'))
    : m(L('O Damon vai comigo. Ele não quis dizer como, mas ele conhece a Katherine muito bem. Bem demais.', 'Damon tulee mukaani. Hän ei halunnut kertoa miten, mutta hän tuntee Katherinen tosi hyvin. Liiankin hyvin.', 'Damon is coming with me. He wouldn\'t say how, but he knows Katherine very well. Too well.')),
  vid('baile', L('Cheguei. Todo mundo de máscara. 🎭', 'Olen perillä. Kaikilla on naamiot. 🎭', 'I\'m here. Everyone is wearing a mask. 🎭')),
  m(L('No verso do convite tem um recado:\n\n_"Me encontre no salão. Eu estarei com a máscara que fica *à esquerda da dourada*, que *não é vermelha* e que *não tem penas*. — K."_',
      'Kutsun takana on viesti:\n\n_"Tapaa minut salissa. Minulla on naamio, joka on *kultaisen vasemmalla puolella*, joka *ei ole punainen* ja jossa *ei ole sulkia*. — K."_',
      'On the back of the invitation there\'s a note:\n\n_"Meet me in the ballroom. I\'ll be wearing the mask that is *to the left of the gold one*, that is *not red* and that has *no feathers*. — K."_'), D, R),
  img('mascaras', L('As cinco máscaras perto da escada. Toque para ampliar.', 'Viisi naamiota portaiden luona. Napauta suurentaaksesi.', 'The five masks by the staircase. Tap to zoom in.'), R),
  m(junta(fase(13, nomeFase(13)), L('Qual é a máscara da Katherine? Mande a *cor* dela.', 'Mikä on Katherinen naamio? Lähetä sen *väri*.', 'Which mask is Katherine\'s? Send its *color*.')), D, R),
];

// ---------- Fase 14: A Caixinha de Música ----------
const FASE14 = () => [
  m(L('🩶 *PRATA!* Fui até a mulher de máscara prateada. Ela tirou a máscara devagar e sorriu. Era a Katherine.', '🩶 *HOPEA!* Menin hopeanaamioisen naisen luo. Hän otti naamion hitaasti pois ja hymyili. Se oli Katherine.', '🩶 *SILVER!* I walked up to the woman in the silver mask. She slowly took it off and smiled. It was Katherine.')),
  { audio: L('Olá, bruxinha. Eu não vim brigar. Eu vim buscar uma coisa que é minha: a pedra da lua. Ela está escondida nesta casa, numa caixinha de música. Você abre a caixinha, e eu te conto onde está o Stefan.',
      'Hei, pikku noita. En tullut tappelemaan. Tulin hakemaan jotain, mikä kuuluu minulle: kuukiven. Se on piilotettu tähän taloon, soittorasiaan. Sinä avaat rasian, ja minä kerron, missä Stefan on.',
      'Hello, little witch. I didn\'t come to fight. I came for something that belongs to me: the moonstone. It\'s hidden in this house, in a music box. You open the box, and I\'ll tell you where Stefan is.'), espera: 4500, repetir: true },
  m(L('O Stefan! Ele está sumido desde o capítulo 1... 😨 A caixinha estava na biblioteca dos Lockwood. Ela não tem chave: tem um cadeado com desenhos da lua.',
      'Stefan! Hän on ollut kateissa luvusta 1 asti... 😨 Soittorasia oli Lockwoodien kirjastossa. Siinä ei ole avainta: siinä on lukko, jossa on kuun kuvia.',
      'Stefan! He\'s been missing since chapter 1... 😨 The music box was in the Lockwood library. It has no key: it has a lock with pictures of the moon.'), D, { efeito: 'glitch' }),
  img('caixinha', L('A tampa da caixinha. Falta a última lua.', 'Rasian kansi. Viimeinen kuu puuttuu.', 'The lid of the box. The last moon is missing.'), R),
  m(L('Gravado embaixo: _"A lua sempre volta pelo mesmo caminho."_', 'Alle on kaiverrettu: _"Kuu palaa aina samaa tietä."_', 'Engraved underneath: _"The moon always comes back the same way."_'), D, R),
  m(junta(fase(14, nomeFase(14)), L('Que lua falta no lugar do *?* Mande o nome dela (ou o desenho 🌑🌒🌓🌔🌕🌖🌗🌘).', 'Mikä kuu puuttuu *?*-kohdasta? Lähetä sen nimi (tai kuva 🌑🌒🌓🌔🌕🌖🌗🌘).', 'Which moon goes where the *?* is? Send its name (or the picture 🌑🌒🌓🌔🌕🌖🌗🌘).')), D, R),
];

// ---------- Fase 15: Os Dois Rostos ----------
const FASE15 = () => [
  m(L('🌑 *LUA NOVA!* A caixinha tocou uma valsa e abriu. Lá dentro: a *pedra da lua*, brilhando azul. Eu guardei no bolso antes que a Katherine visse.', '🌑 *UUSIKUU!* Soittorasia soitti valssin ja aukesi. Sisällä oli *kuukivi*, joka hehkui sinisenä. Pistin sen taskuuni ennen kuin Katherine näki.', '🌑 *NEW MOON!* The music box played a waltz and opened. Inside: the *moonstone*, glowing blue. I slipped it into my pocket before Katherine could see.')),
  m(L('Voltei para o salão... e a luz apagou. Quando acendeu, tinha *duas* moças iguais no meio da pista. Mesmo vestido, mesmo cabelo liso, mesmo colar. Uma é a Elena. A outra é a Katherine.',
      'Palasin saliin... ja valot sammuivat. Kun ne syttyivät, tanssilattian keskellä oli *kaksi* samannäköistä tyttöä. Sama mekko, samat suorat hiukset, sama kaulakoru. Toinen on Elena. Toinen on Katherine.',
      'I went back to the ballroom... and the lights went out. When they came back on, there were *two* identical girls in the middle of the dance floor. Same dress, same straight hair, same necklace. One is Elena. The other is Katherine.'), D, { efeito: 'tremor' }),
  m(L('As duas disseram ao mesmo tempo: _"Bonnie, sou eu, a Elena! Me dá a pedra, rápido!"_', 'Molemmat sanoivat yhtä aikaa: _"Bonnie, minä olen Elena! Anna kivi minulle, nopeasti!"_', 'They both said at the same time: _"Bonnie, it\'s me, Elena! Give me the stone, quick!"_'), 2000, { efeito: 'glitch' }),
  img('rostos', L('Olha bem as duas. Toque para ampliar.', 'Katso molempia tarkkaan. Napauta suurentaaksesi.', 'Look closely at both. Tap to zoom in.'), R),
  m(L('Lembra: o colar da Elena tem *verbena* dentro. A Katherine pode copiar o cabelo, o vestido e o colar... mas verbena *queima a pele* dela.',
      'Muista: Elenan kaulakorussa on *verbenaa*. Katherine voi kopioida hiukset, mekon ja korun... mutta verbena *polttaa hänen ihoaan*.',
      'Remember: Elena\'s necklace has *vervain* inside. Katherine can copy the hair, the dress and the necklace... but vervain *burns her skin*.'), D, R),
  m(junta(fase(15, nomeFase(15)), L('Qual é a Katherine: a número *1* ou a número *2*?', 'Kumpi on Katherine: numero *1* vai numero *2*?', 'Which one is Katherine: number *1* or number *2*?')), D, { repetir: true, opcoes: ['1', '2'] }),
];

// ---------- Fase 16: A Pedra da Lua ----------
const FASE16 = e => [
  m(L('🧤 *A NÚMERO 1!* Ela estava de *luvas* para conseguir tocar no colar de verbena sem se queimar. A número 2 segurava o colar com a mão nua: essa é a Elena de verdade.',
      '🧤 *NUMERO 1!* Hänellä oli *hansikkaat*, jotta hän voisi koskea verbenakorua palamatta. Numero 2 piti korua paljaalla kädellä: hän on oikea Elena.',
      '🧤 *NUMBER 1!* She was wearing *gloves* so she could touch the vervain necklace without getting burned. Number 2 held the necklace with her bare hand: she\'s the real Elena.')),
  m(aliado(e)
    ? L('O Lucien segurou a Katherine pelo braço antes que ela fugisse. Ela riu: _"Tudo bem, vocês ganharam. Vamos negociar."_', 'Lucien tarttui Katherinea käsivarresta ennen kuin hän ehti paeta. Hän nauroi: _"Hyvä on, voititte. Neuvotellaan."_', 'Lucien grabbed Katherine by the arm before she could run. She laughed: _"Fine, you win. Let\'s make a deal."_')
    : L('O Damon se colocou na frente da porta. A Katherine riu: _"Damon, sempre tão previsível. Tudo bem, vamos negociar."_', 'Damon asettui oven eteen. Katherine nauroi: _"Damon, aina niin ennalta-arvattava. Hyvä on, neuvotellaan."_', 'Damon stepped in front of the door. Katherine laughed: _"Damon, always so predictable. Fine, let\'s make a deal."_'), D, { efeito: 'glitch' }),
  { audio: L('A pedra da lua pode quebrar uma maldição muito antiga. Se você me der a pedra, eu te digo onde o Stefan está preso, e vocês salvam ele hoje. Se você destruir a pedra... boa sorte procurando ele sozinha.',
      'Kuukivi voi murtaa ikivanhan kirouksen. Jos annat kiven minulle, kerron missä Stefan on vangittuna, ja voitte pelastaa hänet tänään. Jos tuhoat kiven... onnea, kun etsit häntä yksin.',
      'The moonstone can break a very old curse. If you give me the stone, I\'ll tell you where Stefan is trapped, and you can save him tonight. If you destroy the stone... good luck finding him on your own.'), espera: 4500, repetir: true },
  m(L('Eu posso destruir a pedra com um feitiço agora mesmo. Ninguém nunca mais usa ela para o mal. Mas aí a gente fica sem saber onde o Stefan está...\n\nOu eu entrego a pedra, e a gente salva o Stefan hoje. Mas a Katherine fica com um poder que ninguém sabe qual é.',
      'Voin tuhota kiven loitsulla heti. Kukaan ei voi enää koskaan käyttää sitä pahaan. Mutta silloin emme tiedä, missä Stefan on...\n\nTai annan kiven, ja pelastamme Stefanin tänään. Mutta Katherine saa voiman, josta kukaan ei tiedä mitään.',
      'I can destroy the stone with a spell right now. Nobody could ever use it for evil again. But then we won\'t know where Stefan is...\n\nOr I give her the stone, and we save Stefan tonight. But Katherine gets a power nobody knows anything about.'), D, R),
  m(junta(fase(16, nomeFase(16)), L('A decisão é sua, caçadora. *Destruir* a pedra ou *entregar* à Katherine?', 'Sinä päätät, metsästäjä. *Tuhotaanko* kivi vai *annetaanko* se Katherinelle?', 'It\'s your call, hunter. *Destroy* the stone or *give* it to Katherine?')), D, { repetir: true, opcoes: [DESTRUIR, ENTREGAR] }),
];

const FIM_PEDRA = e => [
  m(L('💥 Eu *destruí* a pedra.', '💥 Minä *tuhosin* kiven.', '💥 I *destroyed* the stone.'), 2000, { efeito: 'tremor' }),
  m(L('Segurei a pedra com as duas mãos e falei o feitiço da minha avó. Ela rachou, brilhou azul uma última vez... e virou pó prateado no chão do salão.', 'Pidin kiveä molemmin käsin ja lausuin isoäitini loitsun. Se halkesi, hehkui sinisenä viimeisen kerran... ja muuttui hopeiseksi pölyksi salin lattialle.', 'I held the stone with both hands and said my grandma\'s spell. It cracked, glowed blue one last time... and turned into silver dust on the ballroom floor.')),
  m(L('A Katherine gritou e sumiu pela janela em meio segundo. Mas ela deixou cair uma coisa: o *celular* dela. E a última mensagem dizia: _"Stefan — porão da velha igreja."_ 😮',
      'Katherine huusi ja katosi ikkunasta puolessa sekunnissa. Mutta häneltä putosi jotain: hänen *puhelimensa*. Ja viimeisessä viestissä luki: _"Stefan — vanhan kirkon kellari."_ 😮',
      'Katherine screamed and vanished through the window in half a second. But she dropped something: her *phone*. And the last message said: _"Stefan — old church cellar."_ 😮')),
  m(aliado(e)
    ? L('Eu, o Lucien e o Damon corremos até lá e tiramos o Stefan das correntes antes do sol nascer. Ele está fraco, mas está vivo. 🙏', 'Minä, Lucien ja Damon juoksimme sinne ja vapautimme Stefanin kahleista ennen auringonnousua. Hän on heikko, mutta elossa. 🙏', 'Lucien, Damon and I ran there and freed Stefan from the chains before sunrise. He\'s weak, but he\'s alive. 🙏')
    : L('Eu e o Damon corremos até lá e tiramos o Stefan das correntes antes do sol nascer. Ele está fraco, mas está vivo. 🙏', 'Damon ja minä juoksimme sinne ja vapautimme Stefanin kahleista ennen auringonnousua. Hän on heikko, mutta elossa. 🙏', 'Damon and I ran there and freed Stefan from the chains before sunrise. He\'s weak, but he\'s alive. 🙏')),
  vid('final_baile', ''),
  OBRIGADA,
  m(L('🏆 *FINAL C: A Pedra Partida*\nVocê terminou os 3 capítulos da Operação Mystic Falls! Não fez trato com a Katherine e mesmo assim salvou o Stefan.\n\nMande *reiniciar* para jogar de novo: escolhas diferentes nas fases 7 e 16 mudam a história.',
      '🏆 *LOPPU C: Särkynyt kivi*\nPelasit Operaatio Mystic Fallsin kaikki 3 lukua! Et tehnyt sopimusta Katherinen kanssa ja pelastit silti Stefanin.\n\nKirjoita *aloita alusta* pelataksesi uudelleen: eri valinnat tasoilla 7 ja 16 muuttavat tarinaa.',
      '🏆 *ENDING C: The Broken Stone*\nYou finished all 3 chapters of Operation Mystic Falls! You made no deal with Katherine and still saved Stefan.\n\nSend *restart* to play again: different choices in levels 7 and 16 change the story.'), 1500, { opcoes: [REINICIAR] }),
];

const FIM_TRATO = () => [
  m(L('🤝 Eu *entreguei* a pedra para a Katherine.', '🤝 Minä *annoin* kiven Katherinelle.', '🤝 I *gave* the stone to Katherine.'), 2000),
  m(L('Ela segurou a pedra, fechou os olhos e sorriu como quem esperou 500 anos por isso. Depois cochichou no meu ouvido: _"Porão da velha igreja. Corram."_', 'Hän piti kiveä, sulki silmänsä ja hymyili kuin olisi odottanut tätä 500 vuotta. Sitten hän kuiskasi korvaani: _"Vanhan kirkon kellari. Juoskaa."_', 'She held the stone, closed her eyes and smiled like someone who had waited 500 years for this. Then she whispered in my ear: _"The old church cellar. Run."_')),
  m(L('Ela cumpriu a promessa! O Stefan estava lá, acorrentado. A gente salvou ele antes do sol nascer. 🙏', 'Hän piti lupauksensa! Stefan oli siellä kahleissa. Pelastimme hänet ennen auringonnousua. 🙏', 'She kept her promise! Stefan was there, in chains. We saved him before sunrise. 🙏')),
  m(L('Mas quando o sol nasceu... eu vi a Katherine andando na praça, *em pleno sol*, sem anel nenhum. A maldição dela quebrou. Agora ela é mais forte do que nunca. 😶', 'Mutta kun aurinko nousi... näin Katherinen kävelevän aukiolla *keskellä auringonpaistetta* ilman sormusta. Hänen kirouksensa murtui. Nyt hän on vahvempi kuin koskaan. 😶', 'But when the sun came up... I saw Katherine walking across the square *in broad daylight*, without any ring. Her curse is broken. Now she\'s stronger than ever. 😶'), D, { efeito: 'glitch' }),
  vid('final_baile', ''),
  OBRIGADA,
  m(L('🏆 *FINAL D: O Trato com Katherine*\nVocê terminou os 3 capítulos da Operação Mystic Falls! Salvou o Stefan, mas deu poder a quem não devia.\n\nMande *reiniciar* para jogar de novo: escolhas diferentes nas fases 7 e 16 mudam a história.',
      '🏆 *LOPPU D: Sopimus Katherinen kanssa*\nPelasit Operaatio Mystic Fallsin kaikki 3 lukua! Pelastit Stefanin, mutta annoit voimaa väärälle henkilölle.\n\nKirjoita *aloita alusta* pelataksesi uudelleen: eri valinnat tasoilla 7 ja 16 muuttavat tarinaa.',
      '🏆 *ENDING D: The Deal with Katherine*\nYou finished all 3 chapters of Operation Mystic Falls! You saved Stefan, but gave power to the wrong person.\n\nSend *restart* to play again: different choices in levels 7 and 16 change the story.'), 1500, { opcoes: [REINICIAR] }),
];

const FASES = { 1: FASE1, 2: FASE2, 3: FASE3, 4: FASE4, 5: FASE5, 6: FASE6, 7: FASE7, 8: FASE8, 9: FASE9, 10: FASE10, 11: FASE11, 12: FASE12, 13: FASE13, 14: FASE14, 15: FASE15, 16: FASE16 };
const msgsDaFase = (fase, e) => typeof FASES[fase] === 'function' ? FASES[fase](e) : FASES[fase];
// o que é reenviado quando a jogadora pede "repetir"
const pistas = (fase, e) => msgsDaFase(fase, e).filter(x => x.repetir).map(({ apagar, efeito, ...x }) => ({ ...x, espera: 1200 }));

const DICAS = {
  1: [L('Não é o feitiço nem o ingrediente. Procure uma etiqueta com a palavra *Arma*.', 'Se ei ole loitsu eikä ainesosa. Etsi kohta, jossa lukee *Ase*.', 'It\'s not the spell or the ingredient. Look for a tag with the word *Weapon*.'),
      L('Olha o feitiço de id *093*, na linha <ArmaSecreta>. Os sublinhados ( _ ) são espaços.', 'Katso loitsua, jonka id on *093*, riviltä <SalainenAse>. Alaviivat ( _ ) ovat välilyöntejä.', 'Look at the spell with id *093*, on the <SecretWeapon> line. The underscores ( _ ) are spaces.')],
  2: [L('Leia a frase inteira começando pela última letra: o "P" no fim de "erucorP" é a primeira letra da resposta.', 'Lue koko lause viimeisestä kirjaimesta alkaen: "eluT"-sanan "T" on ensimmäinen kirjain.', 'Read the whole sentence starting from the last letter: the "M" at the end of "teeM" is the first letter.'),
      L('Ao contrário fica "Procure no Mystic ____". Qual é o lugar?', 'Takaperin siinä lukee "Tule Mystic ____". Mikä paikka?', 'Backwards it says "Meet at Mystic ____". What is the place?')],
  3: [L('"O mais importante está sempre no começo"... no começo de cada *linha*.', '"Tärkein on aina alussa"... jokaisen *rivin* alussa.', '"The most important thing is always at the beginning"... at the beginning of each *line*.'),
      L('Junte a primeira letra de cada uma das 5 linhas do diário: P, O, N...', 'Yhdistä päiväkirjan viiden rivin ensimmäiset kirjaimet: S, I, L...', 'Put together the first letter of each of the 6 lines of the diary: B, R, I...')],
  4: [L('É uma conta de menos: 2009 − 145.', 'Se on vähennyslasku: 2009 − 145.', 'It\'s a subtraction: 2009 − 145.'),
      L('O resultado começa com 18...', 'Vastaus alkaa 18...', 'The answer starts with 18...')],
  5: [L('Vampiro no sol só sobrevive com um anel de lápis-lazúli. E verbena queima vampiros.', 'Vampyyri selviää auringossa vain lapis lazuli -sormuksen kanssa. Ja verbena polttaa vampyyreja.', 'A vampire only survives in the sun with a lapis lazuli ring. And vervain burns vampires.'),
      L('Quem chegou só à noite, não comeu nada e esconde um anel azul?', 'Kuka tuli vasta illalla, ei syönyt mitään ja piilottaa sinistä sormusta?', 'Who only arrived at night, ate nothing and hides a blue ring?')],
  6: [L('"Vinte e sete dormiram por 145 anos": é o mesmo lugar da frase da caixa de ferro.', '"Kaksikymmentäseitsemän nukkui 145 vuotta": se on sama paikka kuin rautalaatikon lauseessa.', '"Twenty-seven slept for 145 years": it\'s the same place as in the sentence on the iron box.'),
      L('Os 27 vampiros ficaram trancados num túmulo embaixo de uma construção da cidade. Qual?', '27 vampyyriä oli lukittuna hautaan kaupungin erään rakennuksen alle. Minkä?', 'The 27 vampires were locked in a tomb under a building in town. Which one?')],
  7: [L('Não tem resposta errada aqui. Escreva *soltar* ou *preso*.', 'Tässä ei ole väärää vastausta. Kirjoita *vapauta* tai *vankina*.', 'There\'s no wrong answer here. Write *release* or *keep locked*.'),
      L('Escreva *soltar* ou *preso*.', 'Kirjoita *vapauta* tai *vankina*.', 'Write *release* or *keep locked*.')],
  8: [L('*C4*: ache a coluna C (em cima) e desça até a linha 4. Que letra está ali?', '*D2*: etsi sarake D (ylhäällä) ja mene alas riville 2. Mikä kirjain siellä on?', '*B3*: find column B (at the top) and go down to row 3. What letter is there?'),
      L('C4 = P, A2 = O... faltam E5 e B1. É um lugar com água lá no fundo.', 'D2 = K, A4 = A... puuttuu vielä C1, E3 ja B5. Se on paikka, jonka pohjalla on vettä.', 'B3 = W, E1 = E... you still need A5 and D4. It\'s a place with water at the bottom.')],
  9: [L('F volta três: F → E → D → *C*. H volta três: H → G → F → *E*. Continue assim.', 'K kolme taaksepäin: K → J → I → *H*. D kolme taaksepäin: D → C → B → *A*. Jatka samoin.', 'F goes back three: F → E → D → *C*. H goes back three: H → G → F → *E*. Keep going.'),
      L('Começa com C-E-M-I... É um lugar com lápides.', 'Alkaa H-A-U-T-A... Siellä on hautakiviä.', 'It starts with C-E-M-E... It\'s a place with gravestones.')],
  10: [L('Primeiro, risque as lápides que têm anjo em cima. Depois, risque os Salvatore.', 'Yliviivaa ensin kivet, joiden päällä on enkeli. Sitten yliviivaa Salvatoret.', 'First, cross out the gravestones with an angel on top. Then cross out the Salvatores.'),
       L('Sobrou só uma lápide que fica do lado de um Salvatore. Qual é o nome escrito nela?', 'Jäljelle jää vain yksi kivi Salvatoren vieressä. Mikä nimi siinä lukee?', 'Only one stone is left next to a Salvatore. What name is written on it?')],
  11: [L('Leia cada palavra de trás para frente, da direita para a esquerda. Ou vire o celular na frente de um espelho de verdade! 🪞', 'Lue jokainen sana takaperin, oikealta vasemmalle. Tai pidä puhelinta oikean peilin edessä! 🪞', 'Read each word backwards, from right to left. Or hold your phone up to a real mirror! 🪞'),
       L('É "a erva roxa que queima os vampiros". Lembra o que o Tristan bebeu no chá?', 'Se on "violetti yrtti, joka polttaa vampyyreja". Muistatko, mitä Tristan joi teessään?', 'It\'s "the purple herb that burns vampires". Remember what Tristan drank in his tea?')],
  12: [L('Risque os feitiços da lua *cheia*. Depois risque os que não usam *verbena*.', 'Yliviivaa *täysikuun* loitsut. Sitten yliviivaa ne, joissa ei ole *verbenaa*.', 'Cross out the *full* moon spells. Then cross out the ones that don\'t use *vervain*.'),
       L('Sobram dois feitiços: um *desperta* e o outro *sela*. Qual sela?', 'Jäljelle jää kaksi loitsua: toinen *herättää* ja toinen *sinetöi*. Kumpi sinetöi?', 'Two spells are left: one *awakens* and the other *seals*. Which one seals?')],
  13: [L('A dourada é a número 4. Então só valem as máscaras 1, 2 e 3. Agora risque a vermelha.', 'Kultainen on numero 4. Vain naamiot 1, 2 ja 3 käyvät. Yliviivaa nyt punainen.', 'The gold one is number 4. So only masks 1, 2 and 3 count. Now cross out the red one.'),
       L('Entre a 1 e a 3, só uma não tem penas. Qual é a cor dela?', 'Naamioista 1 ja 3 vain toisessa ei ole sulkia. Minkä värinen se on?', 'Between masks 1 and 3, only one has no feathers. What color is it?')],
  14: [L('Olhe o desenho: cheia, metade, vazia, metade, cheia, metade... e depois?', 'Katso kuvaa: täysi, puolikas, tyhjä, puolikas, täysi, puolikas... ja sitten?', 'Look at the picture: full, half, empty, half, full, half... and then?'),
       L('Depois da metade que está diminuindo vem a lua *vazia*, toda escura: a lua ____.', 'Pienenevän puolikkaan jälkeen tulee *tyhjä*, ihan pimeä kuu: ____kuu.', 'After the shrinking half comes the *empty* moon, all dark: the ____ moon.')],
  15: [L('Olhe as *mãos* das duas na imagem.', 'Katso kuvasta molempien *käsiä*.', 'Look at both girls\' *hands* in the picture.'),
       L('Quem precisa de luvas para segurar um colar de verbena?', 'Kuka tarvitsee hansikkaat pitääkseen verbenakorua?', 'Who needs gloves to hold a vervain necklace?')],
  16: [L('Não tem resposta errada. Escreva *destruir* ou *entregar*.', 'Väärää vastausta ei ole. Kirjoita *tuhoa* tai *anna*.', 'There\'s no wrong answer. Write *destroy* or *give*.'),
       L('Escreva *destruir* ou *entregar*.', 'Kirjoita *tuhoa* tai *anna*.', 'Write *destroy* or *give*.')],
};

// nomes da série que a jogadora pode mandar a qualquer momento (não contam como erro)
const SEGREDOS = {
  damon: () => [m(L('O Damon? Ele está me ajudando... eu acho. Com o Damon nunca dá para ter certeza. 😏', 'Damon? Hän auttaa minua... luulisin. Damonin kanssa ei voi koskaan olla varma. 😏', 'Damon? He\'s helping me... I think. With Damon you can never be sure. 😏'), 1800)],
  stefan: () => [m(L('O Stefan sumiu desde ontem. A última coisa que ele deixou foi aquele diário.', 'Stefan on ollut kateissa eilisestä asti. Viimeinen asia, jonka hän jätti, oli se päiväkirja.', 'Stefan has been missing since yesterday. The last thing he left was that diary.'), 1800)],
  elena: () => [m(L('A Elena está segura em casa. Pelo menos foi o que ela disse.', 'Elena on turvassa kotona. Ainakin niin hän sanoi.', 'Elena is safe at home. At least that\'s what she said.'), 1800, { apagar: 4000 })],
  katherine: (e) => [m(e.fase >= 13 && e.cap3 ? L('A Katherine sempre tem um plano. E sempre tem um plano B. 💋', 'Katherinella on aina suunnitelma. Ja aina myös varasuunnitelma. 💋', 'Katherine always has a plan. And always a plan B. 💋') : L('Katherine?? Se ela estiver na cidade, estamos todas perdidas.', 'Katherine?? Jos hän on kaupungissa, olemme kaikki hukassa.', 'Katherine?? If she\'s in town, we\'re all doomed.'), 1500, { efeito: 'glitch' })],
  klaus: () => [m(L('Não. Diga. Esse. Nome. 🩸', 'Älä. Sano. Sitä. Nimeä. 🩸', 'Do. Not. Say. That. Name. 🩸'), 1500, { efeito: 'sangue' })],
  caroline: () => [m(L('A Caroline está organizando o Baile dos Fundadores, claro. Ela organiza tudo nesta cidade. ✨', 'Caroline järjestää tietysti Perustajien tanssiaiset. Hän järjestää kaiken tässä kaupungissa. ✨', 'Caroline is organizing the Founders\' Ball, of course. She organizes everything in this town. ✨'), 1800)],
  matt: () => [m(L('O Matt é o único humano normal desta cidade. Ele merece férias. 🍔', 'Matt on tämän kaupungin ainoa tavallinen ihminen. Hän ansaitsee lomaa. 🍔', 'Matt is the only normal human in this town. He deserves a vacation. 🍔'), 1800)],
  tyler: () => [m(L('O Tyler fica trancado no porão dos Lockwood toda lua cheia. Ele diz que é "coisa de família". 🐺', 'Tyler lukitaan Lockwoodien kellariin joka täysikuulla. Hän sanoo, että se on "sukujuttu". 🐺', 'Tyler gets locked in the Lockwood cellar every full moon. He says it\'s a "family thing". 🐺'), 1800)],
  alaric: () => [m(L('O professor Saltzman sabe mais de vampiros do que de história. E ele dá aula de história. 📚', 'Opettaja Saltzman tietää vampyyreista enemmän kuin historiasta. Ja hän opettaa historiaa. 📚', 'Mr. Saltzman knows more about vampires than about history. And he teaches history. 📚'), 1800)],
  sheila: () => [m(L('Minha avó Sheila. Tudo o que eu sei de magia, ela que me ensinou. 🕯️', 'Isoäitini Sheila. Hän opetti minulle kaiken, mitä tiedän taikuudesta. 🕯️', 'My grandma Sheila. She taught me everything I know about magic. 🕯️'), 1800)],
  bonnie: (e) => e.fase >= 7
    ? [m(L('Sim. Sou eu. Bonnie Bennett. 🔥', 'Kyllä. Se olen minä. Bonnie Bennett. 🔥', 'Yes. That\'s me. Bonnie Bennett. 🔥'), 1500)]
    : [m('...', 2000), m(L('Como você sabe esse nome? Ele me dá arrepio, mas eu não lembro de onde.', 'Mistä tiedät tuon nimen? Se saa minut värisemään, mutta en muista mistä.', 'How do you know that name? It gives me chills, but I can\'t remember why.'), 2500, { efeito: 'glitch' })],
  lucien: (e) => e.fase >= 8
    ? [m(aliado(e) ? L('O Lucien está do nosso lado agora. Ainda acho estranho dizer isso. 🤝', 'Lucien on nyt meidän puolellamme. Tuntuu yhä oudolta sanoa niin. 🤝', 'Lucien is on our side now. It still feels weird to say that. 🤝') : L('Não fala o nome dele. Eu sinto que ele está ouvindo. 👁️', 'Älä sano hänen nimeään. Tunnen, että hän kuuntelee. 👁️', 'Don\'t say his name. I can feel him listening. 👁️'), 1800, aliado(e) ? {} : { efeito: 'glitch' })]
    : e.fase >= 6 ? [m(L('Ele está no porão. Acorrentado. Pelo menos por enquanto.', 'Hän on kellarissa. Kahleissa. Ainakin toistaiseksi.', 'He\'s in the cellar. In chains. For now, at least.'), 1800)] : null,
  silas: (e) => e.fase >= 7 ? [m(e.fase >= 8 ? L('Ele é pedra agora. Mas pedra pode rachar...', 'Hän on nyt kiveä. Mutta kivi voi haljeta...', 'He\'s stone now. But stone can crack...') : L('Ele está chegando. Eu sinto a magia dele daqui.', 'Hän on tulossa. Tunnen hänen taikansa tänne asti.', 'He\'s coming. I can feel his magic from here.'), 1800, { efeito: 'tremor' })] : null,
  viajante: (e) => e.fase >= 11 && aliado(e) ? [m(L('Os Viajantes são bruxos que odeiam qualquer magia que não seja deles. E ela queria o Silas acordado.', 'Matkalaiset ovat noitia, jotka vihaavat kaikkea muuta taikuutta kuin omaansa. Ja hän halusi Silaksen hereille.', 'Travelers are witches who hate any magic that isn\'t theirs. And she wanted Silas awake.'), 1800)] : null,
  'quem e voce': (e) => [m(e.fase >= 7 ? L('Bonnie Bennett. Agora eu lembro.', 'Bonnie Bennett. Nyt muistan.', 'Bonnie Bennett. Now I remember.') : L('Eu queria saber. Só sei que sou uma bruxa. E que preciso de você.', 'Kunpa tietäisin. Tiedän vain, että olen noita. Ja että tarvitsen sinua.', 'I wish I knew. All I know is that I\'m a witch. And that I need you.'), 2000)],
};
SEGREDOS.matkalainen = SEGREDOS.traveler = SEGREDOS.viajante;
SEGREDOS['kuka olet'] = SEGREDOS['who are you'] = SEGREDOS['quem e voce'];

const AJUDA = [m(L('Comandos: *dica* (uma ajudinha), *repetir* (ver a pista de novo), *reiniciar* (começar do zero).\nLíngua: *português*, *suomi* ou *english*.',
  'Komennot: *vihje* (pieni apu), *toista* (näe vihje uudelleen), *aloita alusta* (aloita alusta).\nKieli: *português*, *suomi* tai *english*.',
  'Commands: *hint* (a little help), *repeat* (see the clue again), *restart* (start over).\nLanguage: *português*, *suomi* or *english*.'), 800)];

// os comandos valem em qualquer língua
const CMD = {
  dica: ['dica', 'vihje', 'hint', 'help me'],
  repetir: ['repetir', 'toista', 'repeat'],
  reiniciar: ['reiniciar', 'recomecar', 'aloita alusta', 'alusta', 'restart', 'start over'],
  ajuda: ['ajuda', 'menu', 'apua', 'help'],
};
const LINGUA_CMD = { portugues: 'pt', suomi: 'fi', suomeksi: 'fi', finnish: 'fi', finlandes: 'fi', english: 'en', ingles: 'en', englanti: 'en', englanniksi: 'en', portugali: 'pt', portuguese: 'pt' };
const TROCOU = L('🇧🇷 Tudo bem, vou falar em *português*. Mande *repetir* para ver a pista de novo.', '🇫🇮 Selvä, puhun nyt *suomea*. Kirjoita *toista* nähdäksesi vihjeen uudelleen.', '🇬🇧 Okay, I\'ll speak *English* now. Send *repeat* to see the clue again.');

function dica(e) {
  const lista = DICAS[e.fase];
  const n = Math.max(e.erros - 1, 0);
  // depois da última dica, lembra que dá para ver a pista (o arquivo, a imagem...) de novo
  return m(junta('💡 ', lista[Math.min(n, lista.length - 1)], n >= lista.length - 1 ? L('\n\n_Não está vendo a pista? Mande_ *repetir*.', '\n\n_Etkö näe vihjettä? Kirjoita_ *toista*.', '\n\n_Can\'t see the clue? Send_ *repeat*.') : ''), 1500);
}

function avancar(fase, e = {}) {
  const estado = { fase, erros: 0 };
  if (e.final) estado.final = e.final;
  if (fase >= 8) estado.cap2 = true;
  if (fase >= 13) estado.cap3 = true;
  return { estado, msgs: msgsDaFase(fase, estado) };
}

// põe cada texto na língua da jogadora e troca os vídeos pela versão com legendas na língua dela
export function localizar(msgs, lg) {
  return msgs.map(x => {
    const y = { ...x };
    for (const k of ['texto', 'audio', 'capitulo', 'titulo']) if (k in y) y[k] = em(y[k], lg);
    if (y.opcoes) y.opcoes = y.opcoes.map(o => em(o, lg));
    if (y.arquivo) y.arquivo = { ...y.arquivo, nome: em(y.arquivo.nome, lg), conteudo: em(y.arquivo.conteudo, lg) };
    if (y.video && lg !== 'pt') y.video += '_' + lg;
    return y;
  });
}

// Recebe o estado e o que a jogadora escreveu; devolve o novo estado e as mensagens de resposta, já na língua dela.
export function responder(estado, mensagem) {
  const lg = LINGUAS.includes(estado?.lingua) ? estado.lingua : 'pt';
  const t = normalizar(String(mensagem || '').replace(/🌑/g, ' lua nova '));
  // trocar de língua não muda o jogo
  if (LINGUA_CMD[t]) {
    const novo = LINGUA_CMD[t];
    return { estado: { ...estadoInicial(), ...estado, lingua: novo }, msgs: localizar([m(TROCOU, 800)], novo) };
  }
  const r = jogar({ ...estadoInicial(), ...estado }, t);
  return { estado: { ...r.estado, lingua: lg }, msgs: localizar(r.msgs, lg) };
}

function jogar(e, t) {
  const cmd = nome => CMD[nome].includes(t) || (nome === 'reiniciar' && tem(t, 'reiniciar', 'recomecar', 'restart', 'aloita alusta'));

  if (cmd('reiniciar') || e.fase === 0) return avancar(1);
  // terminou o Capítulo 1: qualquer mensagem abre o Capítulo 2 (vale também para quem terminou a versão antiga do jogo)
  if (e.fase === 8 && !e.cap2) return avancar(8, e);
  // terminou o Capítulo 2 (ou a versão de 2 capítulos): qualquer mensagem abre o Capítulo 3
  if (e.fase === 13 && !e.cap3) return avancar(13, e);
  if (e.fase >= FIM) return { estado: e, msgs: [m(junta(L('Você já terminou a Operação Mystic Falls com o *', 'Olet jo pelannut Operaatio Mystic Fallsin loppuun: *', 'You already finished Operation Mystic Falls with *'), FINAIS['cap3-' + (e.fim3 === 'trato' ? 'trato' : 'pedra')],
    L('*. 🏆\nMande *reiniciar* para jogar de novo: escolhas diferentes nas fases 7 e 16 mudam a história!', '*. 🏆\nKirjoita *aloita alusta* pelataksesi uudelleen: eri valinnat tasoilla 7 ja 16 muuttavat tarinaa!', '*. 🏆\nSend *restart* to play again: different choices in levels 7 and 16 change the story!')), 1200, { opcoes: [REINICIAR] })] };
  if (cmd('ajuda')) return { estado: e, msgs: AJUDA };
  const segredo = SEGREDOS[t] || SEGREDOS[t.replace(/^(e |o |a |cade |e o |e a |and |where is |enta |missa on )+/, '')];
  const msgsSegredo = segredo && segredo(e);
  if (msgsSegredo) return { estado: e, msgs: msgsSegredo };
  if (cmd('repetir')) return { estado: e, msgs: pistas(e.fase, e) };
  if (cmd('dica')) {
    const novo = { ...e, erros: e.erros + 1 };
    return { estado: novo, msgs: [dica(novo)] };
  }

  const errou = (texto, extra) => {
    const novo = { ...e, erros: e.erros + 1 };
    const msgs = [m(texto, 2000, extra)];
    if (novo.erros >= 2) msgs.push(dica(novo));
    return { estado: novo, msgs };
  };
  const errouAudio = (fala) => ({ estado: { ...e, erros: e.erros + 1 }, msgs: [m(L('🚨 Errado! Escuta isso:', '🚨 Väärin! Kuuntele tämä:', '🚨 Wrong! Listen to this:'), 1000), { audio: fala, espera: 2500 }] });

  switch (e.fase) {
    case 1:
      if (tem(t, 'carvalho branco', 'valkoisen tammen', 'valkotammi', 'white oak')) return avancar(2, e);
      if (tem(t, 'carvalho', 'tammi', 'tammen', 'oak')) return errou(L('Quase! Carvalho... mas de qual cor? A cor importa.', 'Melkein! Tammi... mutta minkä värinen? Väri on tärkeä.', 'Almost! Oak... but what color? The color matters.'));
      if (/\b(sal|suola|salt)\b/.test(t)) return errou(L('Sal é só o *componente* do feitiço. Eu preciso da *arma*.', 'Suola on vain loitsun *ainesosa*. Tarvitsen *aseen*.', 'Salt is just the spell\'s *component*. I need the *weapon*.'));
      if (tem(t, 'phaesmatos', 'incendia')) return errou(L('Isso é o *feitiço*, não a arma. Continua procurando no código.', 'Tuo on *loitsu*, ei ase. Etsi lisää koodista.', 'That\'s the *spell*, not the weapon. Keep looking in the code.'));
      if (tem(t, 'estaca', 'seivas', 'stake')) return errou(L('Uma estaca, sim! Mas não é qualquer uma. Leia o nome inteiro.', 'Seiväs, kyllä! Mutta ei mikä tahansa. Lue koko nimi.', 'A stake, yes! But not just any stake. Read the whole name.'));
      return errou(L('Não... o selo continua fechado. 🔒 Olha o arquivo de novo.', 'Ei... sinetti on yhä kiinni. 🔒 Katso tiedostoa uudelleen.', 'No... the seal is still closed. 🔒 Look at the file again.'));

    case 2:
      if (tem(t, 'grill')) return avancar(3, e);
      if (tem(t, 'mystic')) return errou(L('Mystic... o quê? Mystic Falls é a cidade toda. Eu preciso do *lugar*.', 'Mystic... mikä? Mystic Falls on koko kaupunki. Tarvitsen *paikan*.', 'Mystic... what? Mystic Falls is the whole town. I need the *place*.'));
      return errou(L('Não faz sentido ainda. 🔁 Tenta ler de trás para frente.', 'Tämä ei vielä käy järkeen. 🔁 Yritä lukea takaperin.', 'That doesn\'t make sense yet. 🔁 Try reading it backwards.'));

    case 3:
      if (tem(t, 'ponte', 'wickery', 'silta', 'bridge')) return avancar(4, e);
      if (tem(t, 'rio', 'estrada', 'joki', 'joen', 'tie', 'river', 'road')) return errou(L('Perto, mas não é isso. A palavra está escondida, não escrita. 👀', 'Lähellä, mutta ei se. Sana on piilotettu, ei kirjoitettu. 👀', 'Close, but that\'s not it. The word is hidden, not written. 👀'));
      return errou(L('Não... reli a página três vezes e não é isso.', 'Ei... luin sivun kolme kertaa, eikä se ole sitä.', 'No... I read the page three times and that\'s not it.'));

    case 4:
      if (/\b1864\b/.test(t)) return avancar(5, e);
      if (/\b\d{4}\b/.test(t)) return errou(L('🔒 *Clac.* O cadeado não abriu. Confere a conta.', '🔒 *Naks.* Lukko ei auennut. Tarkista lasku.', '🔒 *Click.* The padlock didn\'t open. Check your math.'));
      return errou(L('O cadeado só aceita *4 números*.', 'Lukkoon käy vain *4 numeroa*.', 'The padlock only takes *4 numbers*.'));

    case 5: {
      const nomes = ['liam', 'tristan', 'lucien'].filter(n => t.includes(n));
      if (nomes.length > 1) return { estado: e, msgs: [m(L('Calma! Escolha só *um* suspeito.', 'Rauhassa! Valitse vain *yksi* epäilty.', 'Easy! Pick just *one* suspect.'), 1200)] };
      if (nomes[0] === 'lucien') return avancar(6, e);
      if (nomes[0] === 'liam') return errouAudio(L('Não! O Liam passou a tarde inteira no sol forte, e não usava anel nenhum. Um vampiro sem anel de lápis-lazúli teria virado cinza. Pense de novo!', 'Ei! Liam oli koko iltapäivän kirkkaassa auringossa, eikä hänellä ollut sormusta. Vampyyri ilman lapis lazuli -sormusta olisi muuttunut tuhkaksi. Mieti uudelleen!', 'No! Liam spent the whole afternoon in bright sunlight, and he wasn\'t wearing any ring. A vampire without a lapis lazuli ring would have turned to ash. Think again!'));
      if (nomes[0] === 'tristan') return errouAudio(L('Não! O Tristan bebeu verbena pura e nem fez careta. Verbena queima vampiros por dentro. Ele é humano. Pense de novo!', 'Ei! Tristan joi puhdasta verbenaa eikä edes irvistänyt. Verbena polttaa vampyyreja sisältä. Hän on ihminen. Mieti uudelleen!', 'No! Tristan drank pure vervain and didn\'t even make a face. Vervain burns vampires from the inside. He\'s human. Think again!'));
      return { estado: e, msgs: [m(L('Me diga o nome: *Liam*, *Tristan* ou *Lucien*?', 'Kerro nimi: *Liam*, *Tristan* vai *Lucien*?', 'Tell me the name: *Liam*, *Tristan* or *Lucien*?'), 1200)] };
    }

    case 6:
      if (tem(t, 'tumulo', 'cripta', 'igreja', 'tumba', 'hauta', 'krypta', 'kirkko', 'kirkon', 'tomb', 'crypt', 'church', 'grave')) return avancar(7, e);
      if (tem(t, 'ponte', 'grill', 'porao', 'mansao', 'silta', 'kellari', 'kartano', 'bridge', 'cellar', 'basement', 'mansion')) return errou(L('Não, eu já estive aí essa noite. É um lugar *mais antigo*.', 'Ei, olin siellä jo tänä yönä. Se on *vanhempi* paikka.', 'No, I\'ve already been there tonight. It\'s an *older* place.'));
      return errou(L('Não... pensa nos 27 vampiros de 1864.', 'Ei... mieti niitä 27 vampyyriä vuodelta 1864.', 'No... think about the 27 vampires from 1864.'));

    case 7:
      if (tem(t, 'soltar', 'solta', 'libert', 'confi', 'perdo', 'vapaut', 'paasta', 'luota', 'release', 'free', 'trust', 'let him go')) return { estado: { fase: 8, erros: 0, final: 'aliado' }, msgs: FINAL_ALIADO };
      if (tem(t, 'preso', 'prender', 'mata', 'vanki', 'pida', 'lukko', 'tapa', 'keep', 'lock', 'prison', 'kill')) return { estado: { fase: 8, erros: 0, final: 'sombra' }, msgs: FINAL_SOMBRA };
      return { estado: e, msgs: [m(L('O Damon está esperando! *Soltar* ou *preso*?', 'Damon odottaa! *Vapauta* vai *pidä vankina*?', 'Damon is waiting! *Release* or *keep locked*?'), 1200, { opcoes: [SOLTAR, PRESO] })] };

    case 8:
      if (/\bpo[cs]o\b/.test(t) || /\bkaivo/.test(t) || /\bwell\b/.test(t)) return avancar(9, e);
      if (/^[a-z ]*$/.test(t) && [4, 5].includes(t.replace(/ /g, '').length)) return errou(L('Hmm, essas letras não formam um lugar que eu conheça. Confere de novo no mapa: *letra* é a coluna, *número* é a linha.', 'Hmm, noista kirjaimista ei tule paikkaa, jonka tuntisin. Tarkista kartasta: *kirjain* on sarake, *numero* on rivi.', 'Hmm, those letters don\'t spell a place I know. Check the map again: the *letter* is the column, the *number* is the row.'));
      if (tem(t, 'tunel', 'tuneis', 'tunneli', 'tunnel')) return errou(L('A estátua passou pelos túneis, sim. Mas para onde ela *foi*? Junte as letras.', 'Patsas kulki tunneleiden kautta, kyllä. Mutta *minne* se meni? Yhdistä kirjaimet.', 'The statue went through the tunnels, yes. But *where* did it go? Put the letters together.'));
      return errou(L('Não... 🗺️ Ache cada coordenada no mapa. A primeira é *C4*.', 'Ei... 🗺️ Etsi jokainen koordinaatti kartalta. Ensimmäinen on *D2*.', 'No... 🗺️ Find each coordinate on the map. The first one is *B3*.'));

    case 9:
      if (tem(t, 'cemiterio', 'hautausmaa', 'cemetery', 'graveyard')) return avancar(10, e);
      if (tem(t, 'fhplwhulr', 'kdxwdxvpdd', 'fhphwhub')) return errou(L('Isso é o que está gravado. Eu preciso do que está *escondido* nele. Volta 3 letras.', 'Tuo on se, mitä kiveen on kaiverrettu. Tarvitsen sen, mitä siihen on *piilotettu*. Siirrä 3 kirjainta taaksepäin.', 'That\'s what is carved there. I need what\'s *hidden* in it. Go back 3 letters.'));
      if (/^(ce|ha)/.test(t)) return errou(L('Começou certo! C, E... continua voltando 3 letras em cada uma.', 'Hyvä alku! Jatka: siirrä jokaista kirjainta 3 taaksepäin.', 'Good start! Keep going back 3 letters for each one.'));
      return errou(L('Não... a pedra continua sem sentido. 🌙🌙🌙 Volte *três* letras em cada uma.', 'Ei... kivi ei vieläkään käy järkeen. 🌙🌙🌙 Siirrä jokaista kirjainta *kolme* taaksepäin.', 'No... the stone still makes no sense. 🌙🌙🌙 Go back *three* letters for each one.'));

    case 10:
      if (/\bfell\b/.test(t) || /\b(5|cinco|quinta|ultima|viisi|viides|viimeinen|five|fifth|last)\b/.test(t)) return avancar(11, e);
      if (tem(t, 'salvatore')) return errou(L('O bilhete disse: *"ele não é um Salvatore"*. 😉', 'Lapussa luki: *"hän ei ole Salvatore"*. 😉', 'The note said: *"he is not a Salvatore"*. 😉'));
      if (tem(t, 'lockwood', 'gilbert') || /\b(1|3|um|tres|primeira|terceira|yksi|kolme|first|third)\b/.test(t)) return errou(L('Essa lápide tem um *anjo* em cima. Olha de novo!', 'Tuon kiven päällä on *enkeli*. Katso uudelleen!', 'That gravestone has an *angel* on top. Look again!'));
      return errou(L('Não... nenhuma pedra se mexeu. Mande o *nome da família* escrito na lápide.', 'Ei... yksikään kivi ei liikahtanut. Lähetä hautakiveen kirjoitettu *sukunimi*.', 'No... no stone moved. Send the *family name* written on the gravestone.'));

    case 11:
      if (tem(t, 'verbena', 'vervain', 'rautayrtti')) return avancar(12, e);
      if (tem(t, 'sal', 'agua', 'fogo', 'estaca', 'suola', 'vesi', 'tuli', 'seivas', 'water', 'fire', 'stake')) return errou(L('Não é isso que o espelho diz. Leia de novo: é uma *erva roxa*.', 'Peilissä ei lue niin. Lue uudelleen: se on *violetti yrtti*.', 'That\'s not what the mirror says. Read it again: it\'s a *purple herb*.'));
      return errou(L('A pedra rachou mais um pouco! 😱 Leia a frase do espelho de trás para frente.', 'Kivi halkesi vähän lisää! 😱 Lue peilin lause takaperin.', 'The stone cracked a little more! 😱 Read the mirror sentence backwards.'), { efeito: 'tremor' });

    case 12:
      if (tem(t, 'quietus', 'aeternum') || /\b108\b/.test(t)) return { estado: { fase: 13, erros: 0, final: e.final, cap2: true }, msgs: aliado(e) ? FIM_ALIADO : FIM_SOMBRA };
      if (tem(t, 'sanguinem', 'lunae') || /\b101\b/.test(t)) return errou(L('NÃO!! Esse *desperta*! A pedra começou a tremer! 😱 Leia o <Efeito>.', 'EI!! Tuo *herättää*! Kivi alkoi täristä! 😱 Lue <Vaikutus>.', 'NO!! That one *awakens*! The stone started shaking! 😱 Read the <Effect>.'), { efeito: 'sangue' });
      if (tem(t, 'silentium', 'petra') || /\b105\b/.test(t)) return errou(L('Esse sela, mas só funciona na lua *cheia*. A lua lá fora está *de sangue*!', 'Tuo sinetöi, mutta toimii vain *täysikuulla*. Ulkona on *verikuu*!', 'That one seals, but it only works on a *full* moon. The moon outside is a *blood* moon!'));
      if (tem(t, 'motus', 'obscura') || /\b112\b/.test(t)) return errou(L('Esse usa *sal*, e eu só tenho verbena aqui.', 'Siinä käytetään *suolaa*, ja minulla on vain verbenaa.', 'That one uses *salt*, and I only have vervain here.'));
      if (tem(t, 'ascendo', 'phaesmatos', 'incendia') || /\b(091|093|91|93)\b/.test(t)) return errou(L('Esse é da lua *cheia*. Hoje a lua está vermelha!', 'Tuo on *täysikuun* loitsu. Tänään kuu on punainen!', 'That one is for a *full* moon. Tonight the moon is red!'));
      return errou(L('Não sei esse feitiço... ⏳ Procure no grimório o nome que está em <Incantamentum>.', 'En tunne tuota loitsua... ⏳ Etsi loitsukirjasta nimi kohdasta <Incantamentum>.', 'I don\'t know that spell... ⏳ Look in the grimoire for the name in <Incantamentum>.'));

    case 13:
      if (tem(t, 'prata', 'prateada', 'hopea', 'silver') || /^(3|tres|terceira|kolme|kolmas|three|third)$/.test(t)) return avancar(14, e);
      if (tem(t, 'vermelh', 'punai', 'red')) return errou(L('O recado diz: *não é vermelha*. 😉', 'Viestissä lukee: *ei ole punainen*. 😉', 'The note says: *not red*. 😉'));
      if (tem(t, 'dourad', 'ouro', 'kulta', 'kultai', 'gold')) return errou(L('A dourada é a referência: a máscara dela fica *à esquerda* da dourada.', 'Kultainen on vain vertailukohta: hänen naamionsa on kultaisen *vasemmalla puolella*.', 'The gold one is just the reference: her mask is *to the left of* the gold one.'));
      if (tem(t, 'azul', 'sini', 'blue')) return errou(L('A azul tem *penas*. Olha de novo!', 'Sinisessä on *sulkia*. Katso uudelleen!', 'The blue one has *feathers*. Look again!'));
      if (tem(t, 'pret', 'musta', 'black')) return errou(L('A preta fica à *direita* da dourada.', 'Musta on kultaisen *oikealla* puolella.', 'The black one is to the *right* of the gold one.'));
      return errou(L('Hmm, não vejo essa máscara. Mande a *cor*: azul, vermelha, prata, dourada ou preta?', 'Hmm, en näe tuollaista naamiota. Lähetä *väri*: sininen, punainen, hopea, kulta vai musta?', 'Hmm, I don\'t see that mask. Send the *color*: blue, red, silver, gold or black?'));

    case 14:
      if (tem(t, 'lua nova', 'uusikuu', 'uusi kuu', 'new moon', 'nova', 'uusi', 'vazia', 'escura', 'tyhja', 'pimea', 'empty', 'dark')) return avancar(15, e);
      if (tem(t, 'cheia', 'taysi', 'full')) return errou(L('A cheia já apareceu duas vezes. Depois da metade que diminui vem outra coisa...', 'Täysikuu on jo kuvassa kahdesti. Pienenevän puolikkaan jälkeen tulee jotain muuta...', 'The full moon already appeared twice. After the shrinking half comes something else...'));
      if (tem(t, 'quarto', 'metade', 'minguante', 'crescente', 'puoli', 'half', 'quarter', 'crescent')) return errou(L('Quase! Mas depois da metade vem a lua *vazia*. 🌑', 'Melkein! Mutta puolikkaan jälkeen tulee *tyhjä* kuu. 🌑', 'Almost! But after the half moon comes the *empty* one. 🌑'));
      return errou(L('*Clic.* A caixinha não abriu. 🎵 Siga o caminho da lua no desenho.', '*Naks.* Rasia ei auennut. 🎵 Seuraa kuun polkua kuvassa.', '*Click.* The box didn\'t open. 🎵 Follow the moon\'s path in the picture.'));

    case 15:
      if (/^(a )?(n(umero)? ?)?(1|um|uma|primeira|yksi|ykkonen|ensimmainen|one|first)$/.test(t) || tem(t, 'numero 1', 'number 1', 'luva', 'hansik', 'glove')) return avancar(16, e);
      if (/\b(2|dois|duas|segunda|kaksi|kakkonen|toinen|two|second)\b/.test(t)) return errou(L('A número 2 está segurando o colar de verbena com a *mão nua*... e não se queimou. Pensa!', 'Numero 2 pitää verbenakorua *paljaalla kädellä*... eikä palanut. Mieti!', 'Number 2 is holding the vervain necklace with her *bare hand*... and didn\'t get burned. Think!'));
      return { estado: e, msgs: [m(L('Me diga só o número: *1* ou *2*?', 'Kerro vain numero: *1* vai *2*?', 'Just tell me the number: *1* or *2*?'), 1200, { opcoes: ['1', '2'] })] };

    case 16:
      if (tem(t, 'destru', 'quebr', 'tuho', 'riko', 'destroy', 'break', 'smash')) return { estado: { ...e, fase: FIM, erros: 0, fim3: 'pedra' }, msgs: FIM_PEDRA(e) };
      if (tem(t, 'entreg', 'dar', 'anna', 'luovuta', 'give', 'hand', 'trade', 'deal', 'trato')) return { estado: { ...e, fase: FIM, erros: 0, fim3: 'trato' }, msgs: FIM_TRATO(e) };
      return { estado: e, msgs: [m(L('A Katherine está esperando! *Destruir* ou *entregar*?', 'Katherine odottaa! *Tuhoa* vai *anna*?', 'Katherine is waiting! *Destroy* or *give*?'), 1200, { opcoes: [DESTRUIR, ENTREGAR] })] };
  }
  return { estado: e, msgs: AJUDA };
}
