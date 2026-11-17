import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:720}});const errors=[],failed=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
const ready=async()=>{await page.waitForFunction(()=>window.__lt&&__lt.stage.visible,null,{timeout:60000});await page.evaluate(()=>{document.getElementById('skip').click();document.getElementById('enter').click();});};
const check=async(name,fn)=>{try{const detail=await fn();results.push({name,status:'PASS',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'FAIL',detail:e.message});console.log('FAIL',name,e.message);}};
await page.goto(process.env.TEST_URL||'http://localhost:4173/');await ready();
await check('Null-state protected screens and white-card regression',()=>page.evaluate(()=>{const L=__lt;L.UI.go('cottage');L.UI.labels();if(L.UI.state.screen!=='title')throw Error('Uninitialized screen not recovered');const blank=L.CP.filter(c=>c.ico.visible&&!c.ico.material.map);if(blank.length)throw Error('White garden cards remain');return{screen:L.UI.state.screen,whiteCards:blank.length};}));
const cottages=[['pink','Pink Cottage'],['white','White Cottage'],['flowerbox','Flower Box Cottage'],['forest','Forest Green Cottage']];
for(const [key,label] of cottages)await check('Cottage picker, confirmation, model and reload: '+key,async()=>{
 await page.evaluate(({key,label})=>{const L=__lt,U=L.UI,s=L.R.newGame(Date.now());s.name='Cottage Tester';s.tutorialDone=true;s.settings.mute=true;s.settings.auto=false;L.setS(s);U.go('cottage');U.frame();const names=U.controls().filter(b=>b.label?.includes('Cottage'));if(names.length!==4)throw Error('Four cottage cards required');if(!U.tap(label))throw Error('Missing '+label);U.tap('No');if(s.home.cottage)throw Error('Cancel selected a cottage');U.tap(label);U.tap('Yes');if(s.home.cottage!==key)throw Error('Wrong selection');U.go('home');U.frame();},{key,label});
 await page.waitForFunction(key=>__lt.homeObj?.userData.cottageKey===key,key,{timeout:20000});
 const before=await page.evaluate(()=>{const L=__lt;const p=L.homeObj.position;const distance=Math.hypot(p.x-L.comm.position.x,p.z-L.comm.position.z);if(distance>5)throw Error('Cottage not beside Player Garden');L.UI.go('settings');L.UI.frame();L.UI.tap('Back to title');return{selected:L.S.home.cottage,model:L.homeObj.userData.model,distance};});
 await page.reload();await ready();await page.evaluate(()=>{if(!__lt.UI.tap('Continue'))throw Error('No Continue');__lt.UI.frame();});
 await page.waitForFunction(key=>__lt.S?.home.cottage===key&&__lt.homeObj?.userData.cottageKey===key,key,{timeout:20000});return before;
});
await check('Cottage previews render with approved PNGs',async()=>{
 await page.evaluate(()=>{__lt.UI.go('cottage');__lt.UI.frame();});
 await page.waitForFunction(()=>['pink','white','flowerbox','forest'].every(k=>performance.getEntriesByType('resource').some(r=>r.name.includes('/houses/'+k+'.png'))));
 await page.waitForTimeout(300);const board=await page.evaluate(()=>{__lt.UI.frame();return __lt.board.toDataURL('image/png').split(',')[1];});writeFileSync('test-results/r816-cottage-picker.png',Buffer.from(board,'base64'));
 return await page.evaluate(()=>({cards:__lt.UI.controls().filter(b=>b.label?.includes('Cottage')),previews:performance.getEntriesByType('resource').filter(r=>/\/houses\/(pink|white|flowerbox|forest)\.png/.test(r.name)).map(r=>r.name)}));
});
await check('Old cottage save aliases and clearing selected model',async()=>{
 for(const key of ['rose','sky','honey']){await page.evaluate(key=>{const L=__lt,s=L.R.newGame(Date.now());s.home.cottage=key;L.setS(L.R.migrate(s,Date.now()));L.UI.go('home');L.UI.frame();},key);await page.waitForFunction(key=>__lt.homeObj?.userData.cottageKey===key,key);}
 await page.evaluate(()=>{__lt.setS(null);__lt.UI.go('title');__lt.UI.frame();if(__lt.homeObj)throw Error('Old cottage survived cleared state');});return{aliases:['rose','sky','honey'],cleared:true};
});
await check('Map-only travel, scene props and stable workspace',()=>page.evaluate(()=>{
 const L=__lt,U=L.UI,s=L.R.newGame(Date.now());s.tutorialDone=true;s.home.cottage='forest';s.settings.mute=true;L.setS(s);U.go('map');U.frame();
 const stage=L.stage.position.toArray();U.tap('Home');U.frame();if(L.destination!=='home')throw Error('Home does not travel');U.tap('Garden');U.frame();if(L.destination!=='merry')throw Error('Desk route wrong');U.tap('Map');U.tap("Player's Garden");U.frame();if(L.destination!=='commgarden')throw Error('Player Garden route wrong');
 for(const [prop,dest,screen] of [[L.seedShop,'cottages','shop'],[L.greenhouse,'merry','garden'],[L.workshop,'carts','carts']]){
  U.go('map');U.frame();L.stage.updateMatrixWorld(true);const pos=L.stage.worldToLocal(prop.holder.getWorldPosition(new L.THREE.Vector3())).add(new L.THREE.Vector3(0,prop.cy,0));L.sim(0,pos.toArray(),[0,0,0,1],true);L.tick(.016,true);L.sim(0,pos.toArray(),[0,0,0,1],false);L.tick(.016,true);if(U.state.screen!==screen||L.destination!==dest)throw Error('Prop interaction failed '+prop.kind);if(!prop.holder.children.length)throw Error('Model absent '+prop.kind);
 }
 const before=L.town.position.toArray();const P=L.pointers[2];L.sim(0,[0,1,0],[0,0,0,1],true);P.ray={o:new L.THREE.Vector3(0,1,0),d:new L.THREE.Vector3(.8,-.6,0)};L.tick(.016,true);L.sim(0,[0,1,0],[0,0,0,1],false);L.tick(.016,true);L.sim(0,null);
 if(JSON.stringify(before)!==JSON.stringify(L.town.position.toArray()))throw Error('Empty ground moved town');if(L.town.position.y!==0||JSON.stringify(stage)!==JSON.stringify(L.stage.position.toArray()))throw Error('Navigation moved workspace/height');return{destinations:['home','merry','commgarden','cottages','carts'],emptyGroundTravel:false};
}));
await check('QWERTY hit targets and persisted layout',async()=>{
 const data=await page.evaluate(()=>{const L=__lt,U=L.UI;for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')L.S.real.bank[c]=2;U.go('book');U.state.bookTab='spell';U.frame();U.tap('Layout: A to Z');U.frame();const keys=U.controls().filter(b=>/^[A-Z]$/.test(b.label));if(keys.length!==26)throw Error('Missing alphabet');for(const a of keys)for(const b of keys)if(a!==b&&Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y))throw Error('Overlapping keys '+a.label+b.label);U.tap('F');U.tap('L');U.tap('O');U.tap('W');U.tap('E');U.tap('R');if(U.state.tray!=='FLOWER')throw Error('Letter selection broken');U.go('settings');U.frame();U.tap('Back to title');return{keys:keys.length,word:'FLOWER'};});await page.reload();await ready();await page.evaluate(()=>{__lt.UI.tap('Continue');__lt.UI.frame();if(!__lt.S.settings.qwerty)throw Error('Layout not saved');});return data;
});
await check('Deferred lesson transition cancelled after state removal',async()=>{
 await page.evaluate(()=>{const L=__lt;L.UI.startLesson('merry');L.UI.frame();L.UI.tap('Skip these');L.UI.frame();L.UI.emit('planted');L.setS(null);L.UI.go('title');L.UI.frame();});await page.waitForTimeout(800);return await page.evaluate(()=>{if(__lt.UI.state.screen!=='title')throw Error('Stale lesson reopened');return{screen:__lt.UI.state.screen};});
});
const performanceData=await page.evaluate(()=>({renderer:__lettertownSDK.renderer.info.render,geometries:__lettertownSDK.renderer.info.memory.geometries,textures:__lettertownSDK.renderer.info.memory.textures,assetErrors:__lt.assetErrors,mode:'Software Chromium; not Quest performance'}));
await browser.close();
// A deliberately missing new model must be reported, rather than silently ignored.
const faultBrowser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});const fault=await faultBrowser.newPage();const faultErrors=[];fault.on('console',m=>{if(m.type()==='error')faultErrors.push(m.text());});await fault.route('**/models/seed_shop.glb',r=>r.fulfill({status:404,body:'Intentional regression fault'}));await fault.goto(process.env.TEST_URL||'http://localhost:4173/');await fault.waitForFunction(()=>window.__lt,null,{timeout:60000});const reported=await fault.evaluate(()=>__lt.assetErrors.some(p=>p.includes('seed_shop.glb')));results.push({name:'Missing new model is explicitly reported (intentional 404)',status:reported?'PASS':'FAIL',detail:faultErrors});await faultBrowser.close();
writeFileSync('test-results/r816.json',JSON.stringify({results,errors,failed,performanceData},null,2));console.log(JSON.stringify({results,errors,failed,performanceData},null,2));if(errors.length||failed.length||results.some(r=>r.status==='FAIL'))process.exitCode=1;
