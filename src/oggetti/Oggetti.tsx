import React, { useMemo } from 'react';
import * as THREE from 'three';
import { colore } from '../brand/tokens';

/**
 * La libreria chiusa degli oggetti 3D dei reel (prompt "stratega" v1 del Social OS).
 * Un oggetto = un problema, protagonista dall'inizio alla fine (playbook V-02, G-01).
 * Tutto è costruito in codice con primitive Three.js: niente generatori esterni,
 * niente file da scaricare, nessun costo per pezzo.
 *
 * Materiali ammessi (11-RENDER-AI §3): grafite opaca (default), pietra, vetro scuro, carta.
 * Ogni oggetto riceve `t` (secondi dall'inizio) e `fase` (0 → 1 lungo il reel)
 * e anima solo da lì: nessun movimento che non dipenda dal fotogramma.
 */

export type OggettoId = 'moneta-morsa' | 'chiave-portachiavi' | 'telefono-notifica' | 'calendario-caselle' | 'stella-incrinata';
export const OGGETTI: OggettoId[] = ['moneta-morsa', 'chiave-portachiavi', 'telefono-notifica', 'calendario-caselle', 'stella-incrinata'];

/** Fallback dal tema del post, se lo Stratega non ha indicato un oggetto valido. */
export function scegliOggetto(oggetto?: string, problema?: string): OggettoId {
  const o = (oggetto || '').toLowerCase().trim();
  if ((OGGETTI as string[]).includes(o)) return o as OggettoId;
  const p = `${o} ${problema || ''}`.toLowerCase();
  if (/commission|ota|booking|moneta/.test(p)) return 'moneta-morsa';
  if (/dirett|chiave|ritorn|fideli/.test(p)) return 'chiave-portachiavi';
  if (/rispost|lent|messagg|telefon|whatsapp|chat/.test(p)) return 'telefono-notifica';
  if (/stagion|calendar|disponib|vuot/.test(p)) return 'calendario-caselle';
  if (/recension|stell|reputaz/.test(p)) return 'stella-incrinata';
  return 'chiave-portachiavi';
}

const Grafite: React.FC<{ chiaro?: boolean }> = ({ chiaro }) => (
  <meshStandardMaterial color={chiaro ? '#4a4d46' : '#2e312c'} roughness={0.48} metalness={0.35} />
);
const Pietra: React.FC = () => <meshStandardMaterial color="#1b1c1a" roughness={0.92} metalness={0.05} />;
const Carta: React.FC = () => <meshStandardMaterial color="#cfccc4" roughness={0.95} metalness={0} />;

type P = { t: number; fase: number };

// ─── moneta-morsa · commissioni ─────────────────────────────────────────
const MonetaMorsa: React.FC<P> = ({ t, fase }) => {
  // le ganasce si stringono nella prima parte, poi tengono la moneta
  const stretta = Math.min(1, Math.max(0, (t - 0.4) / 1.4));
  const gap = 1.55 - 0.62 * easeOut(stretta);
  const tremito = stretta >= 1 ? Math.sin(t * 38) * 0.006 : 0;
  return (
    <group rotation={[0.18, -0.55 + fase * 0.5, 0]}>
      {/* moneta */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.25 + tremito, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.16, 96]} />
        <meshStandardMaterial color="#6d6b5e" roughness={0.38} metalness={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.25 + tremito, 0.085]}>
        <torusGeometry args={[0.7, 0.025, 12, 96]} />
        <meshStandardMaterial color="#8a887b" roughness={0.38} metalness={0.45} />
      </mesh>
      {/* ganasce */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * gap) / 2 + s * 0.35, 0.25, 0]}>
          <mesh>
            <boxGeometry args={[0.7, 1.5, 0.9]} />
            <Grafite />
          </mesh>
          <mesh position={[s * -0.36, 0, 0]}>
            <boxGeometry args={[0.04, 1.3, 0.8]} />
            <Grafite chiaro />
          </mesh>
        </group>
      ))}
      {/* base e vite */}
      <mesh position={[0, -0.75, 0]}>
        <boxGeometry args={[3.4, 0.5, 1.1]} />
        <Grafite />
      </mesh>
      <mesh position={[gap / 2 + 0.9, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 1.2, 24]} />
        <Grafite chiaro />
      </mesh>
      <mesh position={[gap / 2 + 1.5, 0.25, 0]} rotation={[t * 2.2 * (1 - stretta) + stretta * 2.2, 0, 0]}>
        <boxGeometry args={[0.08, 1.1, 0.08]} />
        <Grafite chiaro />
      </mesh>
    </group>
  );
};

