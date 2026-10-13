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
const Avorio: React.FC = () => <meshPhysicalMaterial color="#ecebe5" roughness={0.45} clearcoat={0.3} />;

type P = { t: number; fase: number };
const eo = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const MonetaMorsa: React.FC<P> = ({ t }) => {
  const s = eo((t - 0.3) / 1.2);
  const gap = 1.7 - 0.7 * s;
  return (
    <group rotation={[0.22, -0.62, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.2, 96]} />
        <Lime />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.35, 0.105]}>
        <torusGeometry args={[0.72, 0.03, 12, 96]} />
        <Lime />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[(k * gap) / 2 + k * 0.38, 0.3, 0]}>
          <boxGeometry args={[0.76, 1.7, 1]} />
          <Nero />
        </mesh>
      ))}
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[3.6, 0.5, 1.2]} />
        <Nero chiaro />
      </mesh>
      <mesh position={[gap / 2 + 1.05, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.3, 32]} />
        <Nero chiaro />
      </mesh>
    </group>
  );
};

const ChiavePortachiavi: React.FC<P> = ({ t, fase }) => (
  <group rotation={[0.35, -0.5 + fase * 0.8, Math.sin(t * 1.5) * 0.12]}>
    <mesh position={[-1.7, 0, 0]} rotation={[0, 0.9, 0]}>
      <torusGeometry args={[0.55, 0.06, 16, 64]} />
      <Nero chiaro />
    </mesh>
    <mesh position={[-0.75, 0, 0]}>
      <torusGeometry args={[0.45, 0.19, 32, 64]} />
      <Lime />
    </mesh>
    <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.12, 0.12, 2, 32]} />
      <Lime />
    </mesh>
    {[0.35, 0.72, 1.08, 1.45].map((x, i) => {
      const h = 0.3 + (i % 2) * 0.15;
      return (
        <mesh key={x} position={[x, -0.08 - h / 2, 0]}>
          <boxGeometry args={[0.2, h, 0.14]} />
          <Lime />
        </mesh>
      );
    })}
  </group>
);

const TelefonoNotifica: React.FC<P> = ({ t, fase }) => {
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
  const n = Math.min(3, t > 0.4 ? 1 + Math.floor((t - 0.4) / 1.2) : 0);
  return (
    <group rotation={[0.2, -0.45 + fase * 0.5, 0.14]}>
      <mesh position={[0, 0, -0.1]}>
        <extrudeGeometry args={[forma, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 5 }]} />
        <Nero />
      </mesh>
      <mesh position={[0, 0, 0.16]}>
        <planeGeometry args={[1.86, 3.9]} />
        <meshPhysicalMaterial color="#050505" roughness={0.05} clearcoat={1} />
      </mesh>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[0, 1.15 - i * 0.62, 0.2]}>
          <boxGeometry args={[1.6, 0.46, 0.06]} />
          {i === 0 ? <Lime /> : <Avorio />}
        </mesh>
      ))}
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
