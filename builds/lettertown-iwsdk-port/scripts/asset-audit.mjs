import * as R from '../rules/game.js';
import { existsSync } from 'node:fs';
const root=new URL('../../lettertown-chapter-one-r8/assets/',import.meta.url);
const overrides=new URL('../asset-overrides/assets/',import.meta.url);
const assetPath=p=>existsSync(new URL(p,overrides))?new URL(p,overrides):new URL(p,root);
const paths=[];
for(const sp of R.CFG.species){paths.push(`seeds/${sp}.png`,`blooms/${sp}.png`);for(const color of R.CFG.flowerColors[sp]||[null])paths.push(`models/flowers/${R.flowerKey(sp,color)}.glb`);}
for(const key of ['seed_magic','sprout_seedling',...['black','blue','pink','purple','white','yellow'].map(c=>'bud_'+c)])paths.push(`models/flowers/${key}.glb`);
for(const key of ['can','supergrow'])paths.push(`models/${key}.glb`);
for(const key of ['pink_cottage','white_cottage','flower_box_cottage','forest_green_cottage','seed_shop','merry_greenhouse','cottage_green'])paths.push(`models/${key}.glb`);
for(const key of ['pink','white','flowerbox','forest'])paths.push(`houses/${key}.png`);
for(const key of ['community_board','pink_cloud','townbook'])paths.push(`models/${key}.glb`);
for(const key of ['vase_orange','vase_fluted'])paths.push(`models/flowers/${key}.glb`);
for(const key of ['river_ring_candidate','distant_hills_panel','bridge_edge','tree_lush_edge','tree_flowering_edge','rock_edge','shrub_edge'])paths.push(`models/world/${key}.glb`);
for(const key of ['pink_cottage','white_cottage','flower_box_cottage','forest_green_cottage','seed_shop'])paths.push(`scene/facade_${key}.png`);
paths.push('world_layout_v1.json');
const missing=paths.filter(p=>!existsSync(assetPath(p)));console.log(JSON.stringify({species:R.CFG.species.length,requiredAssetPaths:paths.length,missing},null,2));if(missing.length)process.exitCode=1;
