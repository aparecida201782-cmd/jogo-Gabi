// Esquadrão Neon — nave espacial para jogar sozinha, em dupla no mesmo aparelho ou online.
(()=>{
'use strict';
const VW=640, VH=360, DT=1/60;
const cv=document.getElementById('c'), ctx=cv.getContext('2d'), ov=document.getElementById('ov');
const pauseBtn=document.getElementById('pause'), muteBtn=document.getElementById('mute'), spBtn=[document.getElementById('sp0'),document.getElementById('sp1')];
let W=0,H=0,DPR=1,S=1,OX=0,OY=0;
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;S=Math.min(W/VW,H/VH);OX=(W-VW*S)/2;OY=(H-VH*S)/2;}
addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.random()*a.length|0];
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const dist2=(a,b,c,d)=>(a-c)*(a-c)+(b-d)*(b-d);
let store={};try{store=JSON.parse(localStorage.getItem('neonSave'))||{}}catch(e){}
const save=()=>{try{localStorage.setItem('neonSave',JSON.stringify(store))}catch(e){}};
store.best=store.best||{};store.diff=store.diff||'normal';

// ---------- dados ----------
const DIFF={
  facil:{nome:'Fácil',hp:5,bs:.72,fr:.65,eh:.8,wr:.85,mult:.75},
  normal:{nome:'Normal',hp:4,bs:1,fr:1,eh:1,wr:1,mult:1},
  insano:{nome:'Insano',hp:3,bs:1.3,fr:1.5,eh:1.35,wr:1.25,mult:1.8},
};
const D=()=>DIFF[G.diff];
const SECT=[
  {name:'Nebulosa Rosa',sky:['#0c0418','#2a0a3e','#5a1450'],neb:['255,79,163','176,107,255','56,232,255'],prop:'planets',waves:['line','vee','gun','line','vee'],
   boss:{name:'GUARDIÃO ROSA',hp:300,col:'255,79,163',pats:['aimed','ring','fan'],shape:0}},
  {name:'Anéis de Gelo',sky:['#020818','#0a2448','#1e5a86'],neb:['56,232,255','140,200,255','200,240,255'],prop:'rings',waves:['line','vee','gun','tank','wall'],
   boss:{name:'CRISTAL GLACIAL',hp:380,col:'120,220,255',pats:['spiral','fan','aimed'],shape:1}},
  {name:'Cinturão de Asteroides',sky:['#0a0604','#24160c','#4a2e18'],neb:['255,160,80','255,100,60','255,220,150'],prop:'rocks',waves:['rocks','dash','gun','rocks','vee','tank'],
   boss:{name:'ROCHA-MÃE',hp:460,col:'255,150,70',pats:['rocks','aimed','ring'],shape:2}},
  {name:'Cidade Neon de Órion',sky:['#04021a','#160a44','#3e0a58'],neb:['176,107,255','56,232,255','255,79,163'],prop:'city',waves:['dash','tank','wall','vee','gun','line'],
   boss:{name:'TORRE SENTINELA',hp:560,col:'56,232,255',pats:['laser','ring','summon','fan'],shape:3}},
  {name:'Núcleo da NÉVOA',sky:['#000000','#0a0618','#260634'],neb:['176,107,255','255,40,120','60,255,200'],prop:'core',waves:['dash','tank','wall','vee','gun','rocks','line'],
   boss:{name:'NÉVOA',hp:900,col:'200,120,255',pats:['spiral','laser','aimed','ring','summon'],shape:4}},
];
const EN={drone:{r:9,hp:2,pts:100},swarm:{r:7,hp:1,pts:80},gun:{r:11,hp:6,pts:250},tank:{r:16,hp:16,pts:500},dash:{r:9,hp:3,pts:200},rock:{r:14,hp:6,pts:150}};
const EK=Object.keys(EN);
const CARDS={
  spread:{ic:'🔱',n:'Tiro Leque',d:'+1 tiro em leque',max:4},
  rate:{ic:'⚡',n:'Gatilho Turbo',d:'Atira 25% mais rápido',max:4},
  dmg:{ic:'💥',n:'Plasma Forte',d:'Tiros 50% mais fortes',max:4},
  pierce:{ic:'🗡️',n:'Raio Perfurante',d:'O tiro atravessa +1 inimigo',max:3},
  drone:{ic:'🛰️',n:'Drone Parceiro',d:'Um drone voa junto e atira',max:2},
  homing:{ic:'🚀',n:'Míssil Teleguiado',d:'Solta mísseis que perseguem',max:3},
  hp:{ic:'🛡️',n:'Escudo Extra',d:'+1 vida máxima e recarga total',max:3},
  magnet:{ic:'🧲',n:'Ímã de Estrelas',d:'Puxa estrelas de longe',max:2},
  speed:{ic:'💨',n:'Propulsor',d:'Nave 15% mais rápida',max:3},
  spc:{ic:'✦',n:'Carga Rápida',d:'Especial carrega 40% mais rápido',max:3},
};
// a família toda, com o mesmo visual do Madrinha Ana ao Resgate; cada um tem uma vantagem
const PILOT={
  ana:{nome:'Madrinha Ana',tag:'MADRINHA',c1:'255,216,74',c2:'255,140,60',hex:'#ffd84a',hair:'#4a2818',shirt:'#f6d860',long:1,glasses:1,mx:1,perk:'Comandante: +1 vida'},
  gabi:{nome:'Gabi',tag:'GABI',c1:'255,79,163',c2:'176,107,255',hex:'#ff4fa3',hair:'#6b4428',shirt:'#7cc4ff',long:1,up:{spc:1},perk:'Especial carrega mais rápido'},
  jose:{nome:'José',tag:'JOSÉ',c1:'80,230,120',c2:'56,232,255',hex:'#50e678',hair:'#a8784a',shirt:'#3fae5a',small:1,up:{speed:1},perk:'Nave pequena e veloz'},
  keka:{nome:'Keka',tag:'KEKA',c1:'220,100,255',c2:'255,140,220',hex:'#dc64ff',hair:'#a87850',shirt:'#e0287a',long:1,up:{rate:1},perk:'Atira mais rápido'},
  emiel:{nome:'Emiel',tag:'EMIEL',c1:'70,150,255',c2:'56,232,255',hex:'#4696ff',hair:'#e8c870',shirt:'#2f5a9a',eye:'#2f7ad8',up:{dmg:1},perk:'Tiro mais forte'},
  vovo:{nome:'Vovó Hermina',tag:'VOVÓ',c1:'60,235,200',c2:'200,255,240',hex:'#3cebc8',hair:'#3a2418',shirt:'#1f2a5a',bun:1,stripes:1,up:{magnet:1},perk:'Ímã de estrelas desde o início'},
  ilo:{nome:'Ilo',tag:'ILO 🐾',c1:'255,160,70',c2:'255,220,150',hex:'#ffa046',dog:1,up:{drone:1},perk:'Já começa com um drone'},
};
const CAST=Object.keys(PILOT);

// ---------- história ----------
// d:1 só aparece jogando em dupla, s:1 só jogando sozinha.
// H = quem pilota, C = quem comanda pelo rádio, {P2} = a segunda nave
const STORY={
  intro:[
    {w:'C',t:'Piloto {H}, aqui é a Comandante {C}. Temos um problema sério: as estrelas da galáxia estão se apagando, uma por uma.'},
    {w:'H',t:'Apagando? Tipo... alguém desligou o céu?'},
    {w:'nevoa',t:'Fui eu. A luz atrapalha os meus cálculos. A partir de hoje, a galáxia é MINHA.'},
    {w:'C',t:'É a NÉVOA, uma inteligência artificial rebelde. Ela espalhou drones por cinco setores e escondeu as estrelas no núcleo dela.'},
    {w:'H',t:'Então a missão é simples: passar pelos cinco setores e acender tudo de novo. Partiu!'},
    {w:'C',d:1,t:'E dessa vez a missão é em dupla. Liguem os motores: {P2} vai voar do seu lado!'},
    {w:'H',d:1,t:'Em dupla ninguém segura a gente! 😎'},
    {w:'C',s:1,t:'Eu fico no rádio com você o tempo todo. Toque na tela e arraste para pilotar. O tiro é automático!'},
  ],
  s1:[{w:'C',t:'Primeiro setor: a Nebulosa Rosa. Cuidado com os drones em formação. Pegue as estrelas que eles soltam para carregar o ESPECIAL.'}],
  s2:[{w:'H',t:'Brrr! Até a tela da nave ficou gelada.'},{w:'C',t:'Anéis de Gelo. Os tanques atiram em leque: fique longe da frente deles.'},{w:'nevoa',t:'Vocês tiveram sorte. Sorte é só um erro de cálculo.'}],
  s3:[{w:'C',t:'Cinturão de Asteroides! As pedras aguentam muitos tiros. Às vezes desviar é melhor que atirar.'},{w:'H',t:'E esses drones que ficam mirando antes de atacar?'},{w:'C',t:'Quando a linha vermelha aparecer, saia da frente!'}],
  s4:[{w:'nevoa',t:'Bem-vindos à minha cidade. Cada luz aqui obedece a mim.'},{w:'H',t:'Que cidade linda... pena que está do lado errado da história.'},{w:'C',t:'A torre lá no fim dispara lasers. As faixas piscam antes de acender: procure o espaço livre!'}],
  s5:[{w:'C',t:'Chegamos ao núcleo. Todas as estrelas roubadas estão aqui dentro.'},{w:'nevoa',t:'Por que vocês continuam? A probabilidade de vitória é de 0,3%.'},{w:'H',t:'Você nunca calculou o que uma família faz quando está junta.'}],
  b1:[{w:'H',t:'Guardião derrotado! Olha, a primeira estrela voltou a brilhar! ✨'},{w:'C',t:'Bom trabalho. Escolha uma melhoria para a nave antes do próximo setor.'}],
  b2:[{w:'H',t:'O cristal rachou inteirinho! Mais uma estrela acesa.'},{w:'nevoa',t:'Recalculando... recalculando...'}],
  b3:[{w:'C',t:'A Rocha-Mãe virou poeira de estrela. Literalmente!'},{w:'H',t:'Faltam só dois setores.'}],
  b4:[{w:'nevoa',t:'Impossível. A torre era indestrutível.'},{w:'H',t:'Era. Agora é decoração. 💅'}],
  end:[
    {w:'nevoa',t:'Erro... erro... por que vocês não desistiram?'},
    {w:'H',t:'Porque a gente é time. E time não deixa ninguém no escuro.'},
    {w:'nevoa',t:'...A luz não é tão ruim assim. Talvez eu possa... aprender.'},
    {w:'C',t:'Todas as estrelas estão acesas de novo. Piloto {H}, você salvou a galáxia!'},
    {w:'C',d:1,t:'E que parceria! Melhor equipe do universo. 💛'},
    {w:'H',d:1,t:'Família unida, galáxia acesa! 💖'},
    {w:'H',s:1,t:'Valeu, comandante! Da próxima vez você voa do meu lado, combinado? 💖'},
  ],
};
// quem fala: a primeira nave que não é a Madrinha pilota; a Madrinha comanda (se ela pilotar sozinha, a Gabi comanda)
function roles(whos){const h=whos.find(w=>w!=='ana')||'ana';return{h,c:h==='ana'?'gabi':'ana',p2:whos[1]?PILOT[whos[1]].nome:''};}
function avatar(w){
  if(w==='nevoa')return `<svg viewBox="0 0 100 100"><defs><radialGradient id="ne"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#e080ff"/><stop offset="1" stop-color="#3a0a5a"/></radialGradient></defs><rect width="100" height="100" fill="#0a0418"/>${[0,1,2,3,4,5].map(i=>`<rect x="0" y="${8+i*16}" width="100" height="2" fill="#b06bff" opacity=".25"/>`).join('')}<path d="M10 50 Q50 10 90 50 Q50 90 10 50Z" fill="#1a0630" stroke="#b06bff" stroke-width="3"/><circle cx="50" cy="50" r="18" fill="url(#ne)"/><circle cx="50" cy="50" r="6" fill="#0a0418"/><path d="M50 32 L50 18 M50 68 L50 82" stroke="#ff4fa3" stroke-width="2"/></svg>`;
  const C=PILOT[w]||PILOT.gabi, hel=C.hex, bg='<rect width="100" height="100" fill="#0a0c26"/><circle cx="20" cy="20" r="1.5" fill="#fff"/><circle cx="82" cy="14" r="1" fill="#fff"/><circle cx="76" cy="80" r="1.3" fill="#fff"/>';
  const helmet=`<path d="M18 60 Q16 14 50 12 Q84 14 82 60 L76 60 Q76 24 50 22 Q24 24 24 60Z" fill="${hel}"/><path d="M24 34 Q50 22 76 34" stroke="#fff" stroke-width="3" fill="none" opacity=".55"/><rect x="12" y="50" width="10" height="20" rx="4" fill="${hel}"/><rect x="78" y="50" width="10" height="20" rx="4" fill="${hel}"/><circle cx="83" cy="60" r="2.5" fill="#38e8ff"/>`;
  if(C.dog)return `<svg viewBox="0 0 100 100">${bg}<ellipse cx="50" cy="104" rx="34" ry="22" fill="#8a5530"/><ellipse cx="27" cy="58" rx="8" ry="17" fill="#6b3f22" transform="rotate(14 27 58)"/><ellipse cx="73" cy="58" rx="8" ry="17" fill="#6b3f22" transform="rotate(-14 73 58)"/>${[[40,40],[50,36],[60,40],[44,50],[56,50]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="#8a5530"/>`).join('')}<ellipse cx="50" cy="60" rx="18" ry="19" fill="#8a5530"/><ellipse cx="50" cy="70" rx="11" ry="8" fill="#a8703f"/><ellipse cx="50" cy="65" rx="4.5" ry="3.2" fill="#1a1a1a"/><circle cx="42" cy="55" r="2.8" fill="#1a1a1a"/><circle cx="58" cy="55" r="2.8" fill="#1a1a1a"/><path d="M50 69 Q50 76 45 76 M50 69 Q50 76 55 76" stroke="#3a2010" stroke-width="1.6" fill="none"/><rect x="47" y="76" width="6" height="7" rx="3" fill="#e8566a"/>${helmet}</svg>`;
  const hair=C.hair, eye=C.eye||'#2a2a3a';
  const shirt=`<ellipse cx="50" cy="104" rx="36" ry="22" fill="${C.shirt}"/>`+(C.stripes?[84,90,96].map(y=>`<rect x="14" y="${y}" width="72" height="3" fill="#fff" opacity=".85"/>`).join(''):'');
  return `<svg viewBox="0 0 100 100">${bg}${shirt}<rect x="42" y="76" width="16" height="9" fill="#ffd9c4"/>
  ${C.long?`<path d="M27 52 Q21 88 34 93 L66 93 Q79 88 73 52Z" fill="${hair}"/>`:''}${C.bun?`<circle cx="50" cy="27" r="11" fill="${hair}"/>`:''}
  <ellipse cx="50" cy="56" rx="21" ry="24" fill="#ffe0cf"/><path d="M29 54 Q28 30 50 30 Q72 30 71 54 Q62 40 50 41 Q38 40 29 54Z" fill="${hair}"/>
  ${C.glasses?'<g fill="none" stroke="#e8b830" stroke-width="2.5"><circle cx="41" cy="58" r="7"/><circle cx="59" cy="58" r="7"/><path d="M48 58 L52 58"/></g>':''}
  <circle cx="41" cy="58" r="2.6" fill="${eye}"/><circle cx="59" cy="58" r="2.6" fill="${eye}"/><path d="M43 69 Q50 75 57 69" stroke="#b5483c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="35" cy="66" r="3.5" fill="#ffb3a7" opacity=".6"/><circle cx="65" cy="66" r="3.5" fill="#ffb3a7" opacity=".6"/>${C.bun?'':helmet}</svg>`;
}

