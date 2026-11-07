/* Presentation consumes resolved events; it never changes an outcome. */
'use strict';
const $=id=>document.getElementById(id),A=window.ASSETS,M=window.CrimeMath;
const params=new URLSearchParams(location.search),replayOnly=params.get('replay')==='true'||params.get('isReplay')==='true';
let social=params.get('social')==='true',busy=false,turbo=false,muted=false,autoLeft=0,balance=1000,betIndex=4,displayWin=0,lastRound=null,lastAmount=1,preview=false,replaying=false,ac=null,roundCosmetic=M.rng(1),lastBoard=null;
const levels=[.01,.05,.1,.5,1,2,5,10,20],names={H1:'Pulp Hitman',H2:'Vengeance Bride',H3:'Vice Kingpin',H4:'Getaway Car',L1:'Cherry Milkshake',L2:'Police Handcuffs',L3:'Emerald Duffel',L4:'Royale Burger',WILD:'Briefcase Wild',SCATTER:'Siren Badge'};
const missionNames=['','The Reservoir Vault Job','Kill Mode Rampage','5-Star Helicopter Chase'];
const heatNames=['NO HEAT. NO WITNESSES.','STREET HEAT','GOLD 1911 DRIVE-BY','KATANA SLASH','BRIEFCASE DROP','MAXIMUM HEAT'];
const choose=key=>A[key][Math.floor(roundCosmetic()*A[key].length)];
const fmt=v=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6});
const wait=ms=>new Promise(r=>setTimeout(r,turbo?Math.max(100,ms*.35):ms));
const unit=()=>social?(params.get('currency')==='XGC'?'XGC':'XSC'):'TOKENS';
function tone(f=220,d=.08,type='sine',vol=.04){if(muted)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,ac.currentTime);o.frequency.exponentialRampToValueAtTime(f*.65,ac.currentTime+d);g.gain.setValueAtTime(vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d);}catch{}}
function status(text,accent=false){$('status').textContent=text;$('status').classList.toggle('accent',accent);}
function labels(){
 $('betLabel').textContent=social?'PLAY AMOUNT':'BET AMOUNT';$('lineLabel').textContent=social?'20 WIN LINES':'20 FIXED PAYLINES';
 $('social').textContent=`SOCIAL MODE: ${social?'ON':'OFF'}`;document.querySelectorAll('.unit').forEach(e=>e.textContent=unit());
 $('balance').textContent=fmt(balance);$('amount').textContent=fmt(levels[betIndex]);$('win').textContent=fmt(displayWin);
 $('editionText').textContent=(replayOnly||replaying)?'DEMO REPLAY':preview?'MISSION PREVIEW':'PLAYABLE PROTOTYPE';
}
function setHeat(heat){$('stars').innerHTML=Array.from({length:5},(_,i)=>`<span class="star ${i<heat?'lit':''}">★</span>`).join('');$('wanted');$('heatMultiplier').textContent=`${heat===5?5:heat?2:1}× HEAT`;$('stars').parentElement.setAttribute('aria-label',`${heat} of 5 wanted stars`);$('heatName').textContent=heatNames[heat];}
let bgMode=0,bgPortrait=null;
function background(tier=0,force=false){const portrait=matchMedia('(orientation:portrait)').matches;if(tier===bgMode&&portrait===bgPortrait&&!force)return;bgMode=tier;bgPortrait=portrait;
 const files=tier===3?(portrait?A.chaseMobile:A.chase):tier?A.vault:(portrait?A.bgMobile:A.bg);
 $('world').innerHTML=files.map((src,i)=>`<div class="layer" data-speed="${[4,9,16,24,32][i]}"><div class="layer-art"><img src="${src}" alt="">${i===3&&!tier?`<svg viewBox="0 0 ${portrait?'939 1676':'1675 939'}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><defs><pattern id="grille" width="7" height="4" patternUnits="userSpaceOnUse"><rect width="7" height="4" fill="#0d1018"/><path d="M0 0h7M0 0v4" stroke="#303442" stroke-width="1"/></pattern></defs><rect x="${portrait?190:948}" y="${portrait?1037:690}" width="${portrait?51:48}" height="${portrait?19:18}" fill="url(#grille)"/></svg>`:''}</div></div>`).join('');
}
addEventListener('pointermove',e=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;document.querySelectorAll('.layer').forEach(el=>{const n=Number(el.dataset.speed);el.style.transform=`translate(${x*n}px,${y*n*.45}px) scale(1.015)`;});});
addEventListener('resize',()=>background(bgMode));
const beamVariants={},stickyVariants={};
function render(e){if(!e.board)return;setHeat(e.heat);const changed=!lastBoard;const oldCells=[...$('reels').children];$('reels').innerHTML='';
 for(let c=0;c<5;c++)for(let row=0;row<3;row++){
  const s=e.board[c][row],idx=c*3+row,cell=document.createElement('div');cell.className='cell';cell.dataset.symbol=s;cell.dataset.c=c;cell.dataset.row=row;
  const old=oldCells[idx],src=!changed&&lastBoard[c][row]===s&&old?.querySelector('.symbol')?old.querySelector('.symbol').getAttribute('src'):choose(s);
  cell.innerHTML=`<img class="symbol" src="${src}" alt="${names[s]}">`;
  if(s==='WILD'||s==='SCATTER')cell.innerHTML+=`<img class="label" src="${A[s==='WILD'?'wildlabel':'scatterlabel'][0]}" alt="${s==='WILD'?'Wild':'Bonus'}">`;
  if(e.split?.[`${c},${row}`]){cell.classList.add('split');cell.innerHTML+=`<span class="split-tag">${e.split[`${c},${row}`]}× SPLIT</span>`;}
  if(e.expanded[c])cell.style.visibility='hidden';$('reels').appendChild(cell);
 }
 lastBoard=JSON.parse(JSON.stringify(e.board));$('expanded').innerHTML='';
 for(const [c,mult] of Object.entries(e.expanded)){
  beamVariants[c]??=choose('beam');stickyVariants[c]??=choose('sticky');const el=document.createElement('div');el.className='wild-reel';el.style.gridColumn=Number(c)+1;
  el.innerHTML=`<img class="beam" src="${beamVariants[c]}" alt="Expanded wild">${e.bonus?`<img class="chain" src="${stickyVariants[c]}" alt="Sticky">`:''}<div class="crest"><img src="${A.crest[0]}" alt=""><b>${mult}×</b></div><img class="wild-plaque" src="${A.wildlabel[0]}" alt="Wild">`;$('expanded').appendChild(el);
 }
}
function lock(locked){busy=locked;['minus','plus','features','social'].forEach(id=>$(id).disabled=locked||replayOnly);$('spin').disabled=locked;$('spin').classList.toggle('active',locked);$('replay').disabled=locked||!lastRound;$('autoplay').disabled=replayOnly;$('spinText').textContent=replayOnly?'REPLAY':locked?'RUNNING':'SPIN';}
function dialog(html){$('modalContent').innerHTML=html;$('modal').showModal();}
$('closeModal').onclick=()=>$('modal').close();$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').close();});
function rules(){const word=social?'Win lines':'Paylines';dialog(`<div class="eyebrow">THE CITY HANDBOOK</div><h1>${social?'Rules & win table':'Rules & paytable'}</h1><p class="notice">Playable concept · demo tokens only. RTP is not calibrated. No real currency or live server session is connected.</p><h2>20 ${word.toLowerCase()} · 5 reels · 3 rows</h2><p>Matching symbols start on the leftmost reel. Each line awards its single highest qualifying combination. Values below multiply the total base amount, with no division by 20. Wilds substitute for all ordinary symbols, never badges.</p><table><thead><tr><th>Symbol</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>${Object.entries(M.PAY).map(([k,v])=>`<tr><td>${names[k]}</td>${v.map(n=>`<td>${n?n.toFixed(2)+'×':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table><h2>Briefcases & crossfire</h2><p>In the base game, a briefcase expands only when a winning line uses its reel after expansion. In missions, every new briefcase expands and stays sticky. Multipliers: 2×, 3×, 4×, 5×, 10×, 15×, 20×, 25×, 50×, 100×. Helicopter Chase excludes 2×, 3× and 4×. With two or more expanded reels, each multiplier doubles once per spin, up to 200×. Participating reel multipliers add together; they do not multiply one another.</p><h2>Five stars of heat</h2><p>Each distinct winning line and each newly landed briefcase cell adds one star, up to five. Upgrades can create new lines and add more heat. Each threshold fires once when crossed: 1★ = 2× global; 2★ = 3–6 low symbols upgraded by gunfire; 3★ = katana split; 4★ = one 10×–100× expanded wild; 5★ = 5× global. The meter resets before every base round and persists only within a mission.</p><p>A katana can show two or three copies of a hit symbol. Following the brief's line formula, each split cell in the winning run contributes +0.5 to the line's split multiplier, regardless of the illustrated copy count. It does not create extra ways.</p><p><strong>Line result = base amount × table value × added wild multipliers × (1 + 0.5 × split cells) × heat multiplier.</strong></p><h2>Three missions</h2><ul><li>3 badges: Reservoir Vault Job, 10 free spins and sticky wilds.</li><li>4 badges: Kill Mode Rampage, 12 free spins, at least 3★ heat, katana every spin.</li><li>5 or more badges: Helicopter Chase, 12 free spins, 5★ heat and a guaranteed 10×–100× sticky wild.</li><li>Retriggers: 3 / 4 / 5+ badges add 4 / 6 / 8 spins, capped at 40 awarded spins per mission. Badges are counted on the original reveal, before expansions.</li><li>Five sticky reels finish the round at the 15,000× maximum. The cap includes all earlier wins in that round; it is not added on top.</li></ul><p>The Missions button opens free previews. Preview results do not change your balance. Feature entry prices have not been designed.</p><h2>${word}</h2><div class="line-map">${M.LINES.map((line,i)=>`<svg viewBox="0 0 100 65"><text x="5" y="10">${i+1}</text><polyline points="${line.map((r,c)=>`${10+c*20},${20+r*18}`).join(' ')}"/></svg>`).join('')}</div><h2>Controls</h2><p>Spin or Space starts one round. − / + changes the base amount. ϟ shortens animations. Autoplay requires confirmation and can be stopped at any time; the current round finishes. ♫ toggles synthesized sound effects. Replay Last Round repeats the exact recorded demo events without changing the balance. Social Mode switches interface wording and token labels. A round finishes before its result is added to the demo balance.</p><p>Demo balance and replay are stored only in this page session, except the last completed replay may be retained in this browser. Production server replay and real-wallet integration are not implemented.</p>`);}
$('info').onclick=rules;
function missions(){if(busy)return;dialog(`<div class="eyebrow">THREE ACTS. ONE CITY.</div><h1>Choose your mission</h1><p>Explore a complete bonus sequence. These previews are free and do not affect your demo balance.</p>${[1,2,3].map(t=>`<button class="mission-card" data-tier="${t}"><span class="stars-small">${'★'.repeat(t+2)}</span><strong>${missionNames[t]}</strong><small>${t===1?'10 free spins · sticky briefcases':t===2?'12 free spins · 3★ starting heat · katana every spin':'12 super spins · maximum heat · guaranteed sticky wild'}</small></button>`).join('')}`);document.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>confirmMission(Number(b.dataset.tier)));}
function confirmMission(t){dialogClose();dialog(`<div class="eyebrow">MISSION BRIEFING</div><h1>${missionNames[t]}</h1><p>Start a free mission preview? No tokens will be deducted, and preview wins will not be added to your balance.</p><div class="actions"><button class="primary" id="confirmMission">START PREVIEW</button><button class="secondary" id="cancelMission">CANCEL</button></div>`);$('confirmMission').onclick=()=>{dialogClose();start(t);};$('cancelMission').onclick=dialogClose;}
function dialogClose(){$('modal').close();}
$('features').onclick=missions;
$('minus').onclick=()=>{betIndex=Math.max(0,betIndex-1);labels();};$('plus').onclick=()=>{betIndex=Math.min(levels.length-1,betIndex+1);labels();};
$('turbo').onclick=()=>{turbo=!turbo;$('turbo').setAttribute('aria-pressed',String(turbo));$('turbo').setAttribute('aria-label',`Turbo ${turbo?'on':'off'}`);};
$('sound').onclick=()=>{muted=!muted;$('sound').setAttribute('aria-pressed',String(muted));$('sound').setAttribute('aria-label',`Sound ${muted?'off':'on'}`);$('sound').textContent=muted?'♪̸':'♫';if(!muted)tone(440);};
$('social').onclick=()=>{social=!social;labels();};
$('autoplay').onclick=()=>{if(autoLeft){autoLeft=0;$('autoplay').setAttribute('aria-pressed','false');status('Autoplay stopped. The current round will finish.');return;}if(busy||replayOnly)return;let selected=10;dialog(`<div class="eyebrow">AUTOPLAY</div><h1>Set your run</h1><p>Each round uses ${fmt(levels[betIndex])} ${unit()}. Stop at any time using the autoplay button. Play stops automatically if your balance is insufficient.</p><div class="auto-options">${[10,25,50].map(n=>`<button data-auto="${n}" class="${n===10?'selected':''}">${n}</button>`).join('')}</div><p id="autoCost">Maximum total cost: ${fmt(10*levels[betIndex])} ${unit()}.</p><div class="actions"><button id="confirmAuto" class="primary">CONFIRM AUTOPLAY</button><button id="cancelAuto" class="secondary">CANCEL</button></div>`);document.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.auto);document.querySelectorAll('[data-auto]').forEach(x=>x.classList.toggle('selected',x===b));$('autoCost').textContent=`Maximum total cost: ${fmt(selected*levels[betIndex])} ${unit()}.`;});$('cancelAuto').onclick=dialogClose;$('confirmAuto').onclick=()=>{dialogClose();autoLeft=selected;$('autoplay').setAttribute('aria-pressed','true');start();};};
function winLines(wins){$('lines').innerHTML=wins.slice(0,6).map(w=>`<polyline points="${w.rows.slice(0,w.count).map((r,c)=>`${50+c*100},${50+r*100}`).join(' ')}"/>`).join('');for(const w of wins)for(let c=0;c<w.count;c++)$('reels').children[c*3+w.rows[c]].classList.add('winner');}
async function counter(to){const from=displayWin,duration=turbo?220:500,start=performance.now();await new Promise(resolve=>{function step(now){const t=Math.min(1,(now-start)/duration);displayWin=from+(to-from)*(1-(1-t)**3);$('win').textContent=fmt(displayWin);if(t<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});displayWin=to;labels();}
function celebrate(title,value,sub){$('celebrateTitle').textContent=title;$('celebrateAmount').textContent=fmt(value);$('celebrateSub').textContent=sub;$('celebrateHero').src=A.hero[0];$('celebration').hidden=false;tone(587,.5,'triangle');return new Promise(resolve=>{$('continue').onclick=()=>{$('celebration').hidden=true;resolve();};if(autoLeft)setTimeout(()=>{if(!$('celebration').hidden){$('celebration').hidden=true;resolve();}},turbo?1100:2300);});}
async function play(round,amount,isReplay=false){
 roundCosmetic=M.rng(round.seed^0xF00D);lastBoard=null;Object.keys(beamVariants).forEach(k=>delete beamVariants[k]);Object.keys(stickyVariants).forEach(k=>delete stickyVariants[k]);$('frame').src=choose('frame');displayWin=0;labels();let tier=0;
 for(const e of round.events){
  if(e.type==='reveal'){
   background(e.tier||0);tier=e.tier||0;$('bonusProgress').hidden=!e.bonus;
   if(e.bonus){$('bonusCount').textContent=`${e.remaining+1} FREE SPINS REMAINING`;$('bonusTrack').style.width=`${Math.min(100,(e.remaining+1)/12*100)}%`;}
   $('lines').innerHTML='';$('effects').innerHTML='';$('reels').classList.add('spinning');tone(110,.18,'sawtooth',.018);status(e.bonus?`${missionNames[tier]} · Spin ${e.spin}`:'Cruising the neon strip…');
   await wait(620);render(e);$('reels').classList.remove('spinning');tone(180,.09);await wait(210);
  }else if(e.type==='expand'||e.type==='drop'){
   render(e);status(e.type==='drop'?`BRIEFCASE DROP · ${e.multiplier}×`:`BRIEFCASE OPEN · ${e.multiplier}×`,true);tone(330,.18,'triangle');await wait(650);
  }else if(e.type==='heat'){
   render(e);status(`${e.heat}★ WANTED · ${heatNames[e.heat]}`,true);tone(180+e.heat*75,.13,'triangle');await wait(420);
  }else if(e.type==='shots'){
   status('GOLD 1911 DRIVE-BY · Crew upgrade',true);for(const hit of e.hits){const im=document.createElement('img');im.className='impact';im.src=A.bullet[hit.variant];im.style.left=hit.c*20+'%';im.style.top=hit.row*100/3+'%';im.style.rotate=hit.rotation+'deg';$('effects').appendChild(im);tone(85,.09,'sawtooth',.07);await wait(110);}render(e);$('machine').classList.add('shake');await wait(450);$('machine').classList.remove('shake');$('effects').innerHTML='';
  }else if(e.type==='slash'){
   const im=document.createElement('img');im.className='slash-beam';im.src=A.slash[0];im.style.top=`${e.rows[2]*33.33+5}%`;$('effects').appendChild(im);status('KATANA SLASH · Symbols split',true);tone(780,.22,'sawtooth',.025);await wait(300);render(e);await wait(400);$('effects').innerHTML='';
  }else if(e.type==='ricochet'){
   render(e);$('expanded').classList.add('ricochet');status('MEXICAN STANDOFF · All briefcases double',true);tone(260,.3,'sawtooth',.03);await wait(800);$('expanded').classList.remove('ricochet');
  }else if(e.type==='win'){
   render(e);winLines(e.wins);if(e.awarded>0){tone(523,.18,'triangle');status(`${e.wins.length} ${social?'win lines':'winning lines'} · ${fmt(e.awarded*amount)} ${unit()}`,true);await counter(e.roundTotal*amount);await wait(700);}else{status('A quiet night. The next move is yours.');await wait(300);}
  }else if(e.type==='bonusStart'){
   background(e.tier);$('act').textContent=`ACT ${e.tier===3?'III':'II'} · ${missionNames[e.tier].toUpperCase()}`;status(`${e.remaining} FREE SPINS · ${missionNames[e.tier]}`,true);await celebrate('MISSION UNLOCKED',e.remaining,missionNames[e.tier].toUpperCase());
  }else if(e.type==='retrigger'){
   status(`MISSION EXTENDED · +${e.add} FREE SPINS`,true);await wait(1100);
  }else if(e.type==='complete'){
   $('bonusProgress').hidden=true;
   if(e.cap)await celebrate('MISSION PASSED!',e.total*amount,'15,000× MAX WIN · RESPECT +');
   else if(e.total>=20)await celebrate(e.total>=100?'LEGENDARY SCORE':'BIG SCORE',e.total*amount,`${fmt(e.total)}× · ${unit()}`);
  }
 }
 if(!isReplay&&!preview){balance=Math.round((balance+round.total*amount)*1e6)/1e6;}
 labels();status(`${isReplay?'Replay complete':preview?'Preview complete':round.total?'Round complete':'Round complete'}${round.total?' · '+fmt(round.total*amount)+' '+unit():''}${preview?' · Balance unchanged':''}`,round.total>0);
 lock(false);if(replayOnly)$('spinText').textContent='AGAIN';if(autoLeft&&!isReplay&&!preview){autoLeft--;if(autoLeft){await wait(1000);if(autoLeft)start();}else $('autoplay').setAttribute('aria-pressed','false');}
}
async function start(tier=0){if(busy||replayOnly)return;const amount=levels[betIndex];if(!tier&&balance<amount){autoLeft=0;status('Insufficient demo tokens. Select a smaller amount.');return;}
 replaying=false;preview=tier>0;if(!preview)balance=Math.round((balance-amount)*1e6)/1e6;else autoLeft=0;
 const seed=crypto.getRandomValues(new Uint32Array(1))[0],round=M.createRound({seed,tier});lastRound=round;lastAmount=amount;
 try{localStorage.setItem('crimecity-demo-replay-v1',JSON.stringify({round,amount}));}catch{}
 $('act').textContent='ACT I · STREETS OF VICE';$('winLabel').textContent=preview?'PREVIEW WIN':'ROUND WIN';background(0);lock(true);labels();await play(round,amount);
}
$('spin').onclick=()=>replayOnly?replay():start();
async function replay(){if(busy||!lastRound)return;autoLeft=0;preview=false;replaying=true;$('winLabel').textContent='REPLAY WIN';$('editionText').textContent='DEMO REPLAY';$('act').textContent='RECORDED ROUND · REPLAY';lock(true);await play(lastRound,lastAmount,true);}
$('replay').onclick=replay;
addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!$('modal').open&&$('celebration').hidden&&!(e.target instanceof HTMLButtonElement)&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();if(!busy)(replayOnly?replay():start());}});
async function init(){
 $('logo').src=A.logo[0];$('frame').src=A.frame[0];background(0,true);setHeat(0);labels();
 const initial=[['H1','L1','L4'],['L2','H2','L3'],['H3','WILD','L1'],['L3','H4','L2'],['SCATTER','L4','H1']];render({board:initial,heat:0,expanded:{},split:{}});
 const urls=Object.values(A).flat();let loaded=0,failed=0;await Promise.all(urls.map(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>{loaded++;$('loadBar').style.width=loaded/urls.length*100+'%';resolve();};im.onerror=()=>{loaded++;failed++;resolve();};im.src=src;})));
 if(replayOnly){try{const saved=JSON.parse(localStorage.getItem('crimecity-demo-replay-v1'));if(saved?.round?.version===1){lastRound=saved.round;lastAmount=saved.amount;}}catch{}status(lastRound?'Recorded demo round ready. Press Replay.':'No recorded demo round is available in this browser.');$('features').disabled=true;$('minus').disabled=true;$('plus').disabled=true;$('autoplay').disabled=true;$('social').disabled=true;$('spinText').textContent='REPLAY';$('spin').disabled=!lastRound;$('replay').hidden=true;}else $('replay').disabled=true;
 if(params.has('rgs_url')||params.has('sessionID')){lock(true);$('autoplay').disabled=true;status('Prototype only: live server sessions and server replay are not connected.');}
 if(failed)status(`${failed} artwork files could not load. Reload to try again.`);
 $('loading').style.opacity=0;setTimeout(()=>$('loading').hidden=true,500);
}
init();
