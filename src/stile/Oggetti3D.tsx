import React, { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Oggetti 3D v2 — stile "nero lucido + lime": superfici laccate che riflettono
 * un ambiente da studio, un pezzo dell'oggetto in lime pieno.
 * Ogni oggetto anima solo da `t` (secondi) e `fase` (0→1), mai da sé.
 */

export type Oggetto2 =
  | 'moneta-morsa'
  | 'chiave-portachiavi'
  | 'telefono-notifica'
  | 'calendario-caselle'
  | 'stella-incrinata'
  | 'megafono'
  | 'pezzo-scacchi';

export const OGGETTI2: Oggetto2[] = ['moneta-morsa', 'chiave-portachiavi', 'telefono-notifica', 'calendario-caselle', 'stella-incrinata', 'megafono', 'pezzo-scacchi'];

export function scegli2(o?: string, problema?: string): Oggetto2 {
  const x = (o || '').toLowerCase().trim();
  if ((OGGETTI2 as string[]).includes(x)) return x as Oggetto2;
  const p = `${x} ${problema || ''}`.toLowerCase();
  if (/commission|ota|booking|moneta|costo/.test(p)) return 'moneta-morsa';
  if (/dirett|chiave|ritorn|fideli|check/.test(p)) return 'chiave-portachiavi';
  if (/rispost|lent|messagg|telefon|whatsapp|chat/.test(p)) return 'telefono-notifica';
  if (/stagion|calendar|disponib|vuot/.test(p)) return 'calendario-caselle';
  if (/recension|stell|reputaz/.test(p)) return 'stella-incrinata';
  if (/ads|pubblicit|visibil|annunc|social/.test(p)) return 'megafono';
  return 'pezzo-scacchi';
}

const LIME = '#D4FF00';

/** Ambiente da studio: dà i riflessi che rendono "premium" le superfici nere. */
const Ambiente: React.FC<{ intensita?: number }> = ({ intensita = 1 }) => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    scene.environmentIntensity = intensita;
    return () => {
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, intensita]);
  return null;
};

const Nero: React.FC<{ chiaro?: boolean }> = ({ chiaro }) => (
  <meshPhysicalMaterial color={chiaro ? '#2a2c28' : '#121311'} roughness={0.28} metalness={0.15} clearcoat={1} clearcoatRoughness={0.12} />
);
const Lime: React.FC = () => <meshPhysicalMaterial color={LIME} roughness={0.34} metalness={0} clearcoat={0.5} clearcoatRoughness={0.2} emissive={LIME} emissiveIntensity={0.22} />;

type P = { t: number; fase: number };
const eo = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/** Texture disegnata su canvas: serve per scritte e interfacce sugli oggetti (schermi, facce). */
function useTela2D(w: number, h: number, disegna: (c: CanvasRenderingContext2D) => void, chiave: string) {
  return useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const c = cv.getContext('2d')!;
    disegna(c);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave]);
}

/** Simbolo dell'euro in rilievo, costruito con le forme (nessun font 3D da caricare). */
function formaEuro(): THREE.Shape[] {
  const R = 0.5, r = 0.36, a0 = (40 * Math.PI) / 180, a1 = (320 * Math.PI) / 180;
  const arco = new THREE.Shape();
  arco.absarc(0.06, 0, R, a0, a1, false);
  arco.absarc(0.06, 0, r, a1, a0, true);
  arco.closePath();
  const barra = (y: number) => {
    const s = new THREE.Shape();
    s.moveTo(-0.62, y - 0.06);
    s.lineTo(0.22, y - 0.06);
    s.lineTo(0.18, y + 0.06);
    s.lineTo(-0.58, y + 0.06);
    s.closePath();
    return s;
  };
  return [arco, barra(0.1), barra(-0.12)];
}

/**
 * moneta-morsa (commissioni) → una moneta da un euro a cui manca una fetta,
 * e la fetta che se ne va. Si legge senza spiegazioni: "ogni prenotazione ti costa una fetta".
 * L'id resta "moneta-morsa" per non cambiare il prompt dello Stratega.
 */