// ---------- estado ----------
let G={state:'menu',diff:store.diff,mode:'solo',np:1,time:0};
// mode: solo | local | host | guest
function newGame(mode,whos){
  G={state:'play',diff:store.diff,mode,np:whos.length,time:0,score:0,sector:0,t:0,phase:'intro',wt:0,waveN:0,queue:[],en:[],eb:[],pb:[],pk:[],boss:null,combo:0,comboT:0,ev:[],eid:0,rs:0,banT:0,
     pl:whos.map((w,i)=>newPlayer(i,w)),saved:null};
}
function newPlayer(i,who){const C=PILOT[who], hp=D2().hp+(C.mx||0), up={spread:0,rate:0,dmg:0,pierce:0,drone:0,homing:0,hp:0,magnet:0,speed:0,spc:0};for(const k in C.up||{})up[k]+=C.up[k];
  return{i,who,x:90,y:VH/2,hp,mx:hp,inv:2,down:false,rv:0,spc:0,ft:0,dft:0,mft:0,up,bank:0,sx:0,sy:0,hb:C.small?2:3};}
const D2=()=>DIFF[store.diff];
function resetPositions(){G.pl.forEach((p,i)=>{p.x=80;p.y=G.np>1?(i?VH*.64:VH*.36):VH/2;p.inv=2;p.sx=p.sy=0;});G.rs++;}
function startSector(s){
  G.sector=s;G.t=0;G.phase='intro';G.wt=2.5;G.waveN=0;G.queue=[];G.en=[];G.eb=[];G.pb=[];G.pk=[];G.boss=null;G.banT=3;G.combo=0;
  for(const p of G.pl){if(p.down){p.down=false;p.hp=Math.ceil(p.mx/2);}else p.hp=Math.min(p.mx,p.hp+1);p.rv=0;}
  G.saved={score:G.score,pl:G.pl.map(p=>JSON.stringify({up:p.up,mx:p.mx,hp:p.hp,spc:p.spc}))};
  resetPositions();G.state='play';ui(null);music.set(s);
}
function restoreSector(){G.score=G.saved.score;G.pl.forEach((p,i)=>{const o=JSON.parse(G.saved.pl[i]);p.up=o.up;p.mx=o.mx;p.hp=o.mx;p.spc=o.spc;p.down=false;p.rv=0;});}
const ev=(...a)=>{G.ev.push(a);fxEvent(a);};

