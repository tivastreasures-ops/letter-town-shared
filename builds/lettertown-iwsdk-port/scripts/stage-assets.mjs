import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
const source = resolve(root, '../lettertown-chapter-one-r8');
const hash = createHash('sha256');
function visit(dir) { for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) { const path = resolve(dir, entry.name); if(entry.isDirectory()) visit(path); else { hash.update(relative(source,path)); hash.update(readFileSync(path)); } } }
for (const dir of ['assets','content']) { if(!existsSync(resolve(source,dir))) throw Error('Missing original '+dir); visit(resolve(source,dir)); }
const revision = hash.digest('hex').slice(0,16);
rmSync(resolve(root,'public'),{ recursive:true, force:true });
const target = resolve(root,'public/releases',revision); mkdirSync(target,{ recursive:true });
for(const dir of ['assets','content']) cpSync(resolve(source,dir),resolve(target,dir),{recursive:true});
writeFileSync(resolve(root,'.asset-revision'), revision);
writeFileSync(resolve(root,'public/_headers'), '/*\n  Cache-Control: no-cache\n  Permissions-Policy: xr-spatial-tracking=(self)\n/releases/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log('Staged unchanged Round 8 art/content as releases/'+revision);
