import {Document,NodeIO} from '@gltf-transform/core';
import fs from 'fs';
const BASE='glovesrc/node_modules/@webxr-input-profiles/assets/dist/profiles/generic-hand/';
// minimal .npz (stored, uncompressed? numpy savez is uncompressed zip) reader
import {execSync} from 'child_process';
function loadNpz(path){const d=`/tmp/npz_${Math.random().toString(36).slice(2)}`;fs.mkdirSync(d);execSync(`cd ${d} && unzip -q ${path}`);const o={};for(const f of fs.readdirSync(d)){const b=fs.readFileSync(`${d}/${f}`);const hl=b.readUInt16LE(8);const hdr=b.slice(10,10+hl).toString();const dt=/'descr': '([^']+)'/.exec(hdr)[1];const shape=/'shape': \(([^)]*)\)/.exec(hdr)[1].split(',').filter(x=>x.trim()).map(Number);const data=b.slice(10+hl);const T={'<f4':Float32Array,'<u2':Uint16Array,'<u4':Uint32Array}[dt];o[f.replace('.npy','')]={shape,arr:new T(data.buffer.slice(data.byteOffset,data.byteOffset+data.length))};}return o;}
const io=new NodeIO();
for(const hand of ['left','right']){
  const doc=await io.read(BASE+`${hand}.glb`);
  const root=doc.getRoot(); const mesh=root.listMeshes()[0]; const buf=root.listBuffers()[0];
  const old=mesh.listPrimitives()[0]; mesh.removePrimitive(old);
  const npz=loadNpz(`/home/claude/work/glove_${hand}.npz`);
  const tex=doc.createTexture('glove_tex').setImage(fs.readFileSync(`/home/claude/work/glove_tex_${hand}.png`)).setMimeType('image/png');
  const gm=doc.createMaterial('glove').setBaseColorTexture(tex).setRoughnessFactor(0.85).setMetallicFactor(0);
  gm.getBaseColorTextureInfo().setMinFilter(9987).setMagFilter(9729);
  const cm=doc.createMaterial('cuff').setBaseColorFactor([0.69,0.51,0.85,1]).setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true);
  const cuffTex=doc.createTexture('cuff_tex').setImage(fs.readFileSync('/home/claude/work/cuff_tex.png')).setMimeType('image/png');
  cm.setBaseColorTexture(cuffTex).setBaseColorFactor([1,1,1,1]);
  const bmat=doc.createMaterial('bow').setBaseColorFactor([0.96,0.45,0.66,1]).setRoughnessFactor(0.8).setMetallicFactor(0);
  const mk=(p,mat)=>{const g=(k)=>npz[`${p}_${k}`];
    const prim=doc.createPrimitive().setMaterial(mat)
     .setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(g('P').arr).setBuffer(buf))
     .setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(g('N').arr).setBuffer(buf))
     .setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(g('UV').arr).setBuffer(buf))
     .setAttribute('JOINTS_0',doc.createAccessor().setType('VEC4').setArray(g('J').arr).setBuffer(buf))
     .setAttribute('WEIGHTS_0',doc.createAccessor().setType('VEC4').setArray(g('W').arr).setBuffer(buf))
     .setIndices(doc.createAccessor().setType('SCALAR').setArray(g('I').arr).setBuffer(buf));
    mesh.addPrimitive(prim);};
  mk('glove',gm); mk('cuff',cm); mk('bow',bmat);
  const out=`/home/claude/work/glove_${hand}.glb`;
  await io.write(out,doc); console.log(hand, fs.statSync(out).size);
}