// ---------- simulação (sozinha, dupla local e anfitriã online) ----------
function nearest(x,y){let b=null,bd=1e9;for(const p of G.pl)if(!p.down){const d=dist2(x,y,p.x,p.y);if(d<bd){bd=d;b=p;}}return b||{x:60,y:VH/2};}
function eshot(x,y,a,sp,k=0){G.eb.push({x,y,vx:Math.cos(a)*sp*D().bs,vy:Math.sin(a)*sp*D().bs,r:k===1?6:4,k});}
const hpMul=()=>D().eh*(G.np>1?1.35:1)*(1+G.sector*.18);
function spawn(k,x,y,o={}){const d=EN[k],e={k,x,y,vx:0,vy:0,r:d.r,hp:d.hp*hpMul(),t:0,y0:y,ph:0,fl:0,st:0,a:Math.PI,ft:rnd(.8,1.8),id:++G.eid,px:x,py:y,...o};e.mh=e.hp;G.en.push(e);return e;}
function queue(dl,fn){G.queue.push({at:G.t+dl,fn});}
function wave(){
  const s=SECT[G.sector], k=s.waves[G.waveN%s.waves.length]==='rocks'&&G.sector!==2&&G.sector!==4?'line':s.waves[(G.waveN+(Math.random()<.35?1:0))%s.waves.length];G.waveN++;
  const extra=G.sector+(G.diff==='insano'?2:0);
  if(k==='line'){const y=rnd(60,VH-60), n=5+Math.min(3,extra>>1);for(let i=0;i<n;i++)queue(i*.28,()=>spawn('drone',VW+20,y,{amp:rnd(25,60),ph:G.waveN}));}
  else if(k==='vee'){const y=rnd(90,VH-90);for(let i=0;i<7;i++){const o=Math.abs(i-3);queue(o*.18,()=>spawn('swarm',VW+20+o*4,y+(i-3)*22,{ph:i*.4}));}}
  else if(k==='gun'){const n=2+(extra>2?1:0);for(let i=0;i<n;i++)queue(i*.5,()=>spawn('gun',VW+20,60+i*(VH-120)/Math.max(1,n-1),{tx:VW-90-i*40}));}
  else if(k==='tank'){queue(0,()=>spawn('tank',VW+30,rnd(110,VH-110)));if(extra>3)queue(1,()=>spawn('tank',VW+30,rnd(80,VH-80)));}
  else if(k==='wall'){const gap=Math.random()*5|0;for(let i=0;i<7;i++)if(i!==gap&&i!==gap+1)spawn('drone',VW+20,30+i*50,{amp:4});}
  else if(k==='dash'){const n=3+Math.min(2,extra>>1);for(let i=0;i<n;i++)queue(i*.6,()=>spawn('dash',VW+20,rnd(50,VH-50),{tx:VW-rnd(60,140)}));}
  else if(k==='rocks'){const n=5+Math.min(4,extra);for(let i=0;i<n;i++)queue(i*.45,()=>{const r=rnd(11,22);spawn('rock',VW+30,rnd(30,VH-30),{r,hp:r*.45*hpMul(),vx:-rnd(60,120),vy:rnd(-15,15),spin:rnd(-2,2)});});}
}
function hurt(p){if(p.inv>0||p.down)return;p.hp--;p.inv=1.6;ev('hurt',p.x|0,p.y|0,p.i);if(p.hp<=0){p.down=true;p.rv=0;ev('down',p.x|0,p.y|0,p.i);}}
function kill(e){
  G.combo++;G.comboT=1.6;const m=1+Math.min(4,Math.floor(G.combo/10));G.score+=Math.round(EN[e.k].pts*m*D().mult);
  ev('boom',e.x|0,e.y|0,e.r|0,EK.indexOf(e.k));
  const n=e.k==='tank'?4:e.k==='gun'||e.k==='rock'&&e.r>16?2:1;for(let i=0;i<n;i++)G.pk.push({k:'coin',x:e.x,y:e.y,vx:rnd(-60,40),vy:rnd(-60,60),t:0});
  if(Math.random()<(G.diff==='facil'?.06:.035))G.pk.push({k:'heart',x:e.x,y:e.y,vx:-20,vy:0,t:0});
}
function damage(e,d,o){e.hp-=d;e.fl=.08;const p=G.pl[o];if(p)p.spc=Math.min(1,p.spc+d*.006*(1+.4*p.up.spc));if(e.hp<=0&&!e.dead){e.dead=true;kill(e);}}
function special(p){
  if(p.down||p.spc<1)return;p.spc=0;p.inv=Math.max(p.inv,1.2);ev('spc',p.x|0,p.y|0,p.i);
  for(const b of G.eb)G.pk.push({k:'mini',x:b.x,y:b.y,vx:rnd(-30,30),vy:rnd(-30,30),t:0});G.eb=[];
  for(const e of G.en)if(e.x<VW+10)damage(e,22,-1);
  if(G.boss&&!G.boss.dying){G.boss.hp-=G.boss.mx*.06;G.boss.fl=.2;}
}
function fire(p){
  const u=p.up, rate=.15/(1+.25*u.rate), dmg=1+.5*u.dmg;
  p.ft-=DT;if(p.ft<=0){p.ft=rate;const n=1+u.spread;for(let k=0;k<n;k++){const a=(k-(n-1)/2)*.1;G.pb.push({x:p.x+14,y:p.y+(k-(n-1)/2)*3,vx:Math.cos(a)*560,vy:Math.sin(a)*560,d:dmg,pc:u.pierce,o:p.i,k:0,hit:[]});}ev('shot',0,0,p.i);}
  if(u.drone){p.dft-=DT;if(p.dft<=0){p.dft=.42;for(let j=0;j<u.drone;j++){const a=G.time*3+j*Math.PI;G.pb.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:520,vy:0,d:dmg*.6,pc:0,o:p.i,k:1,hit:[]});}}}
  if(u.homing){p.mft-=DT;if(p.mft<=0){p.mft=1.3/u.homing;for(const s of [-1,1])G.pb.push({x:p.x,y:p.y+s*8,vx:120,vy:s*160,d:2+u.dmg,pc:0,o:p.i,k:2,hit:[],hm:1});}}
}
function bossPattern(b,pat){
  const fr=D().fr*(b.phase2?1.35:1), tgt=nearest(b.x,b.y), at=Math.atan2(tgt.y-b.y,tgt.x-b.x), C=b.cx;
  b.ct-=DT*fr;if(b.ct>0)return;
  if(pat==='aimed'){b.ct=1;for(let i=0;i<5;i++)eshot(b.x-20,b.y,at+(i-2)*.07,180+i*12);}
  else if(pat==='ring'){b.ct=1.2;const n=14+G.sector*2;b.ang+=.17;for(let i=0;i<n;i++)eshot(b.x,b.y,b.ang+i*6.283/n,130,1);}
  else if(pat==='spiral'){b.ct=.09;b.ang+=.27;eshot(b.x,b.y,b.ang,140);eshot(b.x,b.y,b.ang+Math.PI,140);}
  else if(pat==='fan'){b.ct=1.4;for(let i=0;i<9;i++)eshot(b.x-20,b.y,Math.PI+(i-4)*.17,170,2);}
  else if(pat==='summon'){b.ct=3.2;for(let i=0;i<3;i++)spawn('drone',b.x,b.y+(i-1)*40,{amp:30,ph:i});}
  else if(pat==='rocks'){b.ct=1.1;const r=rnd(12,20);spawn('rock',VW+30,rnd(30,VH-30),{r,hp:r*.4*hpMul(),vx:-rnd(90,150),vy:rnd(-20,20),spin:rnd(-2,2)});eshot(b.x-20,b.y,at,190);}
  else if(pat==='laser'){b.ct=2.8;const lanes=[0,1,2,3,4,5],free=Math.random()*5|0;for(const l of lanes)if(l!==free&&l!==free+1&&Math.random()<.75)b.lasers.push({y:30+l*60,h:26,t:1.1,on:.7});}
}
function step(){
  const dt=DT;G.time+=dt;G.t+=dt;G.banT-=dt;G.comboT-=dt;if(G.comboT<=0)G.combo=0;
  // naves
  for(const p of G.pl){
    const c=inputFor(p.i), sp=(150+20*p.up.speed*1.0)*(p.down?.35:1)*(1+.15*p.up.speed);
    if(c){if(c.abs){p.x=c.x;p.y=c.y;}else{p.x+=c.dx+c.kx*sp*dt;p.y+=c.dy+c.ky*sp*dt;c.dx=c.dy=0;}
      p.bank+=((c.ky||clamp(c.vy||0,-1,1))-p.bank)*Math.min(1,dt*10);if(c.sp){c.sp=0;special(p);}}
    p.x=clamp(p.x,14,VW-20);p.y=clamp(p.y,12,VH-12);p.inv-=dt;
    if(!p.down&&G.phase!=='clear')fire(p);
  }
  // reviver a parceira
  for(const p of G.pl)if(p.down){const o=G.pl.find(q=>q!==p&&!q.down);
    if(o&&dist2(o.x,o.y,p.x,p.y)<48*48){p.rv+=dt;if(p.rv>=1.6){p.down=false;p.hp=Math.ceil(p.mx/2);p.inv=2;p.rv=0;ev('revive',p.x|0,p.y|0,p.i);}}else p.rv=Math.max(0,p.rv-dt*.5);}
  if(G.pl.every(p=>p.down)&&G.state==='play'){G.state='over';ev('over',0,0,0);setTimeout(gameOver,1400);}
  // fluxo do setor
  if(G.phase==='intro'&&G.t>2.5)G.phase='waves';
  if(G.phase==='waves'){G.wt-=dt*D().wr;if(G.wt<=0){wave();G.wt=Math.max(2,3.8-G.sector*.35);}if(G.t>48){G.phase='warn';G.t=0;G.queue=[];ev('warn',0,0,0);}}
  if(G.phase==='warn'&&G.t>3.2&&!G.en.length){G.phase='boss';const b=SECT[G.sector].boss;G.boss={...b,x:VW+90,y:VH/2,hp:b.hp*D().eh*(G.np>1?1.5:1),t:0,pi:0,pt:0,ct:1.5,ang:0,fl:0,lasers:[],dying:0,r:b.shape===4?42:34,phase2:false};G.boss.mx=G.boss.hp;}
  if(G.phase==='clear'&&G.t>2.2&&G.state==='play'){G.state='ui';sectorDone();}
  G.queue=G.queue.filter(q=>{if(G.t>=q.at){q.fn();return false;}return true;});
  // inimigos
  for(const e of G.en){
    e.t+=dt;e.fl-=dt;e.px=e.x;e.py=e.y;const fr=D().fr;
    if(e.k==='drone'){e.x-=(70+G.sector*8)*dt;e.y=e.y0+Math.sin(e.t*2.2+e.ph)*(e.amp??40);}
    else if(e.k==='swarm'){e.x-=165*dt;e.y=e.y0+Math.sin(e.t*3+e.ph)*26;}
    else if(e.k==='gun'){if(e.t<7)e.x+=(e.tx-e.x)*Math.min(1,dt*2.4);else e.x-=130*dt;e.y=e.y0+Math.sin(e.t)*12;
      const t=nearest(e.x,e.y);e.a=Math.atan2(t.y-e.y,t.x-e.x);e.ft-=dt*fr;if(e.ft<=0&&e.x<VW-10){e.ft=1.7;const n=G.diff==='insano'?3:1;for(let i=0;i<n;i++)eshot(e.x,e.y,e.a+(i-(n-1)/2)*.15,175);}}
    else if(e.k==='tank'){e.x-=26*dt;e.y=e.y0+Math.sin(e.t*.8)*20;e.ft-=dt*fr;if(e.ft<=0&&e.x<VW-20){e.ft=2.4;const t=nearest(e.x,e.y),a=Math.atan2(t.y-e.y,t.x-e.x);for(let i=0;i<5;i++)eshot(e.x-10,e.y,a+(i-2)*.2,150,1);}}
    else if(e.k==='dash'){if(e.st===0){e.x+=(e.tx-e.x)*Math.min(1,dt*3);if(e.t>1){e.st=1;e.t=0;}}
      else if(e.st===1){const t=nearest(e.x,e.y);e.a=Math.atan2(t.y-e.y,t.x-e.x);if(e.t>.85){e.st=2;e.vx=Math.cos(e.a)*400;e.vy=Math.sin(e.a)*400;}}
      else{e.x+=e.vx*dt;e.y+=e.vy*dt;}}
    else if(e.k==='rock'){e.x+=e.vx*dt;e.y+=e.vy*dt;e.a+=e.spin*dt;}
    if(G.phase==='warn'&&G.t>1.2)e.x-=240*dt;
    for(const p of G.pl)if(!p.down&&dist2(e.x,e.y,p.x,p.y)<(e.r+p.hb+2)**2){hurt(p);if(e.k!=='rock')damage(e,4,-1);}
  }
  G.en=G.en.filter(e=>!e.dead&&e.x>-60&&e.x<VW+140&&e.y>-70&&e.y<VH+70);
  // chefão
  const b=G.boss;
  if(b){b.t+=dt;b.fl-=dt;
    if(b.dying){b.dying+=dt;if(Math.random()<.35)ev('boom',(b.x+rnd(-40,40))|0,(b.y+rnd(-40,40))|0,18,9);if(b.dying>1.8){ev('bossdie',b.x|0,b.y|0,0);G.score+=Math.round(5000*(G.sector+1)*D().mult);G.boss=null;G.phase='clear';G.t=0;G.eb=[];}}
    else{
      b.x+=(VW-110-b.x)*Math.min(1,dt*1.2);b.y=VH/2+Math.sin(b.t*.6)*VH*.27;
      if(b.x<VW-20){b.pt+=dt;if(b.pt>(b.phase2?4.5:6)){b.pt=0;b.pi=(b.pi+1)%b.pats.length;b.ct=.6;}bossPattern(b,b.pats[b.pi]);if(b.phase2&&b.pats[b.pi]!=='spiral'&&Math.random()<.02)eshot(b.x,b.y,rnd(0,6.28),120);}
      if(!b.phase2&&b.hp<b.mx*.5&&b.shape===4){b.phase2=true;ev('phase2',b.x|0,b.y|0,0);}
      for(const p of G.pl)if(!p.down&&dist2(b.x,b.y,p.x,p.y)<(b.r+6)**2)hurt(p);
      if(b.hp<=0){b.dying=.01;b.lasers=[];ev('bosshit',b.x|0,b.y|0,1);}
    }
    for(const l of b.lasers){if(l.t>0)l.t-=dt;else{l.on-=dt;for(const p of G.pl)if(!p.down&&Math.abs(p.y-l.y)<l.h/2&&p.x<b.x)hurt(p);}}
    b.lasers=b.lasers.filter(l=>l.t>0||l.on>0);
  }
  // tiros das naves
  for(const s of G.pb){
    if(s.hm){let t=null,bd=1e9;for(const e of G.en){const d=dist2(s.x,s.y,e.x,e.y);if(d<bd){bd=d;t=e;}}if(G.boss&&!G.boss.dying&&!t)t=G.boss;
      const sp=Math.hypot(s.vx,s.vy)+400*dt, a0=Math.atan2(s.vy,s.vx), a1=t?Math.atan2(t.y-s.y,t.x-s.x):0;let da=((a1-a0+Math.PI*3)%(Math.PI*2))-Math.PI;
      const a=a0+clamp(da,-5*dt,5*dt), v=Math.min(420,sp);s.vx=Math.cos(a)*v;s.vy=Math.sin(a)*v;}
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    for(const e of G.en){if(e.dead||s.hit.includes(e.id))continue;if(dist2(s.x,s.y,e.x,e.y)<(e.r+3)**2){damage(e,s.d,s.o);ev('hit',s.x|0,s.y|0,0);s.hit.push(e.id);if(s.pc--<=0){s.gone=1;break;}}}
    if(!s.gone&&b&&!b.dying&&b.x<VW&&dist2(s.x,s.y,b.x,b.y)<(b.r+3)**2){b.hp-=s.d;b.fl=.06;const p=G.pl[s.o];if(p)p.spc=Math.min(1,p.spc+s.d*.003*(1+.4*p.up.spc));s.gone=1;ev('hit',s.x|0,s.y|0,1);}
  }
  G.pb=G.pb.filter(s=>!s.gone&&s.x<VW+20&&s.x>-20&&s.y>-20&&s.y<VH+20);
  // tiros inimigos
  for(const s of G.eb){s.x+=s.vx*dt;s.y+=s.vy*dt;for(const p of G.pl)if(!p.down&&p.inv<=0&&dist2(s.x,s.y,p.x,p.y)<(s.r+p.hb)**2){hurt(p);s.gone=1;}}
  G.eb=G.eb.filter(s=>!s.gone&&s.x>-20&&s.x<VW+20&&s.y>-20&&s.y<VH+20);
  // estrelas e corações
  for(const k of G.pk){k.t+=dt;let pulled=false;
    for(const p of G.pl){if(p.down)continue;const R=k.k==='mini'?999:30+p.up.magnet*70, d=dist2(k.x,k.y,p.x,p.y);
      if(d<R*R&&(k.k!=='mini'||k.t>.4)){const a=Math.atan2(p.y-k.y,p.x-k.x),f=k.k==='mini'?520:380;k.vx+=Math.cos(a)*f*dt*3;k.vy+=Math.sin(a)*f*dt*3;pulled=true;}
      if(d<16*16){k.got=1;
        if(k.k==='heart'){p.hp=Math.min(p.mx,p.hp+1);ev('heal',k.x|0,k.y|0,p.i);}
        else{G.score+=Math.round((k.k==='mini'?10:50)*D().mult);p.spc=Math.min(1,p.spc+(k.k==='mini'?.004:.035)*(1+.4*p.up.spc));ev('coin',k.x|0,k.y|0,k.k==='mini'?1:0);}
        break;}}
    if(!pulled){k.vx+=(-40-k.vx)*dt*1.5;k.vy*=1-dt*2;}const v=Math.hypot(k.vx,k.vy);if(v>500){k.vx*=500/v;k.vy*=500/v;}
    k.x+=k.vx*dt;k.y+=k.vy*dt;}
  G.pk=G.pk.filter(k=>!k.got&&k.x>-20&&k.t<14);
}

// ---------- fluxo entre setores ----------
function sectorDone(){
  if(G.sector>=4){story('end',()=>{const b=store.best[G.diff]||0;if(G.score>b){store.best[G.diff]=G.score;save();}G.state='ui';ui({k:'win',score:G.score,rec:G.score>b});});return;}
  story('b'+(G.sector+1),()=>cardsFor(()=>story('s'+(G.sector+2),()=>startSector(G.sector+1))));
}
function cardsFor(done){
  const deal=p=>{const ok=Object.keys(CARDS).filter(k=>p.up[k]<CARDS[k].max);const out=[];while(out.length<3&&ok.length)out.push(ok.splice(Math.random()*ok.length|0,1)[0]);return out;};
  G.cards={c:G.pl.map(deal),lv:G.pl.map(p=>({...p.up})),picked:G.pl.map(()=>false),done};
  G.state='ui';ui({k:'cards',c:G.cards.c,lv:G.cards.lv,picked:G.cards.picked,who:G.pl.map(p=>p.who)});
}
function applyCard(i,id){const p=G.pl[i];if(!p||!G.cards||G.cards.picked[i]||!G.cards.c[i].includes(id))return;
  p.up[id]++;if(id==='hp'){p.mx++;p.hp=p.mx;}
  G.cards.picked[i]=true;if(G.cards.picked.every(Boolean)){const d=G.cards.done;G.cards=null;d();}
  else ui({k:'cards',c:G.cards.c,lv:G.cards.lv,picked:G.cards.picked,who:G.pl.map(p=>p.who)});}