// ─── chiave-portachiavi · prenotazione diretta ──────────────────────────
const ChiavePortachiavi: React.FC<P> = ({ t, fase }) => {
  const oscilla = Math.sin(t * 1.6) * 0.18 * (1 - fase * 0.5);
  return (
    <group rotation={[0.3, -0.6 + fase * 0.9, oscilla]} position={[0, 0.1, 0]}>
      {/* anello portachiavi */}
      <mesh position={[-1.55, 0.05, 0]} rotation={[0, 0.9, 0]}>
        <torusGeometry args={[0.5, 0.05, 16, 64]} />
        <Grafite chiaro />
      </mesh>
      {/* testa della chiave */}
      <mesh position={[-0.7, 0, 0]}>
        <torusGeometry args={[0.42, 0.17, 24, 64]} />
        <Grafite />
      </mesh>
      {/* stelo */}
      <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 1.9, 32]} />
        <Grafite />
      </mesh>
      {/* denti */}
      {[0.35, 0.7, 1.05, 1.4].map((x, i) => (
        <mesh key={x} position={[x, -0.08 - (0.28 + (i % 2) * 0.14) / 2, 0]}>
          <boxGeometry args={[0.18, 0.28 + (i % 2) * 0.14, 0.12]} />
          <Grafite />
        </mesh>
      ))}
      <mesh position={[1.62, 0, 0]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <Grafite />
      </mesh>
    </group>
  );
};

