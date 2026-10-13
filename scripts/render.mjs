// Motore grafico del DEC'S Social OS.
// Chiamato da GitHub Actions quando lo scenario Make "S3 · Produzione e revisione"
// manda l'evento `render`. Legge il payload, produce le grafiche (immagine,
// carosello o reel), fa il controllo qualità automatico, carica i file e
// chiama il webhook di "S3b · Media pronto" con lo stesso formato di sempre:
//   { post_id, media_url, anteprima_url, qa_esito: "ok"|"bloccato", qa_note }
//
// Uso locale:  node scripts/render.mjs --payload fixtures/reel-commissioni.json --no-upload
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { generaAudio } from './audio.mjs';

const args = process.argv.slice(2);
const opt = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const NO_UPLOAD = args.includes('--no-upload');
const NO_CALLBACK = args.includes('--no-callback') || NO_UPLOAD;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

// ── 1. payload ───────────────────────────────────────────────────────────
function leggiPayload() {
  if (opt('--payload')) return JSON.parse(fs.readFileSync(opt('--payload'), 'utf8'));
  if (process.env.PAYLOAD_JSON) return JSON.parse(process.env.PAYLOAD_JSON);
  if (process.env.GITHUB_EVENT_PATH) {
    const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (ev.client_payload) return ev.client_payload;
    if (ev.inputs?.payload) return JSON.parse(ev.inputs.payload);
  }
  throw new Error('Nessun payload: passa --payload, PAYLOAD_JSON o un evento repository_dispatch');
}

const payload = leggiPayload();
let contenuto = payload.contenuto;
if (typeof contenuto === 'string') {
  try {
    contenuto = JSON.parse(contenuto);
  } catch {
    contenuto = {};
  }
}
contenuto = contenuto || {};
const postId = String(payload.post_id || 'prova').replace(/[^a-zA-Z0-9_-]/g, '-');
const clientId = String(payload.client_id || 'decs').replace(/[^a-zA-Z0-9_-]/g, '-');
const mediaTipo = String(payload.media_tipo || '').toLowerCase();
const formatSheet = String(payload.format || '');

const blocchi = []; // fermano il post (qa_esito = bloccato)
const avvisi = []; // finiscono nelle note di revisione, non fermano

// ── 2. controllo qualità dei testi (09-CONTROLLO-QUALITA, playbook) ──────
const pulito = (t) => String(t || '').replace(/==|\*/g, '').replace(/\\n/g, ' ');
const parole = (t) => pulito(t).split(/\s+/).filter(Boolean).length;
const tuttiITesti = JSON.stringify({ p: contenuto.props, s: contenuto.slide, t: contenuto.timeline_testi });
// testo senza la numerazione delle slide, per il controllo dei numeri
const testiSenzaIndici = JSON.stringify({ p: contenuto.props, s: contenuto.slide, t: contenuto.timeline_testi }, (k, v) => (k === 'numero' || k === 'format' ? undefined : v));

function controlliComuni() {
  if (/coming soon|in arrivo|in preparazione|\bbeta\b/i.test(tuttiITesti)) blocchi.push('Testo con "coming soon / in arrivo / beta" (vietato da 05-VOCE §3).');
  if (/(canone|pacchett|listino|abbonament)[^"]{0,40}€|€[^"]{0,40}(canone|pacchett|listino|abbonament)/i.test(tuttiITesti))
    blocchi.push('Sembra esserci un prezzo dei servizi DEC\'S: nessun prezzo, in nessuna forma.');
  if (/costumer/i.test(tuttiITesti)) blocchi.push('Refuso "Costumer" nel testo.');
  if (/\d/.test(testiSenzaIndici) && !/esempio|inventat/i.test(testiSenzaIndici + JSON.stringify(contenuto.caption || '')))
    avvisi.push('Ci sono numeri: verifica che siano veri o dichiarati come esempio (V-07).');
}

// ── 3. rendering ─────────────────────────────────────────────────────────
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const chromiumOptions = { gl: 'swangle' };

