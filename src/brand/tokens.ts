/**
 * Token del brand DEC'S per le tele.
 * Fonte: COMPANY BRAIN/_CONTENUTI/02-TOKEN-VISIVI e 03-FORMATI-E-GRIGLIE
 * (che a loro volta citano _SITO-WEB/style.css). Se un valore qui diverge
 * da quei file, hanno ragione loro: si corregge qui.
 */

export const colore = {
  lime: '#D4FF00',
  limeFreddo: '#B4BF40',
  ink: '#080808',
  bianco: '#FFFFFF',
  bg0: '#080808',
  bg1: '#0D110A',
  bg2: '#1A200F',
  bg3: '#262E17',
  luce0: '#F2F0EB',
  // scala del testo su fondo scuro (opacità del bianco)
  fg: 'rgba(255,255,255,1)',
  fgStrong: 'rgba(255,255,255,.78)',
  fgSoft: 'rgba(255,255,255,.70)',
  fgLabel: 'rgba(255,255,255,.72)',
  fgQuiet: 'rgba(255,255,255,.46)',
  rule: 'rgba(255,255,255,.14)',
  ruleLime: 'rgba(212,255,0,.45)',
} as const;

export const font = {
  sans: "'General Sans', sans-serif",
  serif: "'Instrument Serif', serif",
} as const;

/** I quattro formati che esistono nel sistema. */
export const formati = {
  verticale: { width: 1080, height: 1350 }, // 4:5, default del feed
  quadrato: { width: 1080, height: 1080 }, // caroselli
  storia: { width: 1080, height: 1920 }, // reel, storie
} as const;

/** Griglia: lato corto L = 1080 → margine 8% = 86px, riga base 2% = 22px. */
export const L = 1080;
export const margine = Math.round(L * 0.08); // 86
export const riga = Math.round(L * 0.02); // 22

/** Safe area del 9:16 (03-FORMATI §3, valori prudenziali da verificare a schermo). */
export const safe916 = { alto: 250, basso: 400, lati: 80 };

/** Scala tipografica in px su 1080 di lato corto (02-TOKEN-VISIVI §2). */
export const tipo = {
  display: 96, // 8.0–9.5%
  titolo: 66, // 5.5–6.5%
  lead: 38, // 3.2–3.8%
  corpo: 28, // 2.4–2.8%  (mai sotto 24)
  etichetta: 19, // 1.6–1.9%, maiuscolo .14em
  nota: 15,
  firma: 26, // 2.2–2.6%
} as const;

/** Movimento: easing del sito (02-TOKEN-VISIVI §5). */
export const easing = {
  base: [0.22, 0.61, 0.36, 1] as const,
  ingresso: [0.22, 1, 0.36, 1] as const, // --e-out5
  overshoot: [0.34, 1.56, 0.64, 1] as const,
};

export const FPS = 30;
