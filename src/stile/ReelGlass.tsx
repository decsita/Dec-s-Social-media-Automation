import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { ReelProps, scene } from '../reel/Reel';
import { Studio3D, scegli2 } from './Oggetti3D';

/**
 * Reel v2 "vetro e luce" (prototipo, 14/10/2026).
 * Riferimento di stile scelto dal fondatore: un product demo di agenti AI su Pinterest.
 * Se ne prendono le tecniche, non le scene: fondo nero con nebbie di un solo colore,
 * interfacce in vetro con bordo luminoso, entrate da sfocato, testo che si scrive,
 * barra di luce con le parole che si scambiano, curve di livello che pulsano,
 * camera in prospettiva, chiusura sul logo.
 *
 * Stessi campi (`timeline_testi`) e stessi tempi di scena del Reel v1: il contratto
 * con Make (S3 → S3b) e l'audio sincronizzato non cambiano.
 * Animazioni solo da useCurrentFrame().
 */

const LIME = '#D4FF00';
const S = 30;
const SANS = "'General Sans', sans-serif";
const eOut = Easing.bezier(0.22, 1, 0.36, 1);
const eInOut = Easing.bezier(0.65, 0, 0.35, 1);
const cl = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (f: number, a: number, b: number, da = 0, a2 = 1, e?: (x: number) => number) => interpolate(f, [a, b], [da, a2], { ...cl, easing: e });

/** Entrata "da sfocato": opacità, blur e scala in un colpo solo. Uscita: zoom attraverso. */
function vetroIn(f: number, da: number, durata = 16, uscita?: number) {
  const p = lin(f, da, da + durata, 0, 1, eOut);
  const u = uscita === undefined ? 0 : lin(f, uscita - 10, uscita, 0, 1, Easing.in(Easing.quad));
  return {
    opacity: p * (1 - u),
    filter: `blur(${(1 - p) * 18 + u * 16}px)`,
    scale: String(0.9 + 0.1 * p + u * 0.12),
  } as React.CSSProperties;
}

const pulisci = (t: string) => t.replace(/==/g, '');

/** Testo che si scrive: i caratteri compaiono con il bordo in dissolvenza; *parole* in lime. */
const Scritto: React.FC<{ testo: string; p: number; style?: React.CSSProperties }> = ({ testo, p, style }) => {
  const tutto = pulisci(testo);
  const pezzi: { c: string; lime: boolean }[] = [];
  let lime = /^==.*==$/.test(testo.trim());
  for (const c of tutto) {
    if (c === '*') {
      lime = !lime;
      continue;
    }
    pezzi.push({ c, lime });
  }
  const N = pezzi.length;
  const bordo = 7;
  const testa = p * (N + bordo);
  return (
    <span style={style}>
      {pezzi.map((x, i) => (
        <span key={i} style={{ opacity: Math.max(0, Math.min(1, (testa - i) / bordo)), color: x.lime ? LIME : undefined, textShadow: x.lime ? '0 0 18px rgba(212,255,0,.55)' : undefined }}>
          {x.c}
        </span>
      ))}
    </span>
  );
};

/** Superficie di vetro: riempimento quasi trasparente, bordo sottile acceso, alone. */
const vetro = (intensita = 1, raggio = 40): React.CSSProperties => ({
  background: 'linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.02))',
  border: `2px solid rgba(212,255,0,${0.35 + 0.3 * intensita})`,
  boxShadow: `0 0 ${30 * intensita}px rgba(212,255,0,${0.28 * intensita}), inset 0 0 40px rgba(212,255,0,${0.07 * intensita}), 0 30px 80px rgba(0,0,0,.6)`,
  backdropFilter: 'blur(22px)',
  borderRadius: raggio,
});

