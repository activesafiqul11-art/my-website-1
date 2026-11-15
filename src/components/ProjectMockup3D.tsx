import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { resolveMediaUrl } from '../lib/media';
import { ResilientImage } from './ResilientImage';

interface ProjectMockup3DProps {
  imageUrl: string;
  title: string;
  mockupType: 'laptop' | 'phone';
  exploded?: boolean;
  assembleKey?: number;
}

function DeviceRig({
  imageUrl,
  mockupType,
  exploded,
  assembleKey,
}: {
  imageUrl: string;
  mockupType: 'laptop' | 'phone';
  exploded: boolean;
  assembleKey: number;
}) {
  const { gl, scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  // Assembly & exploded kinematics state
  const buildProgressRef = useRef(0);
  const explodeProgressRef = useRef(exploded ? 1 : 0);

  // Laptop sub-parts
  const laptopLidRef = useRef<THREE.Group>(null);
  const laptopScreenRef = useRef<THREE.Mesh>(null);
  const laptopBaseRef = useRef<THREE.Mesh>(null);
  const laptopHingeRef = useRef<THREE.Mesh>(null);

  // Phone sub-parts
  const phoneBodyRef = useRef<THREE.Mesh>(null);
  const phoneRimRef = useRef<THREE.Mesh>(null);
  const phoneScreenRef = useRef<THREE.Mesh>(null);

  const resolved = resolveMediaUrl(imageUrl);

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(resolved);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [resolved]);

  useEffect(() => {
    buildProgressRef.current = 0;
  }, [assembleKey, mockupType]);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    pmrem.dispose();
    return () => {
      env.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const targetY = Math.sin(t * 0.55) * 0.25 + pointerRef.current.x * 0.35;
    const targetX = 0.08 - pointerRef.current.y * 0.16;
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetY, 5, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetX, 5, delta);

    buildProgressRef.current = THREE.MathUtils.damp(buildProgressRef.current, 1, 3.2, delta);
    explodeProgressRef.current = THREE.MathUtils.damp(
      explodeProgressRef.current,
      exploded ? 1 : 0,
      4.5,
      delta,
    );

    const unbuilt = 1 - buildProgressRef.current;
    const sep = explodeProgressRef.current;

    if (mockupType === 'laptop') {
      if (laptopBaseRef.current) {
        laptopBaseRef.current.position.y = -0.42 - unbuilt * 0.7 - sep * 0.28;
      }
      if (laptopHingeRef.current) {
        laptopHingeRef.current.position.z = -0.58 - unbuilt * 0.9 - sep * 0.35;
        laptopHingeRef.current.position.y = -0.36 + sep * 0.1;
      }
      if (laptopLidRef.current) {
        laptopLidRef.current.position.y = 0.55 + unbuilt * 0.8 + sep * 0.34;
        laptopLidRef.current.rotation.x = -0.14 - unbuilt * 1.15;
      }
      if (laptopScreenRef.current) {
        laptopScreenRef.current.position.z = 0.045 + unbuilt * 0.85 + sep * 0.52;
      }
    } else {
      if (phoneBodyRef.current) {
        phoneBodyRef.current.position.y = -unbuilt * 0.9;
        phoneBodyRef.current.position.z = -sep * 0.28;
      }
      if (phoneRimRef.current) {
        phoneRimRef.current.position.z = -0.01 - unbuilt * 0.95 - sep * 0.56;
      }
      if (phoneScreenRef.current) {
        phoneScreenRef.current.position.z = 0.075 + unbuilt * 1.05 + sep * 0.48;
      }
    }
  });

  return (
    <>
      <hemisphereLight args={['#CBD5E1', '#18181B', 0.7]} />
      <directionalLight position={[4, 5, 4]} intensity={2.0} color="#FFE7C2" />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#E5A93C" />

      <group ref={groupRef}>
        {mockupType === 'phone' ? (
          <group>
            <mesh ref={phoneBodyRef}>
              <boxGeometry args={[1.38, 2.75, 0.14]} />
              <meshStandardMaterial color="#18181D" metalness={0.88} roughness={0.22} />
            </mesh>
            <mesh ref={phoneRimRef} position={[0, 0, -0.01]}>
              <boxGeometry args={[1.42, 2.79, 0.06]} />
              <meshStandardMaterial color="#E5A93C" metalness={0.92} roughness={0.2} />
            </mesh>
            <mesh ref={phoneScreenRef} position={[0, 0, 0.075]}>
              <planeGeometry args={[1.24, 2.58]} />
              <meshBasicMaterial map={texture} />
            </mesh>
          </group>
        ) : (
          <group position={[0, -0.1, 0]}>
            {/* Lid & Screen */}
            <group ref={laptopLidRef} position={[0, 0.55, -0.55]} rotation={[-0.14, 0, 0]}>
              <mesh>
                <boxGeometry args={[3.1, 1.92, 0.08]} />
                <meshStandardMaterial color="#1A1B20" metalness={0.86} roughness={0.25} />
              </mesh>
              <mesh ref={laptopScreenRef} position={[0, 0, 0.045]}>
                <planeGeometry args={[2.9, 1.72]} />
                <meshBasicMaterial map={texture} />
              </mesh>
            </group>
            {/* Aluminum Base Deck */}
            <mesh ref={laptopBaseRef} position={[0, -0.42, 0.35]}>
              <boxGeometry args={[3.14, 0.09, 1.95]} />
              <meshStandardMaterial color="#23242B" metalness={0.85} roughness={0.32} />
            </mesh>
            {/* Champagne Gold Hinge Accent */}
            <mesh ref={laptopHingeRef} position={[0, -0.36, -0.58]}>
              <boxGeometry args={[2.6, 0.07, 0.08]} />
              <meshStandardMaterial color="#E5A93C" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        )}

        {/* Grounding Studio Plinth Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.52, 0]}>
          <ringGeometry args={[1.45, 1.49, 64]} />
          <meshBasicMaterial color="#E5A93C" transparent opacity={0.24} />
        </mesh>
      </group>
    </>
  );
}

export default function ProjectMockup3D({
  imageUrl,
  title,
  mockupType,
  exploded = false,
  assembleKey = 0,
}: ProjectMockup3DProps) {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 640;
    if (reduced || isSmall) setLite(true);
  }, []);

  if (lite) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#09090B]">
        <ResilientImage
          src={imageUrl}
          alt={title}
          fallbackTitle={title}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#09090B]">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.25, 4.6], fov: 38 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#09090B']} />
        <DeviceRig
          imageUrl={imageUrl}
          mockupType={mockupType}
          exploded={exploded}
          assembleKey={assembleKey}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[11px] text-[#A1A1AA] bg-[#09090B]/85 px-2.5 py-1 rounded border border-white/10">
        3D {mockupType.toUpperCase()} {exploded ? 'EXPLODED ASSEMBLY' : 'MOCKUP'} · MOVE CURSOR TO INSPECT
      </div>
    </div>
  );
}
