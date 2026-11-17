// Letter Town — isolated experimental IWSDK CP1. Not Quest-tested; not a submission.
// Renderer and XR session owned by IWSDK, not the legacy Three.js engine.
import {World, Mesh, PlaneGeometry, BoxGeometry, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial, Group, AmbientLight, DirectionalLight, CanvasTexture, DoubleSide} from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import * as Game from '../../lettertown-chapter-one-r8/rules/game.js';
const STORAGE_KEY='lettertown_ch1_v1';
const root=document.getElementById('scene-container'),status=document.getElementById('status');
const now=()=>Date.now();
let state;
try {const saved=localStorage.getItem(STORAGE_KEY);state=saved?Game.migrate(JSON.parse(saved),now()):null;} catch(e){console.warn('Save recovery failed',e);}
state ||= Game.newGame(now());
function save(){try{state.lastSeen=now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){console.warn('Save failed',e);}}
addEventListener('pagehide',save);
function label(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const c=canvas.getContext('2d');c.fillStyle='#fff6dd';c.fillRect(0,0,1024,512);
 c.strokeStyle='#c79358';c.lineWidth=18;c.strokeRect(20,20,984,472);
 c.textAlign='center';c.fillStyle='#573c2c';c.font='bold 70px Georgia';c.fillText('Letter Town',512,160);
 c.font='35px Georgia';c.fillText('IWSDK port: original game rules',512,260);
 c.font='28px Georgia';c.fillText('CP1 — NOT FOR SUBMISSION',512,435);
 return new CanvasTexture(canvas);
}
function sceneFor(world){
 const garden=new Group(),ground=new Mesh(new PlaneGeometry(6,5),new MeshStandardMaterial({color:0xa9d68b}));
 ground.rotation.x=-Math.PI/2;ground.position.set(0,-0.04,-1.6);garden.add(ground);
 const table=new Mesh(new BoxGeometry(1.85,0.06,0.95),new MeshStandardMaterial({color:0xa57c52}));
 table.position.set(0,0.72,-0.85);garden.add(table);
 const blooms=[];
 for(let i=0;i<Game.CFG.plots;i++){
  const x=(i%4-1.5)*0.42,z=-0.55-Math.floor(i/4)*0.36;
  const soil=new Mesh(new BoxGeometry(0.32,0.04,0.27),new MeshStandardMaterial({color:0x775039}));
  soil.position.set(x,0.78,z);garden.add(soil);
  const bloom=new Mesh(new SphereGeometry(0.07,12,10),new MeshStandardMaterial({color:0xf5a9cf}));
  bloom.position.set(x,0.88,z);garden.add(bloom);blooms.push(bloom);
 }
 const board=new Mesh(new PlaneGeometry(1.2,0.6),new MeshBasicMaterial({map:label(),side:DoubleSide}));
 board.position.set(0,1.58,-1.45);garden.add(board);
 garden.add(new AmbientLight(0xffffff,1.4));
 const sun=new DirectionalLight(0xffffff,1.8);sun.position.set(1,4,2);garden.add(sun);
 world.createTransformEntity(garden);
 return ()=>{
  const g=Game.pouch(state);
  blooms.forEach((b,i)=>{
   const plant=g.plots[i]?.plant;b.visible=!!plant;
   if(plant){b.scale.setScalar(plant.stage===2?1.35:plant.stage===1?0.9:0.55);
    b.material.color.set(plant.stage===2?0xf294c8:plant.stage===1?0x92cb86:0xe9cf77);}
  });
 };
}
async function start(){
 if(!(root instanceof HTMLDivElement))throw Error('IWSDK scene-container missing');
 const world=await World.create(root,projectOptions);
 const refreshScene=sceneFor(world);
 const refresh=()=>{
  Game.advance(state,now());refreshScene();const p=Game.pouch(state);
  if(status)status.textContent='Letter Town IWSDK CP1 · '+p.coins+' coins · '+Game.bankCount(p.bank)+' letters · '+p.plots.filter(q=>q.plant).length+' growing';
 };
 refresh();
 document.getElementById('water')?.addEventListener('click',()=>{
  const i=Game.pouch(state).plots.findIndex(p=>p.plant&&p.plant.stage<2&&!p.plant.watered);
  if(i>=0)Game.water(state,i);save();refresh();
 });
 document.getElementById('save')?.addEventListener('click',save);
 setInterval(refresh,1000); // game state only; IWSDK owns rendering
}
start().catch(e=>{console.error('IWSDK startup failed',e);if(status)status.textContent='Startup failed: check console. NOT A SUBMISSION.';});
