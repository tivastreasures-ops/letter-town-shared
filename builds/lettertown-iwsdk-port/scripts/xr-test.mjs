import { chromium } from 'playwright';
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
const injection=await build({stdin:{contents:"import {XRDevice,metaQuest3} from 'iwer'; window.__xrDevice=new XRDevice(metaQuest3,{stereoEnabled:false}); __xrDevice.installRuntime({forceInstall:true}); __xrDevice.primaryInputMode='hand';",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser'});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:800,height:600}});const errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('CONSOLE',m.text());}});
await page.addInitScript({content:injection.outputFiles[0].text});
await page.goto(process.env.TEST_URL||'http://localhost:4173/');
await page.waitForFunction(()=>window.__lt&&__lt.stage.visible,null,{timeout:60000});
await page.evaluate(()=>document.getElementById('skip').click());
await page.locator('#entervr').click({force:true});
let result;
try{
 await page.waitForFunction(()=>__lettertownSDK.renderer.xr.isPresenting&&__lettertownSDK.session,null,{timeout:30000});
 await page.waitForFunction(()=>__lt.stage.position.y>.3,null,{timeout:30000});
 // Aim an emulated tracked hand at the original canvas New game button.
 await page.evaluate(()=>{
  const L=__lt,T=L.THREE,hand=__xrDevice.hands.right; L.stage.updateMatrixWorld(true);
  const board=L.stage.children.find(o=>o.material?.map?.image===L.board); const target=board.localToWorld(new T.Vector3(0,(0.5-615/900)*(1.16*900/1600),0));
  const origin=new T.Vector3(.25,1.45,-.2),dir=target.sub(origin).normalize();
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),dir);
  hand.position.set(origin.x,origin.y,origin.z);hand.quaternion.set(q.x,q.y,q.z,q.w);
 });
 await page.waitForTimeout(500);
 await page.evaluate(()=>__xrDevice.hands.right.updatePinchValue(1));
 await page.waitForFunction(()=>__lt.pointers.slice(0,2).some(p=>p.down),null,{timeout:10000});
 await page.waitForTimeout(250);
 await page.evaluate(()=>__xrDevice.hands.right.updatePinchValue(0));
 await page.waitForFunction(()=>__lt.UI.state.screen==='adjust',null,{timeout:20000});
 result=await page.evaluate(()=>({mode:'IWER emulator only; NOT PHYSICAL QUEST',pinchSelectedNewGame:__lt.UI.state.screen==='adjust',stagePosition:__lt.stage.position.toArray(),presenting:__lettertownSDK.renderer.xr.isPresenting,sdkSession:!!__lettertownSDK.session,inputSources:[...__lettertownSDK.session.inputSources].map(s=>({hand:!!s.hand,handedness:s.handedness})),validGameHands:__lt.pointers.slice(0,2).map(p=>p.valid),requiredHands:__lettertownSDK.xrDefaults.features.handTracking,renderedFrames:__lettertownSDK.renderer.info.render.frame}));
 await page.evaluate(()=>__lettertownSDK.session.end());
 await page.waitForFunction(()=>!__lettertownSDK.renderer.xr.isPresenting);
 result.exit=true;
}catch(e){errors.push(e.message);result=await page.evaluate(()=>({mode:'IWER emulator only; NOT PHYSICAL QUEST',screen:__lt?.UI.state.screen,pointers:__lt?.pointers.slice(0,2).map(p=>({valid:p.valid,down:p.down,gap:p.gap,ray:p.ray,pend:p.pend,pos:p.pos.toArray()})),presenting:__lettertownSDK?.renderer.xr.isPresenting}));}
writeFileSync('test-results/xr-emulator.json',JSON.stringify({result,errors},null,2));console.log(JSON.stringify({result,errors},null,2));await browser.close();
if(errors.length||!result.presenting||!result.inputSources?.every(s=>s.hand)||!result.validGameHands?.every(Boolean))process.exitCode=1;