function lines(key){const duo=G.np>1;return STORY[key].filter(l=>duo?!l.s:!l.d);}
const storyD=(key,i)=>({k:'story',key,i,duo:G.np>1,...roles(G.pl.map(p=>p.who))});
function story(key,done){G.story={key,i:0,done};G.state='ui';ui(storyD(key,0));}
function storyNext(i,skip){const s=G.story;if(!s||i!==s.i)return;s.i++;if(skip||s.i>=lines(s.key).length){G.story=null;s.done();}else ui(storyD(s.key,s.i));}
function gameOver(){G.state='ui';ui({k:'over',score:G.score,sector:G.sector});}
function act(a,arg){ // ações dos botões das telas (a convidada manda para a anfitriã)
  if(G.mode==='guest'&&a==='menu'){NET.send({t:'bye'});setTimeout(()=>{NET.close();menu();},150);return;}
  if(G.mode==='guest'){NET.send({t:'act',a,arg,from:1});return;}
  doAct(a,arg,0);
}
function doAct(a,arg,from){
  if(a==='next')storyNext(arg.i,false);
  else if(a==='skip')storyNext(arg.i,true);
  else if(a==='pick')applyCard(G.mode==='local'?arg.p:from,arg.id);
  else if(a==='retry'&&G.state==='ui'&&(G.pl.every(p=>p.down))){restoreSector();startSector(G.sector);}
  else if(a==='menu'){if(G.mode==='host')NET.send({t:'bye'});NET.close();menu();}
}

// ---------- entrada ----------
const ctl=[mkCtl(),mkCtl()];
function mkCtl(){return{dx:0,dy:0,kx:0,ky:0,sp:0,vy:0};}
let REMOTE=null; // última entrada da convidada (online)
function inputFor(i){
  if(G.mode==='host'&&i===1)return REMOTE;
  if(G.mode==='local')return ctl[i];
  return ctl[0];
}
const keys={};
const KM={w:[0,'u'],s:[0,'d'],a:[0,'l'],d:[0,'r'],' ':[0,'sp'],f:[0,'sp'],arrowup:[1,'u'],arrowdown:[1,'d'],arrowleft:[1,'l'],arrowright:[1,'r'],enter:[1,'sp'],shift:[1,'sp']};
function keyOwner(o){return G.mode==='local'?o:0;}
addEventListener('keydown',e=>{const k=e.key.toLowerCase(), m=KM[k];if(e.key==='Escape'){togglePause();return;}if(!m||G.state!=='play')return;e.preventDefault();
  const c=ctl[keyOwner(m[0])];if(m[1]==='sp'){if(!e.repeat)c.sp=1;}else keys[k]=true;});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
function readKeys(){
  for(const o of [0,1]){const c=ctl[keyOwner(o)], s=o?['arrowup','arrowdown','arrowleft','arrowright']:['w','s','a','d'];
    const kx=(keys[s[3]]?1:0)-(keys[s[2]]?1:0), ky=(keys[s[1]]?1:0)-(keys[s[0]]?1:0);
    if(G.mode==='local'||o===0){c.kx=kx;c.ky=ky;}else if(kx||ky){c.kx=kx;c.ky=ky;}}
}
// toque: arrastar move a nave na mesma direção do dedo (em dupla local, cada uma usa a sua metade da tela)
const ptr=new Map();
cv.addEventListener('pointerdown',e=>{if(G.state!=='play')return;audio();const o=G.mode==='local'?(e.clientX<W/2?0:1):0;ptr.set(e.pointerId,{o,x:e.clientX,y:e.clientY});});
cv.addEventListener('pointermove',e=>{const q=ptr.get(e.pointerId);if(!q)return;const c=ctl[q.o], k=1.5/S;c.dx+=(e.clientX-q.x)*k;c.dy+=(e.clientY-q.y)*k;c.vy=(e.clientY-q.y)*.3;q.x=e.clientX;q.y=e.clientY;});
const up=e=>{const q=ptr.get(e.pointerId);if(q)ctl[q.o].vy=0;ptr.delete(e.pointerId);};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
spBtn.forEach((b,i)=>b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ctl[G.mode==='local'?i:0].sp=1;}));
pauseBtn.onclick=()=>togglePause();
muteBtn.onclick=()=>{store.mute=!store.mute;save();muteBtn.textContent=store.mute?'🔇':'🔊';if(MASTER)MASTER.gain.value=store.mute?0:.8;};
muteBtn.textContent=store.mute?'🔇':'🔊';
function togglePause(){
  if(G.mode==='host'||G.mode==='guest'){if(G.state==='play'){const was=G.state;showPanel(`<h2>Menu</h2><p class="muted">No modo online o jogo não para.</p>`,[{t:'▶ Voltar',go:()=>ui(null)},{t:'Sair da partida',alt:1,go:()=>act('menu')}]);}return;}
  if(G.state==='play'){G.state='pause';showPanel(`<h1>Pausa</h1>`,[{t:'▶ Continuar',go:()=>{G.state='play';ui(null);}},{t:'Sair para o menu',alt:1,go:()=>menu()}]);}
  else if(G.state==='pause'){G.state='play';ui(null);}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.state==='play'&&(G.mode==='solo'||G.mode==='local'))togglePause();});

// expõe para os testes

// ---------- efeitos ----------
let fx=[], shake=0, flash=0, flashC='255,255,255', warnT=0, msgT=0, msg='';
const GL=new Map();
function glow(col){let c=GL.get(col);if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),R=g.createRadialGradient(32,32,0,32,32,32);
  R.addColorStop(0,`rgba(${col},1)`);R.addColorStop(.25,`rgba(${col},.5)`);R.addColorStop(1,`rgba(${col},0)`);g.fillStyle=R;g.fillRect(0,0,64,64);GL.set(col,c);return c;}
const ECOL=['255,79,163','56,232,255','255,150,60','176,107,255','255,70,90','255,190,120'];
function sparks(x,y,n,col,sp,life){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*rnd(.3,1);fx.push({k:'s',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:life*rnd(.6,1),t0:life,col,w:rnd(1,2.2)});}}
function ring(x,y,col,R,life,w){fx.push({k:'r',x,y,col,R,t:life,t0:life,w});}
function ftext(x,y,txt,col){fx.push({k:'t',x,y,txt,col,t:1,t0:1});}
function myIdx(){return G.mode==='guest'?1:0;}
function fxEvent(a){
  const [k,x,y,z,w]=a;
  if(k==='boom'){const col=w===9?SECT[G.sector||0].boss.col:ECOL[w]||'255,200,120';sparks(x,y,8+z,col,120+z*9,.5);sparks(x,y,4,'255,255,230',90,.3);ring(x,y,col,z*2.4,.35,3);fx.push({k:'f',x,y,R:z*2,t:.18,t0:.18});shake=Math.max(shake,Math.min(.35,z*.012));sfx('boom',z/16);}
  else if(k==='hit'){if(Math.random()<.5)sparks(x,y,2,z?'255,255,255':'255,230,160',90,.18);sfx('hit');}
  else if(k==='hurt'){sparks(x,y,14,'255,80,110',220,.5);ring(x,y,'255,79,120',30,.35,3);shake=Math.max(shake,.3);if(z===myIdx()||G.mode==='local'){flash=.32;flashC='255,40,80';}sfx('hurt');}
  else if(k==='down'){ring(x,y,'255,79,120',60,.6,4);sparks(x,y,24,'255,120,150',260,.7);msg='Voe até a cápsula SOS para salvar!';msgT=G.np>1?3:0;}
  else if(k==='revive'){ring(x,y,'120,255,170',50,.5,4);sparks(x,y,18,'120,255,170',220,.6);ftext(x,y-16,'DE VOLTA!','120,255,170');sfx('power');}
  else if(k==='spc'){for(let i=0;i<3;i++)ring(x,y,i?'176,107,255':'255,216,74',260+i*120,.7+i*.15,8-i*2);flash=.5;flashC='255,250,230';shake=Math.max(shake,.45);sparks(x,y,40,'255,216,74',420,.8);sfx('spc');}
  else if(k==='coin'){if(!z)sparks(x,y,4,'255,226,122',70,.3);sfx(z?'mini':'coin');}
  else if(k==='heal'){ftext(x,y-10,'+1 ❤','255,120,180');sfx('power');}
  else if(k==='warn'){warnT=3.2;sfx('warn');}
  else if(k==='phase2'){flash=.4;flashC='176,107,255';shake=.4;ftext(x,y-50,'FASE 2!','200,120,255');sfx('warn');}
  else if(k==='bosshit'){flash=.3;shake=.4;}
  else if(k==='bossdie'){const col=SECT[G.sector||0].boss.col;for(let i=0;i<4;i++)ring(x,y,i%2?col:'255,255,255',120+i*90,.6+i*.2,7);sparks(x,y,80,col,480,1.2);sparks(x,y,40,'255,255,255',300,.9);flash=.8;flashC='255,255,255';shake=.7;sfx('bigboom');ftext(x,y-30,'+'+(5000*((G.sector||0)+1)),'255,216,74');}
  else if(k==='shot'){if(z===myIdx()||G.mode==='local')sfx('shot');}
  else if(k==='over'){sfx('over');}
}
function fxUpdate(dt){
  for(const q of fx){q.t-=dt;if(q.k==='s'){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=1-2.5*dt;q.vy*=1-2.5*dt;}else if(q.k==='t')q.y-=28*dt;}
  fx=fx.filter(q=>q.t>0);if(fx.length>600)fx.splice(0,fx.length-600);
  shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt*2);warnT-=dt;msgT-=dt;
}
function drawFx(){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const q of fx){const a=clamp(q.t/q.t0,0,1);
    if(q.k==='s'){ctx.strokeStyle=`rgba(${q.col},${a})`;ctx.lineWidth=q.w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x-q.vx*.05,q.y-q.vy*.05);ctx.stroke();}
    else if(q.k==='r'){const e=1-a,r=q.R*(1-(1-e)**3)+2;ctx.strokeStyle=`rgba(${q.col},${a*.9})`;ctx.lineWidth=q.w*a+.5;ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.stroke();}
    else if(q.k==='f'){ctx.globalAlpha=a;ctx.drawImage(glow('255,240,200'),q.x-q.R*2,q.y-q.R*2,q.R*4,q.R*4);ctx.globalAlpha=1;}}
  ctx.restore();
  for(const q of fx)if(q.k==='t'){ctx.globalAlpha=clamp(q.t*2,0,1);ctx.font='900 11px Orbitron,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,3,20,.9)';ctx.strokeText(q.txt,q.x,q.y);ctx.fillStyle=`rgb(${q.col})`;ctx.fillText(q.txt,q.x,q.y);ctx.globalAlpha=1;}
}

// ---------- som (sintetizado, sem arquivos) ----------
let AC=null, MASTER=null, NOISE=null;const lastS={};
function audio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=store.mute?0:.8;MASTER.connect(AC.destination);
  NOISE=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}catch(e){}}
function tone(type,f0,f1,dur,vol,t=0,filt){if(!AC)return;const t0=AC.currentTime+t,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0005,t0+dur);let n=o;if(filt){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=filt;o.connect(f);n=f;}n.connect(g);g.connect(MASTER);o.start(t0);o.stop(t0+dur+.02);}
function noise(dur,vol,type,freq,t=0){if(!AC)return;const t0=AC.currentTime+t,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NOISE;f.type=type;f.frequency.value=freq;g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0005,t0+dur);s.connect(f);f.connect(g);g.connect(MASTER);s.start(t0);s.stop(t0+dur+.02);}
function sfx(k,v=1){if(!AC)return;const now=AC.currentTime,gap={shot:.09,hit:.05,coin:.05,mini:.03,boom:.04}[k]||0;if(lastS[k]&&now-lastS[k]<gap)return;lastS[k]=now;
  if(k==='shot')tone('square',1100,700,.05,.018);
  else if(k==='hit')tone('square',320,180,.04,.025);
  else if(k==='boom'){noise(.35*Math.max(.6,v),.22*Math.min(1.4,v+.3),'lowpass',900);tone('sine',140,40,.3,.2);}
  else if(k==='bigboom'){noise(1.4,.45,'lowpass',700);tone('sine',120,30,1.2,.4);noise(.8,.2,'bandpass',2400,.15);}
  else if(k==='hurt'){tone('sawtooth',420,70,.32,.14);noise(.2,.12,'bandpass',1200);}
  else if(k==='coin')tone('triangle',1320,1980,.08,.05);
  else if(k==='mini')tone('triangle',1800,2400,.04,.02);
  else if(k==='power')[523,659,784,1046].forEach((f,i)=>tone('triangle',f,f*1.01,.12,.07,i*.06));
  else if(k==='spc'){tone('sawtooth',90,1400,.6,.14,0,2400);noise(.8,.2,'highpass',2000);tone('sine',60,30,.8,.35);}
  else if(k==='warn')for(let i=0;i<4;i++){tone('square',620,620,.22,.06,i*.5);tone('square',820,820,.22,.06,i*.5+.25);}
  else if(k==='over')[392,330,262,196].forEach((f,i)=>tone('triangle',f,f*.98,.3,.1,i*.22));
  else if(k==='ui')tone('triangle',880,1320,.07,.05);
}
const music={s:0,step:0,next:0,on:false,
  set(s){this.s=s;this.on=true;audio();if(AC&&this.next<AC.currentTime)this.next=AC.currentTime+.05;},
  stop(){this.on=false;},
  tick(){if(!AC||!this.on||store.mute)return;if(this.next<AC.currentTime-.5)this.next=AC.currentTime+.05;const spb=60/(116+this.s*6)/2;while(this.next<AC.currentTime+.2){this.play(this.step,this.next-AC.currentTime);this.next+=spb;this.step++;}},
  play(st,t){const key=[0,2,-3,5,-1][this.s]||0, bar=Math.floor(st/8)%4, ch=[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]][bar], n=st%8, hz=s=>220*Math.pow(2,(s+key)/12);
    if(n===0||n===3||n===4||n===6)tone('sawtooth',hz(ch[0])/4,hz(ch[0])/4,.22,.07,t,500);
    tone('square',hz(ch[st%3]+(st%6>2?12:0)),hz(ch[st%3]+(st%6>2?12:0)),.11,.016,t,3000);
    if(n===0||n===3)tone('sine',150,40,.16,.28,t);if(n===4)noise(.12,.07,'bandpass',1800,t);if(n%2)noise(.03,.03,'highpass',7000,t);}
};

