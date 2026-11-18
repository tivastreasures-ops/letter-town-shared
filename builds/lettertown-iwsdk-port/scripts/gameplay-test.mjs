import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:800,height:600}});
const errors=[],failed=[];
page.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.message);});
page.on('console',m=>{if(m.type()==='error') errors.push(m.text()+' '+JSON.stringify(m.location()));});
page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
await page.goto((process.env.TEST_URL||'http://localhost:4173/')+'?speed=30');
await page.waitForFunction(()=>window.__lt && window.__lt.stage.visible,null,{timeout:60000});
await page.evaluate(()=>{document.getElementById('skip').click();document.getElementById('enter').click();});
const results=[];
const run=async(name,fn)=>{try{const detail=await fn();results.push({name,status:'PASS',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'FAIL',detail:e.message});console.log('FAIL',name,e.message);}};
await run('Complete tutorial through original screen actions (scripted desktop)',()=>page.evaluate(async()=>{
 const L=window.__lt,U=L.UI,R=L.R;
 const pause=()=>new Promise(r=>setTimeout(r,550));
 const tap=label=>{U.frame();if(!U.tap(label))throw Error('Missing '+label+' on '+U.state.screen+' '+U.labels());U.frame();};
 tap('New game'); L.S.settings.mute=true;L.S.settings.auto=false;
 tap('Done, start tour');
 const seen=new Set();
 for(let i=0;i<180&&!L.S.tutorialDone;i++){
  U.frame();const st=U.state;seen.add(st.screen);
  if(st.modal){tap('Yes');await pause();continue;}
  if(st.screen==='talk'){tap(U.labels().includes('Next')?'Next':'Continue');continue;}
  if(st.screen==='name'){tap('A');tap('That is my name');continue;}
  if(st.screen==='present'){tap('Thank you!');continue;}
  if(st.screen==='hub'){tap('Go');continue;}
  if(st.wait?.free){tap("I'm finished");continue;}
  const wait=st.wait?.wait;
  if(wait==='page'){tap('▶');}
  else if(wait==='maptab'){tap('Map');}
  else if(wait==='planted'){tap('Seeds');const p=R.pouch(L.S).plots.findIndex(p=>!p.plant);U.poke(40+p*190+89,600);}
  else if(wait==='watered'){tap('Water');const p=R.pouch(L.S).plots.findIndex(p=>p.plant&&!p.plant.watered&&p.plant.stage<2);U.poke(40+p*190+89,600);}
  else if(wait==='bloom'){await pause();L.tick(.51,true);}
  else if(wait==='harvested'){tap('Pick');const p=R.pouch(L.S).plots.findIndex(p=>p.plant?.stage===2);U.poke(40+p*190+89,600);}
  else if(wait==='bought'){tap('Buy');}
  else if(wait?.startsWith('crafted:')){for(const ch of wait.split(':')[1].toUpperCase())tap(ch);tap('Craft');}
  else if(wait==='gave:flower'){tap('Hand to the customer');}
  else if(wait==='stocked:milk'){tap('Stock');}
  else if(wait==='sold:milk'){await pause();L.tick(.51,true);}
  else if(wait==='cottage'){U.poke(300,400);}
  else if(wait==='gift'){U.poke(300,400);}
  else if(!st.wait){await pause();L.tick(.51,true);continue;}
  else throw Error('Unrecognized tutorial state '+JSON.stringify({screen:st.screen,wait,labels:U.labels()}));
  await pause(); L.tick(.51,true);
 }
 if(!L.S.tutorialDone)throw Error('Tutorial did not finish: '+U.state.screen+' '+JSON.stringify(U.state.wait));
 if(Object.keys(L.S.lessons).length!==7)throw Error('Missing lesson completions');
 return {lessons:L.S.lessons,cottage:L.S.home.cottage,gift:L.S.home.gift,screens:[...seen]};
}));
await run('Grab/release seed packet, plant, water and pull flower (simulated pointer)',()=>page.evaluate(()=>{
 const L=window.__lt,U=L.UI,R=L.R;U.go('garden');U.frame();
 const g=R.pouch(L.S);if(!R.buy(L.S,'sp:rose',1).ok)throw Error('Cannot buy rose');U.state.tier='rose';
 const i=g.plots.findIndex(p=>!p.plant),p=L.plots[i],seed=L.tools.find(t=>t.kind==='seeds');
 const grab=seed.gp.clone().applyQuaternion(seed.g.quaternion).add(seed.g.position);
 L.sim(0,grab.toArray(),[0,0,0,1],true);L.tick(.016,true);
 if(!seed.heldBy)throw Error('Seed packet did not grab');
 L.sim(0,[p.g.position.x,.82,p.g.position.z],[0,0,0,1],true);L.tick(.016,true);
 L.sim(0,[p.g.position.x,.82,p.g.position.z],[0,0,0,1],false);L.tick(.016,true);
 if(g.plots[i].plant?.species!=='rose')throw Error('Release did not plant selected rose');
 const can=L.tools.find(t=>t.kind==='can');
 const handle=can.gp.clone().applyQuaternion(can.g.quaternion).add(can.g.position);
 L.sim(0,handle.toArray(),[0,0,0,1],true);L.tick(.016,true);
 const held=L.pointers[2].held;if(held?.tool!==can)throw Error('Can did not grab');
 const desired=new L.THREE.Quaternion().setFromAxisAngle(new L.THREE.Vector3(0,0,1),-Math.PI/2);
 const pointerQ=desired.clone().multiply(held.relQ.clone().invert());
 const spout=new L.THREE.Vector3(p.g.position.x,.88,p.g.position.z);
 const toolPosition=spout.sub(can.g.userData.tip.position.clone().applyQuaternion(desired));
 const handPosition=toolPosition.sub(held.relP.clone().applyQuaternion(pointerQ));
 L.sim(0,handPosition.toArray(),pointerQ.toArray(),true);
 for(let n=0;n<40;n++)L.tick(.02,true);
 L.sim(0,handPosition.toArray(),pointerQ.toArray(),false);L.tick(.016,true);
 if(!g.plots[i].plant.watered)throw Error('Tilted can did not water plant');
 R.advance(L.S,g.lastAt+R.CFG.growSecs*1000);U.tap('Pick');L.tick(.51,true);
 const target=p.bloomPos.clone().applyQuaternion(p.g.quaternion).add(p.g.position),before=R.bankCount(g.bank);
 L.sim(0,target.toArray(),[0,0,0,1],true);L.tick(.016,true);
 if(!p.heldBy)throw Error('Bloom did not grab');
 L.sim(0,target.clone().add(new L.THREE.Vector3(0,.25,0)).toArray(),[0,0,0,1],true);L.tick(.016,true);
 L.sim(0,target.toArray(),[0,0,0,1],false);L.tick(.016,true);L.sim(0,null);
 if(R.bankCount(g.bank)!==before+4)throw Error('Pull must harvest exactly once');
 return {species:g.plots[i].plant.species,harvestsLeft:g.plots[i].plant.left,lettersAdded:4};
}));
await run('Move tool tray and cancel held object on tracking loss (simulated pointer)',()=>page.evaluate(()=>{
 const L=__lt,U=L.UI;U.go('garden');U.frame();const before=L.S.settings.toolX;
 const start=[before+.145,.715,-.14];L.sim(0,start,[0,0,0,1],true);L.tick(.016,true);
 if(!L.pointers[2].held?.tray)throw Error('Tray did not grab');
 L.sim(0,[before+.245,.715,-.14],[0,0,0,1],true);L.tick(.016,true);
 L.sim(0,[before+.245,.715,-.14],[0,0,0,1],false);L.tick(.016,true);
 if(Math.abs(L.S.settings.toolX-before-.1)>.001)throw Error('Tray did not follow hand');
 const seed=L.tools.find(t=>t.kind==='seeds'),pos=seed.gp.clone().applyQuaternion(seed.g.quaternion).add(seed.g.position);
 L.sim(0,pos.toArray(),[0,0,0,1],true);L.tick(.016,true);if(!seed.heldBy)throw Error('Packet not held for tracking-loss test');
 const plants=L.R.pouch(L.S).plots.filter(p=>p.plant).length;
 L.sim(0,null);L.tick(.6,true);
 if(seed.heldBy||L.pointers[2].held||L.pointers[2].pend)throw Error('Tracking loss did not cancel cleanly');
 if(L.R.pouch(L.S).plots.filter(p=>p.plant).length!==plants)throw Error('Tracking loss planted a seed');
 return {trayDelta:.1,trackingLossCancelled:true};
}));
await run('Book crafting and dictionary rejection through screen actions',()=>page.evaluate(()=>{
 const L=window.__lt,U=L.UI;U.go('book');U.state.bookTab='spell';U.frame();const before=L.S.real.words.length;
 for(const ch of 'FLOWER'){if(!U.tap(ch))throw Error('Missing letter '+ch);}U.tap('Craft');U.frame();
 if(L.S.real.words.length!==before+1)throw Error('FLOWER not crafted');
 const invalid=L.R.craft(L.S,'zzzzzz');if(invalid.ok)throw Error('Invalid word accepted');
 U.tap('Words');U.frame();if(!U.labels().some(l=>l.startsWith('Stock on cart')))throw Error('No cart action');U.tap('Stock on cart');
 const ev=L.R.advance(L.S,L.S.real.wordCart.nextAt+1);U.everyHalfSecond(ev);U.frame();
 if(L.S.real.wordCart.cashbox<=0)throw Error('Sale did not reach cashbox');
 return {discovered:L.S.discovered.flower,wordSales:ev.wordSales.length,cashbox:L.S.real.wordCart.cashbox};
}));
await run('Flower arranging, vase selection and Flower Cart sale',()=>page.evaluate(()=>{
 const L=window.__lt,U=L.UI;U.go('carts');U.state.cartSel='flower';U.frame();
 const sp=Object.keys(L.S.real.flowers).find(k=>L.S.real.flowers[k]>0);if(!sp)throw Error('No harvested flower');
 if(!U.tap('Blue'))throw Error('Blue vase choice missing');U.state.arr={[sp]:1};U.frame();if(!U.tap('Sell on the flower cart'))throw Error('Cannot stock bouquet');
 const before=L.S.real.coins,ev=L.R.advance(L.S,L.S.real.flowerCart.nextAt+1);U.everyHalfSecond(ev);U.frame();
 if(L.S.real.coins<=before||ev.flowerSales.length!==1)throw Error('Bouquet sale failed');
 return {vase:U.state.vase,coinsEarned:L.S.real.coins-before};
}));
await run('Storybook and chapter ending with fixture discoveries',()=>page.evaluate(()=>{
 const L=window.__lt,U=L.UI,R=L.R;
 // Fixture isolates ending/navigation from hours of random letter harvesting. No production economy changes.
 for(const w of ['happy','rose','run','flowers','quickly'])L.S.discovered[w]=R.kinds(w);
 U.go('story');U.state.storyTab='tale';U.frame();U.tap('Surprise me');U.frame();
 if(!U.tap('Finish the story'))throw Error('Story cannot finish: '+U.state.msg);U.tap('Yes');U.frame();
 if(!L.S.madlib.restored||L.S.journal.length!==1)throw Error('Ending did not persist restoration/journal');
 U.tap('Skip');U.frame();U.tap('Skip');U.frame();
 U.tap('Storybook');U.frame();const labels=U.labels();const story=L.S.madlib.stories[0];
 if(!story)throw Error('No saved story');U.tap(story.title||'Telling');U.frame();
 return {restored:L.S.madlib.restored,journal:L.S.journal.length,stories:L.S.madlib.stories.length,labels};
}));
await run('Save and resume after browser reload',async()=>{
 await page.evaluate(()=>{__lt.UI.go('settings');__lt.UI.frame();__lt.UI.tap('Back to title');});
 await page.waitForTimeout(600);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('lettertown_ch1_v1')));
 if(!before?.madlib.restored)throw Error('Ending absent from save');
 await page.reload();await page.waitForFunction(()=>window.__lt,null,{timeout:60000});
 await page.evaluate(()=>{document.getElementById('skip').click();document.getElementById('enter').click();__lt.UI.tap('Continue');__lt.UI.frame();});
 const after=await page.evaluate(()=>({name:__lt.S.name,restored:__lt.S.madlib.restored,cottage:__lt.S.home.cottage,coins:__lt.S.real.coins}));
 if(after.name!==before.name||!after.restored||after.cottage!==before.home.cottage)throw Error('Resume lost progress');return after;
});
await page.screenshot({path:'test-results/gameplay.png',timeout:30000}).catch(e=>errors.push(e.message));
writeFileSync('test-results/gameplay.json',JSON.stringify({mode:'Real Chromium, scripted desktop and simulated pointer; NOT a physical Quest test',results,errors,failed},null,2));
console.log(JSON.stringify({results,errors,failed},null,2));await browser.close();
if(results.some(r=>r.status==='FAIL')||errors.length||failed.length)process.exitCode=1;
