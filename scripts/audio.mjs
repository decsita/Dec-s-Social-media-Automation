// Audio procedurale dei reel: musica + effetti sincronizzati agli eventi visivi.
// Playbook: V-04 sempre musica + sound effect · A-01 palette futuristica
// (warp, glitch, zap, blip, cariche, colpi cyber, conferme UI) · A-02 ogni
// evento visivo ha il suo suono · A-03 synth scuri, sequencer con eco, drop sul numero.
// Generato in codice: nessuna licenza musicale da gestire, nessun file esterno.
import fs from 'node:fs';

const SR = 48000;

/**
 * @param {{durata:number, eventi:{t:number, tipo:string}[], seme?:number}} opz
 * @param {string} file percorso del .wav da scrivere
 */
export function generaAudio({ durata, eventi, seme = 7 }, file) {
  const n = Math.ceil(durata * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let rnd = seme;
  const random = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647) * 2 - 1;

  const add = (i, v, pan = 0) => {
    if (i < 0 || i >= n) return;
    L[i] += v * (1 - Math.max(0, pan));
    R[i] += v * (1 + Math.min(0, pan));
  };

  // ── pad scuro: La minore, quattro voci leggermente stonate, filtro che si apre ──
  const accordo = [55, 82.41, 130.81, 196.0];
  for (const [k, f0] of accordo.entries()) {
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const saw = ((t * f0 * 1.003) % 1) * 2 - 1 + (((t * f0 * 0.997) % 1) * 2 - 1);
      const apertura = 0.02 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.35));
      lp += apertura * (saw - lp);
      const env = Math.min(1, t / 1.2) * Math.min(1, (durata - t) / 1.5);
      add(i, lp * 0.05 * env, k % 2 ? 0.25 : -0.25);
    }
  }

  // ── sequencer con eco: sedicesimi a 110 BPM ──
  const passo = 60 / 110 / 4;
  const scala = [220, 261.63, 329.63, 392, 440, 329.63, 261.63, 196];
  const seq = new Float32Array(n);
  for (let s = 0, t = 0.9; t < durata - 1.2; s++, t += passo) {
    if (s % 4 === 3) continue;
    const f = scala[(s * 3) % scala.length];
    const i0 = Math.floor(t * SR);
    for (let j = 0; j < SR * 0.09; j++) {
      const tt = j / SR;
      seq[i0 + j] += Math.sign(Math.sin(2 * Math.PI * f * tt)) * Math.exp(-tt * 38) * 0.035;
    }
  }
  const dly = Math.floor(passo * 3 * SR);
  for (let i = dly; i < n; i++) seq[i] += seq[i - dly] * 0.38;
  for (let i = 0; i < n; i++) add(i, seq[i], Math.sin(i / SR) * 0.4);

  // ── effetti ──
  const fx = {
    warp(t) {
      // spazzata di rumore filtrato verso l'alto (ingresso dell'oggetto)
      let lp = 0;
      for (let j = 0; j < SR * 0.6; j++) {
        const p = j / (SR * 0.6);
        lp += (0.02 + p * 0.5) * (random() - lp);
        add(Math.floor(t * SR) + j, lp * 0.35 * Math.sin(Math.PI * p));
      }
    },
    colpo(t) {
      // colpo cyber: sub che scende + click
      for (let j = 0; j < SR * 0.5; j++) {
        const tt = j / SR;
        const f = 90 * Math.exp(-tt * 9) + 38;
        add(Math.floor(t * SR) + j, Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 7) * 0.7 + (j < 300 ? random() * 0.4 : 0));
      }
    },
    blip(t) {
      for (let j = 0; j < SR * 0.07; j++) {
        const tt = j / SR;
        add(Math.floor(t * SR) + j, Math.sin(2 * Math.PI * (1400 - tt * 6000) * tt) * Math.exp(-tt * 55) * 0.22, 0.3);
      }
    },
    glitch(t) {
      let hold = 0;
      for (let j = 0; j < SR * 0.16; j++) {
        if (j % 90 === 0) hold = random();
        add(Math.floor(t * SR) + j, hold * 0.16 * (Math.floor(j / 900) % 2), -0.3);
      }
    },
    drop(t) {
      // carica breve + colpo pieno sul numero chiave
      for (let j = 0; j < SR * 0.35; j++) {
        const p = j / (SR * 0.35);
        add(Math.floor((t - 0.35) * SR) + j, Math.sin(2 * Math.PI * (200 + p * 900) * (j / SR)) * p * 0.12);
      }
      fx.colpo(t);
    },
    conferma(t) {
      // conferma UI: due note pulite
      for (const [k, f] of [880, 1318.5].entries()) {
        for (let j = 0; j < SR * 0.35; j++) {
          const tt = j / SR;
          add(Math.floor((t + k * 0.09) * SR) + j, Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 9) * 0.18);
        }
      }
    },
  };
  for (const e of eventi) (fx[e.tipo] || fx.blip)(e.t);

  // limitatore morbido e scrittura WAV 16 bit stereo
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.tanh(L[i] * 1.2) * 30000), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.tanh(R[i] * 1.2) * 30000), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}