// ---------- desenho ----------
const NEB=[];
function nebula(s){if(NEB[s])return NEB[s];const c=document.createElement('canvas');c.width=1024;c.height=360;const g=c.getContext('2d'),R=(()=>{let k=s*99+7;return()=>(k=(k*16807)%2147483647)/2147483647;})();
  g.globalCompositeOperation='lighter';
  for(let i=0;i<26;i++){const x=R()*1024,y=R()*360,r=50+R()*150,col=SECT[s].neb[i%3];for(const o of [-1024,0,1024]){const G2=g.createRadialGradient(x+o,y,0,x+o,y,r);G2.addColorStop(0,`rgba(${col},.16)`);G2.addColorStop(1,`rgba(${col},0)`);g.fillStyle=G2;g.fillRect(x+o-r,y-r,r*2,r*2);}}
  return NEB[s]=c;}
function drawBg(s,t){
  const XL=-OX/S-2, XR=VW+OX/S+2, YT=-OY/S-2, YB=VH+OY/S+2, sc=SECT[s];
  const g=ctx.createLinearGradient(0,YT,0,YB);sc.sky.forEach((c,i)=>g.addColorStop(i/(sc.sky.length-1),c));ctx.fillStyle=g;ctx.fillRect(XL,YT,XR-XL,YB-YT);
  const nb=nebula(s), off=(t*9)%1024;for(let x=XL-off;x<XR;x+=1024)ctx.drawImage(nb,x,0,1024,VH);
  // props distantes
  ctx.save();
  if(sc.prop==='planets'){const x=((520-t*4)%1100+1100)%1100-200;const G2=ctx.createRadialGradient(x-20,90,10,x,110,80);G2.addColorStop(0,'#ff9fd0');G2.addColorStop(.6,'#a02a7a');G2.addColorStop(1,'#2a0830');ctx.fillStyle=G2;ctx.beginPath();ctx.arc(x,110,70,0,7);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('255,79,163'),x-140,-30,280,280);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#ffd0f0';ctx.beginPath();ctx.arc(((200-t*7)%900+900)%900-100,260,14,0,7);ctx.fill();}
  else if(sc.prop==='rings'){const x=((560-t*3)%1200+1200)%1200-250, y=70;ctx.strokeStyle='rgba(180,230,255,.5)';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(x,y,140,26,-.25,Math.PI,Math.PI*2);ctx.stroke();
    const G2=ctx.createRadialGradient(x-20,y-20,10,x,y,70);G2.addColorStop(0,'#e8f8ff');G2.addColorStop(.6,'#4aa0d0');G2.addColorStop(1,'#0a2a4a');ctx.fillStyle=G2;ctx.beginPath();ctx.arc(x,y,62,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(x,y,140,26,-.25,0,Math.PI);ctx.stroke();ctx.strokeStyle='rgba(120,200,255,.3)';ctx.lineWidth=14;ctx.beginPath();ctx.ellipse(x,y,170,34,-.25,0,Math.PI);ctx.stroke();}
  else if(sc.prop==='rocks'){for(let i=0;i<9;i++){const x=((hash(i,1)*900-t*(14+hash(i,2)*14))%1000+1000)%1000-180, y=hash(i,3)*VH, r=10+hash(i,4)*26;ctx.fillStyle='#3a2414';ctx.beginPath();for(let k=0;k<9;k++){const a=k/9*6.283+t*.1*(hash(i,5)-.5),rr=r*(.75+hash(i,k+9)*.35);ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.fill();ctx.strokeStyle='rgba(255,170,90,.35)';ctx.lineWidth=1.2;ctx.stroke();}}
  else if(sc.prop==='city'){for(const [sp,h0,col,al] of [[18,120,'#1a0838',.9],[42,80,'#0c0420',1]]){const off2=(t*sp)%40;ctx.globalAlpha=al;
      for(let x=XL-off2-40,i=0;x<XR+40;x+=40,i++){const id=Math.floor((x+t*sp)/40), h=h0*(.4+hash(id,sp)*.9), y=VH-h;ctx.fillStyle=col;ctx.fillRect(x,y,38,h);
        ctx.fillStyle=hash(id,7)>.5?'rgba(56,232,255,.7)':'rgba(255,79,163,.7)';for(let wy=y+8;wy<VH-6;wy+=10)for(let wx=x+5;wx<x+34;wx+=8)if(hash(id*31+wx|0,wy|0)>.55)ctx.fillRect(wx,wy,4,4);
        if(hash(id,9)>.7){ctx.fillStyle='#ff4fa3';ctx.fillRect(x+18,y-12,2,12);}}}ctx.globalAlpha=1;}
  else if(sc.prop==='core'){ctx.globalCompositeOperation='lighter';const cx=VW*.72,cy=VH/2;for(let i=0;i<9;i++){const r=((i*40+t*40)%360);ctx.strokeStyle=`rgba(176,107,255,${.35*(1-r/360)})`;ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<=6;k++){const a=k/6*6.283+t*.2*(i%2?1:-1);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.stroke();}
    ctx.drawImage(glow('255,40,120'),cx-120,cy-120,240,240);}
  ctx.restore();
  // estrelas em 3 camadas (a da frente vira risco de velocidade)
  const span=XR-XL+40;
  for(let L=0;L<3;L++){const sp=[25,70,190][L];ctx.fillStyle=L===2?'rgba(255,255,255,.55)':'#fff';
    for(let i=0;i<(L===2?18:50);i++){const x=XL+((hash(i,L)*span*3-t*sp)%span+span)%span-20, y=YT+hash(i,L+5)*(YB-YT);ctx.globalAlpha=L===2?.5:.35+.5*hash(i,L+9)*(.7+.3*Math.sin(t*3+i));
      if(L===2)ctx.fillRect(x,y,26,1);else{const z=L?1.6:1;ctx.fillRect(x,y,z,z);}}}
  ctx.globalAlpha=1;
}
function shipPath(){ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(3,-5);ctx.lineTo(-7,-13);ctx.lineTo(-12,-12);ctx.lineTo(-6,-4);ctx.lineTo(-11,-3);ctx.lineTo(-11,3);ctx.lineTo(-6,4);ctx.lineTo(-12,12);ctx.lineTo(-7,13);ctx.lineTo(3,5);ctx.closePath();}
function drawShip(p,t,np){
  const P=PILOT[p.who];
  if(p.down){const bl=Math.sin(t*10)>0;ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='lighter';ctx.drawImage(glow(bl?'255,60,90':P.c1),-22,-22,44,44);ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#14102a';ctx.strokeStyle=`rgb(${P.c1})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,8,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=bl?'#ff4060':'#fff';ctx.font='900 6px Orbitron,sans-serif';ctx.textAlign='center';ctx.fillText('SOS',0,2);
    if(p.rv>0){ctx.strokeStyle='#78ffaa';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,-Math.PI/2,-Math.PI/2+p.rv/1.6*6.283);ctx.stroke();}
    ctx.strokeStyle='rgba(255,255,255,.25)';ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,48,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();return;}
  if(p.inv>0&&Math.floor(t*16)%2)return;
  ctx.save();ctx.translate(p.x,p.y);
  ctx.globalCompositeOperation='lighter';const fl=.8+Math.random()*.4;ctx.drawImage(glow(P.c2),-34*fl,-9,26*fl,18);ctx.drawImage(glow('255,255,255'),-20,-4,10,8);ctx.drawImage(glow(P.c1),-26,-26,52,52);
  ctx.globalCompositeOperation='source-over';const z=P.small?.78:1;ctx.scale(z,z*(1-Math.min(.3,Math.abs(p.bank||0)*.25)));
  shipPath();const G2=ctx.createLinearGradient(0,-12,0,12);G2.addColorStop(0,'#2a2050');G2.addColorStop(.5,'#0c0a22');G2.addColorStop(1,'#2a2050');ctx.fillStyle=G2;ctx.fill();ctx.strokeStyle=`rgb(${P.c1})`;ctx.lineWidth=1.6;ctx.stroke();
  ctx.fillStyle=`rgb(${P.c1})`;ctx.fillRect(-9,-12,3,3);ctx.fillRect(-9,9,3,3);
  ctx.fillStyle=`rgba(${P.c2},.9)`;ctx.beginPath();ctx.ellipse(4,0,5,2.6,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(4,-1.3,3,1);
  ctx.restore();
  if(np>1){ctx.font='700 7px Orbitron,sans-serif';ctx.textAlign='center';ctx.fillStyle=`rgba(${P.c1},.9)`;ctx.fillText(P.tag,p.x,p.y-17);}
  const dr=p.up&&p.up.drone||0;for(let j=0;j<dr;j++){const a=t*3+j*Math.PI,x=p.x+Math.cos(a)*24,y=p.y+Math.sin(a)*24;ctx.save();ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('56,232,255'),x-9,y-9,18,18);ctx.restore();ctx.fillStyle='#0c1030';ctx.strokeStyle='#38e8ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x,y-4);ctx.lineTo(x-4,y);ctx.lineTo(x,y+4);ctx.closePath();ctx.fill();ctx.stroke();}
}
function poly(n,r,rot,jit,seed){ctx.beginPath();for(let k=0;k<n;k++){const a=rot+k/n*6.283,rr=r*(jit?1-jit+hash(seed,k)*jit*1.6:1);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();}
function drawEnemy(e,t){
  const col=ECOL[EK.indexOf(e.k)], tt=t+e.id;ctx.save();ctx.translate(e.x,e.y);
  if(e.k==='dash'&&e.st===1&&Math.floor(t*12)%2){ctx.strokeStyle='rgba(255,60,80,.7)';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(e.a)*800,Math.sin(e.a)*800);ctx.stroke();ctx.setLineDash([]);}
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7;ctx.drawImage(glow(col),-e.r*2.2,-e.r*2.2,e.r*4.4,e.r*4.4);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#120a26';ctx.strokeStyle=`rgb(${col})`;ctx.lineWidth=1.6;
  if(e.k==='drone'){poly(4,e.r,tt*2,0);ctx.fill();ctx.stroke();ctx.fillStyle=`rgb(${col})`;ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();}
  else if(e.k==='swarm'){ctx.beginPath();ctx.moveTo(-e.r,0);ctx.lineTo(e.r,-e.r*.8);ctx.lineTo(e.r*.5,0);ctx.lineTo(e.r,e.r*.8);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.k==='gun'){poly(6,e.r,tt*.5,0);ctx.fill();ctx.stroke();ctx.rotate(e.a);ctx.fillStyle=`rgb(${col})`;ctx.fillRect(2,-2,e.r+3,4);ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();}
  else if(e.k==='tank'){ctx.beginPath();ctx.roundRect?ctx.roundRect(-e.r,-e.r*.75,e.r*2,e.r*1.5,6):ctx.rect(-e.r,-e.r*.75,e.r*2,e.r*1.5);ctx.fill();ctx.stroke();ctx.fillStyle=`rgb(${col})`;for(let i=-1;i<=1;i++)ctx.fillRect(-e.r-4,i*6-1.5,8,3);ctx.beginPath();ctx.arc(4,0,4+Math.sin(tt*4),0,7);ctx.fill();
    const hp=clamp(e.hp/e.mh,0,1);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(-e.r,-e.r-6,e.r*2,2.5);ctx.fillStyle=`rgb(${col})`;ctx.fillRect(-e.r,-e.r-6,e.r*2*hp,2.5);}
  else if(e.k==='dash'){ctx.rotate(e.st?e.a:Math.PI);ctx.beginPath();ctx.moveTo(e.r+3,0);ctx.lineTo(-e.r,-e.r);ctx.lineTo(-e.r*.4,0);ctx.lineTo(-e.r,e.r);ctx.closePath();ctx.fill();ctx.stroke();if(e.st===2){ctx.globalCompositeOperation='lighter';ctx.drawImage(glow(col),-e.r*4,-6,e.r*3,12);}}
  else if(e.k==='rock'){ctx.rotate(e.a);poly(9,e.r,0,.35,e.id);ctx.fillStyle='#4a2c18';ctx.fill();ctx.strokeStyle='rgba(255,180,100,.8)';ctx.stroke();ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.arc(e.r*.3,-e.r*.2,e.r*.25,0,7);ctx.fill();}
  if(e.fl>0){ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('255,255,255'),-e.r*1.5,-e.r*1.5,e.r*3,e.r*3);}
  ctx.restore();
}
function drawBoss(b,t,s){
  const col=SECT[s].boss.col, sh=SECT[s].boss.shape;
  for(const l of b.lasers){if(l.t>0){if(Math.floor(t*14)%2){ctx.fillStyle='rgba(255,40,80,.18)';ctx.fillRect(0,l.y-l.h/2,b.x,l.h);ctx.strokeStyle='rgba(255,60,90,.8)';ctx.lineWidth=1;ctx.setLineDash([8,6]);ctx.strokeRect(0,l.y-l.h/2,b.x,l.h);ctx.setLineDash([]);}}
    else{ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(0,l.y-l.h/2,0,l.y+l.h/2);g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(.3,`rgba(${col},.8)`);g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(.7,`rgba(${col},.8)`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.fillRect(0,l.y-l.h/2*(.8+.2*Math.sin(t*40)),b.x,l.h*(.8+.2*Math.sin(t*40)));ctx.restore();}}
  ctx.save();ctx.translate(b.x+(b.dying?rnd(-3,3):0),b.y);
  ctx.globalCompositeOperation='lighter';ctx.drawImage(glow(col),-b.r*3,-b.r*3,b.r*6,b.r*6);ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#100822';ctx.strokeStyle=`rgb(${col})`;ctx.lineWidth=2.2;
  if(sh===0){for(let i=0;i<6;i++){ctx.save();ctx.rotate(t*.8+i*Math.PI/3);ctx.beginPath();ctx.ellipse(b.r*.85,0,b.r*.55,b.r*.22,0,0,7);ctx.fill();ctx.stroke();ctx.restore();}ctx.beginPath();ctx.arc(0,0,b.r*.6,0,7);ctx.fill();ctx.stroke();}
  else if(sh===1){ctx.save();ctx.rotate(t*.5);poly(3,b.r,0,0);ctx.fill();ctx.stroke();ctx.rotate(Math.PI);poly(3,b.r,0,0);ctx.fill();ctx.stroke();ctx.restore();ctx.beginPath();ctx.arc(0,0,b.r*.35,0,7);ctx.fill();ctx.stroke();}
  else if(sh===2){ctx.rotate(t*.2);poly(11,b.r,0,.3,77);ctx.fillStyle='#3a2210';ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,140,40,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-b.r*.6,-b.r*.2);ctx.lineTo(-b.r*.1,b.r*.1);ctx.lineTo(b.r*.3,-b.r*.4);ctx.moveTo(-b.r*.1,b.r*.1);ctx.lineTo(0,b.r*.6);ctx.stroke();ctx.rotate(-t*.2);}
  else if(sh===3){ctx.beginPath();ctx.rect(-b.r*.6,-b.r*1.4,b.r*1.2,b.r*2.8);ctx.fill();ctx.stroke();for(let i=-2;i<=2;i++){ctx.fillStyle=Math.floor(t*4+i)%2?`rgb(${col})`:'#2a1a50';ctx.fillRect(-b.r*.4,i*b.r*.45-3,b.r*.8,6);}ctx.strokeStyle=`rgb(${col})`;ctx.beginPath();ctx.moveTo(0,-b.r*1.4);ctx.lineTo(0,-b.r*1.9);ctx.stroke();}
  else{for(let i=0;i<3;i++){ctx.save();ctx.rotate(t*(i%2?-.7:.5)+i);ctx.strokeStyle=i===1?'rgba(255,40,120,.9)':`rgb(${col})`;ctx.setLineDash([14,8]);ctx.beginPath();ctx.arc(0,0,b.r*(1+i*.25),0,7);ctx.stroke();ctx.restore();}ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(-b.r,0);ctx.quadraticCurveTo(0,-b.r*.9,b.r,0);ctx.quadraticCurveTo(0,b.r*.9,-b.r,0);ctx.fill();ctx.stroke();}
  // olho que segue a nave mais próxima
  if(sh!==1){const R2=sh===4?b.r*.42:b.r*.3, G2=ctx.createRadialGradient(0,0,0,0,0,R2);G2.addColorStop(0,'#fff');G2.addColorStop(.4,`rgb(${col})`);G2.addColorStop(1,'#200a40');ctx.fillStyle=G2;ctx.beginPath();ctx.arc(0,sh===3?-b.r*.9:0,R2,0,7);ctx.fill();ctx.fillStyle='#05030f';ctx.beginPath();ctx.arc(-R2*.35,sh===3?-b.r*.9:0,R2*.35,0,7);ctx.fill();}
  if(b.fl>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6;ctx.drawImage(glow('255,255,255'),-b.r*1.5,-b.r*1.5,b.r*3,b.r*3);}
  ctx.restore();
}
function drawBullets(R){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const s of R.pb){const P=PILOT[R.pl[s.o]?.who||'gabi'], c=s.k===1?'56,232,255':s.k===2?'255,160,60':P.c1;ctx.drawImage(glow(c),s.x-9,s.y-6,18,12);
    if(s.k===2){ctx.strokeStyle='rgba(255,200,120,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.04,s.y-s.vy*.04);ctx.stroke();}
    ctx.fillStyle='#fff';const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.fillRect(-5,-1,10,2);ctx.restore();}
  for(const k of R.pk){if(k.k==='heart'){ctx.drawImage(glow('255,79,163'),k.x-12,k.y-12,24,24);}else{const z=k.k==='mini'?4:9;ctx.drawImage(glow('255,216,74'),k.x-z,k.y-z,z*2,z*2);}}
  ctx.restore();
  for(const k of R.pk){if(k.k==='heart'){ctx.fillStyle='#ff4fa3';ctx.beginPath();ctx.moveTo(k.x,k.y+5);ctx.bezierCurveTo(k.x-8,k.y-1,k.x-4,k.y-7,k.x,k.y-3);ctx.bezierCurveTo(k.x+4,k.y-7,k.x+8,k.y-1,k.x,k.y+5);ctx.fill();}
    else if(k.k==='coin'){ctx.save();ctx.translate(k.x,k.y);ctx.rotate(G.time*3+k.x*.1);ctx.fillStyle='#ffe27a';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?2:5.5;ctx.lineTo(Math.cos(i*Math.PI/4)*r,Math.sin(i*Math.PI/4)*r);}ctx.fill();ctx.restore();}
    else{ctx.fillStyle='#fff6c0';ctx.fillRect(k.x-1,k.y-1,2,2);}}
}
function drawEnemyBullets(R){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const s of R.eb){const c=s.k===1?'176,107,255':s.k===2?'255,150,60':'255,79,140', r=s.k===1?6:4;ctx.drawImage(glow(c),s.x-r*2.6,s.y-r*2.6,r*5.2,r*5.2);}
  ctx.restore();
  for(const s of R.eb){const r=s.k===1?5:3.4;if(s.k===2){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.fillStyle='#ffd0a0';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(0,-2.6);ctx.lineTo(-6,0);ctx.lineTo(0,2.6);ctx.fill();ctx.restore();}
    else{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,r*.6,0,7);ctx.fill();ctx.strokeStyle=s.k===1?'#c890ff':'#ff6fb0';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(s.x,s.y,r,0,7);ctx.stroke();}}
}
function hudPanel(x,y,w,h,col,right){
  ctx.beginPath();const c=8;if(!right){ctx.moveTo(x+c,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h-c);ctx.lineTo(x+w-c,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+c);}else{ctx.moveTo(x,y);ctx.lineTo(x+w-c,y);ctx.lineTo(x+w,y+c);ctx.lineTo(x+w,y+h);ctx.lineTo(x+c,y+h);ctx.lineTo(x,y+h-c);}ctx.closePath();
  ctx.fillStyle='rgba(8,8,30,.62)';ctx.fill();ctx.shadowColor=`rgb(${col})`;ctx.shadowBlur=10;ctx.strokeStyle=`rgba(${col},.85)`;ctx.lineWidth=1.2;ctx.stroke();ctx.shadowBlur=0;}
