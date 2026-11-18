import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),source=resolve(root,'../lettertown-chapter-one-r8');
const manifest=JSON.parse(readFileSync(resolve(root,'source-current.json'),'utf8'));
const files=manifest.files.map(({path,blob})=>{
 const override=resolve(root,'asset-overrides',path),from=path.startsWith('rules/')?resolve(root,path):existsSync(override)?override:resolve(source,path),bytes=readFileSync(from);
 const actual=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
 if(actual!==blob)throw Error(`Pinned source mismatch: ${path}. Expected ${blob}, got ${actual}`);
 return {path,from,bytes};
});
const hash=createHash('sha256');for(const {path,bytes} of files)hash.update(path).update(bytes);
const revision=hash.digest('hex').slice(0,16);
rmSync(resolve(root,'public'),{recursive:true,force:true});
const target=resolve(root,'public/releases',revision);
for(const {path,from} of files.filter(f=>!f.path.startsWith('rules/'))){const dest=resolve(target,path);mkdirSync(dirname(dest),{recursive:true});copyFileSync(from,dest);}
writeFileSync(resolve(root,'.asset-revision'),revision);
writeFileSync(resolve(root,'public/_headers'),'/*\n  Cache-Control: no-cache\n  Permissions-Policy: xr-spatial-tracking=(self)\n/releases/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`Verified ${files.length} source files against latest Round 8 ${manifest.commit}; staged release ${revision}`);
