/* Crime City v0.2. Deterministic demo model. Not calibrated for real currency. */
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
function evaluate(b,expanded={},heat=0){
 const out=[];
 for(let k=0;k<LINES.length;k++){
  const rows=LINES[k];let best=null;
  for(const s of Object.keys(PAY)){
   let n=0;for(let c=0;c<5;c++){const v=expanded[c]?'WILD':b[c][rows[c]];if(v===s||(v==='WILD'&&s!=='WILD'))n++;else break;}
   if(n<3)continue;const p=PAY[s][n-3];if(!p)continue;
   let wm=0;for(let c=0;c<n;c++)if(expanded[c])wm+=expanded[c];
   const value=round(p*(wm||1)*(heat===5?5:heat>0?2:1));
   if(!best||value>best.value)best={line:k,rows:rows.slice(),symbol:s,count:n,value,wildMultiplier:wm||1};
  }
  if(best)out.push(best);
 }return out;
}
// Clean Cut follows a real line. Low symbols become the first crew symbol
// on that route (the swordswoman if none is present). Crew, badges and wilds
// are protected. Select the largest immediate improvement; never erase a win.
function cleanCut(b,expanded={},heat=0,r=rng(1)){
 const sum=w=>round(w.reduce((n,x)=>n+x.value,0));
 const beforeWins=evaluate(b,expanded,heat),before=sum(beforeWins),candidates=[];
 for(let line=0;line<LINES.length;line++){
  const rows=LINES[line],crew=rows.map((row,c)=>expanded[c]?'WILD':b[c][row]).find(s=>s[0]==='H')||'H2';
  const next=clone(b),hits=[];
  rows.forEach((row,c)=>{if(!expanded[c]&&b[c][row][0]==='L'){hits.push({c,row,from:b[c][row],to:crew});next[c][row]=crew;}});
  if(!hits.length)continue;
  const wins=evaluate(next,expanded,heat),after=sum(wins);
  if(after+1e-6<before||beforeWins.some(old=>!wins.some(w=>w.line===old.line&&w.value+1e-6>=old.value)))continue;
  candidates.push({board:next,rows:rows.slice(),line,target:crew,hits,before,after,gain:round(after-before),newLines:wins.filter(w=>!beforeWins.some(old=>old.line===w.line)).map(w=>w.line)});
 }
 if(!candidates.length)return {board:clone(b),rows:[],line:null,target:null,hits:[],before,after:before,gain:0,newLines:[]};
 const best=Math.max(...candidates.map(c=>c.gain));
 return pick(r,candidates.filter(c=>Math.abs(c.gain-best)<1e-6));
}
function resolveSpin(r,state,initial){
 let b=initial?clone(initial):board(r), expanded=clone(state.sticky),cut={},heat=state.heat;
 const events=[];let seen=new Set(),wildSeen=new Set(),didShot=false,didCut=false,didDrop=false;
 const event=(type,extra={})=>events.push({type,board:clone(b),expanded:clone(expanded),cut:clone(cut),heat,...extra});
 for(const c of Object.keys(state.sticky))b[c]=['WILD','WILD','WILD'];
 const landedWilds=[];for(let c=0;c<5;c++)if(!state.sticky[c])for(let row=0;row<3;row++)if(b[c][row]==='WILD')landedWilds.push(`${c},${row}`);
 const scatterCount=b.flat().filter(x=>x==='SCATTER').length;
 const mult=()=>pick(r,state.tier===3?MULT.filter(x=>x>=5):MULT);
 function expand(){
  let candidates=[];for(let c=0;c<5;c++)if(!expanded[c]&&b[c].includes('WILD'))candidates.push(c);
  if(!candidates.length)return;
  const potential={...expanded};candidates.forEach(c=>potential[c]=1);
  const wins=evaluate(b,potential,heat);
  for(const c of candidates)if(state.bonus||wins.some(w=>c<w.count)){expanded[c]=mult();if(state.bonus)state.sticky[c]=expanded[c];event('expand',{reel:c,multiplier:expanded[c]});}
 }
 function shot(){didShot=true;let low=[];for(let c=0;c<5;c++)for(let row=0;row<3;row++)if(!expanded[c]&&b[c][row][0]==='L')low.push([c,row]);
  const hits=[];let count=3+Math.floor(r()*4);while(low.length&&count--){const i=Math.floor(r()*low.length),[c,row]=low.splice(i,1)[0];b[c][row]=pick(r,['H1','H2','H3','H4']);hits.push({c,row,variant:Math.floor(r()*4),rotation:Math.floor(r()*4)*90});}event('shots',{hits});}
 function slash(){didCut=true;const result=cleanCut(b,expanded,heat,r);b=result.board;result.hits.forEach(({c,row,to})=>cut[`${c},${row}`]=to);event('slash',result);}
 event('reveal',{scatters:scatterCount});expand();
 if(state.tier===2)slash();
 // Award heat once per distinct winning line and newly appearing wild cell.
 // Each threshold can fire at most once per spin; no unbounded recursion.
 for(let phase=0;phase<6;phase++){
  let gain=0;for(const key of landedWilds)if(!wildSeen.has(key)){wildSeen.add(key);gain++;}
  for(const w of evaluate(b,expanded,heat))if(!seen.has(w.line)){seen.add(w.line);gain++;}
  let before=heat;heat=Math.min(5,heat+gain);if(heat!==before)event('heat');
  let changed=false;
  if(heat>=2&&before<2&&!didShot){shot();changed=true;}
  if(heat>=3&&before<3&&!didCut){slash();changed=true;}
  if(heat>=4&&before<4&&!didDrop){didDrop=true;const available=[0,1,2,3,4].filter(c=>!expanded[c]);if(available.length){const c=pick(r,available);expanded[c]=pick(r,[10,15,20,25,50,100]);if(state.bonus)state.sticky[c]=expanded[c];event('drop',{reel:c,multiplier:expanded[c]});changed=true;}}
  if(!changed)break;
 }
 if(Object.keys(expanded).length>=2){for(const c of Object.keys(expanded))expanded[c]=Math.min(200,expanded[c]*2);event('ricochet');}
 if(state.bonus)state.sticky=clone(expanded);
 let wins=evaluate(b,expanded,heat),total=round(wins.reduce((a,w)=>a+w.value,0));
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
 events.push({type:'complete',total,cap,spins:spinNumber,seed,tier});return {version:2,seed,tier,total,cap,events};
}
// A labeled, free feature study. Uses the same cut/evaluation as random rounds.
function createKatanaShowcase(){
 const b=[['H3','H2','H4'],['H1','L1','SCATTER'],['H4','L2','H1'],['H1','H2','H3'],['SCATTER','L4','H4']];
 const base={expanded:{},cut:{},heat:3,bonus:false,tier:0,spin:0,remaining:0,roundTotal:0};
 const cut=cleanCut(b,{},3,rng(7)),marks={};cut.hits.forEach(({c,row,to})=>marks[`${c},${row}`]=to);
 const wins=evaluate(cut.board,{},3),total=round(wins.reduce((n,w)=>n+w.value,0));
 return {version:2,seed:7,tier:0,showcase:true,total,cap:false,events:[
  {...base,type:'reveal',board:clone(b),scatters:0},
  {...base,...cut,type:'slash',cut:marks,showcase:true},
  {...base,type:'win',board:clone(cut.board),cut:marks,wins,total,awarded:total,roundTotal:total,fullCrew:false},
  {type:'complete',total,cap:false,spins:1,seed:7,tier:0,showcase:true}
 ]};
}
const api={LINES,PAY,MULT,WEIGHTS,rng,evaluate,cleanCut,createRound,createKatanaShowcase,resolveSpin};if(typeof module!=='undefined')module.exports=api;else root.CrimeMath=api;
})(typeof window==='undefined'?globalThis:window);