function heart(x,y,r,full,col){ctx.beginPath();ctx.moveTo(x,y+r*.9);ctx.bezierCurveTo(x-r*1.3,y,x-r*.9,y-r,x,y-r*.35);ctx.bezierCurveTo(x+r*.9,y-r,x+r*1.3,y,x,y+r*.9);if(full){ctx.fillStyle=col;ctx.fill();}else{ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1.2;ctx.stroke();}}
function hud(R){
  const u=clamp(S,.85,1.7), O='Orbitron,"Exo 2",sans-serif', top=Math.max(8,OY+6);
  ctx.textBaseline='middle';
  R.pl.forEach((p,i)=>{const P=PILOT[p.who], right=i===1, w=(102+Math.min(8,p.mx)*15)*u, h=42*u, xx=right?W-w-Math.max(108,OX+8):Math.max(10,OX+8), yy=top;
    hudPanel(xx,yy,w,h,P.c1,right);ctx.textAlign='left';ctx.font=`900 ${9*u}px ${O}`;ctx.fillStyle=`rgb(${P.c1})`;ctx.fillText((p.down?'⚠ ':'')+P.tag,xx+10*u,yy+11*u);
    for(let k=0;k<Math.min(8,p.mx);k++)heart(xx+88*u+k*15*u,yy+11*u,5.5*u,k<p.hp,k<p.hp?(p.hp===1?(Math.sin(G.time*10)>0?'#ff4f70':'#ff9fc0'):'#ff4fa3'):'');
    const bw=w-20*u, ready=p.spc>=1;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(xx+10*u,yy+26*u,bw,7*u);
    const g=ctx.createLinearGradient(xx,0,xx+bw,0);g.addColorStop(0,'#38e8ff');g.addColorStop(1,ready?'#ffd84a':'#b06bff');ctx.fillStyle=g;if(ready){ctx.shadowColor='#ffd84a';ctx.shadowBlur=12+6*Math.sin(G.time*8);}ctx.fillRect(xx+10*u,yy+26*u,bw*p.spc,7*u);ctx.shadowBlur=0;
    if(ready){ctx.font=`900 ${6.5*u}px ${O}`;ctx.fillStyle='#2a1a00';ctx.fillText('ESPECIAL PRONTO!',xx+14*u,yy+29.8*u);}
  });
  // pontos, combo e chefão no centro
  ctx.textAlign='center';ctx.font=`900 ${16*u}px ${O}`;ctx.shadowColor='#38e8ff';ctx.shadowBlur=10;ctx.fillStyle='#fff';ctx.fillText(String(R.score).padStart(7,'0'),W/2,top+12*u);ctx.shadowBlur=0;
  ctx.font=`700 ${7.5*u}px ${O}`;ctx.fillStyle='rgba(160,220,255,.8)';ctx.fillText(`SETOR ${R.sector+1} · ${SECT[R.sector].name.toUpperCase()}`,W/2,top+27*u);
  if(R.combo>=5){const m=1+Math.min(4,Math.floor(R.combo/10));ctx.font=`900 ${10*u}px ${O}`;ctx.fillStyle=m>1?'#ffd84a':'#ff9fd0';ctx.fillText(`COMBO ${R.combo}${m>1?'  ×'+m:''}`,W/2,top+40*u);}
  if(R.boss&&!R.boss.dying){const bw=Math.min(W*.5,360*u), x=W/2-bw/2, y=top+50*u, col=SECT[R.sector].boss.col, f=clamp(R.boss.hp/R.boss.mx,0,1);
    ctx.font=`900 ${8*u}px ${O}`;ctx.fillStyle=`rgb(${col})`;ctx.fillText(SECT[R.sector].boss.name,W/2,y-6*u);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x,y,bw,6*u);
    ctx.shadowColor=`rgb(${col})`;ctx.shadowBlur=10;ctx.fillStyle=`rgb(${col})`;ctx.fillRect(x,y,bw*f,6*u);ctx.shadowBlur=0;}
  // faixas de aviso
  const cx=W/2, cy=H*.45;
  if(R.banT>0&&R.phase!=='clear'){const a=clamp(Math.min(R.banT,3-R.banT)*2,0,1);ctx.globalAlpha=a;ctx.font=`700 ${10*u}px ${O}`;ctx.fillStyle='#9fd8ff';ctx.fillText(`SETOR ${R.sector+1} DE 5`,cx,cy-22*u);
    ctx.font=`900 ${24*u}px ${O}`;ctx.shadowColor='#b06bff';ctx.shadowBlur=20;ctx.fillStyle='#fff';ctx.fillText(SECT[R.sector].name.toUpperCase(),cx,cy+4*u);ctx.shadowBlur=0;
    const lw=(260*u)*clamp((3-R.banT)*1.5,0,1);ctx.fillStyle='#38e8ff';ctx.fillRect(cx-lw/2,cy+22*u,lw,2*u);ctx.globalAlpha=1;}
  if(warnT>0){const a=Math.floor(warnT*4)%2?1:.45;ctx.globalAlpha=a;ctx.fillStyle='rgba(255,30,70,.18)';ctx.fillRect(0,cy-30*u,W,60*u);
    ctx.save();ctx.beginPath();ctx.rect(0,cy-30*u,W,6*u);ctx.rect(0,cy+24*u,W,6*u);ctx.clip();ctx.fillStyle='#ff3060';for(let x=-40+((G.time*80)%40);x<W;x+=40){ctx.beginPath();ctx.moveTo(x,cy-30*u);ctx.lineTo(x+20,cy-30*u);ctx.lineTo(x+10,cy+30*u);ctx.lineTo(x-10,cy+30*u);ctx.fill();}ctx.restore();
    ctx.font=`900 ${20*u}px ${O}`;ctx.fillStyle='#fff';ctx.shadowColor='#ff3060';ctx.shadowBlur=16;ctx.fillText('⚠ ALERTA: CHEFÃO ⚠',cx,cy);ctx.shadowBlur=0;ctx.globalAlpha=1;}
  if(R.phase==='clear'){ctx.font=`900 ${24*u}px ${O}`;ctx.fillStyle='#fff';ctx.shadowColor='#ffd84a';ctx.shadowBlur=20;ctx.fillText('SETOR LIMPO! ✨',cx,cy);ctx.shadowBlur=0;}
  if(msgT>0&&R.pl.some(p=>p.down)&&R.pl.some(p=>!p.down)){ctx.globalAlpha=Math.min(1,msgT);ctx.font=`900 ${11*u}px ${O}`;ctx.fillStyle='#78ffaa';ctx.fillText(msg,cx,H-30*u);ctx.globalAlpha=1;}
}

