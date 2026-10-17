// Scarica General Sans 400/500/600 dalla fonte ufficiale (Fontshare, Indian Type Foundry)
// in public/fonts/, solo per il render. I file restano fuori dal repo (.gitignore):
// la licenza ITF FFL permette l'uso gratuito ma non la ridistribuzione.
import fs from 'node:fs';
import path from 'node:path';

const PESI = ['400', '500', '600'];
const CSS = `https://api.fontshare.com/v2/css?f[]=general-sans@${PESI.join(',')}&display=swap`;
const DIR = path.resolve('public/fonts');

const css = await (await fetch(CSS)).text();
const blocchi = css.match(/@font-face\s*{[^}]*}/g) || [];
const trovati = {};
for (const b of blocchi) {
  const peso = (b.match(/font-weight:\s*(\d+)/) || [])[1];
  const url = (b.match(/url\('([^']+\.woff2)'\)/) || [])[1];
  if (peso && url) trovati[peso] = url.startsWith('//') ? `https:${url}` : url;
}
for (const p of PESI) {
  const dest = path.join(DIR, `general-sans-${p}-latin.woff2`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { console.log(`${p}: già presente`); continue; }
  if (!trovati[p]) throw new Error(`Fontshare non restituisce il peso ${p} di General Sans`);
  const buf = Buffer.from(await (await fetch(trovati[p])).arrayBuffer());
  if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') throw new Error(`Il file del peso ${p} non è un woff2 valido`);
  fs.writeFileSync(dest, buf);
  console.log(`${p}: ${buf.length} byte da Fontshare`);
}
