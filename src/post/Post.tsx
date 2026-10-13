import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Etichetta, Firma, Indice, M, Tela, Fondo } from '../brand/Tela';
import { Testo, misuraTitolo } from '../brand/Testo';
import { colore, font, tipo } from '../brand/tokens';

/**
 * Le grafiche dei post statici. Ogni componente riceve le `props` che il
 * Copywriter del Social OS scrive nel campo props_json (prompt "copywriter" v1).
 * Layout (playbook G-03): testo in alto a sinistra, dentro il margine dell'8%.
 */

const Colonna: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 40 }) => (
  <AbsoluteFill style={{ padding: M, display: 'flex', flexDirection: 'column', gap }}>{children}</AbsoluteFill>
);

const Titolo: React.FC<{ testo: string; max?: number; min?: number; style?: React.CSSProperties }> = ({
  testo,
  max = tipo.display,
  min = tipo.titolo,
  style,
}) => (
  <div
    style={{
      fontSize: misuraTitolo(testo, max, min),
      fontWeight: 500,
      lineHeight: 1.04,
      letterSpacing: '-.02em',
      maxWidth: '92%',
      textWrap: 'balance',
      ...style,
    }}
  >
    <Testo testo={testo} />
  </div>
);

/** Zona bassa con la firma (una per pezzo). */
const Piede: React.FC<{ destra?: React.ReactNode; firma?: boolean }> = ({ destra, firma = true }) => (
  <div style={{ position: 'absolute', left: M, right: M, bottom: M, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    {firma ? <Firma /> : <span />}
    {destra}
  </div>
);

// ─── F1 Tesi · F6 Numero ────────────────────────────────────────────────
export type PostTesiProps = { etichetta?: string; tesi: string };
export const PostTesi: React.FC<PostTesiProps> = ({ etichetta, tesi }) => (
  <Tela>
    <Colonna gap={48}>
      <div style={{ height: 120, display: 'flex', alignItems: 'flex-end' }}>{etichetta ? <Etichetta>{etichetta}</Etichetta> : null}</div>
      <Titolo testo={tesi} />
    </Colonna>
    <Piede />
  </Tela>
);

// ─── F7 Domanda dal campo ───────────────────────────────────────────────
export type PostDomandaProps = { domanda: string; etichetta?: string };
export const PostDomanda: React.FC<PostDomandaProps> = ({ domanda, etichetta = 'Domanda dal campo' }) => (
  <Tela alone="tenue">
    <Colonna gap={48}>
      <div style={{ height: 120, display: 'flex', alignItems: 'flex-end' }}>
        <Etichetta>{etichetta}</Etichetta>
      </div>
      <div
        style={{
          fontFamily: font.serif,
          fontStyle: 'italic',
          fontSize: misuraTitolo(domanda, 104, 72),
          lineHeight: 1.05,
          maxWidth: '92%',
          color: colore.fg,
          textWrap: 'balance',
        }}
      >
        &laquo;{domanda.replace(/==|\*/g, '')}&raquo;
      </div>
    </Colonna>
    <Piede />
  </Tela>
);

// ─── F4 Prima / dopo ────────────────────────────────────────────────────
export type PostPrimaDopoProps = { prima: string; dopo: string; etichetta?: string };
export const PostPrimaDopo: React.FC<PostPrimaDopoProps> = ({ prima, dopo, etichetta }) => {
  const Box: React.FC<{ etic: string; testo: string; acceso?: boolean }> = ({ etic, testo, acceso }) => (
    <div
      style={{
        flex: 1,
        borderRadius: 28,
        background: acceso ? colore.bg2 : colore.bg1,
        border: `1px solid ${acceso ? colore.ruleLime : colore.rule}`,
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <Etichetta tick={!!acceso}>{etic}</Etichetta>
      <div style={{ fontSize: misuraTitolo(testo, tipo.titolo, 44), fontWeight: 500, lineHeight: 1.1, letterSpacing: '-.02em', color: acceso ? colore.fg : colore.fgSoft }}>
        {testo.replace(/==|\*/g, '')}
      </div>
    </div>
  );
  return (
    <Tela>
      <Colonna gap={32}>
        <div style={{ height: 60, display: 'flex', alignItems: 'flex-end' }}>{etichetta ? <Etichetta tick={false}>{etichetta}</Etichetta> : null}</div>
        <Box etic="Prima" testo={prima} />
        <Box etic="Dopo" testo={dopo} acceso />
        <div style={{ height: 70 }} />
      </Colonna>
      <Piede />
    </Tela>
  );
};

// ─── F8 Servizio ────────────────────────────────────────────────────────
export type CardServizioProps = { titolo: string; punti: string[]; etichetta?: string };
export const CardServizio: React.FC<CardServizioProps> = ({ titolo, punti = [], etichetta = 'Cosa facciamo' }) => (
  <Tela alone="medio">
    <Colonna gap={44}>
      <div style={{ height: 120, display: 'flex', alignItems: 'flex-end' }}>
        <Etichetta>{etichetta}</Etichetta>
      </div>
      <Titolo testo={titolo} max={tipo.titolo + 8} min={52} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
        {punti.slice(0, 5).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 24, padding: '26px 0', borderTop: `1px solid ${colore.rule}`, fontSize: tipo.lead - 4, lineHeight: 1.3, color: colore.fgStrong }}>
            <span style={{ color: colore.fgQuiet, fontSize: tipo.etichetta + 2, letterSpacing: '.14em', paddingTop: 8 }}>{String(i + 1).padStart(2, '0')}</span>
            <span>{p.replace(/==|\*/g, '')}</span>
          </div>
        ))}
      </div>
    </Colonna>
    <Piede />
  </Tela>
);

// ─── F2 Carosello ───────────────────────────────────────────────────────
export type CopertinaCaroselloProps = { etichetta?: string; titolo: string; totale?: number };
export const CopertinaCarosello: React.FC<CopertinaCaroselloProps> = ({ etichetta, titolo, totale = 6 }) => (
  <Tela fondo="bg-2" alone="medio">
    <Colonna gap={44}>
      <div style={{ height: 90, display: 'flex', alignItems: 'flex-end' }}>{etichetta ? <Etichetta>{etichetta}</Etichetta> : null}</div>
      <Titolo testo={titolo} max={92} min={64} />
    </Colonna>
    <Piede destra={<Indice n={1} tot={totale} />} />
  </Tela>
);

export type SlideCaroselloProps = { numero?: string; titolo: string; testo?: string; indice?: number; totale?: number; chiusura?: boolean };
export const SlideCarosello: React.FC<SlideCaroselloProps> = ({ numero, titolo, testo, indice = 2, totale = 6, chiusura = false }) => {
  const fondo: Fondo = indice % 2 === 0 ? 'bg-1' : 'bg-2';
  return (
    <Tela fondo={fondo} alone={chiusura ? 'medio' : 'fioco'} aloneX="88%" aloneY="96%">
      <Colonna gap={36}>
        <div style={{ height: 90, display: 'flex', alignItems: 'flex-end' }}>
          {numero ? (
            <span style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 88, lineHeight: 1, color: colore.fgStrong }}>{numero}</span>
          ) : null}
        </div>
        <Titolo testo={titolo} max={tipo.titolo + 6} min={50} />
        {testo ? (
          <div style={{ fontSize: tipo.corpo + 2, lineHeight: 1.55, color: colore.fgSoft, maxWidth: '88%' }}>
            <Testo testo={testo.replace(/==/g, '')} />
          </div>
        ) : null}
      </Colonna>
      <Piede firma={chiusura} destra={<Indice n={indice} tot={totale} />} />
    </Tela>
  );
};
