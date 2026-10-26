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
    const portalManifest=['portal/themes.json','portal/cloudflare-reference.json'].includes(rel);
    if (artifact && extname(name)==='.json' && !['version.json','wallet-payment-channels.json'].includes(name) && !portalManifest) throw new Error(`Unregistered public data file: ${rel}`);
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
  if (lstatPortal()) validatePortal();
}
console.log(`Release policy passed: ${count} files (${artifact ? 'artifact' : 'source'}).`);

function lstatPortal(){try{return lstatSync(join(root,'portal')).isDirectory();}catch(error){if(error.code==='ENOENT')return false;throw error;}}
function validatePortal(){
 const json=name=>{const raw=readFileSync(join(root,'portal',name),'utf8');if(Buffer.byteLength(raw)>65536)throw new Error('Oversized portal manifest');return JSON.parse(raw);};
 const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key));
 const themes=json('themes.json');
 if(!Array.isArray(themes)||themes.length!==1||!exact(themes[0],['id','label','version','schemaVersion'])||themes[0].id!=='cloudflare-reference'||themes[0].version!==1||themes[0].schemaVersion!==1||typeof themes[0].label!=='string'||!themes[0].label.trim()||Buffer.byteLength(themes[0].label)>256)throw new Error('Invalid portal theme registry');
 const manifest=json('cloudflare-reference.json');
 if(!exact(manifest,['theme','version','styles','script'])||manifest.theme!=='cloudflare-reference'||manifest.version!==1||!Array.isArray(manifest.styles)||!manifest.styles.length||manifest.styles.length>100||manifest.styles.some(path=>typeof path!=='string'||!/^\/assets\/[A-Za-z0-9_.-]+\.css$/.test(path)||path.includes('..'))||typeof manifest.script!=='string'||!/^\/assets\/portal-content-[a-f0-9]{16}\.js$/.test(manifest.script))throw new Error('Invalid portal asset manifest');
 for(const path of [...manifest.styles,manifest.script,'/portal/cloudflare-reference.html'])if(!lstatSync(join(root,path.slice(1))).isFile())throw new Error('Portal asset is not a regular file');
}