const MonetaMorsa: React.FC<P> = ({ t, fase }) => {
  const taglio = Math.PI / 3.2; // ampiezza della fetta
  const moneta = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.absarc(0, 0, 1.15, taglio / 2, Math.PI * 2 - taglio / 2, false);
    s.lineTo(0, 0);
    return s;
  }, [taglio]);
  const fetta = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.absarc(0, 0, 1.15, -taglio / 2, taglio / 2, false);
    s.lineTo(0, 0);
    return s;
  }, [taglio]);
  const euro = useMemo(() => formaEuro(), []);
  const via = eo((t - 0.4) / 1.4);
  const ext = { depth: 0.24, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4, curveSegments: 64 };
  return (
    <group rotation={[0.42, -0.5 + fase * 0.35, 0.12]}>
      {/* pila di monete sotto */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[-0.1 * i, -0.36 - i * 0.34, -0.15]} rotation={[Math.PI / 2 - 0.42, 0, 0]}>
          <cylinderGeometry args={[1.15, 1.15, 0.26, 96]} />
          <Nero chiaro={i === 0} />
        </mesh>
      ))}
      {/* moneta lime con la fetta mancante */}
      <group rotation={[-0.15, 0, 0]}>
        <mesh>
          <extrudeGeometry args={[moneta, ext]} />
          <Lime />
        </mesh>
        <group position={[-0.06, 0, 0.3]} scale={0.78}>
          {euro.map((s, i) => (
            <mesh key={i}>
              <extrudeGeometry args={[s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 48 }]} />
              <Nero />
            </mesh>
          ))}
        </group>
        {/* la fetta che se ne va verso destra */}
        <mesh position={[0.2 + via * 0.6, 0.05 + via * 0.3, 0.1 + via * 0.35]} rotation={[via * 0.35, via * -0.5, via * 0.3]}>
          <extrudeGeometry args={[fetta, ext]} />
          <Lime />
        </mesh>
      </group>
    </group>
  );
};

/**
 * chiave-portachiavi (prenotazione diretta) → una chiave vera, piatta, con il
 * portachiavi a forma di casa in lime: "riportare l'ospite a casa tua".
 */
const ChiavePortachiavi: React.FC<P> = ({ t, fase }) => {
  // testa tonda con il foro, costruita a parte: una forma sola si rompe sull'arco
  const testa = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.62, 0, Math.PI * 2, false);
    const foro = new THREE.Path();
    foro.absarc(-0.24, 0, 0.17, 0, Math.PI * 2, true);
    s.holes.push(foro);
    return s;
  }, []);
  const lama = useMemo(() => {
    const p: [number, number][] = [
      [0.4, 0.2], [2.35, 0.2], [2.55, 0.02], [2.55, -0.2], [2.38, -0.2], [2.3, -0.42], [2.14, -0.42], [2.06, -0.2],
      [1.9, -0.2], [1.82, -0.5], [1.66, -0.5], [1.58, -0.2], [1.38, -0.2], [1.3, -0.36], [1.14, -0.36], [1.06, -0.2], [0.4, -0.2],
    ];
    const s = new THREE.Shape();
    s.moveTo(p[0][0], p[0][1]);
    for (const [x, y] of p.slice(1)) s.lineTo(x, y);
    s.closePath();
    return s;
  }, []);
  const casa = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.6, -0.55);
    s.lineTo(0.6, -0.55);
    s.lineTo(0.6, 0.2);
    s.lineTo(0, 0.72);
    s.lineTo(-0.6, 0.2);
    s.closePath();
    const foro = new THREE.Path();
    foro.absarc(0, 0.42, 0.09, 0, Math.PI * 2, true);
    s.holes.push(foro);
    return s;
  }, []);
  const ext = { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 48 };
  const ondeggia = Math.sin(t * 1.4) * 0.08;
  return (
    <group rotation={[0.25, -0.3 + fase * 0.3, 0.42]} position={[-0.9, 0, 0]}>
      <mesh>
        <extrudeGeometry args={[testa, ext]} />
        <Nero chiaro />
      </mesh>
      <mesh>
        <extrudeGeometry args={[lama, ext]} />
        <Nero chiaro />
      </mesh>
      <mesh position={[-0.24, 0, 0.07]} rotation={[0, Math.PI / 2.3, 0]}>
        <torusGeometry args={[0.3, 0.035, 16, 48]} />
        <Nero chiaro />
      </mesh>
      {/* portachiavi a casetta, in lime, appeso all'anello */}
      <group position={[-0.55, -0.95, 0.04]} rotation={[0, 0.35, -0.42 + ondeggia]} scale={0.85}>
        <mesh>
          <extrudeGeometry args={[casa, { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4 }]} />
          <Lime />
        </mesh>
      </group>
    </group>
  );
};

