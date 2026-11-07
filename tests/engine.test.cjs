const {test}=require('node:test');const a=require('node:assert/strict');const M=require('../dist/engine.js');
const loss=()=>[['H1','H2','H3'],['L1','L2','L3'],['H4','L4','SCATTER'],['L2','H2','L1'],['H3','L3','H4']];
test('20 unique five-reel valid lines',()=>{a.equal(M.LINES.length,20);a.equal(new Set(M.LINES.map(JSON.stringify)).size,20);M.LINES.forEach(l=>a.ok(l.length===5&&l.every(r=>r>=0&&r<3)));});
test('three H1 on middle line awards 3x base; only left-to-right',()=>{let b=loss();b[0][1]=b[1][1]=b[2][1]='H1';const w=M.evaluate(b).find(w=>w.line===0);a.equal(w.count,3);a.equal(w.value,3);b[0][1]='L1';a.equal(M.evaluate(b).find(w=>w.line===0),undefined);});
test('participating wild multipliers add; wilds beyond run excluded',()=>{const b=loss();b[0][1]=b[2][1]='H1';b[3][1]='L2';const w=M.evaluate(b,{1:10,4:100}).find(w=>w.line===0);a.equal(w.value,30);a.equal(w.count,3);});
test('multiple wilds add and heat applies once',()=>{const b=loss();b[0][1]='H1';b[3][1]='L2';const w=M.evaluate(b,{1:10,2:20},5).find(w=>w.line===0);a.equal(w.value,3*30*5);});
test('all wild line chooses one highest result',()=>{const b=Array.from({length:5},()=>['WILD','WILD','WILD']);a.equal(M.evaluate(b).length,20);a.equal(M.evaluate(b)[0].value,30);});
test('scatter cannot substitute and never line-awards',()=>{a.deepEqual(M.evaluate(Array.from({length:5},()=>['SCATTER','SCATTER','SCATTER'])),[]);});
test('base expansion cannot occur without a contributing win',()=>{const b=loss();b[4][2]='WILD';const s={sticky:{},heat:0,bonus:false,tier:0};const r=M.resolveSpin(M.rng(4),s,b);a.equal(r.events.filter(e=>e.type==='expand').length,0);});
test('new bonus wilds add heat; sticky underlying badges do not count',()=>{const b=loss();b[0]=['SCATTER','SCATTER','SCATTER'];b[4][2]='WILD';const s={sticky:{0:2},heat:0,bonus:true,tier:1};const r=M.resolveSpin(M.rng(1),s,b);a.equal(r.scatterCount,1);a.ok(s.heat>=1);a.ok(s.sticky[4]);});
test('full crew lock awards round cap, never above',()=>{const s={sticky:{0:2,1:2,2:2,3:2,4:2},heat:5,bonus:true,tier:3};const r=M.resolveSpin(M.rng(1),s);a.equal(r.total,15000);a.equal(r.fullCrew,true);});
test('round replay is deterministic and starts independent',()=>{a.deepEqual(M.createRound({seed:12}),M.createRound({seed:12}));M.createRound({seed:99,tier:3});a.deepEqual(M.createRound({seed:12}),M.createRound({seed:12}));});
test('scatter tiers begin proper bonuses',()=>{for(let count=3;count<=5;count++){const b=loss();b[2][2]='L4';for(let c=0;c<count;c++)b[c][0]='SCATTER';const r=M.createRound({seed:2,initialBoard:b});const start=r.events.find(e=>e.type==='bonusStart');a.equal(start.tier,count-2);a.equal(start.remaining,count===3?10:12);}});
test('sampled rounds settle exact awards, obey cap and free-spin limit',()=>{for(let tier=0;tier<=3;tier++)for(let seed=1;seed<=250;seed++){const r=M.createRound({seed,tier});a.ok(r.total>=0&&r.total<=15000);const total=r.events.filter(e=>e.type==='win').reduce((n,e)=>n+e.awarded,0);a.ok(Math.abs(total-r.total)<.00001);a.ok(r.events.filter(e=>e.type==='reveal'&&e.bonus).length<=40);for(const e of r.events)if(e.expanded)a.ok(Object.values(e.expanded).every(x=>x<=200));}});
test('Clean Cut demonstration repairs the middle line and awards only normal line math',()=>{
 const round=M.createKatanaShowcase(),e=round.events.find(x=>x.type==='slash');
 a.equal(e.before,0);a.equal(e.after,40);a.equal(e.line,0);a.equal(e.target,'H2');a.equal(e.hits.length,3);a.deepEqual(e.newLines,[0]);
 a.equal(round.total,20*2);a.equal(round.version,2);a.ok(round.showcase);
});
test('Clean Cut protects crew, badges, wilds and the input board',()=>{
 const b=loss();b[1][2]='WILD';const original=JSON.parse(JSON.stringify(b)),expanded={3:10};
 const e=M.cleanCut(b,expanded,3,M.rng(8));a.deepEqual(b,original);
 for(let c=0;c<5;c++)for(let row=0;row<3;row++)if(expanded[c]||b[c][row][0]!=='L')a.equal(e.board[c][row],b[c][row]);
});
test('Clean Cut refuses a cut that removes an existing win',()=>{
 const b=Array.from({length:5},()=>['L1','L1','L1']);const e=M.cleanCut(b);
 a.equal(e.hits.length,0);a.deepEqual(e.board,b);a.equal(e.before,e.after);
});
test('Clean Cut handles a board with no low symbols',()=>{
 const b=Array.from({length:5},()=>['H1','SCATTER','WILD']);const e=M.cleanCut(b);
 a.equal(e.hits.length,0);a.equal(e.line,null);a.equal(e.gain,0);
});
test('Clean Cut preserves every existing line award across sampled boards',()=>{
 const r=M.rng(99),symbols=Object.keys(M.PAY).concat('SCATTER');
 for(let i=0;i<250;i++){
  const b=Array.from({length:5},()=>Array.from({length:3},()=>symbols[Math.floor(r()*symbols.length)]));
  const expanded=i%3===0?{2:10}:{},e=M.cleanCut(b,expanded,3,r),old=M.evaluate(b,expanded,3),after=M.evaluate(e.board,expanded,3);
  a.ok(e.gain>=0);for(const w of old)a.ok(after.some(x=>x.line===w.line&&x.value>=w.value));
  if(e.hits.length){a.deepEqual(e.rows,M.LINES[e.line]);a.ok(e.hits.every(h=>h.row===e.rows[h.c]&&h.to===e.target&&h.from[0]==='L'));}
 }
});
test('Rampage attempts one cut on every spin',()=>{
 const r=M.createRound({seed:147,tier:2});a.equal(r.events.filter(e=>e.type==='reveal').length,r.events.filter(e=>e.type==='slash').length);
});

