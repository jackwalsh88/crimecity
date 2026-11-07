/* Visuals and audio only. This module never generates or changes round outcomes. */
(function(root){
'use strict';
const $=id=>document.getElementById(id),A=root.ASSETS;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let layers=[],pointer={x:0,y:0},camera={x:0,y:0,kick:0},frame=0,previous=0,clock=0;
let ctx=null,bus=null,muted=false,noiseBuffer=null,canvas=null,paint=null,width=0,height=0,particles=[];
let rolling=new Set(),winAnimation=null,winTimer=0,winResolve=null;
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
function resize(){width=innerWidth;height=innerHeight;if(canvas){const d=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);paint.setTransform(d,0,0,d,0,0);}}
function refreshScene(){
 layers=[...$('world').querySelectorAll('.layer')];
 if(reduce.matches)layers.forEach(el=>el.style.transform='none');
 else $('world').animate([{opacity:.65},{opacity:1}],{duration:650,easing:'ease-out'});
}
function particlesAt(x,y,count=18,kind='gold'){
 if(reduce.matches)return;
 const scale=clamp(width/1100,.45,1.2),colors=kind==='cyan'?['#b6fff4','#62e9ef','#fff8cf']:['#ffe39a','#fbbf4b','#fff4ce','#79ffea'];
 for(let i=0;i<count&&particles.length<180;i++)particles.push({x,y,vx:(Math.random()-.5)*270*scale,vy:(-90-Math.random()*200)*scale,life:0,max:.65+Math.random()*.8,size:(2+Math.random()*5)*scale,angle:Math.random()*6.28,spin:(Math.random()-.5)*14,color:colors[i%colors.length],bar:i%3===0});
}
function burst(el,count=18,kind='gold'){
 if(!el)return;const b=el.getBoundingClientRect();particlesAt(b.x+b.width/2,b.y+b.height*.5,count,kind);
}
function drawParticles(dt){
 if(!paint)return;paint.clearRect(0,0,width,height);
 particles=particles.filter(p=>p.life<p.max);
 for(const p of particles){p.life+=dt;p.vy+=320*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;paint.save();paint.translate(p.x,p.y);paint.rotate(p.angle);paint.globalAlpha=Math.max(0,1-p.life/p.max);paint.fillStyle=p.color;paint.shadowColor=p.color;paint.shadowBlur=5;if(p.bar)paint.fillRect(-p.size,-p.size/3,p.size*2,p.size*.66);else{paint.beginPath();paint.moveTo(0,-p.size);paint.lineTo(p.size*.6,0);paint.lineTo(0,p.size);paint.lineTo(-p.size*.6,0);paint.fill();}paint.restore();}
}
function tick(now){
 frame=0;if(document.hidden)return;
 const dt=Math.min((now-previous)/1000||.016,.05);previous=now;clock+=dt;
 if(!reduce.matches){
  const targetX=Math.sin(clock*.36)*.48+Math.sin(clock*.67)*.08+pointer.x*.58;
  const targetY=Math.sin(clock*.27)*.13+pointer.y*.22;
  const easing=1-Math.exp(-dt*3);camera.x+=(targetX-camera.x)*easing;camera.y+=(targetY-camera.y)*easing;camera.kick*=Math.exp(-dt*4);
  for(const el of layers){const depth=Number(el.dataset.depth);el.style.transform=`translate3d(${(camera.x*depth).toFixed(2)}px,${(camera.y*depth*.38).toFixed(2)}px,0) scale(${(1+camera.kick*.012).toFixed(4)})`;}
 }
 if(particles.length)drawParticles(dt);else if(paint)paint.clearRect(0,0,width,height);
 frame=requestAnimationFrame(tick);
}
function start(){
 canvas=$('particles');paint=canvas.getContext('2d');resize();refreshScene();if(!frame){previous=performance.now();frame=requestAnimationFrame(tick);}
}
addEventListener('pointermove',e=>{pointer.x=clamp(e.clientX/innerWidth*2-1,-1,1);pointer.y=clamp(e.clientY/innerHeight*2-1,-1,1);},{passive:true});
document.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(canvas&&!frame){previous=performance.now();frame=requestAnimationFrame(tick);}});
reduce.addEventListener('change',()=>{refreshScene();if(reduce.matches){particles=[];if(paint)paint.clearRect(0,0,width,height);}});
function kick(){camera.kick=1;}
function pulse(kind='gold'){$('cabinetGlow').dataset.color=kind;$('cabinetGlow').animate([{opacity:0},{opacity:.6,offset:.25},{opacity:0}],{duration:600,easing:'ease-out'});}
function finishReels(){for(const a of rolling)try{a.finish();}catch{}}
async function spin(e,{turbo=false,random=Math.random,render}={}){
 hideWin();const machine=$('machine'),motion=$('reelMotion'),reels=$('reels');
 const oldCells=[...reels.children].map(cell=>({symbol:cell.dataset.symbol,src:cell.querySelector('.symbol')?.getAttribute('src')}));
 render(e);motion.innerHTML='';
 if(reduce.matches){await pause(turbo?100:240);return;}
 machine.classList.add('is-spinning');reels.setAttribute('aria-busy','true');kick();tone(75,.35,'sine',.05);noise(turbo?.55:1.4,.036,900);
 const choose=s=>A[s][Math.floor(random()*A[s].length)];
 const promises=[];
 for(let c=0;c<5;c++){
  if(e.expanded[c])continue; // Sticky reels stay visibly locked while other reels spin.
  const n=(turbo?10:19)+c*3,total=n+3,stripSymbols=[];
  for(let i=0;i<total;i++){const s=cosmeticSymbols[Math.floor(random()*cosmeticSymbols.length)];stripSymbols.push({symbol:s,src:choose(s)});}
  for(let row=0;row<3;row++){
   stripSymbols[row+1]={symbol:e.board[c][row],src:reels.children[c*3+row].querySelector('.symbol').getAttribute('src')};
   const old=oldCells[c*3+row];stripSymbols[n+row]=old?.src?old:stripSymbols[n+row];
  }
  const col=document.createElement('div');col.className='reel-column';col.style.gridColumn=c+1;col.dataset.reel=c;
  const strip=document.createElement('div');strip.className='symbol-strip';strip.style.setProperty('--count',total);
  strip.innerHTML=stripSymbols.map(({symbol,src})=>`<div class="reel-item" data-symbol="${symbol}"><img class="symbol" src="${src}" alt="">${symbol==='WILD'||symbol==='SCATTER'?`<img class="label" src="${A[symbol==='WILD'?'wildlabel':'scatterlabel'][0]}" alt="">`:''}</div>`).join('');
  col.appendChild(strip);motion.appendChild(col);
  const position=index=>`translate3d(0,${-index/total*100}%,0)`,duration=turbo?570+c*75:1320+c*175;
  const animation=strip.animate([
   {transform:position(n),offset:0,easing:'ease-out'},
   {transform:position(n+.18),offset:.065,easing:'linear'},
   {transform:position(3.7),offset:.68,easing:'cubic-bezier(.12,.66,.25,1)'},
   {transform:position(.84),offset:.925,easing:'ease-in-out'},
   {transform:position(1),offset:1}
  ],{duration,fill:'forwards'});
  const blur=strip.animate([{filter:'blur(0px)',offset:0},{filter:'blur(3px)',offset:.12},{filter:'blur(3px)',offset:.63},{filter:'blur(0px)',offset:.84},{filter:'blur(0px)',offset:1}],{duration,fill:'forwards'});
  rolling.add(animation);rolling.add(blur);
  promises.push(animation.finished.catch(()=>{}).then(()=>{
   rolling.delete(animation);rolling.delete(blur);blur.cancel();
   for(let row=0;row<3;row++)reels.children[c*3+row].classList.add('landed');
   col.remove();animation.cancel();tone(125+c*17,.08,'triangle',.075);noise(.055,.065,1700);
   const special=e.board[c].some(s=>s==='WILD'||s==='SCATTER');
   if(special){tone(e.board[c].includes('SCATTER')?620+c*60:420+c*50,.19,'triangle',.035);burst(reels.children[c*3+1],14,'cyan');}
   const b=reels.children[c*3+2].getBoundingClientRect();particlesAt(b.x+b.width/2,b.bottom-3,5,'gold');
  }));
 }
 try{await Promise.all(promises);}finally{machine.classList.remove('is-spinning');motion.innerHTML='';reels.setAttribute('aria-busy','false');}
 await pause(turbo?80:180);
}
function featureReel(reel){const el=$('expanded').querySelector(`[data-reel="${reel}"]`);if(el&&!reduce.matches)el.animate([{transform:'translateY(-10%) scaleY(.65)',opacity:.2},{transform:'translateY(2%) scaleY(1.04)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:500,easing:'cubic-bezier(.2,.8,.25,1)'});burst(el,36);pulse();kick();tone(100,.35,'sine',.055);tone(740,.3,'triangle',.03);}
function hideWin(){clearTimeout(winTimer);if(winAnimation){winAnimation.cancel();winAnimation=null;}$('winSplash').hidden=true;if(winResolve){winResolve();winResolve=null;}}
function win(awarded,amount,{turbo=false,format=String}={}){
 hideWin();if(awarded<=0)return Promise.resolve();
 const el=$('winSplash'),number=$('splashAmount'),value=awarded*amount;
 $('splashRibbon').src=A.ribbon[0];$('splashTitle').textContent=awarded>=100?'HEIST SCORE':awarded>=20?'BIG WIN':'LINE WIN';$('splashUnit').textContent='';
 el.hidden=false;el.dataset.size=awarded>=100?'large':'normal';
 chime(awarded>=20);pulse();burst($('reels'),awarded>=100?90:awarded>=20?60:25);if(awarded>=20)kick();
 const duration=reduce.matches?0:turbo?280:750,startTime=performance.now();
 function count(now){const t=duration?Math.min(1,(now-startTime)/duration):1;number.textContent=t===1?format(value):(value*(1-(1-t)**3)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});if(t<1&&!el.hidden)requestAnimationFrame(count);}
 requestAnimationFrame(count);
 if(!reduce.matches)winAnimation=el.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.65)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.06)',offset:.6},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
 return new Promise(resolve=>{winResolve=resolve;winTimer=setTimeout(hideWin,turbo?650:awarded>=20?1700:1250);});
}
function celebrate(){chime(true);burst($('celebrateAmount'),100);pulse();}
root.CrimeFX={start,refreshScene,spin,finishReels,featureReel,win,hideWin,burst,pulse,kick,tone,mute,chime,celebrate};
})(window);
