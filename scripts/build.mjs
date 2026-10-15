import { cp, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const target = resolve(root, 'dist');
await mkdir(target, { recursive: true });
for (const name of ['manifest.json', 'src', 'assets', 'tests/fixtures', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'PRIVACY.md']) {
  await cp(resolve(root, name), resolve(target, name), { recursive: true });
}
for (const name of ['build', 'web', 'cmaps', 'standard_fonts', 'wasm', 'LICENSE']) {
  await cp(resolve(root, 'node_modules/pdfjs-dist', name), resolve(target, 'vendor/pdfjs', name), { recursive: true });
}
const manifest = JSON.parse(await readFile(resolve(target, 'manifest.json'), 'utf8'));
console.log(`Built ${manifest.name} ${manifest.version} at ${target}`);