// ─── telefono-notifica · risposte lente ─────────────────────────────────
const TelefonoNotifica: React.FC<P> = ({ t, fase }) => {
  const forma = useMemo(() => {
    const s = new THREE.Shape();
    const w = 1.05, h = 2.1, r = 0.22;
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
  // notifiche che si accumulano senza risposta
  const n = Math.min(3, Math.floor(Math.max(0, t - 0.6) / 1.4) + (t > 0.6 ? 1 : 0));
  const vibra = Math.sin(t * 45) * 0.012 * (Math.sin(t * 2.5) > 0.6 ? 1 : 0);
  return (
    <group rotation={[0.25, -0.5 + fase * 0.6, 0.12 + vibra]}>
      <mesh position={[0, 0, -0.09]}>
        <extrudeGeometry args={[forma, { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4 }]} />
        <Grafite />
      </mesh>
      {/* schermo spento */}
      <mesh position={[0, 0, 0.14]}>
        <planeGeometry args={[1.86, 3.9]} />
        <meshStandardMaterial color="#0c0d0b" roughness={0.15} metalness={0.4} />
      </mesh>
      {Array.from({ length: n }).map((_, i) => {
        const nascita = 0.6 + i * 1.4;
        const p = Math.min(1, Math.max(0, (t - nascita) / 0.35));
        return (
          <mesh key={i} position={[0, 1.15 - i * 0.62, 0.16 + 0.04 * p]} scale={[0.4 + 0.6 * easeBack(p), 0.4 + 0.6 * easeBack(p), 1]}>
            <boxGeometry args={[1.6, 0.46, 0.05]} />
            <meshStandardMaterial color="#d9d7d0" roughness={0.6} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
};

// ─── calendario-caselle · bassa stagione ────────────────────────────────
const CalendarioCaselle: React.FC<P> = ({ t, fase }) => {
  const caselle = useMemo(() => {
    const out: { x: number; y: number; piena: boolean; i: number }[] = [];
    let i = 0;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 5; c++) out.push({ x: (c - 2) * 0.62, y: (1.5 - r) * 0.62, piena: (r * 5 + c) % 3 !== 1 && r < 2, i: i++ });
    return out;
  }, []);
  return (
    <group rotation={[-0.55, -0.45 + fase * 0.5, -0.08]}>
      <mesh position={[0, 0, -0.18]}>
        <boxGeometry args={[3.4, 2.75, 0.14]} />
        <Pietra />
      </mesh>
      {caselle.map((c) => {
        // le caselle piene cadono via una dopo l'altra: la stagione si svuota
        const caduta = Math.max(0, t - 1.2 - c.i * 0.12);
        const via = c.piena ? Math.min(caduta * caduta * 1.6, 6) : 0;
        return (
          <mesh key={c.i} position={[c.x, c.y - via, 0.05 + (c.piena ? 0.08 : 0)]} rotation={[via * 0.6, via * 0.3, 0]}>
            <boxGeometry args={[0.52, 0.52, c.piena ? 0.3 : 0.06]} />
            {c.piena ? <Carta /> : <Grafite />}
          </mesh>
        );
      })}
    </group>
  );
};

// ─── stella-incrinata · recensioni ──────────────────────────────────────
const StellaIncrinata: React.FC<P> = ({ t, fase }) => {
  const meta = useMemo(() => {
    const punte = 5, R = 1.25, r = 0.52;
    const lato = (s: number) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, -0.9 * r);
      for (let k = 0; k <= punte * 2; k++) {
        const a = Math.PI / 2 + (k * Math.PI) / punte;
        const rad = k % 2 === 0 ? R : r;
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (s * x >= -0.0001) sh.lineTo(Math.max(0, s * x) * s, y);
      }
      sh.lineTo(0, R);
      return sh;
    };
    return [lato(-1), lato(1)];
  }, []);
  const crepa = Math.min(1, Math.max(0, (t - 1.0) / 1.2));
  const d = 0.04 + 0.32 * easeOut(crepa);
  return (
    <group rotation={[0.2, -0.4 + fase * 0.8, 0]}>
      {meta.map((sh, i) => (
        <mesh key={i} position={[(i === 0 ? -1 : 1) * d, -(i === 0 ? 0.06 : 0) * crepa, 0]} rotation={[0, 0, (i === 0 ? 0.08 : -0.08) * crepa]}>
          <extrudeGeometry args={[sh, { depth: 0.34, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }]} />
          <Grafite />
        </mesh>
      ))}
    </group>
  );
};

const MAPPA: Record<OggettoId, React.FC<P>> = {
  'moneta-morsa': MonetaMorsa,
  'chiave-portachiavi': ChiavePortachiavi,
  'telefono-notifica': TelefonoNotifica,
  'calendario-caselle': CalendarioCaselle,
  'stella-incrinata': StellaIncrinata,
};

/**
 * Luci del sistema (playbook G-04, 11-RENDER-AI §3): chiave bianca dall'alto a
 * sinistra, controluce lime dal basso a destra. Il controluce lime È l'elemento
 * lime dell'inquadratura: quando una scena accende una riga in lime, `limeAcceso`
 * va a false e il controluce diventa bianco freddo (un solo lime per tela).
 */
export const Scena3D: React.FC<{ id: OggettoId; t: number; fase: number; limeAcceso: boolean; scala?: number }> = ({
  id,
  t,
  fase,
  limeAcceso,
  scala = 1,
}) => {
  const O = MAPPA[id];
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#0d110a', 0.5]} />
      <directionalLight position={[-4, 6, 5]} intensity={3.2} color="#ffffff" />
      <directionalLight position={[4, -3, -4]} intensity={limeAcceso ? 5.5 : 2.2} color={limeAcceso ? colore.lime : '#cfd6dc'} />
      <pointLight position={[3.5, -1.5, 2.5]} intensity={limeAcceso ? 9 : 3} distance={9} color={limeAcceso ? colore.lime : '#cfd6dc'} />
      <group scale={scala}>
        <O t={t} fase={fase} />
      </group>
    </>
  );
};

function easeOut(x: number) {
  return 1 - Math.pow(1 - x, 3);
}
function easeBack(x: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