/**
 * telefono-notifica (risposte lente) → uno smartphone con una chat vera sullo
 * schermo alle 23: la domanda dell'ospite e la risposta che arriva subito.
 */
const TelefonoNotifica: React.FC<P> = ({ fase }) => {
  const forma = useMemo(() => {
    const s = new THREE.Shape();
    const w = 1.05, h = 2.1, r = 0.26;
    s.moveTo(-w + r, -h);
    s.lineTo(w - r, -h);
    s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r);
    s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(-w + r, h);
    s.quadraticCurveTo(-w, h, -w, h - r);
    s.lineTo(-w, -h + r);
    s.quadraticCurveTo(-w, -h, -w + r, -h);
    return s;
  }, []);
  const schermo = useTela2D(
    560,
    1180,
    (c) => {
      c.fillStyle = '#0a0b09';
      c.fillRect(0, 0, 560, 1180);
      c.fillStyle = '#ffffff';
      c.font = "600 120px 'General Sans', sans-serif";
      c.textAlign = 'center';
      c.fillText('23:14', 280, 220);
      c.font = "500 30px 'General Sans', sans-serif";
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.fillText('sabato 18 ottobre', 280, 270);
      const bolla = (y: number, testo: string[], mia: boolean) => {
        const w = 400, h = 40 + testo.length * 46, x = mia ? 560 - 40 - w : 40;
        c.fillStyle = mia ? '#D4FF00' : '#2a2c28';
        c.beginPath();
        c.roundRect(x, y, w, h, 34);
        c.fill();
        c.fillStyle = mia ? '#080808' : '#ffffff';
        c.font = "500 34px 'General Sans', sans-serif";
        c.textAlign = 'left';
        testo.forEach((r, i) => c.fillText(r, x + 30, y + 62 + i * 46));
      };
      bolla(420, ['Ciao! È libera', 'la camera sabato?'], false);
      bolla(600, ['Sì! Ti mando foto', 'e prezzo diretto.'], true);
      c.fillStyle = 'rgba(255,255,255,.45)';
      c.font = "500 26px 'General Sans', sans-serif";
      c.textAlign = 'right';
      c.fillText('risposto in 8 secondi', 520, 760);
    },
    'chat-23',
  );
  return (
    <group rotation={[0.12, -0.42 + fase * 0.35, 0.16]}>
      <mesh position={[0, 0, -0.1]}>
        <extrudeGeometry args={[forma, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 5 }]} />
        <Nero />
      </mesh>
      <mesh position={[0, 0, 0.161]}>
        <planeGeometry args={[1.9, 4.0]} />
        <meshBasicMaterial map={schermo} toneMapped={false} />
      </mesh>
    </group>
  );
};

/**
 * calendario-caselle (stagionalità, camere vuote) → un calendario da tavolo vero:
 * anelli, testata lime, i giorni numerati e quasi tutte le caselle libere.
 * Solo tre giorni sono prenotati (caselle nere): "il mese è vuoto".
 */
