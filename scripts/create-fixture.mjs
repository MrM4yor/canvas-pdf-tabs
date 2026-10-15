import { mkdir, writeFile } from 'node:fs/promises';
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R 6 0 R 8 0 R] /Count 3 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R /Annots [10 0 R 11 0 R] >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>',
  '',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 9 0 R >>',
  '',
  '<< /Type /Annot /Subtype /Link /Rect [50 570 400 600] /Border [0 0 1] /A << /S /URI /URI (https://example.com/) >> >>',
  '<< /Type /Annot /Subtype /Link /Rect [50 520 400 550] /Border [0 0 1] /Dest [8 0 R /Fit] >>'
];
for (const [index, page] of [[4,1], [6,2], [8,3]]) {
  const content = `BT /F1 24 Tf 50 720 Td (Synthetic reading test - page ${page}) Tj 0 -50 Td /F1 14 Tf (Canvas PDF Tabs test phrase: copper lantern.) Tj 0 -40 Td (This document contains no student or course data.) Tj${page === 1 ? ' 0 -40 Td (External link: example.com) Tj 0 -50 Td (Internal link: jump to page 3) Tj' : ''} ET`;
  objects[index] = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
}
let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i+1} 0 obj\n${object}\nendobj\n`; });
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10,'0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const directory = new URL('../tests/fixtures/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('reading-test.pdf', directory), pdf);
console.log('Generated synthetic three-page fixture.');
