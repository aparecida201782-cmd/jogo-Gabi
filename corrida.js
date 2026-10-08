// Corrida Neon — corrida infinita em 3 faixas com a família toda, fugindo da NÉVOA.
(()=>{
'use strict';
const cv=document.getElementById('c'), ctx=cv.getContext('2d'), ov=document.getElementById('ov'), pauseBtn=document.getElementById('pause'), toastEl=document.getElementById('toast');
let W=0,H=0,DPR=1,F=1,HOR=0;
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;F=Math.min(H*.95,W*1.05);HOR=H*(W<H?.34:.37);}
addEventListener('resize',resize);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.random()*a.length|0], lerp=(a,b,t)=>a+(b-a)*t;
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const hex2=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixc=(a,b,t)=>`rgb(${a[0]+(b[0]-a[0])*t|0},${a[1]+(b[1]-a[1])*t|0},${a[2]+(b[2]-a[2])*t|0})`;

// ---------- progresso salvo ----------
let store={};try{store=JSON.parse(localStorage.getItem('corridaSave'))||{}}catch(e){}
store={coins:0,best:0,bestDist:0,level:0,char:'gabi',up:{magnet:0,x2:0,rocket:0,shoes:0},shields:0,stats:{},missions:null,seenStory:false,mute:false,...store};
store.up={magnet:0,x2:0,rocket:0,shoes:0,...store.up};store.stats=store.stats||{};
const save=()=>{try{localStorage.setItem('corridaSave',JSON.stringify(store))}catch(e){}};

// ---------- personagens (os mesmos do Madrinha Ana ao Resgate) ----------
const CH={
  ana:{nome:'Madrinha Ana',hex:'#ffd84a',hair:'#4a2818',shirt:'#f6d860',pants:'#2a3050',long:1,glasses:1,perk:'Começa a corrida com escudo',shield:1},
  gabi:{nome:'Gabi',hex:'#ff4fa3',hair:'#6b4428',shirt:'#7cc4ff',pants:'#38406a',long:1,tail:1,perk:'Pulo duplo no ar',dbl:1},
  jose:{nome:'José',hex:'#50e678',hair:'#a8784a',shirt:'#3fae5a',pants:'#2a3a5a',small:1,perk:'Pequeno: passa por baixo das barras'},
  keka:{nome:'Keka',hex:'#dc64ff',hair:'#a87850',shirt:'#e0287a',dress:1,long:1,perk:'Pula bem mais alto',jump:1.16},
  emiel:{nome:'Emiel',hex:'#4696ff',hair:'#e8c870',shirt:'#2f5a9a',pants:'#1e2440',eye:'#2f7ad8',perk:'Quebra as barreiras baixas',smash:1},
  vovo:{nome:'Vovó Hermina',hex:'#3cebc8',hair:'#3a2418',shirt:'#1f2a5a',pants:'#3a3a52',bun:1,stripes:1,perk:'Ímã dura o dobro',mag2:1},
  ilo:{nome:'Ilo',hex:'#ffa046',dog:1,small:1,perk:'Pequeno e já sai com ímã',startMag:1},
};
const CAST=Object.keys(CH);
function avatar(w){
  if(w==='nevoa')return `<svg viewBox="0 0 100 100"><defs><radialGradient id="ne"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#e080ff"/><stop offset="1" stop-color="#3a0a5a"/></radialGradient></defs><rect width="100" height="100" fill="#0a0418"/><path d="M10 50 Q50 10 90 50 Q50 90 10 50Z" fill="#1a0630" stroke="#b06bff" stroke-width="3"/><circle cx="50" cy="50" r="18" fill="url(#ne)"/><circle cx="50" cy="50" r="6" fill="#0a0418"/></svg>`;
  const C=CH[w], bg='<rect width="100" height="100" fill="#0a0c26"/><circle cx="20" cy="20" r="1.5" fill="#fff"/><circle cx="82" cy="14" r="1" fill="#fff"/>';
  if(C.dog)return `<svg viewBox="0 0 100 100">${bg}<ellipse cx="50" cy="104" rx="34" ry="22" fill="#8a5530"/><ellipse cx="27" cy="58" rx="8" ry="17" fill="#6b3f22" transform="rotate(14 27 58)"/><ellipse cx="73" cy="58" rx="8" ry="17" fill="#6b3f22" transform="rotate(-14 73 58)"/>${[[40,40],[50,36],[60,40],[44,50],[56,50]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="#8a5530"/>`).join('')}<ellipse cx="50" cy="60" rx="18" ry="19" fill="#8a5530"/><ellipse cx="50" cy="70" rx="11" ry="8" fill="#a8703f"/><ellipse cx="50" cy="65" rx="4.5" ry="3.2" fill="#1a1a1a"/><circle cx="42" cy="55" r="2.8" fill="#1a1a1a"/><circle cx="58" cy="55" r="2.8" fill="#1a1a1a"/><rect x="47" y="76" width="6" height="7" rx="3" fill="#e8566a"/><rect x="30" y="84" width="40" height="5" rx="2" fill="${C.hex}"/></svg>`;
  const hair=C.hair, eye=C.eye||'#2a2a3a';
  const shirt=`<ellipse cx="50" cy="104" rx="36" ry="22" fill="${C.shirt}"/>`+(C.stripes?[84,90,96].map(y=>`<rect x="14" y="${y}" width="72" height="3" fill="#fff" opacity=".85"/>`).join(''):'');
  return `<svg viewBox="0 0 100 100">${bg}${shirt}<rect x="42" y="76" width="16" height="9" fill="#ffd9c4"/>
  ${C.long?`<path d="M27 52 Q21 88 34 93 L66 93 Q79 88 73 52Z" fill="${hair}"/>`:''}${C.bun?`<circle cx="50" cy="27" r="11" fill="${hair}"/>`:''}
  <ellipse cx="50" cy="56" rx="21" ry="24" fill="#ffe0cf"/><path d="M29 54 Q28 30 50 30 Q72 30 71 54 Q62 40 50 41 Q38 40 29 54Z" fill="${hair}"/>
  ${C.glasses?'<g fill="none" stroke="#e8b830" stroke-width="2.5"><circle cx="41" cy="58" r="7"/><circle cx="59" cy="58" r="7"/><path d="M48 58 L52 58"/></g>':''}
  <circle cx="41" cy="58" r="2.6" fill="${eye}"/><circle cx="59" cy="58" r="2.6" fill="${eye}"/><path d="M43 69 Q50 75 57 69" stroke="#b5483c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="35" cy="66" r="3.5" fill="#ffb3a7" opacity=".6"/><circle cx="65" cy="66" r="3.5" fill="#ffb3a7" opacity=".6"/>
  <path d="M20 46 Q50 22 80 46" stroke="${C.hex}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="20" cy="50" r="6" fill="${C.hex}"/><circle cx="80" cy="50" r="6" fill="${C.hex}"/></svg>`;
}

// ---------- cidades da família (o cenário muda a cada 1000 m) ----------
const BIO=[
  {name:'Sertão de Solonópole',sky:['#3a1a5e','#d8566a','#ffb36a'],fog:'#f8b878',ground:'#c8884a',ground2:'#a86a34',road:'#6a4a3a',road2:'#5e4032',line:'#ffe0a0',edge:'255,170,60',sun:'#ffe08a',
   bld:['#f2c46b','#e8866a','#7cc4c8','#f6e6c8','#e0a0c0'],bh:[2.6,4.2],props:['cactus','cactus','poste'],train:'#c8562a',trainName:'caminhão'},
  {name:'Lisboa, Portugal',sky:['#2a6ac8','#78b8f0','#e8f4fc'],fog:'#d8ecfa',ground:'#b8b0a0',ground2:'#a8a090',road:'#7a7a86',road2:'#6e6e7a',line:'#ffffff',edge:'255,216,74',sun:'#fff6d0',
   bld:['#f2c230','#e86a5a','#7cc4ff','#f6a6c1','#f4f0e6','#5ab88a'],bh:[5,9],props:['poste','arvore'],train:'#f2c230',trainName:'bondinho'},
  {name:'Helsinque, Finlândia',sky:['#060a28','#2a2a6a','#8a6a9a'],fog:'#4a4a7a',ground:'#e8eef6',ground2:'#d0dcea',road:'#3a3e56',road2:'#33374e',line:'#bfe8ff',edge:'56,232,255',moon:1,snow:1,night:1,
   bld:['#e8c86a','#c84a4a','#7ac0a0','#e8e0d0','#9ab0d8'],bh:[4,7],props:['poste','pinheiro'],train:'#3fae5a',trainName:'bonde'},
  {name:'Lapônia, Finlândia',sky:['#020616','#0a2a3a','#1a5a5a'],fog:'#1a3a4a',ground:'#f2f8fc',ground2:'#dceaf4',road:'#d0e0ec',road2:'#c2d4e2',line:'#38e8ff',edge:'120,255,200',aurora:1,snow:1,night:1,moon:1,
   bld:['#8a4a2a','#a85a32','#6a3a22'],bh:[2.4,3.4],props:['pinheiro','pinheiro','pinheiro'],train:'#b8343e',trainName:'trenó'},
  {name:'Cidade Neon',sky:['#02010a','#1a0640','#5a0a6a'],fog:'#2a0a4a',ground:'#0a0418',ground2:'#120626',road:'#0c0820',road2:'#140c2c',line:'#ff4fa3',edge:'56,232,255',neon:1,night:1,
   bld:['#0c0a1e','#120c2a','#0a0818'],bh:[7,16],props:['neonposte'],train:'#141032',trainName:'vagão'},
];
BIO.forEach(b=>{for(const k of ['fog','ground','ground2','road','road2'])b[k+'R']=hex2(b[k]);b.skyR=b.sky.map(hex2);});

// ---------- missões ----------
const MISS=[
  {id:'coinsRun',t:'Pegue {n} moedas numa corrida',n:[100,200,350,550,800],run:1},
  {id:'distRun',t:'Corra {n} m numa corrida',n:[500,1000,1800,2800,4200],run:1},
  {id:'jumps',t:'Pule {n} vezes',n:[25,50,90,140,220]},
  {id:'slides',t:'Deslize {n} vezes',n:[15,35,60,100,160]},
  {id:'pups',t:'Pegue {n} poderes',n:[3,6,10,15,24]},
  {id:'near',t:'Faça {n} "Por um triz!"',n:[3,6,10,16,25]},
  {id:'roofs',t:'Corra em cima de {n} veículos',n:[3,6,10,16,25]},
  {id:'rocket',t:'Voe de mochila-foguete {n} vezes',n:[1,2,4,6,10]},
  {id:'scoreRun',t:'Faça {n} pontos numa corrida',n:[5000,15000,35000,70000,120000],run:1},
];
function newMissions(){const tier=Math.min(4,Math.floor(store.level/2)),ids=[...MISS].sort(()=>Math.random()-.5).slice(0,3);store.missions=ids.map(m=>({id:m.id,n:m.n[tier],p:0,done:false,base:store.stats[m.id]||0}));save();}
if(!store.missions)newMissions();
const missDef=id=>MISS.find(m=>m.id===id);
const missText=m=>missDef(m.id).t.replace('{n}',m.n.toLocaleString('pt-BR'));

// ---------- loja ----------
const SHOP=[
  {id:'magnet',ic:'🧲',n:'Ímã de Moedas',d:'Duração do ímã'},
  {id:'x2',ic:'✖️2',n:'Pontos em Dobro',d:'Duração do 2x'},
  {id:'rocket',ic:'🚀',n:'Mochila-Foguete',d:'Tempo de voo'},
  {id:'shoes',ic:'👟',n:'Tênis de Mola',d:'Duração do super pulo'},
];
const PRICE=[300,700,1500,3000,6000];
const dur=k=>({magnet:9,x2:10,rocket:6,shoes:9}[k])+(store.up[k]||0)*({rocket:1.2}[k]||2);

// ---------- som (sintetizado) ----------
let AC=null,MASTER=null,NOISE=null;const lastS={};
function audio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=store.mute?0:.8;MASTER.connect(AC.destination);
  NOISE=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}catch(e){}}
