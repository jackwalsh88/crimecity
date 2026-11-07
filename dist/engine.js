/* Crime City v0.1. Deterministic demo model. Not calibrated for real currency. */
(function(root){
'use strict';
const LINES=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,2,2,2,1],[0,0,1,0,0],[2,2,1,2,2],[1,0,1,2,1],[1,2,1,0,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,0,1,0],[2,1,2,1,2],[1,0,0,0,1],[0,2,0,2,0],[2,0,2,0,2],[0,2,2,2,0]];
const PAY={H1:[3,10,30],H2:[2,6,20],H3:[1.5,4.5,12],H4:[1,3,8],L1:[.5,1.2,3.5],L2:[.4,1,3],L3:[.3,.8,2.5],L4:[.2,.6,2],WILD:[0,0,30]};
const WEIGHTS=[['H1',5],['H2',6],['H3',7],['H4',8],['L1',17],['L2',18],['L3',19],['L4',20],['WILD',1.7],['SCATTER',2.5]];
const MULT=[2,3,4,5,10,15,20,25,50,100];
const clone=x=>JSON.parse(JSON.stringify(x));
const round=x=>Math.round(x*1e6)/1e6;
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function weighted(r){let n=r()*WEIGHTS.reduce((a,x)=>a+x[1],0);for(const [s,w]of WEIGHTS){n-=w;if(n<0)return s;}return'L4';}
function board(r){return Array.from({length:5},()=>Array.from({length:3},()=>weighted(r)));}
function evaluate(b,expanded={},split={},heat=0){
 const out=[];
 for(let k=0;k<LINES.length;k++){
  const rows=LINES[k];let best=null;
  for(const s of Object.keys(PAY)){
   let n=0;for(let c=0;c<5;c++){const v=expanded[c]?'WILD':b[c][rows[c]];if(v===s||(v==='WILD'&&s!=='WILD'))n++;else break;}
   if(n<3)continue;const p=PAY[s][n-3];if(!p)continue;
   let wm=0,sc=0;for(let c=0;c<n;c++){if(expanded[c])wm+=expanded[c];if(split[`${c},${rows[c]}`])sc++;}
   const value=round(p*(wm||1)*(1+.5*sc)*(heat===5?5:heat>0?2:1));
   if(!best||value>best.value)best={line:k,rows:rows.slice(),symbol:s,count:n,value,wildMultiplier:wm||1,splitMultiplier:1+.5*sc};
  }
  if(best)out.push(best);
 }return out;
}
function resolveSpin(r,state,initial){
 let b=initial?clone(initial):board(r), expanded=clone(state.sticky),split={},heat=state.heat;
 const events=[];let seen=new Set(),wildSeen=new Set(),didShot=false,didSplit=false,didDrop=false;
 const event=(type,extra={})=>events.push({type,board:clone(b),expanded:clone(expanded),split:clone(split),heat,...extra});
 for(const c of Object.keys(state.sticky))b[c]=['WILD','WILD','WILD'];
 const landedWilds=[];for(let c=0;c<5;c++)if(!state.sticky[c])for(let row=0;row<3;row++)if(b[c][row]==='WILD')landedWilds.push(`${c},${row}`);
 const scatterCount=b.flat().filter(x=>x==='SCATTER').length;
 const mult=()=>pick(r,state.tier===3?MULT.filter(x=>x>=5):MULT);
 function expand(){
  let candidates=[];for(let c=0;c<5;c++)if(!expanded[c]&&b[c].includes('WILD'))candidates.push(c);
  if(!candidates.length)return;
  const potential={...expanded};candidates.forEach(c=>potential[c]=1);
  const wins=evaluate(b,potential,split,heat);
  for(const c of candidates)if(state.bonus||wins.some(w=>c<w.count)){expanded[c]=mult();if(state.bonus)state.sticky[c]=expanded[c];event('expand',{reel:c,multiplier:expanded[c]});}
 }
 function shot(){didShot=true;let low=[];for(let c=0;c<5;c++)for(let row=0;row<3;row++)if(!expanded[c]&&b[c][row][0]==='L')low.push([c,row]);
  const hits=[];let count=3+Math.floor(r()*4);while(low.length&&count--){const i=Math.floor(r()*low.length),[c,row]=low.splice(i,1)[0];b[c][row]=pick(r,['H1','H2','H3','H4']);hits.push({c,row,variant:Math.floor(r()*4),rotation:Math.floor(r()*4)*90});}event('shots',{hits});}
 function slash(){didSplit=true;const rows=pick(r,[[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]]);rows.forEach((row,c)=>{if(b[c][row]!=='SCATTER')split[`${c},${row}`]=pick(r,[2,3]);});event('slash',{rows});}
 event('reveal',{scatters:scatterCount});expand();
 if(state.tier===2)slash();
 // Award heat once per distinct winning line and newly appearing wild cell.
 // Each threshold can fire at most once per spin; no unbounded recursion.
 for(let phase=0;phase<6;phase++){
  let gain=0;for(const key of landedWilds)if(!wildSeen.has(key)){wildSeen.add(key);gain++;}
  for(const w of evaluate(b,expanded,split,heat))if(!seen.has(w.line)){seen.add(w.line);gain++;}
  let before=heat;heat=Math.min(5,heat+gain);if(heat!==before)event('heat');
  let changed=false;
  if(heat>=2&&before<2&&!didShot){shot();changed=true;}
  if(heat>=3&&before<3&&!didSplit){slash();changed=true;}
  if(heat>=4&&before<4&&!didDrop){didDrop=true;const available=[0,1,2,3,4].filter(c=>!expanded[c]);if(available.length){const c=pick(r,available);expanded[c]=pick(r,[10,15,20,25,50,100]);if(state.bonus)state.sticky[c]=expanded[c];event('drop',{reel:c,multiplier:expanded[c]});changed=true;}}
  if(!changed)break;
 }
 if(Object.keys(expanded).length>=2){for(const c of Object.keys(expanded))expanded[c]=Math.min(200,expanded[c]*2);event('ricochet');}
 if(state.bonus)state.sticky=clone(expanded);
 let wins=evaluate(b,expanded,split,heat),total=round(wins.reduce((a,w)=>a+w.value,0));
 const fullCrew=state.bonus&&Object.keys(state.sticky).length===5;
 if(fullCrew)total=15000;
 event('win',{wins,total,fullCrew});state.heat=heat;
 return {events,total,scatterCount,fullCrew};
}
function createRound({seed=1,tier=0,initialBoard=null}={}){
 const r=rng(seed);let state={bonus:tier>0,tier,heat:tier===3?5:tier===2?3:0,sticky:{}};
 let events=[],total=0,cap=false,remaining=0,awarded=0,spinNumber=0;
 const append=(result)=>{for(const e of result.events){e.spin=spinNumber;e.bonus=state.bonus;e.tier=state.tier;e.remaining=remaining;e.roundTotal=total;events.push(e);}const delta=result.fullCrew?15000-total:Math.min(result.total,15000-total);total=round(total+delta);const win=events[events.length-1];win.awarded=delta;win.roundTotal=total;if(total>=15000){cap=true;win.fullCrew=result.fullCrew;}};
 const startBonus=t=>{state.bonus=true;state.tier=t;state.heat=Math.max(state.heat,t===3?5:t===2?3:0);remaining=t===1?10:12;awarded=remaining;if(t===3)state.sticky[pick(r,[0,1,2,3,4])]=pick(r,[10,15,20,25,50,100]);events.push({type:'bonusStart',tier:t,remaining,heat:state.heat,roundTotal:total});};
 if(tier)startBonus(tier);else{const base=resolveSpin(r,state,initialBoard);append(base);if(!cap&&base.scatterCount>=3)startBonus(Math.min(3,base.scatterCount-2));}
 while(remaining>0&&!cap){remaining--;spinNumber++;const result=resolveSpin(r,state);append(result);if(!cap&&result.scatterCount>=3&&awarded<40){const add=Math.min(awarded<40?40-awarded:0,result.scatterCount>=5?8:result.scatterCount===4?6:4);remaining+=add;awarded+=add;events.push({type:'retrigger',add,remaining,roundTotal:total,tier:state.tier});}}
 events.push({type:'complete',total,cap,spins:spinNumber,seed,tier});return {version:1,seed,tier,total,cap,events};
}
const api={LINES,PAY,MULT,WEIGHTS,rng,evaluate,createRound,resolveSpin};if(typeof module!=='undefined')module.exports=api;else root.CrimeMath=api;
})(typeof window==='undefined'?globalThis:window);