async function main() {
  controlliComuni();
  console.log(`▶ ${postId} · ${mediaTipo} · ${formatSheet}`);
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') });
  const file = []; // {locale, nome, tipo}

  const still = async (id, props, nome) => {
    const comp = await selectComposition({ serveUrl, id, inputProps: props, browserExecutable, chromiumOptions });
    const out = path.join(OUT, nome);
    await renderStill({ composition: comp, serveUrl, output: out, inputProps: props, imageFormat: 'jpeg', jpegQuality: 92, browserExecutable, chromiumOptions });
    const kb = fs.statSync(out).size / 1024;
    if (kb > 1024) avvisi.push(`${nome} pesa ${Math.round(kb)} KB (tetto 1 MB).`);
    file.push({ locale: out, nome, tipo: 'image/jpeg' });
  };

  if (mediaTipo === 'reel' || formatSheet.startsWith('F3')) {
    await reel(serveUrl, file);
  } else if (mediaTipo === 'carosello' || formatSheet.startsWith('F2')) {
    const cop = contenuto.props?.props || {};
    const slide = (contenuto.slide || []).map((s) => s.props || s);
    const tot = slide.length + 1;
    if (tot < 5 || tot > 8) blocchi.push(`Carosello di ${tot} slide: devono essere da 5 a 8 (03-FORMATI §5).`);
    if (!cop.titolo) blocchi.push('Copertina del carosello senza titolo.');
    await still('CopertinaCarosello', { etichetta: cop.etichetta || '', titolo: cop.titolo || '', totale: tot }, `${postId}-cover.jpg`);
    for (const [i, s] of slide.entries()) {
      if (parole(s.titolo) > 14) avvisi.push(`Slide ${i + 2}: titolo lungo (${parole(s.titolo)} parole).`);
      await still(
        'SlideCarosello',
        { numero: s.numero || String(i + 1).padStart(2, '0'), titolo: s.titolo || '', testo: s.testo || '', indice: i + 2, totale: tot, chiusura: i === slide.length - 1 },
        `${postId}-slide-${String(i + 2).padStart(2, '0')}.jpg`,
      );
    }
  } else {
    // immagine singola: F1, F4, F6, F7, F8
    const fmt = contenuto.props?.format || 'PostTesi';
    const p = contenuto.props?.props || {};
    const ammessi = ['PostTesi', 'PostDomanda', 'PostPrimaDopo', 'CardServizio'];
    if (!ammessi.includes(fmt)) blocchi.push(`Format "${fmt}" non previsto per un post statico.`);
    if (fmt === 'PostTesi') {
      if (!p.tesi) blocchi.push('Tesi vuota.');
      if (parole(p.tesi) > 12 && !formatSheet.startsWith('F6')) blocchi.push(`Tesi di ${parole(p.tesi)} parole: il massimo è 12 (04-ATLANTE F1).`);
    }
    if ((JSON.stringify(p).match(/==/g) || []).length > 2) blocchi.push('Più di una riga accesa in lime: una sola per tela.');
    await still(ammessi.includes(fmt) ? fmt : 'PostTesi', p, `${postId}-post.jpg`);
  }

  // ── 4. caricamento e risposta a Make ───────────────────────────────────
  const url = [];
  for (const f of file) url.push(NO_UPLOAD ? `file://${f.locale}` : await carica(f));
  const media = mediaTipo === 'carosello' || formatSheet.startsWith('F2') ? JSON.stringify(url) : url[0];
  const anteprima = mediaTipo === 'reel' || formatSheet.startsWith('F3') ? url[1] || url[0] : url[0];
  const esito = {
    post_id: payload.post_id || postId,
    media_url: media,
    anteprima_url: anteprima,
    qa_esito: blocchi.length ? 'bloccato' : 'ok',
    qa_note: [...blocchi.map((b) => `BLOCCO: ${b}`), ...avvisi.map((a) => `Avviso: ${a}`)].join('\n') || '',
  };
  fs.writeFileSync(path.join(OUT, 'esito.json'), JSON.stringify(esito, null, 2));
  console.log(JSON.stringify(esito, null, 2));
  await richiama(esito);
}

async function reel(serveUrl, file) {
  const t = contenuto.timeline_testi || {};
  for (const k of ['a1', 'a2', 'c1', 'c2', 'd1']) {
    if (t[k] && parole(t[k]) > 10) blocchi.push(`Battuta "${k}" di ${parole(t[k])} parole: il massimo è 8 (V-06).`);
    else if (t[k] && parole(t[k]) > 8) avvisi.push(`Battuta "${k}" di ${parole(t[k])} parole (V-06 dice 8).`);
  }
  if (!t.a1) blocchi.push('Manca la prima battuta (a1): il reel non ha un gancio nei primi 1,5 s (V-03).');
  if (!t.invito) avvisi.push('Manca la CTA finale (invito).');

  const props = { testi: t, oggetto: payload.oggetto_3d || '', problema: payload.problema || '' };
  const comp = await selectComposition({ serveUrl, id: 'Reel', inputProps: props, browserExecutable, chromiumOptions });
  const muto = path.join(OUT, `${postId}-muto.mp4`);
  let ultimo = -1;
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: 'h264',
    crf: 20,
    pixelFormat: 'yuv420p',
    outputLocation: muto,
    inputProps: props,
    browserExecutable,
    chromiumOptions,
    concurrency: Math.min(Number(process.env.CONCORRENZA || 2), os.cpus().length),
    onProgress: ({ progress }) => {
      const pc = Math.floor(progress * 10) * 10;
      if (pc !== ultimo) console.log(`  render ${(ultimo = pc)}%`);
    },
  });
  console.log('');

  const durata = comp.durationInFrames / comp.fps;
  const wav = path.join(OUT, `${postId}.wav`);
  generaAudio({ durata, eventi: eventiAudio(t) }, wav);

  // mux + normalizzazione a -14 LUFS (03-FORMATI §6), MP4 pronto per lo streaming
  const finale = path.join(OUT, `${postId}-reel.mp4`);
  // loudnorm a due passate: la prima misura, la seconda corregge in modo lineare
  const misura = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  let m = {};
  try {
    m = JSON.parse(String(misura).match(/\{[\s\S]*\}/)?.[0] || '{}');
  } catch {}
  const ln = m.input_i
    ? `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`
    : 'loudnorm=I=-14:TP=-1.5:LRA=11';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', muto, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-r', '30', '-af', ln, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', finale]);
  const copertina = path.join(OUT, `${postId}-cover.jpg`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '2.2', '-i', finale, '-frames:v', '1', '-q:v', '2', copertina]);

  const mb = fs.statSync(finale).size / 1024 / 1024;
  if (mb > 30) blocchi.push(`Il reel pesa ${mb.toFixed(1)} MB: il tetto è 30 MB per 60 s.`);
  if (durata < 15 || durata > 25) avvisi.push(`Durata ${durata.toFixed(1)} s (V-08: 18–20 s).`);
  file.push({ locale: finale, nome: `${postId}-reel.mp4`, tipo: 'video/mp4' });
  file.push({ locale: copertina, nome: `${postId}-cover.jpg`, tipo: 'image/jpeg' });
}