function tone(type,f0,f1,dur,vol,t=0,filt){if(!AC)return;const t0=AC.currentTime+Math.max(0,t),o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0005,t0+dur);let n=o;if(filt){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=filt;o.connect(f);n=f;}n.connect(g);g.connect(MASTER);o.start(t0);o.stop(t0+dur+.02);}
function noise(dur,vol,type,freq,t=0){if(!AC)return;const t0=AC.currentTime+Math.max(0,t),s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NOISE;f.type=type;f.frequency.value=freq;g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0005,t0+dur);s.connect(f);f.connect(g);g.connect(MASTER);s.start(t0);s.stop(t0+dur+.02);}
let coinPitch=0,coinPT=0;
function sfx(k){if(!AC)return;const now=AC.currentTime,gap={coin:.035,whoosh:.08,step:.05}[k]||0;if(lastS[k]&&now-lastS[k]<gap)return;lastS[k]=now;
  if(k==='coin'){if(now-coinPT>.4)coinPitch=0;coinPT=now;const f=1200*Math.pow(2,Math.min(12,coinPitch++)/24);tone('triangle',f,f*1.5,.07,.05);}
  else if(k==='jump')tone('square',260,560,.13,.05,0,2200);
  else if(k==='slide')noise(.25,.08,'bandpass',900);
  else if(k==='whoosh')noise(.14,.07,'bandpass',1600);
  else if(k==='land')tone('sine',120,60,.08,.12);
  else if(k==='crash'){noise(.6,.4,'lowpass',900);tone('sawtooth',300,40,.5,.2);}
  else if(k==='stumble'){tone('square',300,120,.2,.1);noise(.15,.15,'lowpass',600);}
  else if(k==='power')[523,659,784,1046,1318].forEach((f,i)=>tone('triangle',f,f*1.01,.12,.07,i*.05));
  else if(k==='rocket'){noise(1.2,.18,'lowpass',500);tone('sawtooth',80,300,1,.08,0,900);}
  else if(k==='shield')tone('sine',900,300,.4,.15);
  else if(k==='smash'){noise(.3,.3,'lowpass',1400);tone('square',200,60,.2,.12);}
  else if(k==='near')[880,1320].forEach((f,i)=>tone('triangle',f,f,.08,.06,i*.06));
  else if(k==='mission')[784,988,1175,1568].forEach((f,i)=>tone('triangle',f,f,.18,.08,i*.09));
  else if(k==='count')tone('square',660,660,.15,.08);
  else if(k==='go')tone('square',1320,1320,.35,.09);
  else if(k==='ui')tone('triangle',880,1320,.07,.05);
}
const music={on:false,step:0,next:0,bio:0,int:1,
  start(){audio();this.on=true;if(AC)this.next=AC.currentTime+.05;},stop(){this.on=false;},
  tick(){if(!AC||!this.on||store.mute)return;if(this.next<AC.currentTime-.5)this.next=AC.currentTime+.05;const spb=60/(124+this.int*20)/2;
    while(this.next<AC.currentTime+.2){this.play(this.step,this.next-AC.currentTime);this.next+=spb;this.step++;}},
  play(st,t){const key=[0,3,-2,5,-4][this.bio]||0, bar=Math.floor(st/8)%4, ch=[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]][bar], n=st%8, hz=s=>220*Math.pow(2,(s+key)/12);
    if(n%2===0||n===3)tone('sawtooth',hz(ch[0])/4,hz(ch[0])/4,.2,.07,t,520);
    const ar=ch[(st*2)%3]+(st%4>1?12:0);tone('square',hz(ar),hz(ar),.1,.017,t,3200);
    if(n===0||n===4||n===6&&this.int>.5)tone('sine',160,40,.15,.3,t);if(n===2||n===6)noise(.12,.08,'bandpass',1800,t);noise(.03,.035,'highpass',7500,t);}
};
const GL=new Map();
function glow(col){let c=GL.get(col);if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),R=g.createRadialGradient(32,32,0,32,32,32);
  R.addColorStop(0,`rgba(${col},1)`);R.addColorStop(.25,`rgba(${col},.5)`);R.addColorStop(1,`rgba(${col},0)`);g.fillStyle=R;g.fillRect(0,0,64,64);GL.set(col,c);return c;}

// ---------- a corrida ----------
const LANE=2.4, CAMZ=6, ZMAX=150, GRAV=28, JUMPV=9.6;
let R=null, mode='title';
const bioAt=d=>Math.floor(Math.max(0,d)/1000)%BIO.length;
// gerador de números com semente: a mesma semente gera a mesma pista nos dois celulares
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function newRun(attract,seed){
  const C=CH[store.char];
  R={who:store.char,attract,t:0,dist:0,speed:attract?12:14,score:0,coins:0,lane:0,x:0,y:0,vy:0,onGround:true,slide:0,slideQ:false,airJumps:0,
    objs:[],coinsA:[],pups:[],scen:[],parts:[],texts:[],pw:{magnet:C.startMag?6:0,x2:0,rocket:0,shoes:0},shield:(C.shield?1:0)+(attract?0:Math.min(1,store.shields)),
    stumble:0,inv:0,dead:0,goShown:false,spawnZ:attract?30:70,scenZ:{'-1':-8,'1':-8},propZ:{'-1':-8,'1':-4},curve:0,curveT:0,hill:0,hillT:0,nextBend:120,
    bio:0,prevBio:0,bioT:1,banT:attract?0:4,laneT:-9,prevLane:0,jumps:0,slides:0,nPups:0,roofs:0,rockets:0,near:0,onRoof:null,lastRoof:null,revived:0,
    camY:2.5,intro:attract?0:2.2,shake:0,flash:0,flashC:'255,255,255',anim:0,rocketClear:0,rng:mulberry(seed??(Math.random()*1e9|0)),spans:[],skyZ:0,usedShieldItem:!attract&&store.shields>0&&!C.shield};
  if(R.usedShieldItem){store.shields--;save();}
  while(R.scenZ[-1]<ZMAX||R.scenZ[1]<ZMAX)spawnScenery();
}
const mult=()=>1+store.level;
// cenário dos lados (prédios e enfeites da cidade da vez)
function spawnScenery(){
  for(const s of [-1,1]){
    while(R.scenZ[s]<ZMAX){const z=R.scenZ[s], b=BIO[bioAt(R.dist+z)], bi=BIO.indexOf(b);
      if(b.aurora&&Math.random()<.75){R.scen.push({k:'pinheiro',x:s*rnd(7,16),z,s:rnd(.9,1.6),bio:bi,seed:Math.random()*1e4|0});R.scenZ[s]+=rnd(2.5,5);continue;}
      const w=rnd(5,9),d=rnd(5,10),h=rnd(b.bh[0],b.bh[1]),gap=b.name.startsWith('Sert')?rnd(2,6):rnd(.3,1.5);
      R.scen.push({k:'bld',x:s*(LANE*1.5+2.4+rnd(0,1.2)),side:s,z,w,d,h,col:pick(b.bld),bio:bi,seed:Math.random()*1e4|0});R.scenZ[s]+=d+gap;}
    while(R.propZ[s]<ZMAX){const z=R.propZ[s], b=BIO[bioAt(R.dist+z)];R.scen.push({k:pick(b.props),x:s*(LANE*1.5+1.1),z,s:1,bio:BIO.indexOf(b),seed:Math.random()*1e4|0});R.propZ[s]+=rnd(7,12);}
  }
}
const OB={barrier:{w:1.9,h:1.05,d:.45},bar:{w:2.15,h:1.95,d:.35},train:{w:2.1,h:3.3,d:12},drone:{w:1.3,h:1.85,d:.9}};
function addOb(k,lane,z,o={}){const b=BIO[bioAt(R.dist+z)];const ob={k,lane,x:lane*LANE,z,...OB[k],bio:BIO.indexOf(b),t:Math.random()*6,...o};R.objs.push(ob);if(k==='train')R.spans.push({lane,end:R.dist+z+ob.d});return ob;}
function coinLine(lane,z,n,y=.75,sp=1.7){for(let i=0;i<n;i++)R.coinsA.push({x:lane*LANE,y,z:z+i*sp,lane});}
function coinArc(lane,z,n){for(let i=0;i<n;i++){const u=i/(n-1);R.coinsA.push({x:lane*LANE,y:.75+Math.sin(u*Math.PI)*1.9,z:z-4+u*8,lane});}}
function spawnRow(z){
  const lanes=[-1,0,1];
  const wz=R.dist+z;
  // faixa com veículo (ou que acabou de ter um: é onde se cai do teto) fica livre de obstáculos
  const busy=lanes.filter(l=>R.spans.some(s=>s.lane===l&&s.end>wz-16)), free=lanes.filter(l=>!busy.includes(l));
  if(!free.length)return 6;
  const df=clamp(wz/3500,0,1), sh=a=>[...a].sort(()=>Math.random()-.5), canT=!busy.length;let roll=Math.random();
  if(!canT&&roll>=.32&&roll<.46||!canT&&roll>=.65&&roll<.79)roll=rnd(.46,.65);
  let used=[];
  if(R.attract||roll<.1-df*.05){const l=pick(free);coinLine(l,z,7);used=[l];}
  else if(roll<.32){const l=pick(free), k=pick(canT?['barrier','bar','train','barrier']:['barrier','bar']);
    if(k==='train'&&canT)addOb('train',l,z,{d:rnd(8,16)});else addOb(k==='train'?'barrier':k,l,z);
    const o=free.filter(x=>x!==l);if(o.length){const c=pick(o);coinLine(c,z-3,6);}else coinArc(l,z,7);used=[l];}
  else if(roll<.46&&canT){const ls=sh(free);const nT=Math.min(free.length-1+(busy.length?0:0),2), keep=ls.slice(nT);
    for(const l of ls.slice(0,nT))addOb('train',l,z,{d:rnd(10,20)});if(keep.length)coinLine(keep[0],z,8);used=ls;}
  else if(roll<.56){for(const l of free)addOb('barrier',l,z);coinArc(pick(free),z,7);used=free;}
  else if(roll<.65){for(const l of free)addOb('bar',l,z);coinLine(pick(free),z-2,5,.55);used=free;}
  else if(roll<.79&&canT){const l=pick(free),d=rnd(12,22);addOb('train',l,z,{d,ramp:1});coinLine(l,z-3.5,3,1.2,1.3);coinLine(l,z+1,Math.floor(d/1.8),4.05);
    const o=free.filter(x=>x!==l);if(o.length&&Math.random()<.6)addOb(pick(['barrier','bar']),pick(o),z+rnd(4,8));used=[l];}
  else if(roll<.9){const ls=sh(free);ls.forEach((l,i)=>{const k=i===0?'barrier':i===1?'bar':'barrier';addOb(k,l,z+i*rnd(0,5));});coinArc(ls[0],z,7);used=ls;}
  else if(wz>650){const l=pick(free);addOb('drone',l,z,{y0:1,dl:l,mv:Math.random()<.5,dl2:l===0?pick([-1,1]):0});const o=free.filter(x=>x!==l);if(o.length)coinLine(pick(o),z-2,6);used=[l];}
  else{coinLine(pick(free),z,8);}
  // poderes
  if(!R.attract&&Math.random()<.11){const opts=lanes.filter(l=>!busy.includes(l));if(opts.length){const k=pick(['magnet','x2','rocket','shoes','magnet','x2','shield']);R.pups.push({k,x:pick(opts)*LANE,y:1,z:z+9,lane:0});}}
  return Math.max(15,Math.min(38,15+Math.max(0,wz-150)*.0062)*1.18)+rnd(0,9)-df*3;
}
// ---------- controles (deslizar o dedo ou setas) ----------
const act=[];
addEventListener('keydown',e=>{const k=e.key.toLowerCase();
  const m={arrowleft:'l',a:'l',arrowright:'r',d:'r',arrowup:'u',w:'u',' ':'u',arrowdown:'d',s:'d'}[k];
  if(e.key==='Escape'||k==='p'){togglePause();return;}
  if(m&&mode==='run'){e.preventDefault();if(!e.repeat)act.push(m);}});
let sw=null;
cv.addEventListener('pointerdown',e=>{audio();sw={x:e.clientX,y:e.clientY,t:performance.now(),done:false};});
cv.addEventListener('pointermove',e=>{if(!sw||sw.done||mode!=='run')return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y,th=Math.max(24,Math.min(W,H)*.045);
  if(Math.abs(dx)>th||Math.abs(dy)>th){sw.done=true;act.push(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));}});
cv.addEventListener('pointerup',e=>{if(sw&&!sw.done&&mode==='run'&&performance.now()-sw.t<250)act.push('u');sw=null;});
// toque rápido sem arrastar = pular

function laneBlocked(l){for(const o of R.objs){if(o.gone||o.lane!==l||Math.abs(o.x-l*LANE)>.1)continue;
  if(o.k==='train'&&o.z<.6&&o.z+o.d>-.6&&R.y<o.h-.4)return true;if(o.k==='train'&&o.ramp&&o.z>.6&&o.z-4.2<0&&R.y<o.h*(1-o.z/4.2)-.6)return true;}return false;}
function doAct(a){
  const C=CH[R.who];
  if(a==='l'||a==='r'){const nl=clamp(R.lane+(a==='l'?-1:1),-1,1);if(nl===R.lane)return;
    if(laneBlocked(nl)){stumble();return;}R.prevLane=R.lane;R.lane=nl;R.laneT=R.t;sfx('whoosh');}
  else if(a==='u'){if(R.pw.rocket>0)return;
    const jv=JUMPV*(C.jump||1)*(R.pw.shoes>0?1.42:1);
    if(R.onGround){R.vy=jv;R.onGround=false;R.slide=0;R.jumps++;bump('jumps');sfx('jump');dust(4);}
    else if(C.dbl&&R.airJumps<1){R.airJumps++;R.vy=jv*.88;R.jumps++;bump('jumps');sfx('jump');burst(R.x,R.y+.5,0,10,'255,79,163',4);}}
  else if(a==='d'){if(R.pw.rocket>0)return;if(!R.onGround){R.vy=-26;R.slideQ=true;}else if(R.slide<=0){R.slide=.72;R.slides++;bump('slides');sfx('slide');}}
}
function stumble(){if(R.inv>0||R.pw.rocket>0)return;R.shake=.35;sfx('stumble');if(R.stumble>0){die('caught');return;}R.stumble=4;text('CUIDADO!','255,90,90');}
function die(why){if(R.dead)return;if(R.shield>0&&why!=='caught'){R.shield--;R.inv=1.4;sfx('shield');R.flash=.5;R.flashC='120,230,255';burst(R.x,R.y+1,0,30,'120,230,255',8);text('ESCUDO!','120,230,255');return;}
  R.dead=.001;R.why=why;sfx('crash');R.shake=.6;R.flash=.7;R.flashC='255,60,90';burst(R.x,R.y+1,0,40,'255,120,140',9);music.stop();}
