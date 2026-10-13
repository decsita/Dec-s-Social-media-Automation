import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Etichetta, Firma, Tela } from '../brand/Tela';
import { Testo, misuraTitolo } from '../brand/Testo';
import { colore, easing, font, safe916, tipo } from '../brand/tokens';
import { Scena3D, scegliOggetto } from '../oggetti/Oggetti';

/**
 * Reel 9:16 a problema singolo (format F3 del Social OS).
 * I testi arrivano da `timeline_testi` del Copywriter: etichetta, a1, a2,
 * bEtichetta, bTotale, bNota, c1, c2, d1, invito, corpo.
 *
 * Regole del playbook applicate qui:
 *  V-01 un video, un problema · V-02 oggetto 3D protagonista dall'inizio alla fine
 *  V-03 hook nei primi 1,5 s con movimento forte · V-05 nessuna scena ferma oltre 1 s
 *  V-06 battute ≤ 8 parole, max 2 per scena · V-08 durata 18–20 s
 *  G-03 testo in alto a sinistra, oggetto grande in basso · G-04 chiave bianca, controluce lime
 */

export type TimelineTesti = {
  etichetta?: string;
  a1?: string;
  a2?: string;
  bEtichetta?: string;
  bTotale?: string;
  bNota?: string;
  c1?: string;
  c2?: string;
  d1?: string;
  invito?: string;
  corpo?: string;
};

export type ReelProps = {
  testi: TimelineTesti;
  oggetto?: string;
  problema?: string;
};

type Scena = { tipo: 'A' | 'B' | 'C' | 'D'; durata: number; righe: string[]; etichetta?: string; numero?: string; nota?: string; invito?: string };

const S = 30; // fps

/** Costruisce le scene dai testi presenti: una scena vuota si salta, la durata si ricalcola. */
export function scene(t: TimelineTesti): Scena[] {
  const out: Scena[] = [];
  const v = (s?: string) => (s || '').trim();
  if (v(t.a1) || v(t.a2)) out.push({ tipo: 'A', durata: 4.5, righe: [v(t.a1), v(t.a2)].filter(Boolean), etichetta: v(t.etichetta) });
  if (v(t.bTotale)) out.push({ tipo: 'B', durata: 5, righe: [], etichetta: v(t.bEtichetta), numero: v(t.bTotale), nota: v(t.bNota) });
  const c = [v(t.c1), v(t.c2)].filter(Boolean);
  if (c.length) out.push({ tipo: 'C', durata: 4.5, righe: c });
  else if (v(t.corpo)) out.push({ tipo: 'C', durata: 4.5, righe: [v(t.corpo)] });
  out.push({ tipo: 'D', durata: 5, righe: [v(t.d1)].filter(Boolean), invito: v(t.invito) });
  return out;
}

export const durataReel = (t: TimelineTesti) => Math.round(scene(t).reduce((a, s) => a + s.durata, 0) * S);

const eIn = Easing.bezier(...easing.ingresso);

/** Un blocco di testo che entra salendo (--d-reveal 700ms, --e-out5) ed esce rapido. */
const Entra: React.FC<{ da: number; fine: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ da, fine, children, style }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [da, da + 21], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: eIn });
  const outP = interpolate(f, [fine - 7, fine], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity: inP * (1 - outP), translate: `${-outP * 40}px ${(1 - inP) * 70}px`, ...style }}>{children}</div>
  );
};

export const Reel: React.FC<ReelProps> = ({ testi, oggetto, problema }) => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const lista = scene(testi);
  const id = scegliOggetto(oggetto, problema);

  // inizio/fine di ogni scena in fotogrammi
  let acc = 0;
  const tempi = lista.map((s) => {
    const a = acc;
    acc += Math.round(s.durata * S);
    return { ...s, da: a, a: acc };
  });
  const corrente = tempi.find((s) => f >= s.da && f < s.a) || tempi[tempi.length - 1];
  const sec = f / S;
  const fase = f / durationInFrames;

  // un solo lime per inquadratura: se la scena accende una riga, il controluce si spegne
  const testoScena = [...corrente.righe, corrente.numero || ''].join(' ');
  const limeAcceso = !testoScena.includes('==');

  // ingresso dell'oggetto: forte, nei primi 0,6 s (V-03)
  const ingresso = interpolate(f, [0, 18], [0, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(...easing.overshoot) });
  // piccolo colpo a ogni cambio di scena
  const colpo = tempi.slice(1).reduce((m, s) => Math.max(m, Math.exp(-Math.pow((f - s.da) / 4, 2))), 0);
  const scala = 0.55 + 0.45 * ingresso + colpo * 0.05;

  return (
    <Tela fondo="bg-0" alone="tenue" aloneX="78%" aloneY="78%" respiro={(Math.sin((sec / 6.4) * Math.PI * 2) + 1) / 2}>
      {/* oggetto 3D: in basso, grande, anche tagliato (G-03) */}
      <AbsoluteFill style={{ translate: `0px ${(1 - ingresso) * 260}px` }}>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.4, 7.2], fov: 38 }}>
          <group position={[0.15 + Math.sin(sec * 0.7) * 0.06, -0.55 + Math.sin(sec * 1.1) * 0.05, 0]}>
            <Scena3D id={id} t={sec} fase={fase} limeAcceso={limeAcceso} scala={scala * 0.62} />
          </group>
        </ThreeCanvas>
      </AbsoluteFill>

      {/* testo: in alto a sinistra, dentro la safe area */}
      <AbsoluteFill style={{ paddingTop: safe916.alto, paddingLeft: 86, paddingRight: 86 }}>
        {tempi.map((s, i) =>
          f >= s.da - 1 && f < s.a + 1 ? <Blocco key={i} s={s} ultimo={i === tempi.length - 1} /> : null,
        )}
      </AbsoluteFill>
    </Tela>
  );
};