/** Fondo: nero, cono di luce dall'alto e nebbie lime che respirano. */
const Fondo: React.FC<{ f: number }> = ({ f }) => {
  const s = f / S;
  const acceso = lin(f, 0, 14);
  const nebbie = [
    { x: 26 + Math.sin(s * 0.4) * 10, y: 92 + Math.cos(s * 0.3) * 3, r: 30, a: 0.09 },
    { x: 80 + Math.cos(s * 0.35) * 8, y: 64 + Math.sin(s * 0.5) * 6, r: 24, a: 0.05 },
    { x: 50, y: 112, r: 40, a: 0.08 },
  ];
  return (
    <AbsoluteFill style={{ background: '#020302' }}>
      <AbsoluteFill style={{ opacity: acceso }}>
        {nebbie.map((n, i) => (
          <AbsoluteFill key={i} style={{ background: `radial-gradient(circle at ${n.x}% ${n.y}%, rgba(170,210,0,${n.a * (0.85 + 0.15 * Math.sin(s * 1.3 + i))}) 0%, transparent ${n.r}%)` }} />
        ))}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 26% at 50% -4%, rgba(212,255,0,${0.13 + 0.04 * Math.sin(s * 0.9)}) 0%, transparent 100%)` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Freccia del cursore con il cerchio del clic. */
const Cursore: React.FC<{ x: number; y: number; clic: number; opacita: number }> = ({ x, y, clic, opacita }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity: opacita }}>
    {clic > 0 && clic < 1 ? (
      <div style={{ position: 'absolute', left: -40 * clic, top: -40 * clic, width: 80 * clic, height: 80 * clic, borderRadius: 99, border: `3px solid rgba(212,255,0,${1 - clic})` }} />
    ) : null}
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ filter: 'drop-shadow(0 0 14px rgba(212,255,0,.8))', scale: String(1 - 0.15 * Math.sin(Math.PI * Math.min(1, Math.max(0, clic * 3)))) }}>
      <path d="M6 4 L58 30 L34 36 L24 60 Z" fill={LIME} />
    </svg>
  </div>
);

/** Curve di livello: anelli morbidi che si allargano dal centro. */
const Curve: React.FC<{ f: number; cx: number; cy: number }> = ({ f, cx, cy }) => {
  const s = f / S;
  const anelli = 9;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: anelli }).map((_, k) => {
        const fase = (k + (s * 0.45) % 1) / anelli;
        const r = 120 + fase * 820;
        const punti = 72;
        let d = '';
        for (let i = 0; i <= punti; i++) {
          const a = (i / punti) * Math.PI * 2;
          const onda = 1 + 0.06 * Math.sin(a * 4 + s * 0.8 + k) + 0.035 * Math.sin(a * 7 - s * 1.1);
          // superellisse: anelli "quadrati morbidi" come una mappa di calore
          const ca = Math.cos(a), sa = Math.sin(a);
          const sx = Math.sign(ca) * Math.pow(Math.abs(ca), 0.7);
          const sy = Math.sign(sa) * Math.pow(Math.abs(sa), 0.7);
          d += `${i ? 'L' : 'M'} ${cx + sx * r * onda} ${cy + sy * r * 1.15 * onda} `;
        }
        return <path key={k} d={d} fill="none" stroke={LIME} strokeWidth={2} opacity={0.42 * Math.sin(Math.PI * fase)} />;
      })}
    </svg>
  );
};

/** Numero che sale fino al valore finale, mantenendo prefissi e suffissi (es. "18.000 €"). */
function contatore(finale: string, p: number) {
  const m = finale.match(/[\d.,]+/);
  if (!m) return finale;
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'));
  if (!isFinite(n)) return finale;
  const v = Math.round(n * p);
  return finale.replace(m[0], v.toLocaleString('it-IT'));
}

export const ReelGlass: React.FC<ReelProps> = ({ testi, oggetto, problema }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const lista = scene(testi);
  const id = scegli2(oggetto, problema);
  let acc = 0;
  const tempi = lista.map((s) => {
    const a = acc;
    acc += Math.round(s.durata * S);
    return { ...s, da: a, a: acc };
  });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: '#fff', overflow: 'hidden' }}>
      <Fondo f={f} />
      {tempi.map((s, i) => {
        if (f < s.da - 1 || f >= s.a + 1) return null;
        const lf = f - s.da;
        const dur = s.a - s.da;
        const ultimo = i === tempi.length - 1;
        if (s.tipo === 'A') return <ScenaA key={i} lf={lf} dur={dur} righe={s.righe} etichetta={s.etichetta} />;
        if (s.tipo === 'B') return <ScenaB key={i} lf={lf} dur={dur} etichetta={s.etichetta} numero={s.numero || ''} nota={s.nota} id={id} t={f / S} w={width} h={height} />;
        if (s.tipo === 'C') return <ScenaC key={i} lf={lf} dur={dur} righe={s.righe} />;
        return <ScenaD key={i} lf={lf} dur={dur} righe={s.righe} invito={s.invito} ultimo={ultimo} />;
      })}
    </AbsoluteFill>
  );
};

/** A — il gancio: un'etichetta in vetro, il clic, poi la chat che si scrive in prospettiva. */
const ScenaA: React.FC<{ lf: number; dur: number; righe: string[]; etichetta?: string }> = ({ lf, dur, righe, etichetta }) => {
  const conEtichetta = !!etichetta;
  const t0 = conEtichetta ? 34 : 4; // quando parte la chat
  // etichetta: entra, il cursore la clicca, sale a fare da testata del pannello
  const sale = lin(lf, 30, 46, 0, 1, eInOut);
  const clic = lin(lf, 24, 40);
  const curX = interpolate(lf, [4, 24], [900, 600], { ...cl, easing: eOut });
  const curY = interpolate(lf, [4, 24], [1420, 930], { ...cl, easing: eOut });
  const pannello = vetroIn(lf, t0, 18, dur);
  const pushIn = lin(lf, t0, dur, 0, 1);
  const bolla = (k: number) => t0 + 10 + k * 34;
  return (
    <AbsoluteFill>
      {conEtichetta ? (
        <div
          style={{
            position: 'absolute',
            left: 540,
            top: interpolate(sale, [0, 1], [880, 540]),
            translate: '-50% 0',
            ...vetroIn(lf, 2, 14, dur),
            ...vetro(1 + 0.8 * Math.exp(-Math.pow((lf - 26) / 5, 2)), 999),
            padding: '26px 46px',
            fontSize: interpolate(sale, [0, 1], [48, 34]),
            fontWeight: 500,
            letterSpacing: '-.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 18, height: 18, borderRadius: 99, background: LIME, boxShadow: '0 0 16px rgba(212,255,0,.9)' }} />
          {etichetta}
        </div>
      ) : null}
      {conEtichetta ? <Cursore x={curX} y={curY} clic={clic} opacita={lin(lf, 4, 10) * (1 - lin(lf, 36, 44))} /> : null}

      {/* pannello della chat, inclinato, la camera ci entra lentamente */}
      <AbsoluteFill style={{ perspective: 1600 }}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 680,
            width: 860,
            padding: '56px 48px',
            ...vetro(0.8),
            ...pannello,
            transform: `rotateX(${10 - 7 * pushIn}deg) rotateY(${-12 + 8 * pushIn}deg) scale(${0.94 + 0.08 * pushIn})`,
            display: 'flex',
            flexDirection: 'column',
            gap: 34,
          }}
        >
          {righe.map((r, k) => {
            const mia = k % 2 === 1;
            const st = vetroIn(lf, bolla(k), 12);
            return (
              <div key={k} style={{ alignSelf: mia ? 'flex-end' : 'flex-start', maxWidth: 640, ...st }}>
                <div
                  style={{
                    padding: '30px 36px',
                    borderRadius: 34,
                    fontSize: 54,
                    lineHeight: 1.18,
                    fontWeight: 500,
                    letterSpacing: '-.015em',
                    ...(mia ? vetro(1, 34) : { background: 'rgba(255,255,255,.07)', border: '2px solid rgba(255,255,255,.12)' }),
                  }}
                >
                  <Scritto testo={r} p={lin(lf, bolla(k) + 4, bolla(k) + 4 + Math.max(16, pulisci(r).length * 0.9))} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** B — la barra di luce porta l'etichetta, poi si apre in una card con l'oggetto e il numero. */
const ScenaB: React.FC<{ lf: number; dur: number; etichetta?: string; numero: string; nota?: string; id: ReturnType<typeof scegli2>; t: number; w: number; h: number }> = ({
  lf,
  dur,
  etichetta,
  numero,
  nota,
  id,
  t,
  w,
  h,
}) => {
  const barra = lin(lf, 0, 14, 0, 1, eOut);
  const apre = lin(lf, 34, 54, 0, 1, eInOut);
  const uscita = lin(lf, dur - 10, dur, 0, 1, Easing.in(Easing.quad));
  const alto = interpolate(apre, [0, 1], [210, 1060]);
  const cy = 900;
  const conta = lin(lf, 52, 92, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ opacity: 1 - uscita, filter: `blur(${uscita * 16}px)`, scale: String(1 + uscita * 0.1) }}>
      <div
        style={{
          position: 'absolute',
          left: interpolate(apre, [0, 1], [0, 90]),
          right: interpolate(apre, [0, 1], [0, 90]),
          top: cy - alto / 2,
          height: alto,
          transformOrigin: 'left center',
          scale: `${barra} 1`,
          borderRadius: interpolate(apre, [0, 1], [0, 48]),
          background: `linear-gradient(180deg, rgba(212,255,0,${0.55 * (1 - apre)}) 0%, rgba(212,255,0,${0.95 * (1 - apre)}) 50%, rgba(212,255,0,${0.55 * (1 - apre)}) 100%), linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02))`,
          border: `2px solid rgba(212,255,0,${0.6 + 0.4 * (1 - apre)})`,
          boxShadow: `0 0 ${90 - 55 * apre}px rgba(212,255,0,${0.75 - 0.45 * apre}), inset 0 0 40px rgba(212,255,0,.08)`,
          overflow: 'hidden',
        }}
      >
        {/* riflesso che scorre sulla barra */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 260, left: interpolate(lf, [6, 40], [-300, 1200], cl), background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)', opacity: 1 - apre }} />
      </div>

      {/* etichetta nella barra, poi testata della card */}
      {etichetta ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: interpolate(apre, [0, 1], [cy - 34, cy - 530 + 70]),
            textAlign: 'center',
            fontSize: interpolate(apre, [0, 1], [62, 30]),
            fontWeight: interpolate(apre, [0, 1], [600, 500]),
            color: apre < 0.5 ? '#080808' : 'rgba(255,255,255,.7)',
            letterSpacing: apre < 0.5 ? '-.02em' : '.12em',
            textTransform: apre < 0.5 ? 'none' : 'uppercase',
            opacity: lin(lf, 6, 16) * (apre < 0.5 ? 1 - apre * 2 : (apre - 0.5) * 2),
            filter: `blur(${lin(lf, 6, 16, 10, 0)}px)`,
          }}
        >
          {etichetta}
        </div>
      ) : null}

      {/* oggetto 3D nella card */}
      <AbsoluteFill style={{ opacity: apre, filter: `blur(${(1 - apre) * 14}px)` }}>
        <ThreeCanvas width={w} height={h} camera={{ position: [0, 0, 8], fov: 34 }}>
          <Studio3D id={id} t={t} fase={lf / dur} scala={0.44} pos={[0, 0.48, 0]} />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* numero che sale e nota */}
      <div style={{ position: 'absolute', left: 90, right: 90, top: cy + 170, textAlign: 'center', ...vetroIn(lf, 50, 14) }}>
        <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: '-.04em', lineHeight: 1, textShadow: '0 0 40px rgba(212,255,0,.45)' }}>{contatore(numero, conta)}</div>
        {nota ? <div style={{ marginTop: 34, fontSize: 30, lineHeight: 1.35, color: 'rgba(255,255,255,.6)', padding: '0 40px' }}>{pulisci(nota).replace(/\*/g, '')}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** C — le curve di livello pulsano attorno alla frase; la seconda riga sostituisce la prima. */
const ScenaC: React.FC<{ lf: number; dur: number; righe: string[] }> = ({ lf, dur, righe }) => {
  const campo = vetroIn(lf, 0, 18, dur);
  const cambio = righe.length > 1 ? Math.round(dur * 0.48) : dur + 99;
  return (
    <AbsoluteFill style={{ ...campo }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 46% 30% at 50% 47%, rgba(212,255,0,.2) 0%, transparent 100%)' }} />
      <Curve f={lf} cx={540} cy={900} />
      {righe.map((r, k) => {
        const da = k === 0 ? 6 : cambio;
        const fine = k === 0 ? cambio + 4 : dur;
        const p = lin(lf, da, da + 14, 0, 1, eOut);
        const u = lin(lf, fine - 10, fine, 0, 1, Easing.in(Easing.quad));
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 80,
              right: 80,
              top: 900 - 60,
              textAlign: 'center',
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: '-.03em',
              lineHeight: 1.05,
              opacity: p * (1 - u),
              filter: `blur(${(1 - p) * 20 + u * 18}px)`,
              translate: `${(1 - p) * 60 - u * 60}px 0`,
              textShadow: '0 0 30px rgba(212,255,0,.35)',
            }}
          >
            <Scritto testo={r} p={1} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** D — la domanda in vetro, il clic sulla CTA, poi il logo che si forma. */
const ScenaD: React.FC<{ lf: number; dur: number; righe: string[]; invito?: string; ultimo: boolean }> = ({ lf, righe, invito }) => {
  const logo = 88;
  const via = lin(lf, logo - 10, logo, 0, 1, Easing.in(Easing.quad));
  const clic = lin(lf, 64, 80);
  const pL = lin(lf, logo, logo + 22, 0, 1, eOut);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - via, filter: `blur(${via * 18}px)`, scale: String(1 + via * 0.12) }}>
        {righe[0] ? (
          <div style={{ position: 'absolute', left: 100, right: 100, top: 640, padding: '60px 56px', ...vetro(0.9), ...vetroIn(lf, 2, 16) }}>
            <div style={{ fontSize: 30, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 14, height: 14, borderRadius: 99, background: LIME, boxShadow: '0 0 12px rgba(212,255,0,.9)' }} />
              dec&rsquo;s
            </div>
            <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: '-.03em' }}>
              <Scritto testo={righe[0]} p={lin(lf, 10, 10 + Math.max(18, pulisci(righe[0]).length * 0.8))} />
            </div>
          </div>
        ) : null}
        {invito ? (
          <div
            style={{
              position: 'absolute',
              left: 540,
              top: 1150,
              translate: '-50% 0',
              whiteSpace: 'nowrap',
              padding: '30px 52px',
              borderRadius: 999,
              background: LIME,
              color: '#080808',
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: '-.01em',
              boxShadow: `0 0 ${40 + 60 * Math.exp(-Math.pow((lf - 66) / 5, 2))}px rgba(212,255,0,.7)`,
              ...vetroIn(lf, 40, 14),
            }}
          >
            {invito} &rarr;
          </div>
        ) : null}
        {invito ? (
          <Cursore
            x={interpolate(lf, [46, 64], [930, 700], { ...cl, easing: eOut })}
            y={interpolate(lf, [46, 64], [1560, 1190], { ...cl, easing: eOut })}
            clic={clic}
            opacita={lin(lf, 46, 52)}
          />
        ) : null}
      </AbsoluteFill>

      {/* chiusura: il logo si forma da sfocato, sotto l'invito */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: pL }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(212,255,0,${0.22 * pL}) 0%, transparent 38%)` }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            fontSize: 180,
            fontWeight: 600,
            letterSpacing: interpolate(pL, [0, 1], [0.08, -0.04]) + 'em',
            filter: `blur(${(1 - pL) * 26}px)`,
            scale: String(1.25 - 0.25 * pL),
            marginTop: -120,
          }}
        >
          <span style={{ width: 54, height: 54, borderRadius: 99, background: LIME, boxShadow: `0 0 ${50 * pL}px rgba(212,255,0,.95)` }} />
          dec&rsquo;s
        </div>
        {invito ? (
          <div style={{ marginTop: 60, fontSize: 42, fontWeight: 500, color: 'rgba(255,255,255,.75)', opacity: lin(lf, logo + 14, logo + 28), filter: `blur(${lin(lf, logo + 14, logo + 28, 10, 0)}px)` }}>
            {invito.replace(/(\b[A-ZÀ-Ú]{3,}\b)/, '§$1§')
              .split('§')
              .map((p, i) => (i % 2 ? <span key={i} style={{ color: LIME, textShadow: '0 0 16px rgba(212,255,0,.6)' }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>))}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