function burst(x,y,z,n,col,sp){for(let i=0;i<n;i++)R.parts.push({x,y,z,vx:rnd(-1,1)*sp,vy:rnd(0,1.2)*sp,vz:rnd(-.5,1)*sp,t:rnd(.4,.9),t0:.9,col,r:rnd(.05,.12)});}
function dust(n){const b=BIO[R.bio];for(let i=0;i<n;i++)R.parts.push({x:R.x+rnd(-.4,.4),y:R.y+.05,z:rnd(-.2,.3),vx:rnd(-1.5,1.5),vy:rnd(.5,2),vz:-R.speed*.3,t:.5,t0:.5,col:b.snow?'255,255,255':'230,200,170',r:rnd(.08,.16),soft:1});}
function text(t,col){R.texts.push({t,col,life:1.1});}
function bump(stat,v=1){if(R.attract)return;store.stats[stat]=(store.stats[stat]||0)+v;for(const m of store.missions){if(m.done||m.id!==stat)continue;m.p=store.stats[stat]-(m.base??0);checkMission(m);}}
function runStat(id,v){if(R.attract)return;for(const m of store.missions){if(m.done||m.id!==id)continue;m.p=Math.max(m.p,v);checkMission(m);}}
function checkMission(m){if(!m.done&&m.p>=m.n){m.done=true;m.p=m.n;const rw=150*(1+store.level);store.coins+=rw;sfx('mission');toast(`✅ MISSÃO: ${missText(m)} (+${rw} 🪙)`);save();}}
let toastT=null;function toast(t){toastEl.textContent=t;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),2600);}

function update(dt){
  R.t+=dt;R.anim+=dt*(R.speed/6);R.shake=Math.max(0,R.shake-dt);R.flash=Math.max(0,R.flash-dt*2);
  for(const q of R.parts){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(!q.soft)q.vy-=12*dt;}R.parts=R.parts.filter(q=>q.t>0);
  for(const q of R.texts)q.life-=dt;R.texts=R.texts.filter(q=>q.life>0);
  if(R.dead){R.dead+=dt;R.speed=Math.max(0,R.speed-40*dt);if(R.dead>1.4&&!R.goShown){R.goShown=true;gameOver();}scroll(R.speed*dt);return;}
  if(R.intro>-1&&!R.attract){R.intro-=dt;const c=Math.max(0,Math.ceil(R.intro/.55));if(c!==R.cnt&&R.intro<1.65){R.cnt=c;if(c>0)sfx('count');else sfx('go');}}
  if(!R.attract)R.speed=Math.min(38,15+R.dist*.0062+(R.intro>0?-4:0));
  const dz=R.speed*dt;R.dist+=dz;scroll(dz);
  R.score+=dz*mult()*(R.pw.x2>0?2:1)*(R.attract?0:1);
  // curvas e morros só no visual
  if(R.dist>R.nextBend){R.nextBend=R.dist+rnd(150,320);R.curveT=Math.random()<.25?0:rnd(-1,1);R.hillT=Math.random()<.4?0:rnd(-.6,.6);}
  R.curve+=(R.curveT-R.curve)*Math.min(1,dt*.35);R.hill+=(R.hillT-R.hill)*Math.min(1,dt*.3);
  const nb=bioAt(R.dist);if(nb!==R.bio){R.prevBio=R.bio;R.bio=nb;R.bioT=0;R.banT=4;music.bio=nb;if(!R.attract)sfx('power');}
  R.bioT=Math.min(1,R.bioT+dt/2.5);R.banT-=dt;music.int=clamp((R.speed-14)/24,0,1);
  // ações
  while(act.length&&!R.attract)doAct(act.shift());
  if(R.attract)attractAI();
  const C=CH[R.who];
  R.x+=(R.lane*LANE-R.x)*Math.min(1,dt*13);
  // poderes
  for(const k in R.pw)if(R.pw[k]>0){R.pw[k]-=dt;if(R.pw[k]<=0){R.pw[k]=0;if(k==='rocket'){R.inv=1.5;R.rocketClear=0;R.objs=R.objs.filter(o=>o.z>40);R.vy=0;}}}
  R.inv-=dt;R.stumble-=dt;R.slide-=dt;
  // física
  const gy=support();
  if(R.pw.rocket>0){R.y+=(6.4-R.y)*Math.min(1,dt*3);R.vy=0;R.onGround=false;}
  else{R.vy-=GRAV*dt;R.y+=R.vy*dt;
    if(R.y<=gy){if(!R.onGround&&R.vy<-6){sfx('land');dust(5);}R.y=gy;R.vy=0;R.onGround=true;R.airJumps=0;if(R.slideQ){R.slideQ=false;R.slide=.62;R.slides++;bump('slides');sfx('slide');}}
    else if(R.y>gy+.05)R.onGround=false;}
  if(R.onRoof&&R.onRoof!==R.lastRoof){R.lastRoof=R.onRoof;R.roofs++;bump('roofs');}
  // geração
  {const mr=Math.random;Math.random=R.rng;try{while(R.spawnZ<ZMAX){const g=spawnRow(R.spawnZ);R.spawnZ+=g;}}finally{Math.random=mr;}}
  R.spans=R.spans.filter(s=>s.end>R.dist-40);
  // moedas no céu durante a mochila-foguete
  if(R.pw.rocket>.8){R.skyZ-=R.speed*dt;if(R.skyZ<=0){R.skyZ=11;const l=R.skyLane=clamp((R.skyLane??R.lane)+(Math.random()<.4?pick([-1,1]):0),-1,1);coinLine(l,ZMAX*.5,6,6.6,1.8);}}
  spawnScenery();
  // drones da NÉVOA trocam de faixa
  for(const o of R.objs)if(o.k==='drone'){o.t+=dt;if(o.mv&&o.z<55&&o.z>12&&!o.moved){o.moved=1;o.dl=o.dl2;}o.x+=(o.dl*LANE-o.x)*Math.min(1,dt*2.5);o.lane=Math.round(o.x/LANE);}
  // colisões
  const ph=R.slide>0?.7:(C.small?1.05:1.7);
  if(!R.attract)for(const o of R.objs){if(o.gone)continue;
    const inZ=o.z<.45&&o.z+o.d>-.45;
    if(!o.passed&&o.z+o.d<-.45){o.passed=1;if(o.lane===R.prevLane&&o.lane!==R.lane&&R.t-R.laneT<.5&&o.k!=='bar'){R.near++;bump('near');R.score+=100*mult();sfx('near');text('POR UM TRIZ! +'+100*mult(),'255,216,74');}}
    if(!inZ||Math.abs(o.x-R.x)>o.w/2+.3||R.pw.rocket>0||R.inv>0)continue;
    if(o.k==='barrier'&&R.y<o.h-.1){if(C.smash){o.gone=1;sfx('smash');burst(o.x,.6,o.z,26,'255,200,90',7);R.score+=50*mult();text('POW!','255,216,74');R.shake=.2;}else die('barrier');}
    else if(o.k==='bar'&&R.y+ph>1.3&&R.y<o.h)die('bar');
    else if(o.k==='train'&&R.y<o.h-(o.ramp?1.2:.4))die('train');
    else if(o.k==='drone'&&R.y<o.y0+.85&&R.y+ph>o.y0)die('drone');
  }
  // moedas
  const magR=R.pw.magnet>0?30:0, py=R.y+.85;
  for(const c of R.coinsA){if(c.got)continue;
    if(magR&&c.z<magR&&c.z>-1){c.mag=1;}
    if(c.mag){const k=Math.min(1,dt*9);c.x+=(R.x-c.x)*k;c.y+=(py-c.y)*k;c.z+=(0-c.z)*k;}
    if(Math.abs(c.z)<.8&&Math.abs(c.x-R.x)<1&&Math.abs(c.y-py)<1.25){c.got=1;R.coins++;R.score+=5*mult();sfx('coin');R.parts.push({x:c.x,y:c.y,z:c.z,vx:0,vy:2,vz:0,t:.35,t0:.35,col:'255,226,122',r:.25,soft:1,ring:1});}}
  for(const p of R.pups){if(p.got)continue;if(Math.abs(p.z)<1&&Math.abs(p.x-R.x)<1.1&&Math.abs(p.y-py)<1.4){p.got=1;getPower(p.k);}}
  // limpeza
  R.objs=R.objs.filter(o=>o.z+o.d>-CAMZ-2&&!(o.gone&&o.z<-2));R.coinsA=R.coinsA.filter(c=>!c.got&&c.z>-CAMZ);R.pups=R.pups.filter(p=>!p.got&&p.z>-CAMZ);R.scen=R.scen.filter(s=>s.z+(s.d||0)>-CAMZ-2);
  // perseguidor (NÉVOA) quando tropeça
  if(!R.attract){runStat('distRun',Math.floor(R.dist));runStat('coinsRun',R.coins);runStat('scoreRun',Math.floor(R.score));}
}
function scroll(dz){for(const a of [R.objs,R.coinsA,R.pups,R.scen])for(const o of a)o.z-=dz;R.spawnZ-=dz;R.scenZ[-1]-=dz;R.scenZ[1]-=dz;R.propZ[-1]-=dz;R.propZ[1]-=dz;for(const q of R.parts)q.z-=dz*(q.soft?0:1);}
function support(){let gy=0;R.onRoof=null;
  for(const o of R.objs){if(o.k!=='train'||o.gone||Math.abs(o.x-R.x)>LANE*.55)continue;
    if(o.z<=.35&&o.z+o.d>=-.35){if(R.y>=o.h-(o.ramp?1.2:.45)){gy=Math.max(gy,o.h);R.onRoof=o;}}
    else if(o.ramp&&o.z>.35&&o.z-4.2<=0){const rh=o.h*(1-o.z/4.2);if(R.y>=rh-.7)gy=Math.max(gy,rh);}}
  return gy;}
function getPower(k){R.nPups++;bump('pups');sfx('power');const C=CH[R.who];
  if(k==='shield'){R.shield=Math.max(R.shield,1);text('ESCUDO','120,230,255');return;}
  R.pw[k]=dur(k)*(k==='magnet'&&C.mag2?2:1);
  if(k==='rocket'){R.rockets++;bump('rocket');sfx('rocket');R.rocketClear=1;R.objs=R.objs.filter(o=>o.z>60);R.skyLane=R.lane;R.flash=.3;R.flashC='255,200,120';}
  text({magnet:'ÍMÃ!',x2:'PONTOS 2x!',rocket:'MOCHILA-FOGUETE!',shoes:'TÊNIS DE MOLA!'}[k],'255,216,74');}
// modo demonstração (fundo da tela de título)
function attractAI(){R.aiT=(R.aiT||0)-1/60;if(R.aiT<=0){R.aiT=rnd(1.2,2.6);const nl=clamp(R.lane+pick([-1,1]),-1,1);R.lane=nl;}}

// ---------- desenho em 3D (projeção em perspectiva no canvas) ----------
let camX=0,camY=2.5,camZo=0;
function P(x,y,z){const dz=z+CAMZ+camZo;if(dz<.35)return null;const c=R.curve*dz*dz*.0016, hl=R.hill*dz*dz*.0012;return{x:W/2+(x+c-camX)*F/dz,y:HOR+(camY-y-hl)*F/dz,s:F/dz,dz};}
const HC=new Map();const hx=h=>{let v=HC.get(h);if(!v){v=hex2(h);HC.set(h,v);}return v;};
let FOG=[0,0,0];
const fogF=dz=>Math.pow(clamp((dz-18)/(ZMAX-18),0,1),1.15)*.92;
const fc=(h,dz,shade=1)=>{const c=hx(h),f=fogF(dz);return`rgb(${(c[0]*shade*(1-f)+FOG[0]*f)|0},${(c[1]*shade*(1-f)+FOG[1]*f)|0},${(c[2]*shade*(1-f)+FOG[2]*f)|0})`;};
function quad(a,b,c,d,fill){if(!a||!b||!c||!d)return;ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();}
function box(x,y,z,w,h,d,col,o={}){const xl=x-w/2,xr=x+w/2,z1=z+d,yt=y+h,dz=z+CAMZ+camZo;
  if(xl>camX)quad(P(xl,y,z),P(xl,y,z1),P(xl,yt,z1),P(xl,yt,z),fc(o.side||col,dz,.72));
  if(xr<camX)quad(P(xr,y,z),P(xr,y,z1),P(xr,yt,z1),P(xr,yt,z),fc(o.side||col,dz,.72));
  if(yt<camY)quad(P(xl,yt,z),P(xr,yt,z),P(xr,yt,z1),P(xl,yt,z1),fc(o.top||col,dz,1.12));
  const a=P(xl,y,z),b=P(xr,y,z),c=P(xr,yt,z),e=P(xl,yt,z);quad(a,b,c,e,fc(col,dz,1));return a&&c?{x:a.x,y:c.y,w:b.x-a.x,h:a.y-c.y,s:a.s,dz}:null;}
const BLEND=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function blendBio(k){const a=BIO[R.prevBio],b=BIO[R.bio];return BLEND(a[k+'R'],b[k+'R'],R.bioT);}
const rgb=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;

