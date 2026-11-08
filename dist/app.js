/* Presentation consumes resolved events; it never changes an outcome. */
'use strict';
const $=id=>document.getElementById(id),A=window.ASSETS,M=window.CrimeMath,FX=window.CrimeFX;
const params=new URLSearchParams(location.search),replayOnly=params.get('replay')==='true'||params.get('isReplay')==='true';
let social=params.get('social')==='true',busy=false,turbo=false,muted=false,autoLeft=0,balance=1000,betIndex=4,displayWin=0,lastRound=null,lastAmount=1,preview=false,replaying=false,roundCosmetic=M.rng(1),lastBoard=null,cancelPreview=false;
const levels=[.01,.05,.1,.5,1,2,5,10,20],names={H1:'Pulp Hitman',H2:'Vengeance Bride',H3:'Vice Kingpin',H4:'Getaway Car',L1:'Cherry Milkshake',L2:'Police Handcuffs',L3:'Emerald Duffel',L4:'Royale Burger',WILD:'Briefcase Wild',SCATTER:'Siren Badge'};
const missionNames=['','The Vault Job','Neon Rampage','Midnight Pursuit'];
const missionPerks=['','10 FREE SPINS · BRIEFCASES STAY LOCKED','12 FREE SPINS · CLEAN CUT EVERY SPIN','12 FREE SPINS · 5★ HEAT + A LOCKED BRIEFCASE'];
const heatNames=['NO HEAT. NO WITNESSES.','STREET HEAT','GOLD 1911 DRIVE-BY','CLEAN CUT','BRIEFCASE DROP','MAXIMUM HEAT'];
const choose=key=>A[key][Math.floor(roundCosmetic()*A[key].length)];
const fmt=v=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6});
const wait=ms=>new Promise(r=>setTimeout(r,turbo?Math.max(100,ms*.35):ms));
const unit=()=>social?(params.get('currency')==='XGC'?'XGC':'XSC'):'TOKENS';
const tone=(...args)=>FX.tone(...args);
function status(text,accent=false){$('status').textContent=text;$('status').classList.toggle('accent',accent);}
function labels(){
 $('betLabel').textContent=social?'PLAY AMOUNT':'BET AMOUNT';$('lineLabel').textContent=social?'20 WIN LINES':'20 FIXED PAYLINES';
 $('social').textContent=`SOCIAL MODE: ${social?'ON':'OFF'}`;document.querySelectorAll('.unit').forEach(e=>e.textContent=unit());
 $('balance').textContent=fmt(balance);$('amount').textContent=fmt(levels[betIndex]);$('win').textContent=fmt(displayWin);['balance','win'].forEach(id=>$(id).style.setProperty('--digits',$(id).textContent.length));
 $('editionText').textContent=(replayOnly||replaying)?'DEMO REPLAY':preview?(lastRound?.showcase?'KATANA STUDY':'MISSION PREVIEW'):'PLAYABLE PROTOTYPE';
}
let displayedHeat=-1;
function setHeat(heat){
 if(heat===displayedHeat)return;const previous=displayedHeat;displayedHeat=heat;
 $('stars').innerHTML=Array.from({length:5},(_,i)=>`<span class="star ${i<heat?'lit':''} ${i>=previous&&i<heat&&previous>=0?'ignited':''}">★</span>`).join('');
 $('heatMultiplier').textContent=`${heat===5?5:heat?2:1}× HEAT`;$('stars').parentElement.setAttribute('aria-label',`${heat} of 5 wanted stars`);$('heatName').textContent=heatNames[heat];
 if(heat>previous&&previous>=0){FX.burst($('stars'),8+heat*3);FX.pulse('cyan');}
}
let bgMode=0,bgPortrait=null;
function background(tier=0,force=false){const portrait=matchMedia('(orientation:portrait)').matches;if(tier===bgMode&&portrait===bgPortrait&&!force)return;bgMode=tier;bgPortrait=portrait;
 document.body.dataset.mission=tier;
 const files=tier===3?(portrait?A.chaseMobile:A.chase):tier===1?A.vault:(portrait?A.bgMobile:A.bg);
 $('world').innerHTML=files.map((src,i)=>`<div class="layer" data-depth="${files.length===1?26:[8,24,50,85,140][i]}"><div class="layer-art"><img src="${src}" alt="">${i===3&&(tier===0||tier===2)?`<svg viewBox="0 0 ${portrait?'939 1676':'1675 939'}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><defs><pattern id="grille" width="7" height="4" patternUnits="userSpaceOnUse"><rect width="7" height="4" fill="#0d1018"/><path d="M0 0h7M0 0v4" stroke="#303442" stroke-width="1"/></pattern></defs><rect x="${portrait?190:948}" y="${portrait?1037:690}" width="${portrait?51:48}" height="${portrait?19:18}" fill="url(#grille)"/></svg>`:''}</div></div>`).join('');
 FX.refreshScene();
}

addEventListener('resize',()=>background(bgMode));
const beamVariants={},stickyVariants={};
function render(e){
 if(!e.board)return;setHeat(e.heat);const reels=$('reels');
 if(!reels.children.length){
  const fragment=document.createDocumentFragment();
  for(let c=0;c<5;c++)for(let row=0;row<3;row++){
   const cell=document.createElement('div');cell.className='cell';cell.dataset.c=c;cell.dataset.row=row;
   const img=document.createElement('img');img.className='symbol';img.decoding='async';cell.append(img);
   const label=document.createElement('img');label.className='label';label.hidden=true;cell.append(label);
   const tag=document.createElement('span');tag.className='cut-tag';tag.textContent='CUT';tag.hidden=true;cell.append(tag);fragment.append(cell);
  }reels.append(fragment);
 }
 for(let c=0;c<5;c++)for(let row=0;row<3;row++){
  const s=e.board[c][row],cell=reels.children[c*3+row],img=cell.children[0],label=cell.children[1],tag=cell.children[2];
  if(!lastBoard||cell.dataset.symbol!==s){img.src=choose(s);img.alt=names[s];}
  cell.dataset.symbol=s;cell.className='cell';
  const special=s==='WILD'||s==='SCATTER';label.hidden=!special;
  if(special){const src=A[s==='WILD'?'wildlabel':'scatterlabel'][0];if(label.getAttribute('src')!==src)label.src=src;label.alt=s==='WILD'?'Wild':'Bonus';}
  const cut=Boolean(e.cut?.[`${c},${row}`]);tag.hidden=!cut;cell.classList.toggle('cut-cell',cut);cell.style.visibility=e.expanded[c]?'hidden':'';
 }
 lastBoard=e.board.map(col=>col.slice());
 const expanded=$('expanded');
 for(const el of [...expanded.children])if(!e.expanded[el.dataset.reel])el.remove();
 for(const [c,mult] of Object.entries(e.expanded)){
  beamVariants[c]??=choose('beam');stickyVariants[c]??=choose('sticky');
  let el=expanded.querySelector(`[data-reel="${c}"]`);
  if(!el){
   el=document.createElement('div');el.className='wild-reel';el.dataset.reel=c;el.style.gridColumn=Number(c)+1;
   el.innerHTML='<img class="beam" alt="Expanded wild"><img class="chain" alt="Sticky"><div class="crest"><img alt=""><b></b></div><img class="wild-plaque" alt="Wild">';
   el.querySelector('.crest img').src=A.crest[0];el.querySelector('.wild-plaque').src=A.wildlabel[0];expanded.append(el);
  }
  const beam=el.querySelector('.beam'),chain=el.querySelector('.chain');
  if(beam.getAttribute('src')!==beamVariants[c])beam.src=beamVariants[c];
  chain.hidden=!e.bonus;if(e.bonus&&chain.getAttribute('src')!==stickyVariants[c])chain.src=stickyVariants[c];
  const badge=el.querySelector('.crest b'),text=mult+'×';if(badge.textContent!==text)badge.textContent=text;
 }
}
function lock(locked){busy=locked;$('endPreview').hidden=!(locked&&(preview||replaying));$('katanaDemo').hidden=locked&&(preview||replaying);['minus','plus','features','social','katanaDemo'].forEach(id=>$(id).disabled=locked||replayOnly);$('spin').disabled=locked;$('spin').classList.toggle('active',locked);$('replay').disabled=locked||!lastRound;$('autoplay').disabled=replayOnly;$('spinText').textContent=replayOnly?'REPLAY':locked?'RUNNING':'SPIN';}
function dialog(html){$('modalContent').innerHTML=html;$('modal').showModal();}
$('closeModal').onclick=()=>$('modal').close();$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').close();});
function rules(){const word=social?'Win lines':'Paylines';dialog(`<div class="eyebrow">THE CITY HANDBOOK</div><h1>${social?'Rules & win table':'Rules & paytable'}</h1><p class="notice">Playable concept · demo tokens only. RTP is not calibrated. No real currency or live server session is connected.</p><h2>20 ${word.toLowerCase()} · 5 reels · 3 rows</h2><p>Matching symbols start on the leftmost reel. Each line awards its single highest qualifying combination. Values below multiply the total base amount, with no division by 20. Wilds substitute for all ordinary symbols, never badges.</p><table><thead><tr><th>Symbol</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>${Object.entries(M.PAY).map(([k,v])=>`<tr><td>${names[k]}</td>${v.map(n=>`<td>${n?n.toFixed(2)+'×':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table><h2>Briefcases & crossfire</h2><p>In the base game, a briefcase expands only when a winning line uses its reel after expansion. In missions, every new briefcase expands and stays sticky. Multipliers: 2×, 3×, 4×, 5×, 10×, 15×, 20×, 25×, 50×, 100×. Midnight Pursuit excludes 2×, 3× and 4×. With two or more expanded reels, each multiplier doubles once per spin, up to 200×. Participating reel multipliers add together; they do not multiply one another.</p><h2>Five stars of heat</h2><p>Each distinct winning line and each newly landed briefcase cell adds one star, up to five. Upgrades can create new lines and add more heat. Each threshold fires once when crossed: 1★ = 2× global; 2★ = 3–6 low symbols upgraded by gunfire; 3★ = Clean Cut; 4★ = one 10×–100× expanded wild; 5★ = 5× global. The meter resets before every base round and persists only within a mission.</p><h2>Katana · Clean Cut</h2><p>The blade traces one of the 20 lines. Every low symbol on that route becomes the first crew symbol already on the route, reading left to right. If there is no crew symbol, the Vengeance Bride takes over. Briefcases, badges and existing crew symbols stay intact.</p><p>The cut selects the route with the strongest immediate improvement and never reduces an existing line win. Tied routes are selected randomly. If no safe route contains a low symbol, the cut does not change the board. The resulting symbols are evaluated normally; there are no split multipliers. New lines can add heat.</p><p>Watch Clean Cut is a free, fixed example at 3★ heat. It isolates the blade effect and does not trigger the other heat features. Its result is not representative of random-round frequency.</p><p><strong>Line result = base amount × table value × added wild multipliers × heat multiplier.</strong></p><h2>Three missions</h2><ul><li>3 badges: The Vault Job, 10 free spins and sticky wilds.</li><li>4 badges: Neon Rampage, 12 free spins, at least 3★ heat, Clean Cut every spin.</li><li>5 or more badges: Midnight Pursuit, 12 free spins, 5★ heat and a guaranteed 10×–100× sticky wild.</li><li>Retriggers: 3 / 4 / 5+ badges add 4 / 6 / 8 spins, capped at 40 awarded spins per mission. Badges are counted on the original reveal, before expansions.</li><li>Five sticky reels finish the round at the 15,000× maximum. The cap includes all earlier wins in that round; it is not added on top.</li></ul><p>The Missions button opens free previews. Preview results do not change your balance. Feature entry prices have not been designed.</p><h2>${word}</h2><div class="line-map">${M.LINES.map((line,i)=>`<svg viewBox="0 0 100 65"><text x="5" y="10">${i+1}</text><polyline points="${line.map((r,c)=>`${10+c*20},${20+r*18}`).join(' ')}"/></svg>`).join('')}</div><h2>Controls</h2><p>Spin or Space starts one round. − / + changes the base amount. ϟ shortens animations. Autoplay requires confirmation and can be stopped at any time; the current round finishes. ♫ toggles synthesized sound effects. Replay Last Round repeats the exact recorded demo events without changing the balance. Social Mode switches interface wording and token labels. F8 shows live frame timing. A round finishes before its result is added to the demo balance.</p><p>Demo balance and replay are stored only in this page session, except the last completed replay may be retained in this browser. Production server replay and real-wallet integration are not implemented.</p>`);}
$('info').onclick=rules;
function missions(){if(busy)return;dialog(`<div class="eyebrow">THREE JOBS. SAME CITY.</div><h1>Choose your mission</h1><p>Free previews. Your demo balance stays unchanged.</p><button id="drawerKatana" class="cut-study"><span>NEW · KATANA FEATURE</span><strong>One blade. A better line.</strong><small>Watch a short Clean Cut demonstration →</small></button>${[1,2,3].map(t=>`<button class="mission-card mission-${t}" data-tier="${t}"><span class="mission-number">0${t}</span><div><span class="stars-small">${'★'.repeat(t+2)} BADGES</span><strong>${missionNames[t]}</strong><small>${t===1?'Lock the loot. Every briefcase stays for the mission.':t===2?'Follow the blade. A new Clean Cut on every spin.':'Make your escape. Maximum heat from the first spin.'}</small><span class="mission-perk">${missionPerks[t]}</span></div><span class="mission-arrow">↗</span></button>`).join('')}`);document.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>{dialogClose();start(Number(b.dataset.tier));});$('drawerKatana').onclick=()=>{dialogClose();startKatana();};}
function dialogClose(){$('modal').close();}
$('features').onclick=missions;
$('minus').onclick=()=>{betIndex=Math.max(0,betIndex-1);labels();};$('plus').onclick=()=>{betIndex=Math.min(levels.length-1,betIndex+1);labels();};
$('turbo').onclick=()=>{turbo=!turbo;$('turbo').setAttribute('aria-pressed',String(turbo));$('turbo').setAttribute('aria-label',`Turbo ${turbo?'on':'off'}`);};
$('sound').onclick=()=>{muted=!muted;FX.mute(muted);$('sound').setAttribute('aria-pressed',String(muted));$('sound').setAttribute('aria-label',`Sound ${muted?'off':'on'}`);$('sound').textContent=muted?'♪̸':'♫';if(!muted)tone(440);};
$('social').onclick=()=>{social=!social;labels();};
$('autoplay').onclick=()=>{if(autoLeft){autoLeft=0;$('autoplay').setAttribute('aria-pressed','false');status('Autoplay stopped. The current round will finish.');return;}if(busy||replayOnly)return;let selected=10;dialog(`<div class="eyebrow">AUTOPLAY</div><h1>Set your run</h1><p>Each round uses ${fmt(levels[betIndex])} ${unit()}. Stop at any time using the autoplay button. Play stops automatically if your balance is insufficient.</p><div class="auto-options">${[10,25,50].map(n=>`<button data-auto="${n}" class="${n===10?'selected':''}">${n}</button>`).join('')}</div><p id="autoCost">Maximum total cost: ${fmt(10*levels[betIndex])} ${unit()}.</p><div class="actions"><button id="confirmAuto" class="primary">CONFIRM AUTOPLAY</button><button id="cancelAuto" class="secondary">CANCEL</button></div>`);document.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.auto);document.querySelectorAll('[data-auto]').forEach(x=>x.classList.toggle('selected',x===b));$('autoCost').textContent=`Maximum total cost: ${fmt(selected*levels[betIndex])} ${unit()}.`;});$('cancelAuto').onclick=dialogClose;$('confirmAuto').onclick=()=>{dialogClose();autoLeft=selected;$('autoplay').setAttribute('aria-pressed','true');start();};};
function winLines(wins){$('lines').innerHTML=wins.slice(0,6).map(w=>`<polyline points="${w.rows.slice(0,w.count).map((r,c)=>`${50+c*100},${50+r*100}`).join(' ')}"/>`).join('');for(const w of wins)for(let c=0;c<w.count;c++)$('reels').children[c*3+w.rows[c]].classList.add('winner');}
async function counter(to){$('win').style.setProperty('--digits',Math.max(fmt(to).length,fmt(displayWin).length));await FX.countNumber($('win'),displayWin,to,turbo?220:500,fmt);displayWin=to;labels();}
function celebrate(title,value,sub,button='CONTINUE'){$('continue').textContent=button;$('celebrateTitle').textContent=title;$('celebrateAmount').textContent=button==='START MISSION'?String(value):fmt(value);$('celebrateAmount').style.setProperty('--digits',$('celebrateAmount').textContent.length);$('celebrateSub').textContent=sub;$('celebrateHero').src=A.hero[0];$('celebration').hidden=false;FX.celebrate();return new Promise(resolve=>{$('continue').onclick=()=>{$('celebration').hidden=true;resolve();};if(autoLeft)setTimeout(()=>{if(!$('celebration').hidden){$('celebration').hidden=true;resolve();}},turbo?1100:2300);});}
async function animateCut(e){
 if(!e.hits.length){status('CLEAN CUT · No safe low-symbol route',true);await wait(600);return;}
 const machine=$('machine'),fx=$('effects');machine.classList.add('cutting');
 for(let c=0;c<5;c++)$('reels').children[c*3+e.rows[c]].classList.add('cut-focus');
 const intro=document.createElement('div');intro.className='cut-callout';
 intro.innerHTML=`<img src="${A.H2[0]}" alt=""><div><small>3★ WANTED FEATURE</small><strong>CLEAN CUT</strong><span>${e.hits.length} low symbols → ${names[e.target]}</span></div>`;fx.appendChild(intro);
 status(`CLEAN CUT · Line ${e.line+1} · Recruiting ${names[e.target]}`,true);tone(190,.35,'triangle',.025);
 await wait(e.showcase?1250:750);intro.remove();
 fx.innerHTML=`<svg class="cut-route" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true"><polyline class="cut-guide" points="${e.rows.map((row,c)=>`${50+c*100},${50+row*100}`).join(' ')}"/><polyline class="cut-trace" points="${e.rows.map((row,c)=>`${50+c*100},${50+row*100}`).join(' ')}"/></svg>`;
 const blade=document.createElement('img');blade.className='cut-blade';blade.src=A.slash[0];blade.alt='';fx.appendChild(blade);
 for(let c=0;c<5;c++){
  blade.style.left=`${c*20-6}%`;blade.style.top=`${e.rows[c]*100/3+6}%`;
  const cell=$('reels').children[c*3+e.rows[c]];
  if(e.hits.some(h=>h.c===c)){cell.classList.add('cut-hit');tone(710+c*65,.10,'sawtooth',.018);}
  await wait(e.showcase?210:130);
 }
 blade.remove();render(e);machine.classList.remove('cutting');
 status(`CLEAN CUT · ${e.hits.length} upgrades${e.newLines.length?' · '+e.newLines.length+' new '+(e.newLines.length===1?'line':'lines'):e.gain>0?' · Stronger combinations':' · Crew assembled'}`,true);
 tone(620,.28,'triangle',.03);await wait(e.showcase?1400:850);fx.innerHTML='';
}
async function startKatana(){
 if(busy||replayOnly)return;
 cancelPreview=false;replaying=false;preview=true;autoLeft=0;
 $('autoplay').setAttribute('aria-pressed','false');
 lastRound=M.createKatanaShowcase();lastAmount=levels[betIndex];
 try{localStorage.setItem('crimecity-demo-replay-v2',JSON.stringify({round:lastRound,amount:lastAmount}));}catch{}
 $('act').textContent='FEATURE STUDY · CLEAN CUT';$('winLabel').textContent='PREVIEW WIN';
 lock(true);labels();await play(lastRound,lastAmount);
}
$('katanaDemo').onclick=startKatana;
$('endPreview').onclick=()=>{cancelPreview=true;FX.finishReels();FX.hideWin();if(!$('celebration').hidden)$('continue').click();};
async function play(round,amount,isReplay=false){
 roundCosmetic=M.rng(round.seed^0xF00D);lastBoard=null;Object.keys(beamVariants).forEach(k=>delete beamVariants[k]);Object.keys(stickyVariants).forEach(k=>delete stickyVariants[k]);$('frame').src=choose('frame');displayWin=0;labels();let tier=0;
 for(const e of round.events){
  if(cancelPreview)break;
  if(e.type==='reveal'){
   background(e.tier||0);tier=e.tier||0;$('bonusProgress').hidden=!e.bonus;
   if(e.bonus){$('bonusCount').textContent=`${e.remaining+1} FREE SPINS REMAINING`;$('bonusTrack').style.width=`${Math.min(100,(e.remaining+1)/12*100)}%`;}
   $('lines').innerHTML='';$('effects').innerHTML='';FX.hideWin();status(round.showcase?'KATANA STUDY · Watch the gaps in the middle line':e.bonus?`${missionNames[tier]} · Spin ${e.spin}`:'Cruising the neon strip…');
   await FX.spin(e,{turbo,random:roundCosmetic,render});
  }else if(e.type==='expand'||e.type==='drop'){
   render(e);FX.featureReel(e.reel);status(e.type==='drop'?`BRIEFCASE DROP · ${e.multiplier}×`:`BRIEFCASE OPEN · ${e.multiplier}×`,true);tone(330,.18,'triangle');await wait(650);
  }else if(e.type==='heat'){
   render(e);status(`${e.heat}★ WANTED · ${heatNames[e.heat]}`,true);tone(180+e.heat*75,.13,'triangle');await wait(420);
  }else if(e.type==='shots'){
   status('GOLD 1911 DRIVE-BY · Crew upgrade',true);for(const hit of e.hits){const im=document.createElement('img');im.className='impact';im.src=A.bullet[hit.variant];im.style.left=hit.c*20+'%';im.style.top=hit.row*100/3+'%';im.style.rotate=hit.rotation+'deg';$('effects').appendChild(im);tone(85,.09,'sawtooth',.07);await wait(110);}render(e);$('machine').classList.add('shake');await wait(450);$('machine').classList.remove('shake');$('effects').innerHTML='';
  }else if(e.type==='slash'){
   await animateCut(e);
  }else if(e.type==='ricochet'){
   render(e);FX.pulse();FX.burst($('expanded'),50);FX.kick();$('expanded').classList.add('ricochet');status('MEXICAN STANDOFF · All briefcases double',true);tone(260,.3,'sawtooth',.03);await wait(800);$('expanded').classList.remove('ricochet');
  }else if(e.type==='win'){
   render(e);winLines(e.wins);if(e.awarded>0){tone(523,.18,'triangle');status(`${e.wins.length} ${social?'win':'winning'} ${e.wins.length===1?'line':'lines'} · ${fmt(e.awarded*amount)} ${unit()}`,true);await Promise.all([counter(e.roundTotal*amount),FX.win(e.awarded,amount,{turbo,format:fmt})]);await wait(380);}else{status('A quiet night. The next move is yours.');await wait(300);}
  }else if(e.type==='bonusStart'){
   background(e.tier);setHeat(e.heat);$('act').textContent=`ACT ${e.tier===3?'III':'II'} · ${missionNames[e.tier].toUpperCase()}`;status(`${e.remaining} FREE SPINS · ${missionNames[e.tier]}`,true);await celebrate(missionNames[e.tier].toUpperCase(),e.remaining,missionPerks[e.tier],'START MISSION');
  }else if(e.type==='retrigger'){
   status(`MISSION EXTENDED · +${e.add} FREE SPINS`,true);await wait(1100);
  }else if(e.type==='complete'){
   $('bonusProgress').hidden=true;
   if(e.showcase){await wait(900);}
   else if(e.cap)await celebrate('MISSION PASSED!',e.total*amount,'15,000× MAX WIN · RESPECT +');
   else if(e.total>=20)await celebrate(e.total>=100?'LEGENDARY SCORE':'BIG SCORE',e.total*amount,`${fmt(e.total)}× · ${unit()}`);
  }
 }
 if(!isReplay&&!preview){balance=Math.round((balance+round.total*amount)*1e6)/1e6;}
 FX.hideWin();$('machine').classList.remove('cutting');$('effects').innerHTML='';$('bonusProgress').hidden=true;
 labels();status(`${cancelPreview?'Preview ended':round.showcase?'Clean Cut complete · 3 gaps became a five-symbol line':isReplay?'Replay complete':preview?'Preview complete':'Round complete'}${!cancelPreview&&round.total?' · '+fmt(round.total*amount)+' '+unit():''}${preview?' · Balance unchanged':''}`,round.total>0);
 lock(false);if(replayOnly)$('spinText').textContent='AGAIN';if(autoLeft&&!isReplay&&!preview){autoLeft--;if(autoLeft){await wait(1000);if(autoLeft)start();}else $('autoplay').setAttribute('aria-pressed','false');}
}
async function start(tier=0){if(busy||replayOnly)return;const amount=levels[betIndex];if(!tier&&balance<amount){autoLeft=0;status('Insufficient demo tokens. Select a smaller amount.');return;}
 replaying=false;cancelPreview=false;preview=tier>0;if(!preview)balance=Math.round((balance-amount)*1e6)/1e6;else autoLeft=0;
 const seed=crypto.getRandomValues(new Uint32Array(1))[0],round=M.createRound({seed,tier});lastRound=round;lastAmount=amount;
 try{localStorage.setItem('crimecity-demo-replay-v2',JSON.stringify({round,amount}));}catch{}
 $('act').textContent='ACT I · STREETS OF VICE';$('winLabel').textContent=preview?'PREVIEW WIN':'ROUND WIN';background(0);lock(true);labels();await play(round,amount);
}
$('spin').onclick=()=>replayOnly?replay():start();
async function replay(){if(busy||!lastRound)return;cancelPreview=false;autoLeft=0;preview=false;replaying=true;$('winLabel').textContent='REPLAY WIN';$('editionText').textContent='DEMO REPLAY';$('act').textContent='RECORDED ROUND · REPLAY';lock(true);await play(lastRound,lastAmount,true);}
$('replay').onclick=replay;
addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!$('modal').open&&$('celebration').hidden&&!(e.target instanceof HTMLButtonElement)&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();if(!busy)(replayOnly?replay():start());}});
async function init(){
 $('logo').src=A.logo[0];$('frame').src=A.frame[0];background(0,true);setHeat(0);labels();
 const initial=[['H1','L1','L4'],['L2','H2','L3'],['H3','WILD','L1'],['L3','H4','L2'],['SCATTER','L4','H1']];render({board:initial,heat:0,expanded:{},cut:{}});
 const fontReady=document.fonts.load('16px "Bowlby One SC"').catch(()=>[]);
 const failed=await FX.loadAssets(progress=>{$('loadBar').style.width=progress*100+'%';});
 if(replayOnly){try{const saved=JSON.parse(localStorage.getItem('crimecity-demo-replay-v2'));if(saved?.round?.version===2){lastRound=saved.round;lastAmount=saved.amount;}}catch{}status(lastRound?'Recorded demo round ready. Press Replay.':'No recorded demo round is available in this browser.');$('katanaDemo').disabled=true;$('features').disabled=true;$('minus').disabled=true;$('plus').disabled=true;$('autoplay').disabled=true;$('social').disabled=true;$('spinText').textContent='REPLAY';$('spin').disabled=!lastRound;$('replay').hidden=true;}else $('replay').disabled=true;
 if(params.has('rgs_url')||params.has('sessionID')){lock(true);$('autoplay').disabled=true;status('Prototype only: live server sessions and server replay are not connected.');}
 if(failed)status(`${failed} artwork files could not load. Reload to try again.`);
 await fontReady;
 FX.start();$('loading').style.opacity=0;setTimeout(()=>$('loading').hidden=true,500);
}
init();

