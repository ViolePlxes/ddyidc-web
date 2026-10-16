import { readdirSync, lstatSync, readFileSync } from 'node:fs';
import { resolve, relative, extname, basename, join } from 'node:path';

const artifact = process.argv.includes('--artifact');
const root = resolve(artifact ? 'dist' : '.');
const allowed = new Set(['.html','.js','.css','.json','.svg','.png','.jpg','.jpeg','.webp','.ico','.woff','.woff2','.ttf','.txt','.gif']);
const excluded = new Set(['.git','node_modules','dist','dist.old','.releases','artifacts','.vite','coverage']);
let count = 0;
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (!artifact && excluded.has(entry)) continue;
    const path = join(dir, entry), name = basename(path).toLowerCase(), rel = relative(root,path).replaceAll('\\','/');
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Release symlink: ${rel}`);
    if (stat.isDirectory()) { walk(path); continue; }
    if ((name.startsWith('.env') && name !== '.env.example') || /\.(sql|sqlite|db|key|pem|log|tar|gz|zip)$/.test(name)) throw new Error(`Private/runtime file: ${rel}`);
    // Vite's eight-character content hash is opaque; policy applies to the
    // asset's meaningful name, not random hash characters (e.g. BsTmOCK3).
    const policyName=name.replace(/-[a-z0-9_-]{8}(?=\.[a-z0-9]+$)/i,'');
    const backupComponent=/^assets\/backups-[a-z0-9_-]{8,}\.js$/i.test(rel);
    if (artifact && (!allowed.has(extname(name)) || /fixture|mock/.test(policyName) || (/backup/.test(policyName) && !backupComponent))) throw new Error(`Unexpected public artifact: ${rel}`);
    if (artifact && extname(name)==='.json' && !['version.json','wallet-payment-channels.json'].includes(name)) throw new Error(`Unregistered public data file: ${rel}`);
    if (artifact && ['.js','.html','.json','.txt'].includes(extname(name))) {
      const text = readFileSync(path,'utf8');
      if (/TODO[0-9a-f]{32}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i.test(text)) throw new Error(`Sensitive/test content: ${rel}`);
    }
    count++;
  }
}
walk(root);
if (artifact) {
  const version = JSON.parse(readFileSync(join(root,'version.json'),'utf8'));
  if (!version.commit || !version.version) throw new Error('Missing release provenance');
}
console.log(`Release policy passed: ${count} files (${artifact ? 'artifact' : 'source'}).`);