function drawSky(){
  const A=BIO[R.prevBio],B=BIO[R.bio],t=R.bioT;
  const g=ctx.createLinearGradient(0,0,0,HOR+4);for(let i=0;i<3;i++)g.addColorStop(i/2,rgb(BLEND(A.skyR[i],B.skyR[i],t)));ctx.fillStyle=g;ctx.fillRect(0,0,W,HOR+4);
  for(const [b,al] of [[A,1-t],[B,t]])if(al>.01)celestial(b,al);
  // horizonte distante
  const shift=-camX*6-R.curve*W*.08;
  for(const [b,al] of [[A,1-t],[B,t]]){if(al<.01)continue;ctx.globalAlpha=al;const base=rgb(BLEND(hx(b.fog),hx(b.sky[0]),.45));ctx.fillStyle=base;ctx.beginPath();ctx.moveTo(0,HOR+2);
    if(b.aurora||b.name.startsWith('Sert')){for(let x=-40;x<=W+40;x+=20){const u=(x-shift*.5)/W;ctx.lineTo(x,HOR-(b.aurora?40:18)*(.5+.5*Math.sin(u*9))*(1+.6*Math.sin(u*23))*H/600);}}
    else for(let i=-2;i<W/26+2;i++){const id=Math.floor(i-shift/26),x=i*26+((shift%26)+26)%26,h=(18+hash(id,3)*60)*H/600*(b.neon?1.7:1);ctx.lineTo(x,HOR-h);ctx.lineTo(x+24,HOR-h);}
    ctx.lineTo(W,HOR+2);ctx.fill();
    if(b.night&&!b.aurora){ctx.fillStyle=b.neon?'rgba(255,79,163,.8)':'rgba(255,220,140,.7)';for(let i=0;i<70;i++){const id=Math.floor(i/3),x=((hash(i,9)*W*1.4+shift*.5)%W+W)%W,y=HOR-hash(i,10)*40*H/600;ctx.fillRect(x,y,2,2);}}
    ctx.globalAlpha=1;}
}
function celestial(b,al){
  ctx.save();ctx.globalAlpha=al;
  if(b.night){ctx.fillStyle='#fff';for(let i=0;i<90;i++){ctx.globalAlpha=al*(.3+.7*hash(i,1))*(.6+.4*Math.sin(R.t*2+i));ctx.fillRect(hash(i,2)*W,hash(i,3)*HOR*.85,1.6,1.6);}ctx.globalAlpha=al;}
  if(b.aurora){ctx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const ag=ctx.createLinearGradient(0,0,0,HOR);ag.addColorStop(0,'rgba(0,0,0,0)');ag.addColorStop(.5,k===1?'rgba(176,107,255,.35)':'rgba(80,255,180,.35)');ag.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ag;ctx.beginPath();
    for(let x=0;x<=W;x+=W/30)ctx.lineTo(x,HOR*(.18+k*.1)+Math.sin(x/W*6+R.t*.5+k*2)*HOR*.08);for(let x=W;x>=0;x-=W/30)ctx.lineTo(x,HOR*(.55+k*.08)+Math.sin(x/W*4+R.t*.4+k)*HOR*.1);ctx.fill();}ctx.globalCompositeOperation='source-over';}
  if(b.moon){const x=W*.22,y=HOR*.32,r=Math.min(W,H)*.045;ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('200,220,255'),x-r*4,y-r*4,r*8,r*8);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#f4f2e6';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}
  if(b.sun){const x=W*.7-R.curve*W*.05,y=HOR*(b.name.startsWith('Sert')?.78:.4),r=Math.min(W,H)*(b.name.startsWith('Sert')?.12:.06);ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('255,220,150'),x-r*4,y-r*4,r*8,r*8);ctx.globalCompositeOperation='source-over';
    const sg=ctx.createLinearGradient(0,y-r,0,y+r);sg.addColorStop(0,'#fff8d8');sg.addColorStop(1,b.sun);ctx.fillStyle=sg;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}
  if(b.neon){const x=W/2-R.curve*W*.06,y=HOR,r=Math.min(W,H)*.2;ctx.save();ctx.beginPath();ctx.arc(x,y,r,Math.PI,0);ctx.clip();const sg=ctx.createLinearGradient(0,y-r,0,y);sg.addColorStop(0,'#ffe46b');sg.addColorStop(.5,'#ff8a3c');sg.addColorStop(1,'#ff3fa0');ctx.fillStyle=sg;ctx.fillRect(x-r,y-r,r*2,r);
    ctx.fillStyle=rgb(hx(b.sky[2]));for(let i=0;i<7;i++){const yy=y-r*.55+i*r*.08;ctx.fillRect(x-r,yy,r*2,1.5+i*1.1);}ctx.restore();ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('255,80,170'),x-r*2,y-r*2,r*4,r*4);ctx.globalCompositeOperation='source-over';
    // olho da NÉVOA no céu
    const ex=W*.2,ey=HOR*.3,er=Math.min(W,H)*.05;ctx.globalAlpha=al*(.5+.2*Math.sin(R.t*2));ctx.strokeStyle='#b06bff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ex-er*2,ey);ctx.quadraticCurveTo(ex,ey-er*1.6,ex+er*2,ey);ctx.quadraticCurveTo(ex,ey+er*1.6,ex-er*2,ey);ctx.stroke();ctx.fillStyle='#e080ff';ctx.beginPath();ctx.arc(ex+Math.sin(R.t*.7)*er*.4,ey,er*.5,0,7);ctx.fill();}
  ctx.restore();
}
function drawGround(){
  FOG=blendBio('fog');const G1=blendBio('ground'),G2=blendBio('ground2'),R1=blendBio('road'),R2=blendBio('road2'),B=BIO[R.bio];
  const gg=ctx.createLinearGradient(0,HOR,0,H);gg.addColorStop(0,rgb(FOG));gg.addColorStop(.25,rgb(G1));gg.addColorStop(1,rgb(G1));ctx.fillStyle=gg;ctx.fillRect(0,HOR-2,W,H-HOR+2);
  const SEG=3, off=R.dist%(SEG*2), RW=LANE*1.5+.35, cm=(c,dz,s=1)=>{const f=fogF(dz);return`rgb(${(c[0]*s*(1-f)+FOG[0]*f)|0},${(c[1]*s*(1-f)+FOG[1]*f)|0},${(c[2]*s*(1-f)+FOG[2]*f)|0})`;};
  const edge=B.edge, lineC=B.line;
  for(let k=Math.ceil(ZMAX/SEG);k>=0;k--){
    let z0=k*SEG-off-CAMZ+.4, z1=z0+SEG;if(z1<-CAMZ+.4)continue;z0=Math.max(z0,-CAMZ+.4);const par=(Math.floor((R.dist+z0)/SEG)%2+2)%2, dz=z0+CAMZ+camZo;
    quad(P(-90,0,z0),P(90,0,z0),P(90,0,z1),P(-90,0,z1),cm(par?G2:G1,dz));
    quad(P(-RW,0,z0),P(RW,0,z0),P(RW,0,z1),P(-RW,0,z1),cm(par?R2:R1,dz));
    if(B.neon||B.night){ctx.globalAlpha=.9;quad(P(-RW-.12,0,z0),P(-RW+.12,0,z0),P(-RW+.12,0,z1),P(-RW-.12,0,z1),`rgba(${edge},${1-fogF(dz)})`);quad(P(RW-.12,0,z0),P(RW+.12,0,z0),P(RW+.12,0,z1),P(RW-.12,0,z1),`rgba(${edge},${1-fogF(dz)})`);ctx.globalAlpha=1;}
    else{quad(P(-RW-.25,0,z0),P(-RW,0,z0),P(-RW,0,z1),P(-RW-.25,0,z1),cm(par?[230,230,230]:[200,60,60],dz));quad(P(RW,0,z0),P(RW+.25,0,z0),P(RW+.25,0,z1),P(RW,0,z1),cm(par?[230,230,230]:[200,60,60],dz));}
    if(par)for(const lx of [-LANE/2,LANE/2])quad(P(lx-.07,0,z0),P(lx+.07,0,z0),P(lx+.07,0,z1-.8),P(lx-.07,0,z1-.8),cm(hx(lineC),dz));
    if(B.neon&&!par){ctx.strokeStyle=`rgba(176,107,255,${.5*(1-fogF(dz))})`;ctx.lineWidth=1;const a=P(-90,0,z0),b=P(90,0,z0);if(a&&b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
  }
}
function drawBld(o){
  const B=BIO[o.bio], x0=o.x, x1=o.x+o.side*o.w, z0=o.z, z1=o.z+o.d, h=o.h, dz=Math.max(.4,z0+CAMZ+camZo), zz0=Math.max(z0,-CAMZ+.5);
  quad(P(x0,0,zz0),P(x0,0,z1),P(x0,h,z1),P(x0,h,zz0),fc(o.col,dz,B.neon?1:.82));
  if(z0>-CAMZ+.5)quad(P(x0,0,z0),P(x1,0,z0),P(x1,h,z0),P(x0,h,z0),fc(o.col,dz,B.neon?.8:1));
  if(dz<75){const night=B.night, nc=B.neon;
    for(let yy=.9;yy<h-.6;yy+=1.35)for(let u=.7;u<o.d-.6;u+=1.7){const zA=z0+u;if(zA<-CAMZ+.6)continue;const lit=hash(o.seed+u*7|0,yy*3|0)>(nc?.45:.55);
      const col=night?(lit?(nc?(hash(o.seed,u|0)>.5?'#38e8ff':'#ff4fa3'):'#ffd88a'):'#1a1a30'):(hash(o.seed,yy|0)>.5?'#5a7aa0':'#3a5a80');
      quad(P(x0,yy,zA),P(x0,yy,zA+.8),P(x0,yy+.75,zA+.8),P(x0,yy+.75,zA),night&&lit?col:fc(col,dz));}
    if(z0>-CAMZ+.5){const a=P(x0,h,z0),b=P(x1,h,z0);if(a&&b){ctx.strokeStyle=nc?'#38e8ff':fc('#ffffff',dz,.9);ctx.lineWidth=Math.max(1,a.s*.08);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    if(nc){const a=P(x0,0,zz0),b=P(x0,h,zz0),c=P(x0,h,z1);if(a&&b&&c){ctx.strokeStyle='rgba(255,79,163,.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.stroke();}}}
  if(B.snow&&z0>-CAMZ+.5)quad(P(x0,h,z0),P(x1,h,z0),P(x1,h+.25,z0),P(x0,h+.25,z0),fc('#ffffff',dz));
}
function drawProp(o){
  const p=P(o.x,0,o.z);if(!p)return;const s=p.s*o.s, B=BIO[o.bio], dz=p.dz;ctx.save();ctx.translate(p.x,p.y);
  if(o.k==='cactus'){ctx.fillStyle=fc('#3f8a3a',dz);ctx.beginPath();ctx.roundRect?ctx.roundRect(-.18*s,-2.3*s,.36*s,2.3*s,.18*s):ctx.rect(-.18*s,-2.3*s,.36*s,2.3*s);ctx.fill();ctx.fillRect(-.6*s,-1.5*s,.42*s,.22*s);ctx.fillRect(-.6*s,-1.9*s,.18*s,.6*s);ctx.fillRect(.18*s,-1.1*s,.42*s,.2*s);ctx.fillRect(.42*s,-1.6*s,.18*s,.7*s);}
  else if(o.k==='poste'||o.k==='neonposte'){const nc=o.k==='neonposte';ctx.fillStyle=fc(nc?'#2a2440':'#3a3a48',dz);ctx.fillRect(-.06*s,-4*s,.12*s,4*s);ctx.fillRect(-.06*s,-4*s,(o.x<0?1:-1)*.8*s,.1*s);
    const lx=(o.x<0?1:-1)*.75*s;if(B.night||nc){ctx.globalCompositeOperation='lighter';ctx.drawImage(glow(nc?'56,232,255':'255,210,140'),lx-1.5*s,-4.4*s,3*s,3*s);ctx.globalCompositeOperation='source-over';}ctx.fillStyle=nc?'#38e8ff':B.night?'#ffe8b0':fc('#e8e8e8',dz);ctx.fillRect(lx-.2*s,-3.95*s,.4*s,.14*s);}
  else if(o.k==='arvore'){ctx.fillStyle=fc('#6a4a2a',dz);ctx.fillRect(-.12*s,-1.8*s,.24*s,1.8*s);ctx.fillStyle=fc(hash(o.seed,1)>.5?'#b06bd8':'#4a9a4a',dz);ctx.beginPath();ctx.arc(0,-2.3*s,1.1*s,0,7);ctx.arc(-.6*s,-1.9*s,.7*s,0,7);ctx.arc(.6*s,-1.9*s,.7*s,0,7);ctx.fill();}
  else if(o.k==='pinheiro'){ctx.fillStyle=fc('#5a3a22',dz);ctx.fillRect(-.15*s,-.8*s,.3*s,.8*s);for(let i=0;i<3;i++){const w=(1.3-i*.32)*s,y=-(.6+i*.95)*s;ctx.fillStyle=fc('#1f5a3a',dz,1-i*.06);ctx.beginPath();ctx.moveTo(-w,y);ctx.lineTo(0,y-1.5*s);ctx.lineTo(w,y);ctx.fill();ctx.fillStyle=fc('#ffffff',dz);ctx.beginPath();ctx.moveTo(-w*.45,y-.85*s);ctx.lineTo(0,y-1.5*s);ctx.lineTo(w*.45,y-.85*s);ctx.fill();}}
  ctx.restore();
}
function drawOb(o){
  const dz=o.z+CAMZ+camZo, B=BIO[o.bio];
  if(o.k==='barrier'){const f=box(o.x,0,o.z,o.w,o.h,o.d,'#f4f4f4');if(f){ctx.save();ctx.beginPath();ctx.rect(f.x,f.y+f.h*.12,f.w,f.h*.5);ctx.clip();ctx.fillStyle=fc('#e8343e',dz);for(let i=-2;i<8;i++){ctx.beginPath();ctx.moveTo(f.x+i*f.w/5,f.y+f.h*.62);ctx.lineTo(f.x+i*f.w/5+f.w/10,f.y+f.h*.62);ctx.lineTo(f.x+i*f.w/5+f.w/10+f.h*.5,f.y);ctx.lineTo(f.x+i*f.w/5+f.h*.5,f.y);ctx.fill();}ctx.restore();
      ctx.fillStyle=fc('#3a3a48',dz);ctx.fillRect(f.x+f.w*.08,f.y+f.h*.62,f.w*.08,f.h*.38);ctx.fillRect(f.x+f.w*.84,f.y+f.h*.62,f.w*.08,f.h*.38);
      if(Math.sin(R.t*8+o.t)>0){ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('255,160,40'),f.x+f.w*.5-f.s*.4,f.y-f.s*.4,f.s*.8,f.s*.8);ctx.globalCompositeOperation='source-over';}}}
  else if(o.k==='bar'){box(o.x-o.w/2+.1,0,o.z,.18,o.h,.2,'#4a4a5a');box(o.x+o.w/2-.1,0,o.z,.18,o.h,.2,'#4a4a5a');const f=box(o.x,1.38,o.z,o.w,.5,.2,'#ff4fa3',{top:'#ff9fd0'});
    if(f){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6*(1-fogF(dz));ctx.drawImage(glow('255,79,163'),f.x-f.w*.2,f.y-f.h*1.5,f.w*1.4,f.h*4);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      if(dz<45){ctx.fillStyle='#fff';ctx.font=`900 ${Math.max(6,f.h*.55)}px Orbitron,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('▼ ▼ ▼',f.x+f.w/2,f.y+f.h/2);}}}
  else if(o.k==='train'){const behind=o.z+o.d<1.5&&R.y<o.h+.2;if(behind)ctx.globalAlpha=.28;
    if(o.ramp){const xl=o.x-o.w/2,xr=o.x+o.w/2,z0=o.z-4.2;quad(P(xl,0,Math.max(z0,-CAMZ+.5)),P(xr,0,Math.max(z0,-CAMZ+.5)),P(xr,o.h,o.z),P(xl,o.h,o.z),fc('#d8b030',dz,.9));
      for(let i=1;i<6;i++){const zz=z0+i*.7;if(zz<-CAMZ+.5)continue;const yy=o.h*i*.7/4.2;quad(P(xl,yy,zz),P(xr,yy,zz),P(xr,yy+.09,zz+.07),P(xl,yy+.09,zz+.07),fc('#2a2a2a',dz));}}
    const col=B.train, f=box(o.x,0,Math.max(o.z,-CAMZ+.5),o.w,o.h,o.d-Math.max(0,-CAMZ+.5-o.z),col,{top:B.neon?'#2a2050':'#b8b8c0'});
    if(f&&o.z>-CAMZ+.5){const wy=f.y+f.h*.12,wh=f.h*.32;ctx.fillStyle=fc('#1a2a40',dz);ctx.fillRect(f.x+f.w*.12,wy,f.w*.76,wh);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(f.x+f.w*.16,wy+wh*.1,f.w*.2,wh*.8);
      ctx.fillStyle=fc('#ffffff',dz,.95);ctx.fillRect(f.x,f.y+f.h*.58,f.w,f.h*.06);
      ctx.globalCompositeOperation='lighter';for(const hx2 of [.2,.8]){ctx.drawImage(glow(B.neon?'56,232,255':'255,240,200'),f.x+f.w*hx2-f.s*.5,f.y+f.h*.78-f.s*.5,f.s,f.s);}ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='#fff8d0';for(const hx2 of [.2,.8]){ctx.beginPath();ctx.arc(f.x+f.w*hx2,f.y+f.h*.78,f.s*.12,0,7);ctx.fill();}
      if(B.neon){ctx.strokeStyle='#38e8ff';ctx.lineWidth=2;ctx.strokeRect(f.x,f.y,f.w,f.h);}}ctx.globalAlpha=1;}
  else if(o.k==='drone'){const p=P(o.x,o.y0+.45+Math.sin(R.t*3+o.t)*.12,o.z);if(!p)return;const s=p.s;ctx.save();ctx.translate(p.x,p.y);
    ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('176,107,255'),-s*1.3,-s*1.3,s*2.6,s*2.6);ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#1a0a30';ctx.strokeStyle='#b06bff';ctx.lineWidth=Math.max(1,s*.05);ctx.beginPath();ctx.ellipse(0,0,s*.55,s*.42,0,0,7);ctx.fill();ctx.stroke();
    for(const sx of [-1,1]){ctx.fillStyle='#b06bff';ctx.fillRect(sx*s*.55,-s*.05,sx*s*.3,s*.08);ctx.fillStyle=`rgba(255,255,255,${.4+.4*Math.sin(R.t*40)})`;ctx.fillRect(sx*s*.85-s*.25,-s*.12,s*.5,s*.04);}
    const eg=ctx.createRadialGradient(0,0,0,0,0,s*.25);eg.addColorStop(0,'#fff');eg.addColorStop(.4,'#e080ff');eg.addColorStop(1,'#3a0a5a');ctx.fillStyle=eg;ctx.beginPath();ctx.arc(0,0,s*.25,0,7);ctx.fill();ctx.restore();}
}
function drawCoin(c){const p=P(c.x,c.y,c.z);if(!p)return;const s=p.s*.32, w=Math.abs(Math.cos(R.t*5+c.z*.3))*s+s*.12;
  if(p.dz<60){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6*(1-fogF(p.dz));ctx.drawImage(glow('255,210,80'),p.x-s*1.8,p.y-s*1.8,s*3.6,s*3.6);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  ctx.fillStyle=fc('#e8a820',p.dz);ctx.beginPath();ctx.ellipse(p.x,p.y,w,s,0,0,7);ctx.fill();ctx.fillStyle=fc('#ffe27a',p.dz);ctx.beginPath();ctx.ellipse(p.x,p.y,w*.72,s*.72,0,0,7);ctx.fill();if(w>s*.5){ctx.fillStyle=fc('#fff6c0',p.dz);ctx.fillRect(p.x-w*.15,p.y-s*.45,w*.3,s*.9);}}
function drawPup(u){const p=P(u.x,u.y+Math.sin(R.t*3)*.15,u.z);if(!p)return;const s=p.s*.55, col={magnet:'255,80,90',x2:'255,216,74',rocket:'255,150,60',shoes:'120,255,170',shield:'120,230,255'}[u.k];
  ctx.globalCompositeOperation='lighter';ctx.drawImage(glow(col),p.x-s*2,p.y-s*2,s*4,s*4);ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='rgba(10,8,30,.75)';ctx.strokeStyle=`rgb(${col})`;ctx.lineWidth=Math.max(1.5,s*.08);ctx.beginPath();ctx.arc(p.x,p.y,s,0,7);ctx.fill();ctx.stroke();
  ctx.font=`${s*1.1}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText({magnet:'🧲',x2:'✖️',rocket:'🚀',shoes:'👟',shield:'🛡️'}[u.k],p.x,p.y+s*.06);
  if(u.k==='x2'){ctx.font=`900 ${s*.7}px Orbitron,sans-serif`;ctx.fillStyle='#ffd84a';ctx.fillText('2x',p.x,p.y);}}
// a personagem, vista de costas
function drawRunner(sx,sy,s,who,st){
  const C=CH[who];const k=s/100*(C.small?.64:1);ctx.save();ctx.translate(sx,sy);ctx.scale(k,k);
  if(st.dead){ctx.rotate(-.5+Math.min(1,st.dead*3)*-.6);ctx.translate(0,-st.dead*40);}
  if(st.inv&&Math.floor(st.t*14)%2)ctx.globalAlpha=.45;
  const ph=st.ph, sw=Math.sin(ph), run=!st.air&&!st.slide&&!st.rocket;
  if(st.slide){ctx.scale(1.12,.5);}
  ctx.translate(0,run?-Math.abs(Math.cos(ph))*6:0);
  if(C.dog){drawDogBack(st,sw,run);ctx.restore();return;}
  const skin='#ffd9c4', pants=C.dress?skin:C.pants;
  const leg=(x,lift)=>{ctx.strokeStyle=pants;ctx.lineWidth=17;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,-86);ctx.lineTo(x*1.05,-8-lift);ctx.stroke();
    ctx.fillStyle='#f4f4f8';ctx.beginPath();ctx.ellipse(x*1.05,-4-lift,11,8,0,0,7);ctx.fill();ctx.fillStyle=C.hex;ctx.beginPath();ctx.ellipse(x*1.05,-1-lift,10,lift>14?6:3,0,0,7);ctx.fill();};
  const lL=run?Math.max(0,sw)*36:st.air?30:12, lR=run?Math.max(0,-sw)*36:st.air?16:12;
  if(st.rocket){ctx.globalCompositeOperation='lighter';for(const x of [-12,12]){const fl=40+Math.random()*30;ctx.drawImage(glow('255,170,60'),x-14,-100,28,fl+30);ctx.drawImage(glow('255,255,220'),x-6,-100,12,fl*.6);}ctx.globalCompositeOperation='source-over';}
  leg(-11,lL);leg(11,lR);
  // tronco
  if(C.dress){ctx.fillStyle=C.shirt;ctx.beginPath();ctx.moveTo(-23,-150);ctx.lineTo(23,-150);ctx.lineTo(34,-70);ctx.lineTo(-34,-70);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-30,-78,60,4);}
  else{ctx.fillStyle=C.pants;ctx.fillRect(-23,-96,46,14);ctx.fillStyle=C.shirt;ctx.beginPath();ctx.roundRect?ctx.roundRect(-25,-152,50,62,10):ctx.rect(-25,-152,50,62);ctx.fill();
    if(C.stripes){ctx.fillStyle='rgba(255,255,255,.85)';for(let y=-144;y<-94;y+=10)ctx.fillRect(-25,y,50,3.5);}
    ctx.fillStyle=C.hex;ctx.fillRect(-25,-104,50,5);}
  // braços balançando
  const arm=(x,d)=>{const hy=-104+(run?d*sw*22:st.air?-40:-6), hx2=x*1.35;ctx.strokeStyle=C.shirt;ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(x,-144);ctx.lineTo((x+hx2)/2,(-144+hy)/2);ctx.stroke();
    ctx.strokeStyle=skin;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo((x+hx2)/2,(-144+hy)/2);ctx.lineTo(hx2,hy);ctx.stroke();ctx.fillStyle=skin;ctx.beginPath();ctx.arc(hx2,hy,6.5,0,7);ctx.fill();};
  arm(-25,1);arm(25,-1);
  if(st.rocket){ctx.fillStyle='#5a5a70';ctx.beginPath();ctx.roundRect?ctx.roundRect(-20,-150,40,50,8):ctx.rect(-20,-150,40,50);ctx.fill();ctx.fillStyle='#8a8aa0';ctx.fillRect(-18,-104,12,8);ctx.fillRect(6,-104,12,8);ctx.fillStyle=C.hex;ctx.fillRect(-20,-136,40,5);}
  // cabeça (de costas: cabelo)
  ctx.fillStyle=skin;ctx.fillRect(-8,-162,16,14);ctx.beginPath();ctx.ellipse(-21,-174,5,7,0,0,7);ctx.ellipse(21,-174,5,7,0,0,7);ctx.fill();
  ctx.fillStyle=C.hair;ctx.beginPath();ctx.arc(0,-177,22,0,7);ctx.fill();
  if(C.long){ctx.beginPath();ctx.moveTo(-22,-178);ctx.quadraticCurveTo(-27,-130,-20+Math.sin(ph)*2,-118);ctx.lineTo(20+Math.sin(ph)*2,-118);ctx.quadraticCurveTo(27,-130,22,-178);ctx.fill();}
  if(C.tail){ctx.beginPath();ctx.ellipse(Math.sin(ph*1.3)*5,-150,7,16,Math.sin(ph)*.2,0,7);ctx.fill();}
  if(C.bun){ctx.beginPath();ctx.arc(0,-199,11,0,7);ctx.fill();}
  if(C.glasses){ctx.strokeStyle='#e8b830';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-22,-176);ctx.lineTo(-26,-174);ctx.moveTo(22,-176);ctx.lineTo(26,-174);ctx.stroke();}
  ctx.strokeStyle=C.hex;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-177,21,-Math.PI*.95,-Math.PI*.05);ctx.stroke();
  ctx.restore();
}
function drawDogBack(st,sw,run){
  const lift=run?Math.max(0,sw)*18:st.air?14:4, lift2=run?Math.max(0,-sw)*18:st.air?8:4;
  ctx.fillStyle='#6b3f22';for(const [x,l] of [[-17,lift],[17,lift2]]){ctx.fillRect(x-6,-30-l,12,26);ctx.beginPath();ctx.ellipse(x,-4-l,9,6,0,0,7);ctx.fill();}
  ctx.fillStyle='#8a5530';ctx.beginPath();ctx.ellipse(0,-52,34,34,0,0,7);ctx.fill();for(const [x,y] of [[-20,-74],[0,-82],[20,-74],[-28,-50],[28,-50]]){ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill();}
  ctx.strokeStyle='#8a5530';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-70);ctx.quadraticCurveTo(Math.sin(st.t*14)*22,-100,Math.sin(st.t*14)*14,-122);ctx.stroke();
  ctx.beginPath();ctx.arc(0,-104,24,0,7);ctx.fill();ctx.fillStyle='#6b3f22';const fl=run?Math.sin(st.ph*2)*.3:0;
  for(const s of [-1,1]){ctx.save();ctx.translate(s*22,-108);ctx.rotate(s*(.25+fl));ctx.beginPath();ctx.ellipse(0,14,8,18,0,0,7);ctx.fill();ctx.restore();}
  ctx.strokeStyle=CH.ilo.hex;ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,-104,22,Math.PI*.15,Math.PI*.85);ctx.stroke();
}
function drawNevoaChaser(close){
  const p=P(R.x*.8,2.6+Math.sin(R.t*3)*.15-close*1.1,-2.2+close*1.2);if(!p)return;const s=p.s*.9;ctx.save();ctx.translate(p.x,p.y);
  ctx.globalCompositeOperation='lighter';ctx.drawImage(glow('176,107,255'),-s*1.6,-s*1.6,s*3.2,s*3.2);
  if(close>0){const bg=ctx.createLinearGradient(0,0,0,s*3);bg.addColorStop(0,'rgba(200,120,255,.6)');bg.addColorStop(1,'rgba(200,120,255,0)');ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(-s*.2,0);ctx.lineTo(s*.2,0);ctx.lineTo(s*1.2,s*3);ctx.lineTo(-s*1.2,s*3);ctx.fill();}
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#1a0630';ctx.strokeStyle='#b06bff';ctx.lineWidth=Math.max(1,s*.05);ctx.beginPath();ctx.moveTo(-s,0);ctx.quadraticCurveTo(0,-s*.8,s,0);ctx.quadraticCurveTo(0,s*.8,-s,0);ctx.fill();ctx.stroke();
  const eg=ctx.createRadialGradient(0,0,0,0,0,s*.35);eg.addColorStop(0,'#fff');eg.addColorStop(.4,'#e080ff');eg.addColorStop(1,'#3a0a5a');ctx.fillStyle=eg;ctx.beginPath();ctx.arc(0,s*.05,s*.32,0,7);ctx.fill();ctx.fillStyle='#05030f';ctx.beginPath();ctx.arc(0,s*.1,s*.12,0,7);ctx.fill();ctx.restore();
}

// ---------- quadro ----------
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
let flakes=Array.from({length:90},(_,i)=>({x:Math.random(),y:Math.random(),s:.5+Math.random(),d:Math.random()*6}));
function render(dt){
  ctx.setTransform(DPR,0,0,DPR,0,0);if(!R){ctx.fillStyle='#05030f';ctx.fillRect(0,0,W,H);return;}
  const e=R.intro>0?ease(clamp(R.intro/2.2,0,1)):0, att=R.attract;
  camX+=((att?R.x*.5+Math.sin(R.t*.3)*1.2:R.x*.72)-camX)*Math.min(1,dt*8);
  const cyT=2.5+R.y*(R.pw.rocket>0?.92:.72)+e*9+(att?.6:0);camY+=(cyT-camY)*Math.min(1,dt*(e>0?30:7));camZo=e*16+(att?2:0);
  ctx.save();if(R.shake>0)ctx.translate((Math.random()-.5)*R.shake*18,(Math.random()-.5)*R.shake*12);
  drawSky();drawGround();
  const items=[];
  for(const o of R.scen)items.push([o.z,o.k==='bld'?drawBld:drawProp,o]);
  for(const o of R.objs)if(!o.gone)items.push([o.k==='train'?o.z+o.d:o.z,drawOb,o]);
  for(const c of R.coinsA)items.push([c.z,drawCoin,c]);
  for(const u of R.pups)items.push([u.z,drawPup,u]);
  items.push([0,drawPlayer,null]);
  if(ONL&&ONL.p&&!att){const pz=partnerZ();if(pz>-CAMZ+1&&pz<ZMAX)items.push([pz,drawPartner,pz]);}
  items.sort((a,b)=>b[0]-a[0]);
  for(const [z,f,o] of items){if(z>ZMAX+5)continue;f(o);}
  // partículas
  ctx.globalCompositeOperation='lighter';
  for(const q of R.parts){const p=P(q.x,q.y,q.z);if(!p)continue;const a=clamp(q.t/q.t0,0,1);
    if(q.ring){ctx.strokeStyle=`rgba(${q.col},${a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(.6-q.t),0,7);ctx.stroke();}
    else{ctx.globalAlpha=a;const r=Math.max(2,p.s*q.r*2);ctx.drawImage(glow(q.col),p.x-r,p.y-r,r*2,r*2);ctx.globalAlpha=1;}}
  ctx.globalCompositeOperation='source-over';
  if(!att&&(R.stumble>0||R.dead))drawNevoaChaser(R.dead?Math.min(1,R.dead*1.5):0);
  // neve e linhas de velocidade
  const B=BIO[R.bio];
  if(B.snow){ctx.fillStyle='rgba(255,255,255,.85)';for(const f of flakes){f.y+=dt*(.12+f.s*.1);f.x+=dt*Math.sin(R.t+f.d)*.03;if(f.y>1)f.y=0;const x=((f.x%1)+1)%1*W,y=f.y*H;ctx.beginPath();ctx.arc(x,y,f.s*1.6,0,7);ctx.fill();}}
  const v=R.pw.rocket>0?1:clamp((R.speed-24)/12,0,1);
  if(v>0&&!R.dead){ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(220,245,255,${.25*v})`;ctx.lineWidth=1.5;for(let i=0;i<18;i++){const a=hash(i,1)*6.283,r0=(.35+((R.t*1.8+hash(i,2))%1)*.6)*Math.max(W,H),r1=r0+60*v;ctx.beginPath();ctx.moveTo(W/2+Math.cos(a)*r0,HOR+Math.sin(a)*r0*.7);ctx.lineTo(W/2+Math.cos(a)*r1,HOR+Math.sin(a)*r1*.7);ctx.stroke();}ctx.globalCompositeOperation='source-over';}
  ctx.restore();
  // vinheta
  const vg=ctx.createRadialGradient(W/2,H*.55,Math.min(W,H)*.35,W/2,H*.55,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,R.stumble>0&&!R.dead?`rgba(255,20,60,${.35+.15*Math.sin(R.t*10)})`:'rgba(0,0,10,.45)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  if(R.flash>0){ctx.fillStyle=`rgba(${R.flashC},${R.flash})`;ctx.fillRect(0,0,W,H);}
  if(!att){hud();if(ONL)hudOnline();}
}
function drawPlayer(){
  const gy=supportY(), sp=P(R.x,gy,0);
  if(sp){const hgt=R.y-gy,a=clamp(1-hgt/4,.2,1);ctx.fillStyle=`rgba(0,0,0,${.35*a})`;ctx.beginPath();ctx.ellipse(sp.x,sp.y,sp.s*.55*a,sp.s*.14*a,0,0,7);ctx.fill();}
  const p=P(R.x,R.y,0);if(!p)return;
  if(R.shield>0||R.inv>0&&R.pw.rocket<=0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=R.shield>0?.55:.3;ctx.drawImage(glow('120,230,255'),p.x-p.s*1.3,p.y-p.s*2.3,p.s*2.6,p.s*2.6);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  if(R.pw.magnet>0){ctx.strokeStyle=`rgba(255,80,90,${.3+.2*Math.sin(R.t*8)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-p.s*.9,p.s*(1.1+.1*Math.sin(R.t*6)),0,7);ctx.stroke();}
  drawRunner(p.x,p.y,p.s,R.who,{ph:R.anim*2.2,t:R.t,air:!R.onGround&&R.pw.rocket<=0,slide:R.slide>0,rocket:R.pw.rocket>0,dead:R.dead,inv:R.inv>0&&!R.dead});
}
function supportY(){let gy=0;for(const o of R.objs){if(o.k!=='train'||Math.abs(o.x-R.x)>LANE*.55)continue;if(o.z<=.35&&o.z+o.d>=-.35)gy=Math.max(gy,R.y>=o.h-(o.ramp?1.2:.45)?o.h:0);else if(o.ramp&&o.z>.35&&o.z-4.2<=0)gy=Math.max(gy,o.h*(1-o.z/4.2));}return Math.min(gy,R.y);}
function hud(){
  const u=clamp(Math.min(W,H)/420,.8,1.6), O='Orbitron,"Exo 2",sans-serif', top=12*u, B=BIO[R.bio];
  ctx.textBaseline='middle';
  // pontos
  ctx.textAlign='left';ctx.font=`900 ${24*u}px ${O}`;ctx.shadowColor='#38e8ff';ctx.shadowBlur=14;ctx.fillStyle='#fff';ctx.fillText(Math.floor(R.score).toLocaleString('pt-BR'),14*u,top+14*u);ctx.shadowBlur=0;
  const mx=mult()*(R.pw.x2>0?2:1);ctx.font=`900 ${11*u}px ${O}`;const mt=`×${mx}`, mw=ctx.measureText(mt).width+14*u;ctx.fillStyle=R.pw.x2>0?'#ffd84a':'rgba(56,232,255,.25)';ctx.beginPath();ctx.roundRect?ctx.roundRect(14*u,top+30*u,mw,18*u,9*u):ctx.rect(14*u,top+30*u,mw,18*u);ctx.fill();
  ctx.fillStyle=R.pw.x2>0?'#2a1a00':'#bff4ff';ctx.fillText(mt,21*u,top+39.5*u);
  ctx.font=`700 ${10*u}px ${O}`;ctx.fillStyle='rgba(200,235,255,.85)';ctx.fillText(`${Math.floor(R.dist)} m`,14*u+mw+8*u,top+39.5*u);
  // moedas
  ctx.textAlign='right';ctx.font=`900 ${18*u}px ${O}`;ctx.fillStyle='#ffe27a';ctx.shadowColor='#ffb020';ctx.shadowBlur=10;ctx.fillText(`${R.coins} 🪙`,W-62*u,top+14*u);ctx.shadowBlur=0;
  // poderes ativos
  let px=14*u;const py=H-34*u;
  for(const [k,ic,col] of [['magnet','🧲','255,80,90'],['x2','2x','255,216,74'],['rocket','🚀','255,150,60'],['shoes','👟','120,255,170']]){if(R.pw[k]<=0)continue;const f=R.pw[k]/(dur(k)*(k==='magnet'&&CH[R.who].mag2?2:1)),r=18*u;
    ctx.fillStyle='rgba(6,8,30,.7)';ctx.beginPath();ctx.arc(px+r,py,r,0,7);ctx.fill();ctx.strokeStyle=`rgb(${col})`;ctx.lineWidth=3.5*u;ctx.beginPath();ctx.arc(px+r,py,r-2*u,-Math.PI/2,-Math.PI/2+f*6.283);ctx.stroke();
    ctx.textAlign='center';ctx.font=k==='x2'?`900 ${12*u}px ${O}`:`${16*u}px sans-serif`;ctx.fillStyle='#fff';ctx.fillText(ic,px+r,py+1);px+=r*2+8*u;}
  if(R.shield>0){ctx.textAlign='center';ctx.font=`${18*u}px sans-serif`;ctx.fillText('🛡️',px+16*u,py);}
  // nome da cidade nova
  ctx.textAlign='center';
  if(R.banT>0&&R.intro<=0){const a=clamp(Math.min(R.banT,4-R.banT)*2,0,1);ctx.globalAlpha=a;const y=H*.24;ctx.font=`700 ${10*u}px ${O}`;ctx.fillStyle='#bff4ff';ctx.fillText(R.dist<50?'PARTIDA':'BEM-VINDOS A',W/2,y-20*u);
    ctx.font=`900 ${24*u}px ${O}`;ctx.lineWidth=5;ctx.strokeStyle='rgba(5,3,20,.7)';ctx.strokeText(B.name.toUpperCase(),W/2,y+4*u);ctx.shadowColor=`rgb(${B.edge})`;ctx.shadowBlur=18;ctx.fillStyle='#fff';ctx.fillText(B.name.toUpperCase(),W/2,y+4*u);ctx.shadowBlur=0;
    const lw=Math.min(W*.8,300*u)*clamp((4-R.banT)*1.5,0,1);ctx.fillStyle=`rgb(${B.edge})`;ctx.fillRect(W/2-lw/2,y+22*u,lw,2*u);ctx.globalAlpha=1;}
  // contagem
  if(R.intro>0&&R.intro<1.65){const c=Math.ceil(R.intro/.55), f=(R.intro%.55)/.55, txt=c>0?String(c):'CORRE!';ctx.save();ctx.translate(W/2,H*.42);const s=1+f*.8;ctx.scale(s,s);ctx.globalAlpha=Math.min(1,f*2+.2);
    ctx.font=`900 ${(c>0?64:40)*u}px ${O}`;ctx.lineWidth=8;ctx.strokeStyle='rgba(5,3,20,.8)';ctx.strokeText(txt,0,0);ctx.shadowColor=c>0?'#38e8ff':'#ffd84a';ctx.shadowBlur=24;ctx.fillStyle='#fff';ctx.fillText(txt,0,0);ctx.restore();}
  if(R.intro<=0&&R.intro>-.6){const f=-R.intro/.6;ctx.save();ctx.translate(W/2,H*.42);ctx.scale(1+f*1.5,1+f*1.5);ctx.globalAlpha=1-f;ctx.font=`900 ${40*u}px ${O}`;ctx.shadowColor='#ffd84a';ctx.shadowBlur=24;ctx.fillStyle='#fff';ctx.fillText('CORRE!',0,0);ctx.restore();}
  // textos
  R.texts.forEach((q,i)=>{const a=clamp(q.life*2,0,1), y=H*.34-(1.1-q.life)*30*u-i*26*u;ctx.globalAlpha=a;ctx.font=`900 ${16*u}px ${O}`;ctx.lineWidth=4;ctx.strokeStyle='rgba(5,3,20,.8)';ctx.strokeText(q.t,W/2,y);ctx.fillStyle=`rgb(${q.col})`;ctx.fillText(q.t,W/2,y);ctx.globalAlpha=1;});
  if(R.stumble>0&&!R.dead){ctx.font=`900 ${11*u}px ${O}`;ctx.fillStyle='#ff6080';ctx.fillText('A NÉVOA ESTÁ PERTO! NÃO TROPECE DE NOVO!',W/2,H-16*u);}
}

// ---------- telas ----------
function panel(html,btns,opt={}){
  ov.className='ov'+(opt.dim===false?'':' dim');ov.id=opt.id||'ov';
  ov.innerHTML=(opt.raw?html:`<div class="card ${opt.wide?'wide':''}">${html}${btnsHTML(btns)}</div>`);ov.hidden=false;bindBtns(btns);
}
function btnsHTML(btns){return (btns||[]).map((b,i)=>b.row?`<div class="row">${b.row.map((c,j)=>`<button class="btn ${c.cls||''}" data-i="${i}-${j}" ${c.dis?'disabled':''}>${c.t}</button>`).join('')}</div>`:`<button class="btn ${b.cls||''}" data-i="${i}" ${b.dis?'disabled':''}>${b.t}</button>`).join('');}
function bindBtns(btns){ov.querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{audio();sfx('ui');const [i,j]=el.dataset.i.split('-');const b=j!==undefined?btns[i].row[j]:btns[i];b.go();});}
function title(){
  mode='title';pauseBtn.hidden=true;if(!R||!R.attract||R.who!==store.char)newRun(true);music.start();music.bio=0;
  const allDone=store.missions.every(m=>m.done);
  const btns=[{t:'▶ CORRER',cls:'play',go:startRun},{t:'🌐 Correr online com alguém',cls:'pink',go:onlineMenu},{row:[{t:'👥 Personagens',cls:'alt',go:chars},{t:'🛒 Loja',cls:'alt',go:shop},{t:`🎯 Missões${allDone?' ✨':''}`,cls:'alt',go:missions}]},
    {row:[{t:'❔ Como jogar',cls:'alt',go:howTo},{t:store.mute?'🔇 Som':'🔊 Som',cls:'alt',go:()=>{store.mute=!store.mute;save();if(MASTER)MASTER.gain.value=store.mute?0:.8;title();}},{t:'⬅ Galáxia da Gabi',cls:'alt',go:()=>{location.href='index.html';}}]}];
  panel(`<div class="logo"><div class="l1">CORRIDA</div><div class="l2">NEON</div><div class="l3">Fuja da NÉVOA pelas cidades da família</div></div>
    <div class="menu"><div class="stats"><span class="chip">🏆 <b>${store.best.toLocaleString('pt-BR')}</b></span><span class="chip">🪙 <b>${store.coins.toLocaleString('pt-BR')}</b></span><span class="chip">✖ <b>${mult()}</b></span><span class="chip" style="border-color:${CH[store.char].hex}">${CH[store.char].nome}</span></div>${btnsHTML(btns)}</div>`,btns,{raw:1,dim:false,id:'title'});
  ov.style.background='linear-gradient(rgba(3,2,14,.55),transparent 35%,transparent 55%,rgba(3,2,14,.75))';
}
function chars(){
  const html=`<h2>Escolha quem vai correr</h2><div class="chars">${CAST.map(w=>`<button class="ch ${w===store.char?'sel':''}" data-w="${w}" style="--c:${CH[w].hex}">${avatar(w)}<b>${CH[w].nome.toUpperCase()}</b><small>${CH[w].perk}</small></button>`).join('')}</div>`;
  panel(html,[{t:'✔ Pronto',go:title}],{wide:1});ov.style.background='';
  ov.querySelectorAll('.ch').forEach(el=>el.onclick=()=>{audio();sfx('power');store.char=el.dataset.w;save();newRun(true);chars();});
}
function shop(){
  const items=SHOP.map(s=>{const lv=store.up[s.id],max=lv>=5,price=PRICE[lv];return`<div class="item"><div class="ic">${s.ic}</div><div class="tx"><b>${s.n}</b><small>${s.d}: ${dur(s.id).toFixed(0)} s</small><div class="lv">${[0,1,2,3,4].map(i=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div></div>
    <button class="btn" data-buy="${s.id}" ${max||store.coins<price?'disabled':''}>${max?'MÁX':`${price} 🪙`}</button></div>`}).join('');
  panel(`<h2>🛒 Loja</h2><p style="text-align:center">Você tem <b style="color:#ffd84a">${store.coins.toLocaleString('pt-BR')} 🪙</b></p>${items}
    <div class="item"><div class="ic">🛡️</div><div class="tx"><b>Escudo inicial</b><small>Começa a próxima corrida protegida (tem ${store.shields})</small></div><button class="btn" data-buy="shield" ${store.coins<400?'disabled':''}>400 🪙</button></div>`,[{t:'⬅ Voltar',cls:'alt',go:title}]);ov.style.background='';
  ov.querySelectorAll('[data-buy]').forEach(el=>el.onclick=()=>{const id=el.dataset.buy;audio();
    if(id==='shield'){if(store.coins>=400){store.coins-=400;store.shields++;}}else{const p=PRICE[store.up[id]];if(store.coins>=p&&store.up[id]<5){store.coins-=p;store.up[id]++;}}sfx('power');save();shop();});
}
function missions(){
  const all=store.missions.every(m=>m.done);
  const list=store.missions.map(m=>`<div class="item"><div class="ic">${m.done?'✅':'🎯'}</div><div class="tx"><b class="${m.done?'done':''}">${missText(m)}</b><div class="bar"><i style="width:${Math.min(100,m.p/m.n*100)}%"></i></div><small>${Math.min(m.p,m.n).toLocaleString('pt-BR')} / ${m.n.toLocaleString('pt-BR')}</small></div></div>`).join('');
  panel(`<h2>🎯 Missões</h2><p style="text-align:center">Complete as 3 para o multiplicador de pontos subir.<br>Multiplicador atual: <b style="color:#ffd84a">×${mult()}</b></p>${list}`,
    [all?{t:`✨ Subir para ×${mult()+1} e ganhar novas missões`,cls:'pink',go:()=>{store.level++;newMissions();for(const m of store.missions)m.base=store.stats[m.id]||0;save();sfx('mission');missions();}}:null,{t:'⬅ Voltar',cls:'alt',go:title}].filter(Boolean));ov.style.background='';
}
function howTo(){panel(`<h2>Como jogar</h2>
  <p>👆 <b>Deslize o dedo</b>: para os lados troca de faixa, para cima pula, para baixo desliza. Um toque rápido também pula.</p>
  <p>⌨️ No computador: <b>setas</b> ou <b>W A S D</b>, Espaço pula, P pausa.</p>
  <p>🚧 Pule as barreiras, deslize por baixo das barras rosa e desvie dos veículos. Veículos com rampa amarela dá para subir e correr em cima!</p>
  <p>⚠️ Se bater de lado, você tropeça e a NÉVOA chega perto. Tropeçou duas vezes seguidas? Ela pega você.</p>
  <p>⚡ Poderes: 🧲 ímã, ✖️ pontos em dobro, 🚀 mochila-foguete, 👟 tênis de mola e 🛡️ escudo.</p>
  <p>🎯 Complete missões para o multiplicador subir e gaste moedas na loja.</p>`,[{t:'Entendi!',go:title}]);ov.style.background='';}
function storyThenRun(){
  const hero=store.char==='ana'?'gabi':store.char;
  const L=[{w:'nevoa',t:'Vocês acenderam as estrelas... mas eu voltei. Agora vou apagar as CORES do mundo!'},{w:'ana',t:'Ela está vindo atrás de nós! Corre pelas cidades da família e pega todas as moedas de luz!'},{w:hero,t:'Do Sertão de Solonópole até a Cidade Neon. Ninguém pega a gente!'}];
  let i=0;const show=()=>{if(i>=L.length){store.seenStory=true;save();return startRun();}const l=L[i++],c=l.w==='nevoa'?'#b06bff':CH[l.w].hex,nm=l.w==='nevoa'?'NÉVOA':CH[l.w].nome.toUpperCase();
    let tx=l.t;if(l.w==='ilo')tx=`Au au! 🐾 <i style="opacity:.75">(${tx})</i>`;
    panel(`<div class="say" style="--c:${c}">${avatar(l.w)}<div><div class="nm">${nm}</div><div class="tx">${tx}</div></div></div>`,[{row:[{t:'Continuar ▶',go:show},{t:'Pular ⏭',cls:'alt',go:()=>{i=L.length;show();}}]}]);ov.style.background='';};
  show();
}
function startRun(){
  if(!store.seenStory)return storyThenRun();
  for(const m of store.missions)if(m.base===undefined)m.base=store.stats[m.id]||0;
  newRun(false);mode='run';ov.hidden=true;pauseBtn.hidden=false;act.length=0;music.bio=0;music.start();
}
function gameOver(){
  if(ONL)return gameOverOnline();
  mode='dead';pauseBtn.hidden=true;const gain=R.coins-(R.banked||0);R.banked=R.coins;store.coins+=gain;
  const rec=R.score>store.best;if(rec)store.best=Math.floor(R.score);store.bestDist=Math.max(store.bestDist,Math.floor(R.dist));save();
  const cost=500*(R.revived+1), canRev=R.revived<2&&store.coins>=cost;
  const why={train:'Bateu num veículo!',barrier:'Tropeçou na barreira!',bar:'Bateu na barra!',drone:'Um drone da NÉVOA pegou você!',caught:'A NÉVOA alcançou você!'}[R.why]||'Fim da corrida!';
  panel(`<h2>${why}</h2>${rec?'<p style="text-align:center;color:#ffd84a;font-family:Orbitron;font-weight:900">🏆 NOVO RECORDE!</p>':''}<div class="big">${Math.floor(R.score).toLocaleString('pt-BR')}</div>
    <div class="grid2"><div class="stat"><small>DISTÂNCIA</small><b>${Math.floor(R.dist)} m</b></div><div class="stat"><small>MOEDAS</small><b>🪙 ${R.coins}</b></div><div class="stat"><small>RECORDE</small><b>${store.best.toLocaleString('pt-BR')}</b></div><div class="stat"><small>CHEGOU EM</small><b style="font-size:.8rem">${BIO[R.bio].name}</b></div></div>
    ${store.missions.map(m=>`<div class="muted">${m.done?'✅':'▫️'} ${missText(m)} — ${Math.min(m.p,m.n).toLocaleString('pt-BR')}/${m.n.toLocaleString('pt-BR')}</div>`).join('')}`,
    [canRev?{t:`💫 Continuar daqui (${cost} 🪙)`,cls:'pink',go:()=>revive(cost)}:null,{t:'↻ Correr de novo',go:startRun},{row:[{t:'🛒 Loja',cls:'alt',go:shop},{t:'Menu',cls:'alt',go:title}]}].filter(Boolean));ov.style.background='';
}
function revive(cost){store.coins-=cost;save();R.revived++;R.dead=0;R.goShown=false;R.inv=2.5;R.stumble=0;R.y=0;R.vy=0;R.objs=R.objs.filter(o=>o.z>35);R.speed=Math.min(38,15+R.dist*.0062);mode='run';ov.hidden=true;pauseBtn.hidden=false;music.start();act.length=0;}
function togglePause(){if(ONL){if(mode==='run')panel('<h2>Corrida online</h2><p class="muted">No modo online a corrida não para.</p>',[{t:'▶ Voltar',go:()=>{ov.hidden=true;}},{t:'Sair da corrida',cls:'alt',go:leaveOnline}]);return;}if(mode==='run'){mode='pause';panel('<h2>Pausa</h2>',[{t:'▶ Continuar',go:()=>{mode='run';ov.hidden=true;}},{t:'Sair para o menu',cls:'alt',go:()=>{title();}}]);ov.style.background='';}else if(mode==='pause'){mode='run';ov.hidden=true;}}
pauseBtn.onclick=togglePause;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='run')togglePause();});

// ---------- online: as duas correm na mesma pista, cada uma no seu celular ----------
let ONL=null;
const NET={peer:null,conn:null,role:null,
  cfg(){const q=new URLSearchParams(location.search).get('peer');if(q){const [h,p]=q.split(':');return{host:h,port:+p||9000,path:'/',secure:false,debug:0};}return{debug:0};},
  send(m){if(this.conn&&this.conn.open)try{this.conn.send(m)}catch(e){}},
  close(){const p=this.peer;this.role=null;this.conn=null;this.peer=null;try{p&&p.destroy()}catch(e){}},
  err(e){return({network:'Sem conexão com a internet.','server-error':'O servidor de salas não respondeu. Tente de novo.','browser-incompatible':'Este navegador não suporta o modo online.'})[e&&e.type]||'Não consegui conectar. Tente de novo.';},
  host(onCode,onJoin,onErr){
    if(!window.Peer)return onErr('O modo online precisa de internet.');
    const code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');
    this.role='host';const peer=this.peer=new Peer('corridaneon-'+code.toLowerCase(),this.cfg());
    peer.on('open',()=>onCode(code));
    peer.on('error',e=>{if(peer!==this.peer)return;if(e.type==='unavailable-id'){this.close();this.host(onCode,onJoin,onErr);}else if(!this.conn)onErr(this.err(e));});
    peer.on('disconnected',()=>{if(peer===this.peer&&!peer.destroyed)try{peer.reconnect()}catch(e){}});
    peer.on('connection',c=>{if(this.conn){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),500);});return;}
      this.conn=c;this.onHello=onJoin;c.on('data',onNet);c.on('close',()=>{if(this.conn===c)netLost();});c.on('error',()=>{if(this.conn===c)netLost();});});
  },
  join(code,onOk,onErr){
    if(!window.Peer)return onErr('O modo online precisa de internet.');
    this.role='guest';const peer=this.peer=new Peer(this.cfg());let done=false;
    const to=setTimeout(()=>{if(!done&&peer===this.peer){done=true;this.close();onErr('Não consegui conectar. Confira o código e a internet das duas.');}},20000);
    peer.on('open',()=>{const c=this.conn=peer.connect('corridaneon-'+code.toLowerCase(),{reliable:true});
      c.on('open',()=>{done=true;clearTimeout(to);onOk();});c.on('data',onNet);c.on('close',()=>{if(this.conn===c)netLost();});});
    peer.on('error',e=>{if(done||peer!==this.peer)return;done=true;clearTimeout(to);this.close();onErr(e.type==='peer-unavailable'?'Sala não encontrada. Confira o código.':this.err(e));});
  },
};
function onlineMenu(){
  panel(`<h2>🌐 Correr online</h2><p>Vocês duas correm <b>ao mesmo tempo e na mesma pista</b>, cada uma no seu celular, até em países diferentes! Você vê a outra correndo do seu lado. No fim, ganha quem fizer mais pontos.</p><p class="muted">Uma cria a sala e manda o código de 4 letras para a outra. As duas precisam de internet. Você vai correr como <b>${CH[store.char].nome}</b> (troque em Personagens).</p>`,
    [{t:'➕ Criar sala',go:hostWait},{t:'🔑 Entrar com código',cls:'pink',go:joinScreen},{t:'⬅ Voltar',cls:'alt',go:title}]);ov.style.background='';
}
function hostWait(){
  panel(`<h2>Criando sala...</h2><p>Conectando ao servidor...</p>`,[{t:'Cancelar',cls:'alt',go:leaveOnline}]);ov.style.background='';
  NET.host(code=>{panel(`<h2>Sala criada!</h2><p style="text-align:center">Mande este código para quem vai correr com você:</p><div class="big" style="letter-spacing:10px">${code}</div><p style="text-align:center" class="muted">Esperando a outra pessoa entrar...</p>`,[{t:'Cancelar',cls:'alt',go:leaveOnline}]);ov.style.background='';},
    who=>{ONL={role:'host',pwho:CH[who]?who:'gabi',p:null,ready:{me:false,them:false},results:null};sfx('power');startOnline(newSeed());},
    e=>{panel(`<h2>Ops!</h2><p>${e}</p>`,[{t:'Tentar de novo',go:hostWait},{t:'Menu',cls:'alt',go:leaveOnline}]);ov.style.background='';});
}
function joinScreen(){
  panel(`<h2>Digite o código da sala</h2><input id="cin" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" style="font-family:Orbitron,sans-serif;font-size:2rem;letter-spacing:10px;text-transform:uppercase;text-align:center;width:100%;padding:10px;border-radius:12px;border:1px solid #38e8ff;background:rgba(0,0,0,.35);color:#fff;outline:none"><p class="muted" id="er"></p>`,
    [{t:'Entrar',cls:'pink',go:()=>{const code=ov.querySelector('#cin').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==4){ov.querySelector('#er').textContent='O código tem 4 letras.';return;}
      panel(`<h2>Entrando na sala ${code}...</h2><p>Conectando...</p>`,[{t:'Cancelar',cls:'alt',go:leaveOnline}]);ov.style.background='';
      NET.join(code,()=>{ONL={role:'guest',pwho:'gabi',p:null,ready:{me:false,them:false},results:null};NET.send({t:'hello',who:store.char});panel(`<h2>Conectada! ✔</h2><p>A corrida já vai começar...</p>`,[]);ov.style.background='';},
        e=>{panel(`<h2>Ops!</h2><p>${e}</p>`,[{t:'Tentar de novo',go:joinScreen},{t:'Menu',cls:'alt',go:leaveOnline}]);ov.style.background='';});}},
     {t:'⬅ Voltar',cls:'alt',go:onlineMenu}]);ov.style.background='';
  const inp=ov.querySelector('#cin');setTimeout(()=>inp.focus(),100);inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')ov.querySelector('[data-i="0"]').click();});
}
const newSeed=()=>Math.random()*1e9|0;
function startOnline(seed){
  if(ONL.role==='host')NET.send({t:'start',seed,who:store.char});
  ONL.p=null;ONL.ready={me:false,them:false};ONL.results=null;ONL.sendT=0;
  newRun(false,seed);mode='run';ov.hidden=true;pauseBtn.hidden=false;act.length=0;music.bio=0;music.start();
}
function onNet(d){
  if(!d||typeof d!=='object')return;
  if(d.t==='hello'&&NET.role==='host'&&NET.onHello){const f=NET.onHello;NET.onHello=null;f(d.who);return;}
  if(!ONL)return;
  if(d.t==='start'){ONL.pwho=CH[d.who]?d.who:'ana';startOnline(d.seed);}
  else if(d.t==='p'){ONL.p={...d,at:performance.now()};}
  else if(d.t==='again'){ONL.ready.them=true;tryRematch();}
  else if(d.t==='full'){leaveOnline();panel(`<h2>Sala cheia</h2><p>Essa sala já tem duas pessoas.</p>`,[{t:'Voltar',go:title}]);ov.style.background='';}
  else if(d.t==='bye')netLost();
}
function netLost(){if(!ONL)return;const was=ONL;ONL=null;NET.close();
  if(mode==='run'){toast('📡 A outra pessoa saiu. Continue correndo!');}
  else{panel(`<h2>📡 A conexão caiu</h2><p>A outra pessoa saiu ou a internet falhou.</p>`,[{t:'Voltar ao menu',go:title}]);ov.style.background='';}}
function leaveOnline(){if(NET.conn)NET.send({t:'bye'});setTimeout(()=>NET.close(),150);ONL=null;title();}
function partnerZ(){const p=ONL.p;if(!p)return 1e9;const pd=p.dead?p.d:p.d+p.sp*Math.min(.3,(performance.now()-p.at)/1000);return pd-R.dist;}
function drawPartner(pz){
  const q=ONL.p, p=P(q.x,q.y,pz);if(!p)return;const C=CH[ONL.pwho];
  ctx.save();ctx.globalAlpha=.62;drawRunner(p.x,p.y,p.s,ONL.pwho,{ph:R.anim*2.2+1.3,t:R.t,air:!q.g&&!q.r,slide:q.sl,rocket:q.r,dead:q.dead?1:0});ctx.restore();
  const ty=p.y-p.s*(C.small?1.35:2.05);ctx.font=`900 ${clamp(p.s*.3,9,16)}px Orbitron,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,3,20,.85)';ctx.strokeText(C.nome.toUpperCase(),p.x,ty);ctx.fillStyle=C.hex;ctx.fillText(C.nome.toUpperCase(),p.x,ty);
}
function hudOnline(){
  if(!ONL)return;const u=clamp(Math.min(W,H)/420,.8,1.6), O='Orbitron,"Exo 2",sans-serif', q=ONL.p, C=CH[ONL.pwho], me=CH[R.who];
  // envia a posição ~15 vezes por segundo
  ONL.sendT-=1/60;if(ONL.sendT<=0){ONL.sendT=1/15;NET.send({t:'p',d:Math.round(R.dist*100)/100,x:Math.round(R.x*100)/100,y:Math.round(R.y*100)/100,sl:R.slide>0,r:R.pw.rocket>0,g:R.onGround,sp:R.dead?0:R.speed,sc:Math.floor(R.score),c:R.coins,dead:!!R.dead});}
  const y=H-14*u;ctx.textBaseline='middle';ctx.textAlign='center';ctx.font=`700 ${10*u}px ${O}`;
  if(!q){ctx.fillStyle='#bff4ff';ctx.fillText('Esperando a outra pessoa...',W/2,y);return;}
  const diff=Math.round(partnerZ());
  const txt=q.dead?`${C.nome}: caiu em ${Math.floor(q.d)} m · ${q.sc.toLocaleString('pt-BR')} pts`:diff>2?`${C.nome} está ${diff} m à frente ▲`:diff<-2?`${C.nome} está ${-diff} m atrás ▼`:`${C.nome} está do seu lado!`;
  ctx.lineWidth=4;ctx.strokeStyle='rgba(5,3,20,.8)';ctx.strokeText(txt,W/2,y);ctx.fillStyle=C.hex;ctx.fillText(txt,W/2,y);
  // placar ao vivo
  ctx.textAlign='right';ctx.font=`900 ${11*u}px ${O}`;ctx.fillStyle=C.hex;ctx.fillText(`${C.nome.split(' ')[0].toUpperCase()} ${q.sc.toLocaleString('pt-BR')}`,W-62*u,12*u+38*u);
}
function gameOverOnline(){
  mode='dead';pauseBtn.hidden=true;
  if(!R.banked){store.coins+=R.coins;R.banked=R.coins;if(R.score>store.best)store.best=Math.floor(R.score);store.bestDist=Math.max(store.bestDist,Math.floor(R.dist));save();}
  NET.send({t:'p',d:R.dist,x:R.x,y:R.y,sl:false,r:false,sp:0,sc:Math.floor(R.score),c:R.coins,dead:true});
  const q=ONL.p, C=CH[ONL.pwho], me=CH[R.who], mine=Math.floor(R.score);
  if(!q||!q.dead){
    panel(`<h2>Você caiu em ${Math.floor(R.dist)} m</h2><div class="big">${mine.toLocaleString('pt-BR')}</div><p style="text-align:center"><b style="color:${C.hex}">${C.nome}</b> ainda está correndo...<br><span id="live" class="muted"></span></p>`,[{t:'Sair',cls:'alt',go:leaveOnline}]);ov.style.background='';
    clearInterval(ONL.wt);ONL.wt=setInterval(()=>{if(!ONL){return;}const q2=ONL.p,el=document.getElementById('live');if(el&&q2)el.textContent=`${Math.floor(q2.d)} m · ${q2.sc.toLocaleString('pt-BR')} pontos`;if(q2&&q2.dead){clearInterval(ONL.wt);gameOverOnline();}},400);return;}
  clearInterval(ONL.wt);
  const theirs=q.sc, win=mine>theirs?'me':mine<theirs?'them':'tie';if(win==='me')sfx('mission');
  const card=(c,nm,sc,d,co,w)=>`<div class="stat" style="border-color:${c.hex};${w?`box-shadow:0 0 18px ${c.hex}`:''}">${avatar(nm)}<small style="color:${c.hex}">${c.nome.toUpperCase()}${w?' 🏆':''}</small><b>${sc.toLocaleString('pt-BR')}</b><div class="muted">${Math.floor(d)} m · 🪙 ${co}</div></div>`;
  panel(`<h2>${win==='me'?'🏆 Você venceu!':win==='them'?`🏆 ${C.nome} venceu!`:'🤝 Empate!'}</h2><div class="grid2">${card(me,R.who,mine,R.dist,R.coins,win==='me')}${card(C,ONL.pwho,theirs,q.d,q.c,win==='them')}</div>
    <p class="muted" style="text-align:center" id="rm">${ONL.ready.them?`${C.nome} quer revanche!`:''}</p>`,
    [{t:'↻ Revanche!',cls:'pink',go:()=>{ONL.ready.me=true;NET.send({t:'again'});document.getElementById('rm').textContent=`Esperando ${C.nome} aceitar a revanche...`;tryRematch();}},{t:'Sair',cls:'alt',go:leaveOnline}]);ov.style.background='';
  ov.querySelectorAll('.stat svg').forEach(e=>{e.style.width='54px';e.style.height='54px';e.style.borderRadius='12px';});
}
function tryRematch(){if(!ONL)return;if(mode==='dead'&&!ONL.ready.me){const el=document.getElementById('rm');if(el)el.textContent=`${CH[ONL.pwho].nome} quer revanche!`;}
  if(ONL.role==='host'&&ONL.ready.me&&ONL.ready.them)startOnline(newSeed());}

let last=0;
function loop(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(R&&(mode==='run'||mode==='title'||mode==='dead'))update(dt);music.tick();render(dt);requestAnimationFrame(loop);}
window.__run={get R(){return R},get ONL(){return ONL},get mode(){return mode},act,store,startRun,title,getPower:k=>getPower(k)};
title();requestAnimationFrame(loop);
})();