/** Stessa scansione delle scene di src/reel/Reel.tsx: ogni evento visivo ha il suo suono (A-02). */
function eventiAudio(t) {
  const v = (s) => (s || '').trim();
  const sc = [];
  if (v(t.a1) || v(t.a2)) sc.push({ tipo: 'A', d: 4.5, n: [v(t.a1), v(t.a2)].filter(Boolean).length });
  if (v(t.bTotale)) sc.push({ tipo: 'B', d: 5 });
  const c = [v(t.c1), v(t.c2)].filter(Boolean).length || (v(t.corpo) ? 1 : 0);
  if (c) sc.push({ tipo: 'C', d: 4.5, n: c });
  sc.push({ tipo: 'D', d: 5, n: v(t.d1) ? 1 : 0, invito: !!v(t.invito) });
  const ev = [{ t: 0, tipo: 'warp' }, { t: 0.45, tipo: 'colpo' }];
  let a = 0;
  for (const [i, s] of sc.entries()) {
    if (i > 0) ev.push({ t: a, tipo: 'glitch' });
    if (s.tipo === 'B') {
      ev.push({ t: a + 0.05, tipo: 'blip' }, { t: a + 0.25, tipo: 'drop' }, { t: a + 1.05, tipo: 'blip' });
    } else {
      for (let j = 0; j < (s.n || 0); j++) ev.push({ t: a + 0.07 + j * 1.2, tipo: 'blip' });
      if (s.tipo === 'D' && s.invito) ev.push({ t: a + 1.0, tipo: 'conferma' });
    }
    a += s.d;
  }
  return ev;
}

// ── caricamento: Supabase Storage (bucket pubblico) ──────────────────────
async function carica(f) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'social-media';
  if (!base || !key) throw new Error('Mancano i segreti SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const dest = `${clientId}/${postId}/${f.nome}`;
  const r = await fetch(`${base}/storage/v1/object/${bucket}/${dest}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': f.tipo, 'x-upsert': 'true', 'cache-control': 'max-age=31536000' },
    body: fs.readFileSync(f.locale),
  });
  if (!r.ok) throw new Error(`Caricamento di ${f.nome} fallito: ${r.status} ${await r.text()}`);
  return `${base}/storage/v1/object/public/${bucket}/${dest}`;
}

// ── risposta a S3b ───────────────────────────────────────────────────────
async function richiama(esito) {
  const cb = payload.callback;
  if (NO_CALLBACK || !cb) return console.log(NO_CALLBACK ? '(callback saltata)' : '(nessuna callback nel payload)');
  if (!/^https:\/\/hook\.[a-z0-9]+\.make\.com\//.test(cb)) throw new Error(`Callback non riconosciuta: ${cb}`);
  const r = await fetch(cb, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(esito) });
  console.log(`callback S3b → ${r.status}`);
}

main().catch(async (e) => {
  console.error(e);
  // Anche se il render fallisce, S3b deve saperlo: mette il post in "errore" e ti scrive.
  try {
    await richiama({ post_id: payload?.post_id || postId, media_url: '', anteprima_url: '', qa_esito: 'bloccato', qa_note: `BLOCCO: il motore grafico si è fermato — ${String(e.message || e).slice(0, 800)}` });
  } catch (e2) {
    console.error('Anche la callback è fallita:', e2);
  }
  process.exit(1);
});
