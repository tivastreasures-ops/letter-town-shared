import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const sha = execFileSync('git', ['rev-parse', '--short=12', 'HEAD']).toString().trim();
const dirty = execFileSync('git', ['status', '--porcelain', '--', '.']).toString().trim();
process.env.VITE_BUILD_ID = process.env.VITE_BUILD_ID || sha + (dirty ? '-worktree' : '');
const revision = readFileSync(new URL('./.asset-revision', import.meta.url), 'utf8').trim();
const rewrite = text => text.replaceAll('assets/', 'releases/' + revision + '/assets/').replaceAll('content/', 'releases/' + revision + '/content/');
export default defineConfig({ plugins: [{ name: 'original-content-revision', transform(code, id) { if(id.includes('/src/') && !id.includes('node_modules')) return rewrite(code); }, transformIndexHtml: { order: 'pre', handler: rewrite } }], base: './', resolve: { dedupe: ['three'] }, build: { target: 'esnext' } });
