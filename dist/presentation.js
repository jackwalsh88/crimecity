/* Visuals and audio only. This module never generates or changes round outcomes. */
(function(root){
'use strict';
const $=id=>document.getElementById(id),A=root.ASSETS;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let layers=[],pointer={x:0,y:0},frame=0,previous=0;
let ctx=null,bus=null,muted=false,noiseBuffer=null,canvas=null,paint=null,width=0,height=0,particles=[];
let winAnimation=null,winTimer=0,winResolve=null;
const cosmeticSymbols=['H1','H2','H3','H4','L1','L2','L3','L4'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function audio(){
 if(muted)return null;
 try{
  if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();bus=ctx.createGain();bus.gain.value=.65;const limiter=ctx.createDynamicsCompressor();bus.connect(limiter);limiter.connect(ctx.destination);}
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return ctx;
 }catch{return null;}
}
function tone(f=220,d=.08,type='sine',vol=.04,delay=0){
 const a=audio();if(!a)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f*.82),t+d);
 g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+d);
 o.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect();};
}
function noise(duration=.06,volume=.04,frequency=1400){
 const a=audio();if(!a)return;
 if(!noiseBuffer){noiseBuffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 const source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain(),t=a.currentTime;
 source.buffer=noiseBuffer;source.loop=true;filter.type='bandpass';filter.Q.value=.6;filter.frequency.setValueAtTime(frequency,t);filter.frequency.exponentialRampToValueAtTime(frequency*.45,t+duration);
 gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
 source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();source.stop(t+duration+.03);
 source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
function mute(value){muted=value;if(bus)bus.gain.setTargetAtTime(value?0:.65,ctx.currentTime,.015);}
function chime(big=false){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,big?.5:.22,'triangle',big?.05:.032,i*.075));if(big)tone(130.8,.7,'sine',.05);}
// Decode artwork once and retain the decoded objects for the reel sprite cache.
const images=new Map(),sprites=new Map(),sparkSprites=new Map();
let reelCanvas=null,reelPaint=null,reelBounds=null,reelW=0,reelH=0,reelDpr=1,activeSpin=null;
let particleDirty=false,sceneAnimations=[],resizePending=false,pointerFrame=0,started=false;
const counts=new Set(),rollupFormat=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
let hud=null,hudLast=0,hudFrames=[],hudPrevious=0;
async function loadAssets(progress){
 const urls=[...new Set(Object.values(A).flat())];let done=0,failed=0;
 await Promise.all(urls.map(async src=>{const im=new Image();im.decoding='async';im.src=src;
  try{await im.decode();images.set(src,im);}catch{failed++;}
  progress?.(++done/urls.length);
 }));return failed;
}
function wake(){if(started&&!frame&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick);}}
function resize(){
 width=innerWidth;height=innerHeight;
 if(canvas){const d=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);paint.setTransform(d,0,0,d,0,0);particleDirty=false;}
 resizeReels();resizePending=false;
}
function resizeReels(){
 if(!reelCanvas)return;
 reelBounds=$('reels').getBoundingClientRect();reelW=reelBounds.width;reelH=reelBounds.height;
 const d=Math.min(devicePixelRatio||1,1.5,1100/Math.max(1,reelW));
 const w=Math.round(reelW*d),h=Math.round(reelH*d);
 if(reelCanvas.width!==w||reelCanvas.height!==h){
  reelCanvas.width=w;reelCanvas.height=h;reelDpr=d;sprites.clear();
  // Warm every symbol while loading/resizing, before the next user spin.
  for(const symbol of [...cosmeticSymbols,'WILD','SCATTER'])for(const src of A[symbol])sprite({symbol,src});
 }
 reelPaint.setTransform(d,0,0,d,0,0);
 if(activeSpin)prepareSpinSprites(activeSpin);
}
function refreshScene(){
 sceneAnimations.forEach(a=>a.cancel());sceneAnimations=[];
 layers=[...$('world').querySelectorAll('.layer')];
 for(let i=0;i<layers.length;i++){
  const el=layers[i],depth=Number(el.dataset.depth);el.style.transform='none';
  if(reduce.matches)continue;
  // Each layer moves on the compositor. No JavaScript/style writes during idle.
  const a=el.animate([{transform:`translate3d(${-depth*.48}px,${depth*.035}px,0)`},{transform:`translate3d(${depth*.48}px,${-depth*.035}px,0)`}],{duration:18000+i*1400,iterations:Infinity,direction:'alternate',easing:'ease-in-out',delay:-3000-i*500});
  sceneAnimations.push(a);if(document.hidden)a.pause();
 }
}
function spark(color,bar){
 const key=color+bar;if(sparkSprites.has(key))return sparkSprites.get(key);
 const c=document.createElement('canvas');c.width=c.height=32;const p=c.getContext('2d');
 p.translate(16,16);p.fillStyle=color;p.shadowColor=color;p.shadowBlur=5;
 if(bar)p.fillRect(-7,-2,14,4);else{p.beginPath();p.moveTo(0,-7);p.lineTo(4,0);p.lineTo(0,7);p.lineTo(-4,0);p.fill();}
 sparkSprites.set(key,c);return c;
}
function particlesAt(x,y,count=18,kind='gold'){
 if(reduce.matches)return;
 const scale=clamp(width/1100,.45,1.2),colors=kind==='cyan'?['#b6fff4','#62e9ef','#fff8cf']:['#ffe39a','#fbbf4b','#fff4ce','#79ffea'];
 for(let i=0;i<count&&particles.length<120;i++)particles.push({x,y,vx:(Math.random()-.5)*270*scale,vy:(-90-Math.random()*200)*scale,life:0,max:.65+Math.random()*.8,size:(2+Math.random()*5)*scale,angle:Math.random()*6.28,spin:(Math.random()-.5)*14,sprite:spark(colors[i%colors.length],i%3===0)});
 wake();
}
function burst(el,count=18,kind='gold'){
 if(!el)return;const b=el.getBoundingClientRect();particlesAt(b.x+b.width/2,b.y+b.height*.5,count,kind);
}
function drawParticles(dt){
 if(!paint||(!particles.length&&!particleDirty))return;
 paint.clearRect(0,0,width,height);let n=0;
 for(let i=0;i<particles.length;i++){
  const p=particles[i];p.life+=dt;if(p.life>=p.max)continue;particles[n++]=p;
  p.vy+=320*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;
  paint.save();paint.translate(p.x,p.y);paint.rotate(p.angle);paint.globalAlpha=1-p.life/p.max;
  const size=p.size*4;paint.drawImage(p.sprite,-size/2,-size/2,size,size);paint.restore();
 }
 particles.length=n;particleDirty=n>0;
}
function contain(p,im,x,y,w,h){if(!im)return;const k=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;p.drawImage(im,Math.round(x+(w-dw)/2),Math.round(y+(h-dh)/2),Math.round(dw),Math.round(dh));}
function sprite(item){
 if(sprites.has(item.src))return sprites.get(item.src);
 const w=Math.ceil(reelW/5*reelDpr),h=Math.ceil(reelH/3*reelDpr),c=document.createElement('canvas');c.width=w;c.height=h;
 const p=c.getContext('2d'),portrait=height>width;
 contain(p,images.get(item.src),w*(portrait?.035:.065),h*(portrait?.05:.065),w*(portrait?.93:.87),h*(portrait?.9:.87));
 if(item.symbol==='WILD'||item.symbol==='SCATTER')contain(p,images.get(A[item.symbol==='WILD'?'wildlabel':'scatterlabel'][0]),w*.12,h*(item.symbol==='WILD'?.7:.55),w*.76,h*.25);
 sprites.set(item.src,c);return c;
}
function prepareSpinSprites(run){for(const col of run.columns)for(const item of col.items)item.sprite=sprite(item);}
function position(t,n){
 if(t<.07)return n+.16*(1-(1-t/.07)**2);
 if(t<.66){const p=(t-.07)/.59;return n+.16+(3.6-n-.16)*(p*p*(2-p));}
 if(t<.93){const p=(t-.66)/.27;return 3.6+(.88-3.6)*(1-(1-p)**3);}
 return .88+.12*(1-Math.cos(Math.PI*(t-.93)/.07))/2;
}
function land(col,run,sound=true){
 if(col.done)return;col.done=true;
 for(let row=0;row<3;row++){const cell=$('reels').children[col.c*3+row];cell.classList.add('landed');cell.classList.remove('in-motion');}
 if(sound){tone(125+col.c*17,.08,'triangle',.075);noise(.055,.065,1700);
  const special=run.event.board[col.c].some(s=>s==='WILD'||s==='SCATTER');
  const x=reelBounds.x+(col.c+.5)*reelW/5;
  if(special){tone(run.event.board[col.c].includes('SCATTER')?620+col.c*60:420+col.c*50,.19,'triangle',.035);particlesAt(x,reelBounds.y+reelH/2,14,'cyan');}
  particlesAt(x,reelBounds.bottom-3,5);
 }
}
function settleSpin(){
 const run=activeSpin;if(!run)return;activeSpin=null;
 $('machine').classList.remove('is-spinning');$('reels').setAttribute('aria-busy','false');
 reelCanvas.hidden=true;reelPaint.clearRect(0,0,reelW,reelH);run.resolve();
}
function finishReels(){if(activeSpin){for(const col of activeSpin.columns)land(col,activeSpin,false);settleSpin();}}
function drawReels(dt){
 const run=activeSpin;if(!run)return;run.elapsed+=dt*1000;
 const p=reelPaint,cw=reelW/5,ch=reelH/3;p.clearRect(0,0,reelW,reelH);let moving=0;
 for(const col of run.columns){
  if(col.done)continue;const t=Math.min(1,run.elapsed/col.duration);
  if(t>=1){land(col,run);continue;}moving++;
  const x=col.c*cw,offset=position(t,col.n),first=Math.floor(offset),fraction=offset-first;
  p.save();p.beginPath();p.rect(x,0,cw,reelH);p.clip();p.fillStyle='#170d21';p.fillRect(x,0,cw,reelH);
  for(let row=0;row<4;row++){
   const item=col.items[first+row];if(!item)continue;const y=(row-fraction)*ch;
   p.drawImage(item.sprite,Math.round(x),Math.round(y),cw,ch);
   p.fillStyle='#e7c99326';p.fillRect(x,Math.round(y+ch)-1,cw,1);
  }
  // A cached gradient supplies depth without blurring an oversized strip.
  p.fillStyle=run.shade;p.fillRect(x,0,cw,reelH);p.fillStyle='#e7c99326';p.fillRect(x+cw-1,0,1,reelH);p.restore();
 }
 if(!moving)settleSpin();
}
async function spin(e,{turbo=false,random=Math.random,render}={}){
 hideWin();finishReels();const reels=$('reels'),old=[...reels.children].map(cell=>({symbol:cell.dataset.symbol,src:cell.querySelector('.symbol')?.getAttribute('src')}));
 render(e);if(reduce.matches){await pause(turbo?100:240);return;}
 resizeReels();const columns=[];
 for(let c=0;c<5;c++){
  if(e.expanded[c])continue;
  const n=(turbo?10:19)+c*3,items=[];
  for(let i=0;i<n+4;i++){const symbol=cosmeticSymbols[Math.floor(random()*cosmeticSymbols.length)];items.push({symbol,src:A[symbol][Math.floor(random()*A[symbol].length)]});}
  for(let row=0;row<3;row++){
   const cell=reels.children[c*3+row];items[row+1]={symbol:e.board[c][row],src:cell.querySelector('.symbol').getAttribute('src')};
   if(old[c*3+row]?.src)items[n+row]=old[c*3+row];cell.classList.add('in-motion');
  }
  columns.push({c,n,items,duration:turbo?570+c*75:1320+c*175,done:false});
 }
 if(!columns.length){await pause(turbo?80:180);return;}
 const shade=reelPaint.createLinearGradient(0,0,0,reelH);shade.addColorStop(0,'#070511b0');shade.addColorStop(.22,'#07051100');shade.addColorStop(.78,'#07051100');shade.addColorStop(1,'#070511b0');
 await new Promise(resolve=>{
  activeSpin={event:e,columns,elapsed:0,resolve,shade};prepareSpinSprites(activeSpin);
  reelCanvas.hidden=false;$('machine').classList.add('is-spinning');reels.setAttribute('aria-busy','true');
  drawReels(0);kick();tone(75,.35,'sine',.05);noise(turbo?.55:1.4,.036,900);wake();
 });await pause(turbo?80:180);
}
function countNumber(el,from,to,duration,format=String){
 cancelCount(el);let resolve;const promise=new Promise(r=>resolve=r);
 const task={el,from,to,duration,elapsed:0,last:-100,format,resolve};counts.add(task);wake();return promise;
}
function cancelCount(el){for(const task of counts)if(task.el===el){counts.delete(task);task.resolve();}}
function updateCounts(dt){
 for(const t of counts){t.elapsed+=dt*1000;const progress=Math.min(1,t.elapsed/t.duration);
  if(progress===1||t.elapsed-t.last>=32){t.el.textContent=progress===1?t.format(t.to):rollupFormat.format(t.from+(t.to-t.from)*(1-(1-progress)**3));t.last=t.elapsed;}
  if(progress===1){counts.delete(t);t.resolve();}
 }
}
function measure(now){
 if(!hud||hud.hidden)return;
 if(hudPrevious)hudFrames.push(now-hudPrevious);hudPrevious=now;
 if(now-hudLast<1000)return;hudLast=now;
 const sorted=hudFrames.slice().sort((a,b)=>a-b),sum=hudFrames.reduce((a,b)=>a+b,0),fps=sum?hudFrames.length*1000/sum:0;
 hud.textContent=`${fps.toFixed(1)} FPS · p95 ${(sorted[Math.floor(sorted.length*.95)]||0).toFixed(1)} ms\n${activeSpin?'REELS':'IDLE / EFFECTS'} · ${sprites.size} cached sprites · ${particles.length} particles\nF8 to hide`;hudFrames=[];
}
function tick(now){
 frame=0;if(document.hidden)return;
 const dt=Math.max(0,(now-previous)/1000)||.016;previous=now;
 if(resizePending)resize();
 drawReels(dt);drawParticles(Math.min(dt,.05));updateCounts(dt);measure(now);
 if(activeSpin||particles.length||particleDirty||counts.size||(hud&&!hud.hidden))frame=requestAnimationFrame(tick);
}
function start(){
 canvas=$('particles');paint=canvas.getContext('2d');
 reelCanvas=document.createElement('canvas');reelCanvas.className='reel-canvas';reelCanvas.hidden=true;reelCanvas.setAttribute('aria-hidden','true');$('reelMotion').replaceChildren(reelCanvas);reelPaint=reelCanvas.getContext('2d');
 started=true;resize();refreshScene();
 for(const color of ['#b6fff4','#62e9ef','#fff8cf','#ffe39a','#fbbf4b','#fff4ce','#79ffea']){spark(color,false);spark(color,true);}
 new ResizeObserver(()=>{resizePending=true;wake();}).observe($('reels'));
}
addEventListener('pointermove',e=>{
 if(reduce.matches)return;pointer.x=clamp(e.clientX/innerWidth*2-1,-1,1)*8;pointer.y=clamp(e.clientY/innerHeight*2-1,-1,1)*3;
 if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;$('world').style.transform=`translate3d(${pointer.x.toFixed(1)}px,${pointer.y.toFixed(1)}px,0)`;});
},{passive:true});
document.addEventListener('pointerleave',()=>{$('world').style.transform='none';});
addEventListener('resize',()=>{resizePending=true;wake();});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){cancelAnimationFrame(frame);frame=0;sceneAnimations.forEach(a=>a.pause());hudPrevious=0;}
 else{sceneAnimations.forEach(a=>a.play());wake();}
});
reduce.addEventListener('change',()=>{refreshScene();if(reduce.matches){finishReels();particles=[];drawParticles(0);$('world').style.transform='none';}});
addEventListener('keydown',e=>{if(e.code!=='F8')return;e.preventDefault();
 if(!hud){hud=document.createElement('output');hud.id='performanceHUD';hud.hidden=true;document.body.appendChild(hud);}
 hud.hidden=!hud.hidden;hudFrames=[];hudPrevious=0;hudLast=0;wake();
});
function kick(){if(!reduce.matches)$('world').animate([{translate:'0 0'},{translate:'-2px 1px',offset:.3},{translate:'0 0'}],{duration:280,easing:'ease-out'});}
function pulse(kind='gold'){$('cabinetGlow').dataset.color=kind;$('cabinetGlow').animate([{opacity:0},{opacity:.6,offset:.25},{opacity:0}],{duration:600,easing:'ease-out'});}
function featureReel(reel){const el=$('expanded').querySelector(`[data-reel="${reel}"]`);if(el&&!reduce.matches)el.animate([{transform:'translateY(-10%) scaleY(.65)',opacity:.2},{transform:'translateY(2%) scaleY(1.04)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:500,easing:'cubic-bezier(.2,.8,.25,1)'});burst(el,36);pulse();kick();tone(100,.35,'sine',.055);tone(740,.3,'triangle',.03);}
function hideWin(){clearTimeout(winTimer);cancelCount($('splashAmount'));if(winAnimation){winAnimation.cancel();winAnimation=null;}$('winSplash').hidden=true;if(winResolve){winResolve();winResolve=null;}}
function win(awarded,amount,{turbo=false,format=String}={}){
 hideWin();if(awarded<=0)return Promise.resolve();
 const el=$('winSplash'),number=$('splashAmount'),value=awarded*amount;number.style.setProperty('--digits',format(value).length);
 $('splashRibbon').src=A.ribbon[0];$('splashTitle').textContent=awarded>=100?'HEIST SCORE':awarded>=20?'BIG WIN':'LINE WIN';$('splashUnit').textContent='';
 el.hidden=false;el.dataset.size=awarded>=100?'large':'normal';
 chime(awarded>=20);pulse();burst($('reels'),awarded>=100?90:awarded>=20?60:25);if(awarded>=20)kick();
 countNumber(number,0,value,reduce.matches?1:turbo?280:750,format);
 if(!reduce.matches)winAnimation=el.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.65)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.06)',offset:.6},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
 return new Promise(resolve=>{winResolve=resolve;winTimer=setTimeout(hideWin,turbo?650:awarded>=20?1700:1250);});
}
function celebrate(){chime(true);burst($('celebrateAmount'),100);pulse();}
root.CrimeFX={start,loadAssets,refreshScene,spin,finishReels,featureReel,win,hideWin,burst,pulse,kick,tone,mute,chime,celebrate,countNumber};
})(window);
