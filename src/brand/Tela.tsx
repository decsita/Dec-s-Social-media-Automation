import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colore, font, margine, tipo } from './tokens';

export type Fondo = 'bg-0' | 'bg-1' | 'bg-2';
const FONDI: Record<Fondo, string> = { 'bg-0': colore.bg0, 'bg-1': colore.bg1, 'bg-2': colore.bg2 };

/** Intensità dell'alone (02-TOKEN-VISIVI §1): tenue è il default, medio per copertine e chiusure. */
const INTENSITA = { medio: 0.14, tenue: 0.1, fioco: 0.085 } as const;

/**
 * La superficie di ogni contenuto: fondo nero-verde + alone lime.
 * Una tela piatta è un errore (02-TOKEN-VISIVI §1), quindi l'alone c'è sempre.
 * L'alone è luce, non un oggetto: non consuma l'unico lime della tela.
 */
export const Tela: React.FC<{
  fondo?: Fondo;
  alone?: keyof typeof INTENSITA;
  aloneX?: string;
  aloneY?: string;
  respiro?: number; // 0..1, per far respirare l'alone nei video
  children?: React.ReactNode;
}> = ({ fondo = 'bg-0', alone = 'tenue', aloneX = '12%', aloneY = '4%', respiro = 0, children }) => {
  const a = INTENSITA[alone] * (1 + respiro * 0.25);
  return (
    <AbsoluteFill style={{ backgroundColor: FONDI[fondo], fontFamily: font.sans, color: colore.fg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${aloneX} ${aloneY}, rgba(212,255,0,${a}) 0%, rgba(212,255,0,${a * 0.45}) 22%, rgba(212,255,0,0) 58%)`,
          filter: 'blur(100px)',
          scale: String(1 + respiro * 0.04),
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/** L'occhiello: maiuscolo spaziato, con il quadratino lime del payoff. */
export const Etichetta: React.FC<{ children: React.ReactNode; tick?: boolean; style?: React.CSSProperties }> = ({
  children,
  tick = true,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      fontSize: tipo.etichetta,
      fontWeight: 500,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: colore.fgLabel,
      ...style,
    }}
  >
    {tick ? <span style={{ width: 7, height: 7, background: colore.lime, display: 'inline-block' }} /> : null}
    <span>{children}</span>
  </div>
);

/** Il wordmark: dec's minuscolo, General Sans 600, in un angolo, mai al centro. */
export const Firma: React.FC<{ style?: React.CSSProperties; colore?: string }> = ({ style, colore: c = colore.fg }) => (
  <div style={{ fontSize: tipo.firma, fontWeight: 600, letterSpacing: '-.03em', color: c, ...style }}>dec&rsquo;s</div>
);

/** Indice di slide in zona bassa: 03/07. */
export const Indice: React.FC<{ n: number; tot: number }> = ({ n, tot }) => (
  <div style={{ fontSize: tipo.etichetta, letterSpacing: '.14em', color: colore.fgQuiet, fontWeight: 500 }}>
    {String(n).padStart(2, '0')}/{String(tot).padStart(2, '0')}
  </div>
);

export const M = margine;
