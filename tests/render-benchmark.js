/* Development-only deterministic rendering benchmark. Never bundled into the game. */
(() => {
const panel=document.createElement('div');panel.style='position:fixed;right:8px;top:8px;z-index:9999;background:#080b13ed;color:#b9fff0;padding:12px;font:12px monospace;border:1px solid #5baca0;max-width:410px';
panel.innerHTML='<button id="runBench">Run rendering benchmark</button><pre id="benchResult">Ready. 4s idle + 6 seeded reels + 4s effects.</pre>';document.body.append(panel);
const out=panel.querySelector('pre'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let samples=[],times=[],active=false,last=0,peak=0,longTasks=[],phase='',raf=0;
try{new PerformanceObserver(list=>{if(active)for(const e of list.getEntries())longTasks.push(e.duration);}).observe({type:'longtask',buffered:false});}catch{}
function frame(t){if(active&&last)times.push(t-last);last=active?t:0;if(active)raf=requestAnimationFrame(frame);}
function begin(name){phase=name;times=[];longTasks=[];last=0;active=true;raf=requestAnimationFrame(frame);}
function end(){active=false;cancelAnimationFrame(raf);const a=times.slice().sort((x,y)=>x-y),sum=times.reduce((s,n)=>s+n,0);const r={phase,visibility:document.visibilityState,frames:a.length,fps:+(a.length*1000/sum).toFixed(1),p50:+a[Math.floor(a.length*.5)]?.toFixed(1),p95:+a[Math.floor(a.length*.95)]?.toFixed(1),over25ms:a.filter(x=>x>25).length,longTasks:longTasks.length,maxLongTask:Math.round(Math.max(0,...longTasks)),peakMovingImages:peak};samples.push(r);out.textContent=JSON.stringify(samples,null,2);}
document.getElementById('runBench').onclick=async()=>{
 document.getElementById('runBench').disabled=true;samples=[];peak=0;
 if(window.CrimeFX)window.CrimeFX.mute(true);
 await sleep(1000);begin('idle');await sleep(4000);end();await sleep(100);
 begin('reels');
 if(window.CrimeFX){
  const rng=window.CrimeMath.rng(731);const e={board:[['H1','L1','L2'],['L3','H2','L4'],['L2','H3','L1'],['H4','L4','L3'],['SCATTER','L1','H2']],heat:0,expanded:{},cut:{}};
  for(let i=0;i<6;i++){const p=window.CrimeFX.spin(e,{turbo:false,random:rng,render:window.render});peak=Math.max(peak,document.querySelectorAll('.reel-motion img').length);await p;}
 }else{for(let i=0;i<3;i++){window.startSpin?.();await sleep(4500);}}
 end();await sleep(100);begin('effects');
 if(window.CrimeFX){for(let i=0;i<2;i++){window.CrimeFX.burst(document.getElementById('reels'),100);await window.CrimeFX.win(40,1,{format:n=>n.toFixed(2)});await sleep(300);}}
 else await sleep(4000);
 end();panel.dataset.complete='true';document.getElementById('runBench').disabled=false;
};
})();