const CalendarioCaselle: React.FC<P> = ({ t, fase }) => {
  const pagina = useTela2D(
    1000,
    1000,
    (c) => {
      c.fillStyle = '#F7F6F1';
      c.fillRect(0, 0, 1000, 1000);
      const giorni = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
      const x0 = 60, y0 = 150, cw = 126, ch = 160;
      c.textAlign = 'center';
      c.font = "600 40px 'General Sans', sans-serif";
      c.fillStyle = 'rgba(8,8,8,.45)';
      giorni.forEach((g, i) => c.fillText(g, x0 + cw * i + cw / 2, 90));
      const prenotati = new Set([4, 11, 25]);
      for (let d = 1; d <= 31; d++) {
        const k = d + 1; // il mese parte di mercoledì
        const col = k % 7, riga = Math.floor(k / 7);
        const x = x0 + col * cw, y = y0 + riga * ch;
        c.strokeStyle = 'rgba(8,8,8,.14)';
        c.lineWidth = 3;
        c.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
        if (prenotati.has(d)) {
          c.fillStyle = '#080808';
          c.fillRect(x + 4, y + 4, cw - 8, ch - 8);
        }
        c.fillStyle = prenotati.has(d) ? '#ffffff' : '#080808';
        c.font = "600 52px 'General Sans', sans-serif";
        c.textAlign = 'left';
        c.fillText(String(d), x + 20, y + 66);
      }
    },
    'calendario-v2',
  );
  const sfoglia = eo((t - 0.3) / 1.2); // il foglio si posa
  return (
    <group rotation={[-0.22, -0.5 + fase * 0.35, 0.06]}>
      {/* supporto nero dietro */}
      <mesh position={[0, -0.12, -0.12]}>
        <boxGeometry args={[2.75, 3.05, 0.12]} />
        <Nero />
      </mesh>
      {/* testata lime */}
      <mesh position={[0, 1.28, 0.02]}>
        <boxGeometry args={[2.75, 0.5, 0.2]} />
        <Lime />
      </mesh>
      {/* foglio del mese */}
      <mesh position={[0, -0.27, 0.0 + 0.01]} rotation={[(1 - sfoglia) * -0.5, 0, 0]}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshPhysicalMaterial map={pagina} roughness={0.55} clearcoat={0.3} />
      </mesh>
      {/* anelli */}
      {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((x) => (
        <mesh key={x} position={[x, 1.55, 0.02]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.13, 0.03, 12, 32]} />
          <Nero chiaro />
        </mesh>
      ))}
    </group>
  );
};

/** Stella a cinque punte: R raggio esterno, r interno. */
function formaStella(R = 1, r = 0.42) {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 5;
    const rad = k % 2 === 0 ? R : r;
    if (k === 0) s.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else s.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  s.closePath();
  return s;
}

/** Mezza stella (sinistra o destra), tagliata lungo una linea a zig-zag: la crepa. */
function mezzaStella(lato: -1 | 1, R = 1, r = 0.42) {
  // crepa: dall'alto al basso con un piccolo zig-zag
  const crepa: [number, number][] = [
    [0, R],
    [0.06, 0.45],
    [-0.07, 0.12],
    [0.05, -0.18],
    [-0.02, -r * 0.82],
  ];
  const punti: [number, number][] = [];
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 5;
    const rad = k % 2 === 0 ? R : r;
    punti.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  // punte della metà richiesta, ordinate dall'alto in giù
  const meta = punti.filter(([x]) => (lato < 0 ? x < -0.001 : x > 0.001));
  const s = new THREE.Shape();
  s.moveTo(crepa[0][0], crepa[0][1]);
  const ord = lato < 0 ? meta : meta.slice().reverse();
  // lato sinistro: k cresce in senso antiorario → dall'alto scende a sinistra
  for (const [x, y] of ord) s.lineTo(x, y);
  for (const [x, y] of crepa.slice().reverse()) s.lineTo(x, y);
  s.closePath();
  return s;
}

/**
 * stella-incrinata (recensioni, reputazione) → la valutazione a cinque stelle:
 * quattro piene in lime, la quinta nera e spaccata in due. "Una stella in meno".
 */
