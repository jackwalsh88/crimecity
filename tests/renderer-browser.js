/* Run inside a decoded, initialized demo. These tests never change the math engine. */
(() => {
 const ui=document.createElement('div');ui.id='rendererTests';ui.style='position:fixed;right:8px;top:8px;z-index:1000;padding:14px;background:#06151bf2;color:#c4ffe7;font:12px/1.5 monospace;max-width:520px';
 ui.innerHTML='<button id="runRendererTests">Run renderer checks</button><pre id="rendererResult">Ready</pre>';document.body.append(ui);
 const $=id=>document.getElementById(id),FX=window.CrimeFX,sleep=ms=>new Promise(r=>setTimeout(r,ms));
 $('runRendererTests').onclick=async()=>{
  const results=[];const check=(ok,name)=>{if(!ok)throw Error(name);results.push('PASS '+name);$('rendererResult').textContent=results.join('\n');};
  $('runRendererTests').disabled=true;FX.mute(true);
  const e={board:[['H1','L1','L2'],['L3','H2','L4'],['L2','H3','L1'],['H4','L4','L3'],['SCATTER','WILD','H2']],heat:0,expanded:{},cut:{}};
  try {
   const refs=[...$('reels').children];window.render(e);window.render(e);
   check(refs.length===15&&refs.every((cell,i)=>$('reels').children[i]===cell),'All 15 reel cells retain their identity');
   const source=JSON.stringify(e);let p=FX.spin(e,{render:window.render,random:window.CrimeMath.rng(19)});
   check($('reelMotion').querySelectorAll('img').length===0,'Moving reels create no image elements');
   const canvas=$('reelMotion').querySelector('canvas');check(canvas&&!canvas.hidden,'One viewport canvas renders the spin');
   check(canvas.width<=1101&&canvas.height<1101,'Reel backing surface stays bounded');
   check($('reels').querySelectorAll('.in-motion').length===15,'Only moving cells are hidden');
   await sleep(120);FX.finishReels();await p;
   check(canvas.hidden&&!$('machine').classList.contains('is-spinning'),'Early exit settles and releases the reel canvas');
   check($('reels').getAttribute('aria-busy')==='false'&&$('reels').querySelectorAll('.in-motion').length===0,'Early exit restores all settled cells');
   check(JSON.stringify(e)===source,'Animation leaves the resolved event unchanged');
   check(refs.every((cell,i)=>cell.dataset.symbol===e.board[Math.floor(i/3)][i%3]),'Settled board exactly matches the resolved symbols');
   const sticky={...e,bonus:true,expanded:{1:10,3:25}};p=FX.spin(sticky,{render:window.render,turbo:true,random:window.CrimeMath.rng(20)});
   check($('reels').querySelectorAll('.in-motion').length===9,'Two sticky columns stay still');
   const wild=$('expanded').querySelector('[data-reel="1"]');FX.finishReels();await p;window.render({...sticky,expanded:{1:20,3:50}});
   check(wild===$('expanded').querySelector('[data-reel="1"]')&&wild.querySelector('b').textContent==='20×','Multiplier updates reuse the existing wild reel');
   await FX.spin({...e,bonus:true,expanded:{0:10,1:20,2:50,3:100,4:200}},{render:window.render,turbo:true});
   check(canvas.hidden&&$('expanded').children.length===5,'Five locked columns complete without a spin loop');
   window.render(e);const machine=$('machine'),oldWidth=machine.style.width;
   p=FX.spin(e,{render:window.render,random:window.CrimeMath.rng(22)});machine.style.width='500px';await sleep(1200);
   check(Math.abs(canvas.getBoundingClientRect().width-$('reels').getBoundingClientRect().width)<2,'Active canvas follows a resized reel window');
   FX.finishReels();await p;machine.style.width=oldWidth;
   await FX.countNumber($('win'),0,300000.000001,20,n=>n.toFixed(6));
   check($('win').textContent==='300000.000001','Count-up preserves the final amount and precision');
   p=FX.win(40,1,{format:n=>n.toFixed(2)});FX.hideWin();await p;
   check($('winSplash').hidden,'Dismissed win resolves its promise and hides cleanly');
   $('rendererResult').textContent=results.join('\n')+'\nALL '+results.length+' CHECKS PASSED';ui.dataset.complete='true';
  } catch(error){$('rendererResult').textContent=results.join('\n')+'\nFAIL '+error.message;ui.dataset.failed='true';}
  finally{$('runRendererTests').disabled=false;}
 };
})();