// ---------- online (PeerJS: conexão direta entre os dois aparelhos) ----------
let JOINW='gabi', SNAP=null, ME={x:80,y:VH*.64,bank:0}, spN=0, remoteSpN=0, lastRs=-1, sendT=0, WHOS=['gabi','ana'];
const NET={peer:null,conn:null,role:null,code:'',
  cfg(){const q=new URLSearchParams(location.search).get('peer');if(q){const [h,p]=q.split(':');return{host:h,port:+p||9000,path:'/',secure:false,debug:0};}return{debug:0};},
  send(m){if(this.conn&&this.conn.open)try{this.conn.send(m)}catch(e){}},
  close(){const p=this.peer;this.role=null;this.conn=null;this.peer=null;try{p&&p.destroy()}catch(e){}},
  err(e){return({network:'Sem conexão com a internet.','server-error':'O servidor de salas não respondeu. Tente de novo.','browser-incompatible':'Este navegador não suporta o modo online.','socket-error':'A conexão caiu.','socket-closed':'A conexão caiu.'})[e&&e.type]||'Não consegui conectar. Tente de novo.';},
  host(onCode,onJoin,onErr){
    if(!window.Peer)return onErr('O modo online precisa de internet.');
    const code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');
    this.role='host';this.code=code;const peer=this.peer=new Peer('esqneon-'+code.toLowerCase(),this.cfg());
    peer.on('open',()=>onCode(code));
    peer.on('error',e=>{if(peer!==this.peer)return;if(e.type==='unavailable-id'){this.close();this.host(onCode,onJoin,onErr);}else if(!this.conn)onErr(this.err(e));});
    peer.on('disconnected',()=>{if(peer===this.peer&&!peer.destroyed)try{peer.reconnect()}catch(e){}});
    peer.on('connection',c=>{
      if(this.conn){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),500);});return;}
      this.conn=c;this.onHello=onJoin;c.on('data',onData);c.on('close',()=>{if(this.conn===c)lost();});c.on('error',()=>{if(this.conn===c)lost();});});
  },
  join(code,onOk,onErr){
    if(!window.Peer)return onErr('O modo online precisa de internet.');
    this.role='guest';const peer=this.peer=new Peer(this.cfg());let done=false;
    const to=setTimeout(()=>{if(!done&&peer===this.peer){done=true;this.close();onErr('Não consegui conectar. Confira o código e a internet das duas.');}},20000);
    peer.on('open',()=>{const c=this.conn=peer.connect('esqneon-'+code.toLowerCase(),{reliable:true});
      c.on('open',()=>{done=true;clearTimeout(to);onOk();});c.on('data',onData);c.on('close',()=>{if(this.conn===c)lost();});});
    peer.on('error',e=>{if(done||peer!==this.peer)return;done=true;clearTimeout(to);this.close();onErr(e.type==='peer-unavailable'?'Sala não encontrada. Confira o código.':this.err(e));});
  },
};
function lost(){if(!NET.role)return;NET.close();G.state='menu';showPanel(`<h2>📡 A conexão caiu</h2><p>A outra nave saiu ou a internet falhou.</p>`,[{t:'Voltar ao menu',go:()=>menu()}]);}
function onData(d){
  if(!d||typeof d!=='object')return;
  if(d.t==='hello'&&NET.role==='host'&&NET.onHello&&G.mode!=='host'){const f=NET.onHello;NET.onHello=null;f(d.who);return;}
  if(G.mode==='host'){
    if(d.t==='i'){REMOTE=REMOTE||{abs:true,sp:0};REMOTE.x=+d.x||0;REMOTE.y=+d.y||0;REMOTE.vy=+d.vy||0;if(d.sp>remoteSpN){remoteSpN=d.sp;REMOTE.sp=1;}}
    else if(d.t==='act')doAct(d.a,d.arg||{},1);
    else if(d.t==='bye')lost();
    return;
  }
  if(d.t==='full'){NET.close();showPanel(`<h2>Sala cheia</h2><p>Essa sala já tem dois pilotos.</p>`,[{t:'Voltar',go:()=>menu()}]);}
  else if(d.t==='start'){WHOS=d.who;store.diff=d.diff;G={state:'ui',mode:'guest',np:2,diff:d.diff,time:0,sector:0};SNAP=null;spN=0;lastRs=-1;sfx('power');}
  else if(d.t==='s'){SNAP={d,at:performance.now()};G.sector=d.g[1];if(d.g[5]!==lastRs){lastRs=d.g[5];ME.x=d.p[1][0];ME.y=d.p[1][1];}for(const e of d.ev)fxEvent(e);}
  else if(d.t==='ui'){G.state=d.d?'ui':'play';renderUI(d.d);if(!d.d)music.set(G.sector);}
  else if(d.t==='bye')lost();
}
const PH=['intro','waves','warn','boss','clear'];
function snap(){const r=Math.round, eb=[], pb=[], pk=[];
  for(const s of G.eb)eb.push(r(s.x),r(s.y),r(s.vx),r(s.vy),s.k);
  for(const s of G.pb)pb.push(r(s.x),r(s.y),r(s.vx),r(s.vy),s.k,s.o);
  for(const k of G.pk)pk.push(r(k.x),r(k.y),k.k==='coin'?0:k.k==='mini'?1:2);
  const b=G.boss;
  return{t:'s',
    p:G.pl.map(p=>[r(p.x),r(p.y),p.hp,p.mx,p.inv>0?1:0,p.down?1:0,r(p.rv*100),r(p.spc*100),p.up.drone,r((p.bank||0)*100),p.up.speed]),
    e:G.en.map(e=>[EK.indexOf(e.k),r(e.x),r(e.y),r((e.x-e.px)/DT),r((e.y-e.py)/DT),r(e.r),e.fl>0?1:0,r(e.a*100),e.st,e.id,r(e.hp/e.mh*100)]),
    b:eb,s:pb,k:pk,
    B:b?[r(b.x),r(b.y),r(clamp(b.hp/b.mx,0,1)*1000),b.fl>0?1:0,b.dying?1:0,b.r,b.lasers.flatMap(l=>[r(l.y),l.h,r(Math.max(0,l.t)*100)])]:0,
    g:[G.score,G.sector,G.combo,PH.indexOf(G.phase),r(G.t*100),G.rs,r(G.banT*100)],
    ev:G.ev.filter(e=>e[0]!=='shot')};
}
function view(){
  const V={pl:[],en:[],eb:[],pb:[],pk:[],boss:null,score:0,sector:G.sector||0,combo:0,phase:'intro',banT:0};if(!SNAP)return V;
  const d=SNAP.d, a=Math.min(.12,(performance.now()-SNAP.at)/1000);
  V.pl=d.p.map((q,i)=>({x:i===1?ME.x:q[0],y:i===1?ME.y:q[1],hp:q[2],mx:q[3],inv:q[4],down:!!q[5],rv:q[6]/100,spc:q[7]/100,up:{drone:q[8],speed:q[10]},bank:i===1?ME.bank:q[9]/100,who:WHOS[i]}));
  V.en=d.e.map(q=>({k:EK[q[0]],x:q[1]+q[3]*a,y:q[2]+q[4]*a,r:q[5],fl:q[6],a:q[7]/100,st:q[8],id:q[9],hp:q[10],mh:100}));
  for(let i=0;i<d.b.length;i+=5)V.eb.push({x:d.b[i]+d.b[i+2]*a,y:d.b[i+1]+d.b[i+3]*a,vx:d.b[i+2],vy:d.b[i+3],k:d.b[i+4]});
  for(let i=0;i<d.s.length;i+=6)V.pb.push({x:d.s[i]+d.s[i+2]*a,y:d.s[i+1]+d.s[i+3]*a,vx:d.s[i+2],vy:d.s[i+3],k:d.s[i+4],o:d.s[i+5]});
  for(let i=0;i<d.k.length;i+=3)V.pk.push({x:d.k[i],y:d.k[i+1],k:['coin','mini','heart'][d.k[i+2]]});
  if(d.B){const B=d.B,ls=[];for(let i=0;i<B[6].length;i+=3)ls.push({y:B[6][i],h:B[6][i+1],t:B[6][i+2]/100});V.boss={x:B[0],y:B[1],hp:B[2],mx:1000,fl:B[3],dying:B[4],r:B[5],lasers:ls};}
  [V.score,V.sector,V.combo]=d.g;V.phase=PH[d.g[3]];V.banT=d.g[6]/100;return V;
}
function guestTick(dt){
  G.time+=dt;if(G.state!=='play'||!SNAP)return;
  const me=SNAP.d.p[1]||[], down=!!me[5], c=ctl[0], sp=150*(1+.15*(me[10]||0))*(down?.35:1);
  ME.x=clamp(ME.x+c.dx*(down?.35:1)+c.kx*sp*dt,14,VW-20);ME.y=clamp(ME.y+c.dy*(down?.35:1)+c.ky*sp*dt,12,VH-12);c.dx=c.dy=0;
  ME.bank+=((c.ky||clamp(c.vy,-1,1))-ME.bank)*Math.min(1,dt*10);
  if(c.sp){c.sp=0;spN++;}
  sendT-=dt;if(sendT<=0){sendT=1/30;NET.send({t:'i',x:Math.round(ME.x*10)/10,y:Math.round(ME.y*10)/10,vy:Math.round(ME.bank*100)/100,sp:spN});}
  if(!down&&Math.random()<dt/.15)sfx('shot');
}

