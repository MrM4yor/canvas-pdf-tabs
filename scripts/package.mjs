import {cp,mkdir,mkdtemp,readFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const {version}=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid release version.');
await mkdir(resolve(root,'work'),{recursive:true});
await mkdir(resolve(root,'release'),{recursive:true});
const stage=await mkdtemp(resolve(root,'work','package-'));
// Fresh staging prevents deleted modules from an older dist build entering a release.
for(const name of ['manifest.json','src','assets','tests/fixtures','LICENSE','THIRD_PARTY_NOTICES.md','PRIVACY.md'])await cp(resolve(root,name),resolve(stage,name),{recursive:true});
for(const name of ['build','web','cmaps','standard_fonts','wasm','LICENSE'])await cp(resolve(root,'node_modules/pdfjs-dist',name),resolve(stage,'vendor/pdfjs',name),{recursive:true});
const target=resolve(root,'release',`canvas-pdf-tabs-${version}.zip`);
try{await stat(target);throw Error('Release ZIP already exists. Preserve it or choose a new version before packaging again.');}catch(error){if(error.code!=='ENOENT')throw error;}
// Windows ships bsdtar; ZIP format is selected explicitly without shell interpolation.
// Pass root entries explicitly: archiving "." prefixes manifest.json with "./",
// which the Chrome Web Store uploader does not recognize as a root manifest.
execFileSync('tar.exe',['--format=zip','-cf',target,'-C',stage,...(await readdir(stage)).sort()],{stdio:'inherit'});
const entries=execFileSync('tar.exe',['-tf',target],{encoding:'utf8'}).trim().split(/\r?\n/);
if(!entries.includes('manifest.json')||entries.some(name=>name.startsWith('./')||name.includes('\\')))throw Error('Invalid ZIP root paths.');
console.log(`Packaged ${target}`);
