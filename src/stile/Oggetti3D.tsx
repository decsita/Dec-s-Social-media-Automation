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
const Lime: React.FC = () => <meshPhysicalMaterial color={LIME} roughness={0.32} metalness={0} clearcoat={0.7} clearcoatRoughness={0.2} emissive={LIME} emissiveIntensity={0.06} />;

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

const CalendarioCaselle: React.FC<P> = ({ t, fase }) => {
  const caselle = useMemo(() => {
    const out: { x: number; y: number; piena: boolean; i: number }[] = [];
    let i = 0;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) out.push({ x: (c - 2) * 0.64, y: (1.5 - r) * 0.64, piena: (r * 5 + c) % 3 !== 1 && r < 2, i: i++ });
    return out;
  }, []);
  return (
    <group rotation={[-0.5, -0.45 + fase * 0.4, -0.06]}>
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[3.5, 2.85, 0.16]} />
        <Nero />
      </mesh>
      {caselle.map((c) => {
        const via = c.piena ? Math.min(Math.pow(Math.max(0, t - 1 - c.i * 0.1), 2) * 1.6, 6) : 0;
        return (
          <mesh key={c.i} position={[c.x, c.y - via, 0.06 + (c.piena ? 0.1 : 0)]} rotation={[via * 0.6, via * 0.3, 0]}>
            <boxGeometry args={[0.54, 0.54, c.piena ? 0.32 : 0.06]} />
            {c.piena ? <Lime /> : <Nero chiaro />}
          </mesh>
        );
      })}
    </group>
  );
};

const StellaIncrinata: React.FC<P> = ({ t, fase }) => {
  const meta = useMemo(() => {
    const R = 1.3, r = 0.54;
    const lato = (s: number) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, -0.9 * r);
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI / 2 + (k * Math.PI) / 5;
        const rad = k % 2 === 0 ? R : r;
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (s * x >= -0.0001) sh.lineTo(Math.max(0, s * x) * s, y);
      }
      sh.lineTo(0, R);
      return sh;
    };
    return [lato(-1), lato(1)];
  }, []);
  const d = 0.04 + 0.34 * eo((t - 0.8) / 1.2);
  return (
    <group rotation={[0.2, -0.4 + fase * 0.7, 0]}>
      {meta.map((sh, i) => (
        <mesh key={i} position={[(i ? 1 : -1) * d, 0, 0]} rotation={[0, 0, (i ? -0.08 : 0.08) * (d / 0.38)]}>
          <extrudeGeometry args={[sh, { depth: 0.36, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4 }]} />
          {i ? <Nero /> : <Lime />}
        </mesh>
      ))}
    </group>
  );
};

const Megafono: React.FC<P> = ({ t, fase }) => {
  const colpo = 1 + Math.max(0, Math.sin(t * 5)) * 0.03;
  return (
    <group rotation={[0.15, -0.9 + fase * 0.4, 0.28]} scale={colpo}>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.45, 0, 0]}>
        <cylinderGeometry args={[1.05, 0.32, 1.9, 64, 1, true]} />
        <meshPhysicalMaterial color={LIME} roughness={0.3} clearcoat={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[1.42, 0, 0]}>
        <torusGeometry args={[1.05, 0.07, 16, 64]} />
        <Nero chiaro />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.85, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.75, 48]} />
        <Nero />
      </mesh>
      <mesh position={[-0.75, -0.65, 0]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.28, 0.9, 0.3]} />
        <Nero />
      </mesh>
    </group>
  );
};

const PezzoScacchi: React.FC<P> = ({ fase }) => {
  const geo = useMemo(() => {
    const p: [number, number][] = [
      [0, 0], [0.95, 0], [0.95, 0.12], [0.82, 0.22], [0.82, 0.32], [0.58, 0.45], [0.42, 0.62], [0.36, 1.6],
      [0.5, 1.72], [0.5, 1.82], [0.34, 1.9], [0.44, 2.3], [0.52, 2.55], [0.2, 2.7], [0, 2.7],
    ];
    return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), 96);
  }, []);
  return (
    <group rotation={[0.08, fase * 1.2, 0]} position={[0, -1.4, 0]}>
      <mesh geometry={geo}>
        <Nero />
      </mesh>
      {/* croce del re, in lime */}
      <mesh position={[0, 3.05, 0]}>
        <boxGeometry args={[0.16, 0.7, 0.16]} />
        <Lime />
      </mesh>
      <mesh position={[0, 3.12, 0]}>
        <boxGeometry args={[0.5, 0.16, 0.16]} />
        <Lime />
      </mesh>
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