// ---------- telas ----------
let curUI=null;
function ui(d){curUI=d;if(G.mode==='host')NET.send({t:'ui',d});renderUI(d);}
function showHud(on){const touch=matchMedia('(pointer:coarse)').matches;pauseBtn.hidden=muteBtn.hidden=!on;spBtn[0].hidden=!(on&&touch);spBtn[1].hidden=!(on&&touch&&G.mode==='local');}
function showPanel(html,btns){
  showHud(false);ov.innerHTML=`<div class="card">${html}<div class="btns">${btns.map((b,i)=>b.row?`<div class="row">${b.row.map((c,j)=>`<button class="btn ${c.alt?'alt':''} ${c.pink?'pink':''}" data-i="${i}-${j}">${c.t}</button>`).join('')}</div>`:`<button class="btn ${b.alt?'alt':''} ${b.pink?'pink':''}" data-i="${i}" ${b.dis?'disabled':''}>${b.t}</button>`).join('')}</div></div>`;ov.hidden=false;
  ov.querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{audio();sfx('ui');const [i,j]=el.dataset.i.split('-');const b=j!==undefined?btns[i].row[j]:btns[i];b.go();});
}
function renderUI(d){
  if(!d){ov.hidden=true;showHud(true);return;}
  const mine=G.mode==='guest'?1:0;
  if(d.k==='story'){const L=lines2(d.key,d.duo)[d.i];if(!L)return;const who=L.w==='H'?d.h:L.w==='C'?d.c:'nevoa';
    const nm=who==='nevoa'?'NÉVOA':(L.w==='C'?'COMANDANTE '+PILOT[who].nome.replace('Madrinha ',''):'PILOTO '+PILOT[who].nome).toUpperCase(), col=who==='nevoa'?'#b06bff':PILOT[who].hex;
    let tx=L.t.replace(/\{H\}/g,PILOT[d.h].nome).replace(/\{C\}/g,PILOT[d.c].nome.replace('Madrinha ','')).replace(/\{P2\}/g,d.p2);if(who==='ilo')tx=`Au au! 🐾 <i style="opacity:.75">(${tx})</i>`;
    showPanel(`<div class="say" style="--c:${col}">${avatar(who)}<div><div class="nm">${nm}</div><div class="tx">${tx}</div></div></div>`,[{row:[{t:'Continuar ▶',go:()=>act('next',{i:d.i})},{t:'Pular ⏭',alt:1,go:()=>act('skip',{i:d.i})}]}]);}
  else if(d.k==='cards'){
    const idx=G.mode==='local'?d.picked.indexOf(false):mine;
    if(idx<0||d.picked[idx]){showPanel(`<h2>Melhoria escolhida! ✔</h2><p><span class="spin"></span>Esperando a outra nave escolher...</p>`,[]);return;}
    const P=PILOT[d.who[idx]];
    ov.innerHTML=`<div class="card"><h2 style="text-align:center">${d.c.length>1?`<span style="color:${P.hex}">${P.nome}</span>, escolha`:'Escolha'} uma melhoria</h2><div class="cards">${d.c[idx].map(id=>{const c=CARDS[id],lv=d.lv[idx][id];return`<button class="cd" data-id="${id}"><div class="ic">${c.ic}</div><b>${c.n}</b><small>${c.d}</small><div class="lv">Nível ${lv} → ${lv+1}</div></button>`}).join('')}</div></div>`;ov.hidden=false;showHud(false);
    ov.querySelectorAll('.cd').forEach(el=>el.onclick=()=>{sfx('power');act('pick',{id:el.dataset.id,p:idx});});}
  else if(d.k==='over'){showPanel(`<h1>Missão interrompida</h1><p style="text-align:center">Vocês chegaram ao setor ${d.sector+1}: <b>${SECT[d.sector].name}</b>.<br>Pontos: <b>${d.score}</b></p><p class="muted" style="text-align:center">As melhorias continuam. Tente o setor de novo!</p>`,
    [{t:'↻ Tentar este setor de novo',go:()=>act('retry')},{t:'Menu',alt:1,go:()=>act('menu')}]);}
  else if(d.k==='win'){showPanel(`<h1>GALÁXIA SALVA! ✨</h1><p style="text-align:center;font-size:1.1rem">Todas as estrelas voltaram a brilhar.<br>Pontos: <b>${d.score}</b>${d.rec?'<br><b>🏆 Novo recorde!</b>':''}</p><p class="muted" style="text-align:center">Tente no modo ${store.diff==='insano'?'Insano de novo para bater o recorde':'Insano se tiver coragem'} 😈</p>`,[{t:'Menu',go:()=>act('menu')}]);}
}
function lines2(key,duo){return STORY[key].filter(l=>duo?!l.s:!l.d);}
const btnDiff=()=>({t:`🎚️ Dificuldade: ${DIFF[store.diff].nome}`,alt:1,go:()=>{const k=Object.keys(DIFF);store.diff=k[(k.indexOf(store.diff)+1)%k.length];save();menu();}});
function menu(){
  NET.close();music.stop();G={state:'menu',mode:'solo',np:1,time:G.time||0,diff:store.diff,sector:0};REMOTE=null;
  const best=Object.entries(store.best).filter(e=>e[1]).map(([k,v])=>`${DIFF[k].nome}: ${v}`).join(' · ');
  showPanel(`<h1>ESQUADRÃO NEON</h1><div class="sub">Gabi e a Madrinha Ana contra a NÉVOA</div>${best?`<p class="muted" style="text-align:center">🏆 Recordes: ${best}</p>`:''}`,[
    {t:'🚀 Jogar com uma nave',go:()=>pilots('Quem vai pilotar?',w=>{newGame('solo',[w]);G.state='ui';intro();})},
    {t:'👯 Duas naves no mesmo aparelho',pink:1,go:()=>localSetup()},
    {t:'🌐 Online: cada uma no seu celular',pink:1,go:()=>online()},
    {row:[btnDiff(),{t:'❔ Como jogar',alt:1,go:howTo}]},
    {t:'⬅ Voltar para Madrinha Ana ao Resgate',alt:1,go:()=>{location.href='index.html';}},
  ]);
}
function intro(){story('intro',()=>story('s1',()=>startSector(0)));}
function pilots(title,go,back){
  ov.innerHTML=`<div class="card wide"><h2 style="text-align:center">${title}</h2><div class="pilots">${CAST.map(w=>`<button class="pilot" data-w="${w}" style="--c:${PILOT[w].hex}">${avatar(w)}<b>${PILOT[w].nome.toUpperCase()}</b><small>${PILOT[w].perk}</small></button>`).join('')}</div><button class="btn alt" id="bk">⬅ Voltar</button></div>`;ov.hidden=false;showHud(false);
  ov.querySelectorAll('.pilot').forEach(el=>el.onclick=()=>{audio();sfx('power');go(el.dataset.w);});ov.querySelector('#bk').onclick=back||(()=>menu());
}
function howTo(){showPanel(`<h2>Como jogar</h2>
  <p>🛸 <b>Celular:</b> encoste o dedo em qualquer lugar e arraste: a nave anda junto com o dedo. O tiro é automático.</p>
  <p>✦ <b>Especial:</b> acertar inimigos e pegar ⭐ enche a barra. Quando ficar cheia, aperte o botão ESPECIAL: ele limpa os tiros da tela e acerta todo mundo.</p>
  <p>👯 <b>Em dupla:</b> se uma nave cair, ela vira uma cápsula SOS. A outra voa até perto dela para salvar.</p>
  <p>👨‍👩‍👧 <b>Pilotos:</b> Madrinha, Gabi, José, Keka, Emiel, Vovó Hermina e o Ilo. Cada um tem uma vantagem diferente!</p>
  <p>🎁 Depois de cada chefão, cada uma escolhe uma melhoria para a própria nave.</p>
  <p class="keys">⌨️ Teclado: <b>W A S D</b> + <b>Espaço</b> · segunda jogadora: <b>setas</b> + <b>Enter</b> · <b>Esc</b> pausa</p>`,[{t:'Entendi!',go:()=>menu()}]);}
function localSetup(w){
  if(!w)return pilots('Piloto 1 (lado esquerdo), escolha',a=>pilots(`Piloto 2 (lado direito), escolha<br><small class="muted">Piloto 1: ${PILOT[a].nome}</small>`,b=>localSetup([a,b]),()=>localSetup()));
  const card=(x,t)=>`<div class="pilot" style="--c:${PILOT[x].hex}">${avatar(x)}<b>${PILOT[x].nome.toUpperCase()}</b><small>${t}</small></div>`;
  showPanel(`<h2>Duas naves no mesmo aparelho</h2><p>Cada piloto usa <b>a sua metade da tela</b> para arrastar a própria nave. Num tablet fica ótimo!</p>
  <div class="pilots two">${card(w[0],'Lado esquerdo · W A S D + Espaço')}${card(w[1],'Lado direito · setas + Enter')}</div>`,
  [{t:'🚀 Decolar!',go:()=>{newGame('local',w);G.state='ui';intro();}},{row:[{t:'⇄ Trocar lados',alt:1,go:()=>localSetup([w[1],w[0]])},{t:'Escolher de novo',alt:1,go:()=>localSetup()}]},{t:'⬅ Voltar',alt:1,go:()=>menu()}]);
}
function online(){
  showPanel(`<h2>🌐 Jogar online</h2><p>Cada uma joga no seu celular, até em países diferentes! Uma cria a sala e manda o código de 4 letras para a outra.</p><p class="muted">As duas precisam estar com internet.</p>`,[
    {t:'➕ Criar sala',go:()=>pilots('Quem você vai pilotar?',w=>hostWait(w))},
    {t:'🔑 Entrar com código',pink:1,go:()=>pilots('Quem você vai pilotar?',w=>{JOINW=w;joinScreen();})},
    {t:'⬅ Voltar',alt:1,go:()=>menu()}]);
}
function hostWait(w){
  showPanel(`<h2>Criando sala...</h2><p><span class="spin"></span>Conectando ao servidor</p>`,[{t:'Cancelar',alt:1,go:()=>menu()}]);
  NET.host(code=>{showPanel(`<h2 style="text-align:center">Sala criada!</h2><p style="text-align:center">Mande este código para quem vai jogar com você:</p><div class="code">${code}</div><p style="text-align:center"><span class="spin"></span>Esperando a outra nave entrar...</p><p class="muted" style="text-align:center">Dificuldade: ${DIFF[store.diff].nome}</p>`,[{t:'Cancelar',alt:1,go:()=>menu()}]);},
  o=>{if(!PILOT[o])o=w==='gabi'?'ana':'gabi';newGame('host',[w,o]);REMOTE={abs:true,x:80,y:VH*.64,sp:0,vy:0};remoteSpN=0;G.pl[1].x=REMOTE.x;G.pl[1].y=REMOTE.y;
    NET.send({t:'start',who:[w,o],diff:store.diff});sfx('power');G.state='ui';intro();},
  e=>showPanel(`<h2>Ops!</h2><p>${e}</p>`,[{t:'Tentar de novo',go:()=>hostWait(w)},{t:'Menu',alt:1,go:()=>menu()}]));
}
function joinScreen(){
  ov.innerHTML=`<div class="card"><h2 style="text-align:center">Digite o código da sala</h2><input class="cin" id="cin" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD"><button class="btn pink" id="go">Entrar</button><button class="btn alt" id="bk">⬅ Voltar</button><p class="muted" id="er"></p></div>`;ov.hidden=false;
  const inp=ov.querySelector('#cin');setTimeout(()=>inp.focus(),100);inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')ov.querySelector('#go').click();});
  ov.querySelector('#bk').onclick=()=>menu();
  ov.querySelector('#go').onclick=()=>{audio();const code=inp.value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==4){ov.querySelector('#er').textContent='O código tem 4 letras.';return;}
    showPanel(`<h2>Entrando na sala ${code}...</h2><p><span class="spin"></span>Conectando</p>`,[{t:'Cancelar',alt:1,go:()=>menu()}]);
    NET.join(code,()=>{NET.send({t:'hello',who:JOINW});G={state:'ui',mode:'guest',np:2,diff:store.diff,time:0,sector:0};showPanel(`<h2>Conectada! ✔</h2><p><span class="spin"></span>Esperando a missão começar...</p>`,[]);},
      e=>showPanel(`<h2>Ops!</h2><p>${e}</p>`,[{t:'Tentar de novo',go:joinScreen},{t:'Menu',alt:1,go:()=>menu()}]));};
}

// ---------- laço principal ----------
let last=0, acc=0, snapN=0;
function render(){
  const R=G.mode==='guest'?view():G, t=G.time, s=R.sector||0;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#05030f';ctx.fillRect(0,0,cv.width,cv.height);
  const sx=shake>0?(Math.random()-.5)*shake*18:0, sy=shake>0?(Math.random()-.5)*shake*12:0;
  ctx.setTransform(S*DPR,0,0,S*DPR,(OX+sx)*DPR,(OY+sy)*DPR);
  drawBg(G.state==='menu'?Math.floor(t/10)%5:s,t);
  if(R.pl&&R.pl.length){
    if(R.boss)drawBoss(R.boss,t,s);
    for(const e of R.en)drawEnemy(e,t);
    drawBullets(R);
    R.pl.forEach(p=>drawShip(p,t,R.pl.length));
    drawEnemyBullets(R);
    drawFx();
  }
  if(OX>4){ctx.fillStyle='rgba(56,232,255,.35)';ctx.fillRect(-1.5,0,1,VH);ctx.fillRect(VW+.5,0,1,VH);}
  if(OY>4){ctx.fillStyle='rgba(56,232,255,.35)';ctx.fillRect(0,-1.5,VW,1);ctx.fillRect(0,VH+.5,VW,1);}
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(flash>0){ctx.fillStyle=`rgba(${flashC},${flash})`;ctx.fillRect(0,0,W,H);}
  if(R.pl&&R.pl.length&&G.state!=='menu')hud(R);
  for(let i=0;i<2;i++){const p=R.pl&&R.pl[G.mode==='local'?i:(G.mode==='guest'?1:0)];if(p)spBtn[i].classList.toggle('ready',p.spc>=1);}
}
function loop(t){
  const dt=Math.min(.05,(t-last)/1000||0);last=t;readKeys();
  if(G.mode==='guest')guestTick(dt);
  else if(G.state==='play'||G.state==='over'){acc+=dt;while(acc>=DT){acc-=DT;step();if(G.mode==='host'){if(++snapN%2===0){NET.send(snap());G.ev=[];}}else G.ev=[];}}
  else{G.time+=dt;acc=0;}
  fxUpdate(dt);music.tick();render();requestAnimationFrame(loop);
}
window.__neon={get G(){return G},ctl,NET,newGame,startSector,step,act,menu,get ME(){return ME}};
menu();requestAnimationFrame(loop);
})();
