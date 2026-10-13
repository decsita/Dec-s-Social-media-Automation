import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { Studio3D, scegli2 } from './Oggetti3D';

/**
 * Stile v2 (prototipo): titolo condensato maiuscolo enorme, righe accese in lime,
 * oggetto 3D protagonista grande in basso, curva lime, pulsante freccia.
 * Tre registri: scuro, chiaro (avorio), lime pieno.
 */

export const fontV2 = loadFont({ family: 'Anton', url: staticFile('fonts/anton-400-latin.woff2'), weight: '400' });

const LIME = '#D4FF00';
/** Ogni oggetto ha la sua misura: deve stare in basso a destra senza coprire il titolo. */
const SCALA: Record<string, number> = { 'moneta-morsa': 0.82, 'chiave-portachiavi': 0.9, 'telefono-notifica': 0.62, 'calendario-caselle': 0.8, 'stella-incrinata': 0.9, megafono: 0.85, 'pezzo-scacchi': 0.68 };
const INK = '#080808';
const AVORIO = '#F2F0EB';

export type Registro = 'scuro' | 'chiaro' | 'lime';

const TEMI: Record<Registro, { fondo: string; testo: string; accento: string; tenue: string; alone: string }> = {
  scuro: { fondo: '#0B0D09', testo: '#FFFFFF', accento: LIME, tenue: 'rgba(255,255,255,.62)', alone: 'rgba(212,255,0,.22)' },
  chiaro: { fondo: AVORIO, testo: INK, accento: INK, tenue: 'rgba(8,8,8,.62)', alone: 'rgba(212,255,0,.0)' },
  lime: { fondo: LIME, testo: INK, accento: INK, tenue: 'rgba(8,8,8,.7)', alone: 'rgba(255,255,255,.25)' },
};

export type PostV2Props = {
  registro: Registro;
  titolo: string; // righe separate da \n; ==riga== = accesa
  corpo?: string;
  occhiello?: string; // piccolo testo in alto a destra
  oggetto?: string;
  problema?: string;
  invito?: string;
};

/** Titolo condensato: ogni riga va a capo da sola, le righe ==così== si accendono. */
const TitoloCondensato: React.FC<{ testo: string; tema: (typeof TEMI)[Registro]; dimensione: number }> = ({ testo, tema, dimensione }) => (
  <div style={{ fontFamily: 'Anton', fontSize: dimensione, lineHeight: 0.92, textTransform: 'uppercase', letterSpacing: '-.005em' }}>
    {testo
      .replace(/\\n/g, '\n')
      .split('\n')
      .map((r, i) => {
        const accesa = /^==.*==$/.test(r.trim());
        return (
          <div key={i} style={{ color: accesa ? tema.accento : tema.testo }}>
            {r.replace(/==|\*/g, '')}
          </div>
        );
      })}
  </div>
);

export const PostV2: React.FC<PostV2Props> = ({ registro, titolo, corpo, occhiello, oggetto, problema, invito }) => {
  const tema = TEMI[registro];
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const righe = titolo.replace(/\\n/g, '\n').split('\n');
  const piuLunga = Math.max(...righe.map((r) => r.replace(/==|\*/g, '').length));
  const dimensione = Math.min(168, Math.round(820 / Math.max(6, piuLunga) * 1.55));
  const id = scegli2(oggetto, problema);
  return (
    <AbsoluteFill style={{ background: tema.fondo, fontFamily: "'General Sans', sans-serif", color: tema.testo, overflow: 'hidden' }}>
      {/* luce d'ambiente dietro l'oggetto */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 72% 74%, ${tema.alone} 0%, transparent 46%)` }} />

      {/* curva lime che attraversa la tela */}
      {registro !== 'lime' ? (
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          <path
            d={`M ${width * 0.18} ${height * 1.02} C ${width * 0.35} ${height * 0.62}, ${width * 0.9} ${height * 0.86}, ${width * 1.05} ${height * 0.38}`}
            stroke={LIME}
            strokeWidth={registro === 'chiaro' ? 5 : 4}
            fill="none"
            opacity={0.9}
            style={{ filter: registro === 'scuro' ? 'drop-shadow(0 0 14px rgba(212,255,0,.8))' : undefined }}
          />
        </svg>
      ) : null}

      {/* oggetto protagonista, grande, in basso a destra, anche tagliato */}
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 8], fov: 34 }}>
          <Studio3D id={id} t={f / 30 + 3} fase={0.35} fondoChiaro={registro !== 'scuro'} scala={SCALA[id] ?? 0.85} pos={[1.25, -1.55, 0]} />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* testata: firma a sinistra, occhiello a destra */}
      <div style={{ position: 'absolute', left: 72, right: 72, top: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, fontSize: 30, letterSpacing: '-.03em' }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: registro === 'lime' ? INK : LIME }} />
          dec&rsquo;s
        </div>
        {occhiello ? (
          <div style={{ fontSize: 20, lineHeight: 1.3, textAlign: 'right', color: tema.tenue, maxWidth: 240 }}>{occhiello}</div>
        ) : null}
      </div>

      {/* titolo + corpo, in alto a sinistra */}
      <div style={{ position: 'absolute', left: 72, top: 170, maxWidth: 640 }}>
        <TitoloCondensato testo={titolo} tema={tema} dimensione={dimensione} />
        {corpo ? <div style={{ marginTop: 34, fontSize: 25, lineHeight: 1.42, color: tema.tenue, maxWidth: 400 }}>{corpo.replace(/==|\*/g, '')}</div> : null}
      </div>

      {/* piede: pulsante freccia + invito */}
      <div style={{ position: 'absolute', left: 72, bottom: 64, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 99,
            background: registro === 'lime' ? INK : LIME,
            color: registro === 'lime' ? LIME : INK,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          →
        </div>
        {invito ? <div style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 500, maxWidth: 260 }}>{invito}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
