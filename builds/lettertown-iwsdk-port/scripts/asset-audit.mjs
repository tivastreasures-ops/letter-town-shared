import * as R from '../../lettertown-chapter-one-r8/rules/game.js';
import { existsSync } from 'node:fs';
const root=new URL('../../lettertown-chapter-one-r8/assets/',import.meta.url);
const assetPath=p=>new URL(p,root);
const paths=[];
for(const sp of R.CFG.species){paths.push(`seeds/${sp}.png`,`blooms/${sp}.png`);for(const color of R.CFG.flowerColors[sp]||[null])paths.push(`models/flowers/${R.flowerKey(sp,color)}.glb`);}
for(const key of ['seed_magic','sprout_seedling',...['black','blue','pink','purple','white','yellow'].map(c=>'bud_'+c)])paths.push(`models/flowers/${key}.glb`);
for(const key of ['can','supergrow'])paths.push(`models/${key}.glb`);
const missing=paths.filter(p=>!existsSync(assetPath(p)));console.log(JSON.stringify({species:R.CFG.species.length,requiredAssetPaths:paths.length,missing},null,2));if(missing.length)process.exitCode=1;