const StellaIncrinata: React.FC<P> = ({ t, fase }) => {
  const stella = useMemo(() => formaStella(), []);
  const meta = useMemo(() => [mezzaStella(-1), mezzaStella(1)], []);
  const ext = { depth: 0.28, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4 };
  const rotta = eo((t - 1) / 1.2);
  return (
    <group rotation={[0.18, -0.35 + fase * 0.3, 0.14]}>
      {[0, 1, 2, 3].map((i) => {
        const entra = eo((t - i * 0.15) / 0.6);
        return (
          <mesh key={i} position={[(i - 2) * 1.12, 0, 0]} scale={0.5 * entra}>
            <extrudeGeometry args={[stella, ext]} />
            <Lime />
          </mesh>
        );
      })}
      {/* la quinta, nera, spaccata */}
      <group position={[2 * 1.12, -0.05 - rotta * 0.12, 0]} scale={0.5}>
        {meta.map((sh, i) => (
          <mesh key={i} position={[(i ? 1 : -1) * rotta * 0.07, (i ? -1 : 0) * rotta * 0.08, 0]} rotation={[0, 0, (i ? -0.12 : 0.03) * rotta]}>
            <extrudeGeometry args={[sh, ext]} />
            <Nero chiaro />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/** Campana del megafono: profilo per il tornio (asse y, bocca in alto). */
function profiloCampana(): THREE.Vector2[] {
  const p: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    p.push(new THREE.Vector2(0.3 + Math.pow(u, 1.6) * 0.85, u * 1.6));
  }
  return p;
}

/**
 * megafono (visibilità, pubblicità) → un megafono completo: campana lime,
 * corpo e impugnatura neri, e le onde del suono che escono dalla bocca.
 */
const Megafono: React.FC<P> = ({ t, fase }) => {
  const campana = useMemo(() => new THREE.LatheGeometry(profiloCampana(), 96), []);
  const onda = (k: number) => {
    const ciclo = ((t * 0.9 + k * 0.33) % 1 + 1) % 1;
    return { r: 0.75 + k * 0.42 + ciclo * 0.12, o: 0.95 - ciclo * 0.35 };
  };
  return (
    // la bocca guarda verso l'alto a sinistra, verso il titolo
    <group rotation={[0, -0.45 + fase * 0.3, -0.38]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* campana: fuori lime, dentro nera */}
        <mesh geometry={campana} position={[0, 0.2, 0]}>
          <meshPhysicalMaterial color={LIME} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.2} emissive={LIME} emissiveIntensity={0.06} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={campana} position={[0, 0.2, 0]} scale={[0.97, 1, 0.97]}>
          <meshPhysicalMaterial color="#0d0e0c" roughness={0.5} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.07, 16, 96]} />
          <Nero chiaro />
        </mesh>
        {/* corpo */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.34, 0.4, 1.1, 48]} />
          <Nero />
        </mesh>
        <mesh position={[0, -0.95, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.16, 48]} />
          <Nero chiaro />
        </mesh>
        {/* impugnatura e grilletto */}
        <mesh position={[-0.62, -0.5, 0]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.15, 0.62, 8, 24]} />
          <Nero />
        </mesh>
        <mesh position={[-0.42, -0.08, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.1, 0.3, 0.12]} />
          <Nero chiaro />
        </mesh>
      </group>
      {/* onde del suono davanti alla bocca */}
      {[0, 1, 2].map((k) => {
        const o = onda(k);
        return (
          <mesh key={k} position={[-2.0, 0, 0.1]} rotation={[0, 0, Math.PI - 0.7]}>
            <torusGeometry args={[o.r, 0.06, 12, 48, 1.4]} />
            <meshBasicMaterial color={LIME} transparent opacity={o.o} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Pedone: profilo per il tornio. */
function profiloPedone(): THREE.Vector2[] {
  const p: [number, number][] = [
    [0, 0], [0.5, 0], [0.5, 0.08], [0.44, 0.16], [0.44, 0.22], [0.3, 0.32], [0.2, 0.5], [0.16, 0.86],
    [0.28, 0.92], [0.28, 0.98], [0.14, 1.02],
  ];
  const out = p.map(([x, y]) => new THREE.Vector2(x, y));
  // testa sferica
  for (let i = 0; i <= 16; i++) {
    const a = -Math.PI / 2 + 0.55 + (i / 16) * (Math.PI - 0.55);
    out.push(new THREE.Vector2(Math.max(0, Math.cos(a) * 0.27), 1.27 + Math.sin(a) * 0.27));
  }
  return out;
}

/**
 * pezzo-scacchi (strategia, giocare d'anticipo) → la prima mossa: una scacchiera
 * vera e un pedone che avanza di una casa, sulla casella lime.
 */
const PezzoScacchi: React.FC<P> = ({ t, fase }) => {
  const pedone = useMemo(() => new THREE.LatheGeometry(profiloPedone(), 96), []);
  const N = 4, L = 0.62;
  const caselle = useMemo(() => {
    const out: { x: number; z: number; scura: boolean; meta: boolean; k: string }[] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) out.push({ x: (c - (N - 1) / 2) * L, z: (r - (N - 1) / 2) * L, scura: (r + c) % 2 === 1, meta: r === 2 && c === 1, k: `${r}-${c}` });
    return out;
  }, [L]);
  // il pedone parte dalla casa dietro (r=1) e avanza verso chi guarda, sulla lime (r=2)
  const v = Math.min(1, Math.max(0, (t - 2.5) / 1.0));
  const u = v * v * (3 - 2 * v); // nel fotogramma del post (t=3) il pedone è a metà salto
  const zDa = (1 - (N - 1) / 2) * L, zA = (2 - (N - 1) / 2) * L;
  const x = (1 - (N - 1) / 2) * L;
  const salto = Math.sin(Math.PI * u) * 0.4;
  return (
    <group rotation={[0.55, -0.62 + fase * 0.35, 0]}>
      <mesh position={[0, -0.09, 0]}>
        <boxGeometry args={[N * L + 0.2, 0.16, N * L + 0.2]} />
        <Nero />
      </mesh>
      {caselle.map((c) => (
        <mesh key={c.k} position={[c.x, 0.0, c.z]}>
          <boxGeometry args={[L - 0.015, 0.04, L - 0.015]} />
          {c.meta ? <Lime /> : c.scura ? <Nero chiaro /> : <meshPhysicalMaterial color="#e8e6df" roughness={0.3} clearcoat={1} clearcoatRoughness={0.15} />}
        </mesh>
      ))}
      <mesh geometry={pedone} position={[x, 0.02 + salto, zDa + (zA - zDa) * u]} rotation={[(1 - u) * -0.15 * Math.sin(Math.PI * u), 0, 0]} scale={0.95}>
        <Nero />
      </mesh>
      {/* un re sullo sfondo: dice "scacchi" anche a chi guarda di sfuggita */}
      <group position={[(2 - (N - 1) / 2) * L, 0.02, (0 - (N - 1) / 2) * L]} scale={0.62}>
        <mesh geometry={pedone} scale={[1.05, 1.5, 1.05]}>
          <Nero chiaro />
        </mesh>
        <mesh position={[0, 2.25, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <Nero chiaro />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <Nero chiaro />
        </mesh>
      </group>
    </group>
  );
};

const MAPPA: Record<Oggetto2, React.FC<P>> = {
  'moneta-morsa': MonetaMorsa,
  'chiave-portachiavi': ChiavePortachiavi,
  'telefono-notifica': TelefonoNotifica,
  'calendario-caselle': CalendarioCaselle,
  'stella-incrinata': StellaIncrinata,
  megafono: Megafono,
  'pezzo-scacchi': PezzoScacchi,
};

/** Luce: chiave bianca dall'alto a sinistra, controluce lime dal basso a destra (playbook G-04). */
export const Studio3D: React.FC<{ id: Oggetto2; t: number; fase: number; fondoChiaro?: boolean; scala?: number; pos?: [number, number, number] }> = ({
  id,
  t,
  fase,
  fondoChiaro,
  scala = 1,
  pos = [0, 0, 0],
}) => {
  const O = MAPPA[id];
  return (
    <>
      <Ambiente intensita={fondoChiaro ? 0.45 : 0.7} />
      <ambientLight intensity={fondoChiaro ? 0.25 : 0.15} />
      <directionalLight position={[-4, 6, 5]} intensity={fondoChiaro ? 1.6 : 2.4} color="#ffffff" />
      <directionalLight position={[4, -3, -3]} intensity={fondoChiaro ? 0.4 : 4} color={fondoChiaro ? '#ffffff' : LIME} />
      <group position={pos} scale={scala}>
        <O t={t} fase={fase} />
      </group>
    </>
  );
};
