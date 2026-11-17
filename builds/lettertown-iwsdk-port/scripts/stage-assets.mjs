import {cpSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
for(const dir of ['assets','content']) {
 const from=resolve(root,'../lettertown-chapter-one-r8',dir);
 if(!existsSync(from)) throw new Error('Missing '+from);
 mkdirSync(resolve(root,'public',dir),{recursive:true});
 cpSync(from,resolve(root,'public',dir),{recursive:true,force:true});
}
console.log('Staged unchanged Round 8 art and content');