const Battuta: React.FC<{ testo: string }> = ({ testo }) => (
  <div style={{ fontSize: misuraTitolo(testo, 92, 74), fontWeight: 500, lineHeight: 1.04, letterSpacing: '-.02em', textWrap: 'balance', maxWidth: 900 }}>
    <Testo testo={testo} />
  </div>
);

const Blocco: React.FC<{ s: Scena & { da: number; a: number }; ultimo: boolean }> = ({ s, ultimo }) => {
  const fine = ultimo ? s.a + 30 : s.a;
  if (s.tipo === 'B') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {s.etichetta ? (
          <Entra da={s.da} fine={fine}>
            <Etichetta>{s.etichetta}</Etichetta>
          </Entra>
        ) : null}
        <Entra da={s.da + 6} fine={fine}>
          <Numero testo={s.numero || ''} da={s.da + 6} />
        </Entra>
        {s.nota ? (
          <Entra da={s.da + 30} fine={fine}>
            <div style={{ fontSize: tipo.corpo + 6, lineHeight: 1.4, color: colore.fgSoft, maxWidth: 820 }}>
              <Testo testo={s.nota} />
            </div>
          </Entra>
        ) : null}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      {s.tipo === 'A' && s.etichetta ? (
        <Entra da={s.da} fine={fine}>
          <Etichetta>{s.etichetta}</Etichetta>
        </Entra>
      ) : null}
      {s.righe.map((r, j) => (
        // V-03: la prima battuta è a schermo entro 0,2 s; la seconda arriva dopo 1,2 s
        <Entra key={j} da={s.da + (s.tipo === 'A' ? 2 : 0) + j * 36} fine={fine}>
          <Battuta testo={r} />
        </Entra>
      ))}
      {s.tipo === 'D' ? (
        <>
          {s.invito ? (
            <Entra da={s.da + 30} fine={fine} style={{ marginTop: 18 }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '26px 38px',
                  borderRadius: 999,
                  border: `1.5px solid ${colore.rule}`,
                  background: 'rgba(26,32,15,.72)',
                  fontSize: tipo.lead,
                  fontWeight: 500,
                  maxWidth: 908,
                }}
              >
                <Testo testo={s.invito.replace(/==/g, '')} />
              </div>
            </Entra>
          ) : null}
          <Entra da={s.da + 48} fine={fine} style={{ marginTop: 26 }}>
            <Firma style={{ fontSize: 34 }} />
          </Entra>
        </>
      ) : null}
    </div>
  );
};

/** Il dato grande, in corsivo serif. Se è un numero, conta fino al valore (il "drop" della musica cade qui). */
const Numero: React.FC<{ testo: string; da: number }> = ({ testo, da }) => {
  const f = useCurrentFrame();
  const pulito = testo.replace(/==|\*/g, '');
  const m = pulito.match(/(\d[\d.,]*)/);
  let mostrato = pulito;
  if (m) {
    const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (isFinite(val) && val > 0) {
      const p = interpolate(f, [da, da + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: eIn });
      const decimali = m[1].includes(',') ? m[1].split(',')[1].length : 0;
      const n = (val * p).toLocaleString('it-IT', { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
      mostrato = pulito.replace(m[1], n);
    }
  }
  const acceso = testo.includes('==');
  return (
    <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: misuraTitolo(pulito, 196, 120), lineHeight: 0.95, color: acceso ? colore.lime : colore.fg }}>
      {mostrato}
    </div>
  );
};
