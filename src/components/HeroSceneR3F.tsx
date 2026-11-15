import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ResilientImage } from './ResilientImage';

interface HeroSceneR3FProps {
  wordmark: string;
  scrollProgress: number;
  fallbackImage?: string;
}

const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

const SubtleNoiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmount: { value: 0.022 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      float n = (rand(vUv + fract(uTime)) - 0.5) * uAmount;
      gl_FragColor = vec4(col.rgb + n, col.a);
    }
  `,
};

function detectSoftwareGl(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createGlassCardTexture(title: string, metric: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(18, 18, 22, 0.92)';
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);

    // Mini motion waveform / chart lines
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 36; x <= c.width - 36; x += 18) {
      const y = 175 + Math.sin(x * 0.025) * 32 - (x / c.width) * 36;
      if (x === 36) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title, 36, 66);

    ctx.fillStyle = '#F4F4F0';
    ctx.font = '700 44px "Bricolage Grotesque", sans-serif';
    ctx.fillText(metric, 36, 268);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawPhoneFeed(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#0B0B0E';
  ctx.fillRect(0, 0, w, h);

  // Header strip
  ctx.fillStyle = '#15151B';
  ctx.fillRect(0, 0, w, 54);
  ctx.fillStyle = '#E5A93C';
  ctx.font = '700 18px "Bricolage Grotesque", sans-serif';
  ctx.fillText('MOTION FEED', 22, 34);

  // Scrolling feed cards
  const scrollOffset = (t * 44) % 210;
  for (let i = -1; i < 4; i++) {
    const y = 72 + i * 210 - scrollOffset;
    ctx.fillStyle = '#16161C';
    ctx.fillRect(20, y, w - 40, 186);

    ctx.strokeStyle = 'rgba(229, 169, 60, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, y, w - 40, 186);

    // Visual preview box inside feed post
    const grad = ctx.createLinearGradient(34, y + 16, w - 34, y + 124);
    grad.addColorStop(0, '#1D1A14');
    grad.addColorStop(1, '#262116');
    ctx.fillStyle = grad;
    ctx.fillRect(34, y + 16, w - 68, 108);

    ctx.strokeStyle = '#E5A93C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, y + 70, 26 + Math.sin(t * 2 + i) * 4, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.fillStyle = '#F4F4F0';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Campaign Reel 0${((i + 4) % 4) + 1}`, 34, y + 156);
  }
}

function PostProcessingEffects({ enabled }: { enabled: boolean }) {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    if (!enabled) return null;
    const comp = new EffectComposer(gl);
    comp.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.26,
      0.45,
      0.85,
    );
    comp.addPass(bloom);

    const bokeh = new BokehPass(scene, camera, {
      focus: 6.2,
      aperture: 0.00018,
      maxblur: 0.0035,
    });
    comp.addPass(bokeh);

    const noise = new ShaderPass(SubtleNoiseShader);
    comp.addPass(noise);

    return { comp, noise };
  }, [enabled, gl, scene, camera]);

  useEffect(() => {
    if (!composer) return;
    composer.comp.setSize(size.width, size.height);
  }, [composer, size]);

  useEffect(() => {
    return () => {
      composer?.comp.dispose();
    };
  }, [composer]);

  useFrame((state) => {
    if (!composer) return;
    composer.noise.uniforms.uTime.value = state.clock.elapsedTime;
    composer.comp.render();
  }, 1);

  return null;
}

