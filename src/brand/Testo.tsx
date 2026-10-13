import React from 'react';
import { colore, font } from './tokens';

/**
 * Il markup che scrive il Copywriter del Social OS:
 *   ==riga==   → la riga accesa in lime (Evidenza). Una sola per tela.
 *   *parole*   → corsivo Instrument Serif (Accento): chiusure, numeri, citazioni.
 *   \n         → a capo.
 * Su fondo chiaro l'Evidenza diventa ink pieno (il lime non è un colore di testo).
 */
export const Testo: React.FC<{ testo: string; accesa?: string; serifScale?: number }> = ({
  testo,
  accesa = colore.lime,
  serifScale = 1.08,
}) => {
  const righe = (testo || '').replace(/\\n/g, '\n').split('\n');
  return (
    <>
      {righe.map((r, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <br /> : null}
          {spezza(r, accesa, serifScale)}
        </React.Fragment>
      ))}
    </>
  );
};

function spezza(riga: string, accesa: string, serifScale: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /==(.+?)==|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(riga))) {
    if (m.index > last) out.push(riga.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <span key={k++} style={{ color: accesa }}>
          {spezza(m[1], accesa, serifScale)}
        </span>,
      );
    } else {
      out.push(
        <span
          key={k++}
          style={{ fontFamily: font.serif, fontStyle: 'italic', fontWeight: 400, fontSize: `${serifScale}em`, letterSpacing: 0 }}
        >
          {m[2]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < riga.length) out.push(riga.slice(last));
  return out;
}

/** Testo pulito (senza markup), per contare parole e caratteri. */
export const pulito = (t: string) => (t || '').replace(/==|\*/g, '').replace(/\\n/g, '\n');
export const parole = (t: string) => pulito(t).split(/\s+/).filter(Boolean).length;

/** Dimensione del titolo che si adatta alla lunghezza, dentro la scala del brand. */
export function misuraTitolo(t: string, max: number, min: number): number {
  const n = pulito(t).length;
  if (n <= 28) return max;
  if (n >= 90) return min;
  return Math.round(max - ((n - 28) / (90 - 28)) * (max - min));
}