function HeroSceneContent({
  wordmark,
  scrollProgress,
  isSoftwareGl,
}: {
  wordmark: string;
  scrollProgress: number;
  isSoftwareGl: boolean;
}) {
  const { gl, scene, camera } = useThree();
  const rootRef = useRef<THREE.Group>(null);
  const wordmarkRef = useRef<THREE.Mesh>(null);
  const phoneRef = useRef<THREE.Group>(null);
  const cardsGroupRef = useRef<THREE.Group>(null);
  const barsRef = useRef<(THREE.Mesh | null)[]>([]);
  const buildingFloorsRef = useRef<(THREE.Group | null)[]>([]);
  const mountBuildRef = useRef(0);
  const particlesRef = useRef<THREE.Points>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollValRef = useRef(scrollProgress);
  scrollValRef.current = scrollProgress;

  const [font, setFont] = useState<Font | null>(null);

  // Environment reflection map
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();
    return () => {
      envTex.dispose();
    };
  }, [gl, scene]);

  // Load bundled TTF font synchronously/locally
  useEffect(() => {
    let active = true;
    const loader = new TTFLoader();
    loader.load('/assets/display-bold.ttf', (json) => {
      if (!active) return;
      setFont(new Font(json));
    });
    return () => {
      active = false;
    };
  }, []);

  // Track pointer over window for subtle parallax
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Extruded 3D Wordmark Geometry ("Yeasin" by default)
  const textGeo = useMemo(() => {
    if (!font) return null;
    const label = (wordmark || 'SAFIQUL').trim().slice(0, 14);
    const geo = new TextGeometry(label, {
      font,
      size: 0.54,
      depth: 0.19,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.028,
      bevelSize: 0.018,
      bevelSegments: 4,
    });
    geo.computeBoundingBox();
    geo.center();
    return geo;
  }, [font, wordmark]);

  useEffect(() => {
    return () => {
      textGeo?.dispose();
    };
  }, [textGeo]);

  // Glass Post Cards textures
  const cardTextures = useMemo(() => {
    return [
      createGlassCardTexture('REEL RETENTION', '+84%', '#E5A93C'),
      createGlassCardTexture('BRAND SYSTEM', '60 FPS', '#F4F4F0'),
      createGlassCardTexture('CAMPAIGN REACH', '420K', '#E5A93C'),
    ];
  }, []);

  useEffect(() => {
    return () => {
      cardTextures.forEach((t) => t.dispose());
    };
  }, [cardTextures]);

  // Live Phone Feed CanvasTexture
  const phoneFeed = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, ctx, tex };
  }, []);

  useEffect(() => {
    return () => {
      phoneFeed.tex.dispose();
    };
  }, [phoneFeed]);

  // Sparse gold dust particle buffer
  const particlesGeo = useMemo(() => {
    const count = 85;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      particlesGeo.dispose();
    };
  }, [particlesGeo]);

  const barBaseHeights = [0.42, 0.72, 1.08, 0.85, 1.32];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = THREE.MathUtils.clamp(scrollValRef.current, 0, 1);
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;

    // Update phone feed canvas
    if (phoneFeed.ctx) {
      drawPhoneFeed(phoneFeed.ctx, phoneFeed.canvas.width, phoneFeed.canvas.height, t);
      phoneFeed.tex.needsUpdate = true;
    }

    // Scroll-driven camera path
    _camTarget.set(
      0.2 + Math.sin(s * Math.PI) * 1.15 + px * 0.35,
      0.32 + s * 0.48 + py * 0.22,
      6.1 - s * 1.15,
    );
    camera.position.lerp(_camTarget, Math.min(1, delta * 4.5));
    _lookTarget.set(0, -0.05 + s * 0.15, 0);
    camera.lookAt(_lookTarget);

    // Subtle whole-stage rotation
    if (rootRef.current) {
      rootRef.current.rotation.y = THREE.MathUtils.damp(
        rootRef.current.rotation.y,
        px * 0.14 - s * 0.24,
        4.5,
        delta,
      );
      rootRef.current.rotation.x = THREE.MathUtils.damp(
        rootRef.current.rotation.x,
        -py * 0.08 + s * 0.1,
        4.5,
        delta,
      );
    }

    // Extruded gold wordmark subtle levitation & morph tilt
    if (wordmarkRef.current) {
      wordmarkRef.current.position.y = 0.78 + Math.sin(t * 1.2) * 0.06 - s * 0.25;
      wordmarkRef.current.rotation.y = Math.sin(t * 0.45) * 0.1 + s * 0.35;
    }

    // Rotating 3D phone
    if (phoneRef.current) {
      phoneRef.current.rotation.y = -0.35 + Math.sin(t * 0.6) * 0.25 + s * 1.1;
      phoneRef.current.position.y = -0.22 + Math.cos(t * 1.1) * 0.06;
    }

    // Floating glass cards depth parallax
    if (cardsGroupRef.current) {
      cardsGroupRef.current.children.forEach((child, idx) => {
        child.position.y += Math.sin(t * 1.1 + idx * 1.4) * 0.0008;
        child.rotation.z = Math.sin(t * 0.5 + idx) * 0.04 + s * (idx - 1) * 0.12;
      });
    }

    // 3D analytics bars grow with scroll
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const targetScale = 0.45 + s * 0.95 + Math.sin(t * 1.6 + i * 0.6) * 0.06;
      bar.scale.y = THREE.MathUtils.damp(bar.scale.y, targetScale, 5.5, delta);
      bar.position.y = (barBaseHeights[i] * bar.scale.y) / 2 - 1.28;
    });

    // Architectural tower floor-by-floor construction on mount + scroll
    mountBuildRef.current = THREE.MathUtils.damp(mountBuildRef.current, 1, 2.4, delta);
    const buildRatio = THREE.MathUtils.clamp(mountBuildRef.current * 0.62 + s * 0.55, 0, 1);
    buildingFloorsRef.current.forEach((floor, idx) => {
      if (!floor) return;
      const threshold = idx * 0.13;
      const localProgress = THREE.MathUtils.clamp((buildRatio - threshold) / 0.25, 0.02, 1);
      floor.scale.y = THREE.MathUtils.damp(floor.scale.y, localProgress, 6.5, delta);
      floor.scale.x = THREE.MathUtils.damp(floor.scale.x, 0.5 + localProgress * 0.5, 6.5, delta);
      floor.scale.z = THREE.MathUtils.damp(floor.scale.z, 0.5 + localProgress * 0.5, 6.5, delta);
    });

    // Gold dust drift
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.03 + s * 0.25;
    }
  });

  return (
    <>
      <color attach="background" args={['#09090B']} />
      <fogExp2 attach="fog" args={['#09090B', 0.05]} />

      {/* 3-Point Warm / Cool Studio Lighting */}
      <hemisphereLight args={['#CBD5E1', '#18181B', 0.65]} />
      <directionalLight
        position={[4.5, 5.5, 5.0]}
        intensity={2.2}
        color="#FFE7C2"
        castShadow={!isSoftwareGl}
      />
      <directionalLight position={[-4.5, 2.0, -3.5]} intensity={1.3} color="#E5A93C" />

      <group ref={rootRef}>
        {/* Extruded Champagne-Gold Metal Wordmark */}
        {textGeo && (
          <mesh ref={wordmarkRef} geometry={textGeo} position={[-0.25, 0.78, 0.15]} castShadow>
            <meshPhysicalMaterial
              color="#E5A93C"
              metalness={0.94}
              roughness={0.14}
              clearcoat={0.65}
              anisotropy={0.8}
            />
          </mesh>
        )}

        {/* Rotating 3D Phone Showing Live Motion Feed */}
        <group ref={phoneRef} position={[1.65, -0.22, 0.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.92, 1.84, 0.09]} />
            <meshStandardMaterial color="#18181D" metalness={0.88} roughness={0.24} />
          </mesh>
          {/* Gold Side Rim */}
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[0.95, 1.87, 0.04]} />
            <meshStandardMaterial color="#E5A93C" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Feed Screen */}
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[0.82, 1.72]} />
            <meshBasicMaterial map={phoneFeed.tex} />
          </mesh>
        </group>

        {/* Floating Glass Post Cards */}
        <group ref={cardsGroupRef}>
          {[
            { pos: [-1.85, -0.1, -0.35] as [number, number, number], rot: [0.06, 0.28, -0.04] as [number, number, number] },
            { pos: [-0.95, -0.95, 0.75] as [number, number, number], rot: [-0.08, 0.12, 0.03] as [number, number, number] },
            { pos: [1.35, 1.05, -0.85] as [number, number, number], rot: [0.05, -0.28, 0.05] as [number, number, number] },
          ].map((cfg, idx) => (
            <mesh key={idx} position={cfg.pos} rotation={cfg.rot}>
              <boxGeometry args={[1.38, 0.86, 0.035]} />
              <meshPhysicalMaterial
                map={cardTextures[idx]}
                transparent
                opacity={0.92}
                roughness={0.12}
                metalness={0.08}
                clearcoat={1.0}
              />
            </mesh>
          ))}
        </group>

        {/* 3D Analytics Bars That Grow With Scroll */}
        <group position={[0.15, 0, -0.45]}>
          {/* Plinth Base */}
          <mesh position={[0, -1.32, 0]} receiveShadow>
            <boxGeometry args={[2.1, 0.08, 0.75]} />
            <meshStandardMaterial color="#15151A" metalness={0.6} roughness={0.45} />
          </mesh>

          {barBaseHeights.map((h, i) => (
            <mesh
              key={i}
              ref={(el) => {
                barsRef.current[i] = el;
              }}
              position={[-0.72 + i * 0.36, h / 2 - 1.28, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, h, 0.2]} />
              <meshPhysicalMaterial
                color={i % 2 === 0 ? '#E5A93C' : '#2C2D35'}
                metalness={i % 2 === 0 ? 0.92 : 0.7}
                roughness={i % 2 === 0 ? 0.18 : 0.35}
                clearcoat={0.4}
              />
            </mesh>
          ))}
        </group>

        {/* Multi-Tier Architectural Building Assembly (Constructs Floor-by-Floor) */}
        <group position={[-2.05, -1.32, -1.05]}>
          {/* Foundation Plinth */}
          <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
            <boxGeometry args={[1.05, 0.08, 1.05]} />
            <meshStandardMaterial color="#15151A" metalness={0.65} roughness={0.4} />
          </mesh>

          {[0, 1, 2, 3, 4, 5].map((tier) => {
            const w = 0.86 - tier * 0.095;
            const floorH = 0.28;
            const yBase = 0.08 + tier * floorH;
            return (
              <group
                key={tier}
                ref={(el) => {
                  buildingFloorsRef.current[tier] = el;
                }}
                position={[0, yBase, 0]}
              >
                {/* Glass Structural Core */}
                <mesh position={[0, floorH / 2, 0]} castShadow>
                  <boxGeometry args={[w * 0.86, floorH * 0.84, w * 0.86]} />
                  <meshPhysicalMaterial
                    color="#1B1E26"
                    metalness={0.2}
                    roughness={0.14}
                    clearcoat={1.0}
                    transparent
                    opacity={0.86}
                  />
                </mesh>
                {/* Floor Slab */}
                <mesh position={[0, floorH - 0.02, 0]} castShadow>
                  <boxGeometry args={[w, 0.04, w]} />
                  <meshStandardMaterial color="#23242D" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Champagne-Gold Perimeter Mullion Ring */}
                <mesh position={[0, floorH - 0.045, 0]}>
                  <boxGeometry args={[w + 0.025, 0.016, w + 0.025]} />
                  <meshStandardMaterial color="#E5A93C" metalness={0.94} roughness={0.16} />
                </mesh>
                {tier === 5 && (
                  <mesh position={[0, floorH + 0.22, 0]}>
                    <cylinderGeometry args={[0.015, 0.032, 0.44, 12]} />
                    <meshStandardMaterial color="#E5A93C" metalness={0.95} roughness={0.14} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>

        {/* Sparse Gold Dust Particle Field */}
        <points ref={particlesRef} geometry={particlesGeo}>
          <pointsMaterial
            color="#E5A93C"
            size={0.035}
            transparent
            opacity={0.65}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      </group>

      <PostProcessingEffects enabled={!isSoftwareGl} />
    </>
  );
}

export default function HeroSceneR3F({
  wordmark,
  scrollProgress,
  fallbackImage = 'preset:motion_reel',
}: HeroSceneR3FProps) {
  const [useLiteFallback, setUseLiteFallback] = useState(false);
  const [isSoftwareGl, setIsSoftwareGl] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 768;
    const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;
    if (reduced || isSmall || lowCores) {
      setUseLiteFallback(true);
      return;
    }
    setIsSoftwareGl(detectSoftwareGl());
  }, []);

  if (useLiteFallback) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D10]">
        <ResilientImage
          src={fallbackImage}
          alt={wordmark}
          fallbackTitle={wordmark}
          className="h-full w-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <div className="text-xs font-mono text-[#E5A93C]">3D STUDIO REEL</div>
            <div className="font-display text-2xl font-semibold text-[#F4F4F0]">{wordmark}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#09090B]">
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 2]}
        shadows={!isSoftwareGl}
        camera={{ position: [0.2, 0.32, 6.1], fov: 38, near: 0.1, far: 50 }}
        gl={{ antialias: !isSoftwareGl, powerPreference: 'high-performance' }}
      >
        <HeroSceneContent
          wordmark={wordmark}
          scrollProgress={scrollProgress}
          isSoftwareGl={isSoftwareGl}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3.5 left-4 font-mono text-[11px] text-[#A1A1AA] bg-[#09090B]/80 px-2.5 py-1 rounded border border-white/10">
        INTERACTIVE 3D STAGE · MOVE CURSOR &amp; SCROLL
      </div>
    </div>
  );
}
