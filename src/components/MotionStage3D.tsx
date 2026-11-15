import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Layers, Pause, Play, RotateCcw } from 'lucide-react';

export interface MotionStage3DProps {
  scrollProgress?: number;
  activeChapter?: number;
  className?: string;
  showDock?: boolean;
  caption?: string;
}

const _targetPos = new THREE.Vector3();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3(1, 1, 1);
const _dummyEuler = new THREE.Euler();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
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

function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGlassOverlayTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 576;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, c.width, c.height);

    // Subtle registration crosshairs & rule-of-thirds motion guides
    ctx.strokeStyle = 'rgba(244, 244, 240, 0.22)';
    ctx.lineWidth = 1.5;

    // Safe-frame inset border
    ctx.strokeRect(42, 34, c.width - 84, c.height - 68);

    // Center crosshair
    const cx = c.width / 2;
    const cy = c.height / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy);
    ctx.lineTo(cx + 18, cy);
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy + 18);
    ctx.stroke();

    // Corner ticks in studio amber
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.75)';
    ctx.lineWidth = 2.5;
    const corners = [
      [42, 34, 1, 1],
      [c.width - 42, 34, -1, 1],
      [42, c.height - 34, 1, -1],
      [c.width - 42, c.height - 34, -1, -1],
    ];
    for (const [x, y, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * 22);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * 22, y);
      ctx.stroke();
    }

    // Technical registration label
    ctx.fillStyle = 'rgba(244, 244, 240, 0.55)';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText('16:9  60FPS  SAFE TITLE', 60, c.height - 46);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function drawMotionReelFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  scroll: number,
  sceneMode: number,
) {
  const phase = time * 0.85 + scroll * 5.2;

  // Deep studio canvas background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (sceneMode === 1) {
    bgGrad.addColorStop(0, '#101216');
    bgGrad.addColorStop(1, '#191B21');
  } else if (sceneMode === 2) {
    bgGrad.addColorStop(0, '#13100E');
    bgGrad.addColorStop(1, '#0B0B0D');
  } else {
    bgGrad.addColorStop(0, '#0C0C0F');
    bgGrad.addColorStop(1, '#15151A');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle geometric grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = (phase * 18) % step; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Animated kinetic ribbon waves
  const ribbonCount = 4;
  for (let r = 0; r < ribbonCount; r++) {
    ctx.beginPath();
    const amp = 46 + r * 14 + Math.sin(phase + r) * 18;
    const yBase = height * (0.42 + r * 0.06);
    for (let x = 0; x <= width; x += 24) {
      const y =
        yBase +
        Math.sin(x * 0.007 + phase * (1 + r * 0.14) + r * 0.9) * amp +
        Math.cos(x * 0.004 - phase * 0.6) * 20;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle =
      r === 0
        ? 'rgba(229, 169, 60, 0.9)'
        : r === 1
          ? 'rgba(244, 244, 240, 0.55)'
          : 'rgba(229, 169, 60, 0.25)';
    ctx.lineWidth = r === 0 ? 3.5 : 1.5;
    ctx.stroke();
  }

  // Kinetic typographic blocks & orbital geometry
  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);

  if (sceneMode === 1) {
    // Editorial Swiss Brand Grid Animation
    const offset = Math.sin(phase * 1.1) * 32;
    ctx.strokeStyle = 'rgba(244, 244, 240, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-230 + offset * 0.4, -125, 200, 250);
    ctx.fillStyle = 'rgba(229, 169, 60, 0.88)';
    ctx.fillRect(-10 - offset * 0.5, -125, 240, 118);
    ctx.fillStyle = '#F4F4F0';
    ctx.fillRect(-10 + offset * 0.25, 12, 240, 113);

    ctx.fillStyle = '#09090B';
    ctx.font = '700 28px "Bricolage Grotesque", sans-serif';
    ctx.fillText('BRAND SYSTEM', 14 - offset * 0.5, -56);
    ctx.fillText('GRID · TYPE', 14 + offset * 0.25, 76);
  } else if (sceneMode === 2) {
    // 3D Aperture & Title Frame Sequence
    const ringRadius = 116 + Math.sin(phase * 1.4) * 10;
    ctx.rotate(phase * 0.25);
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.88)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 1.45);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244, 244, 240, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius - 24, Math.PI * 0.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.rotate(-phase * 0.25);

    ctx.fillStyle = '#F4F4F0';
    ctx.textAlign = 'center';
    ctx.font = '700 40px "Bricolage Grotesque", sans-serif';
    ctx.fillText('3D TITLE MOTION', 0, 12);
  } else {
    // Kinetic Showreel Title Card
    const slideX = Math.sin(phase * 0.9) * 28;
    ctx.fillStyle = 'rgba(229, 169, 60, 0.95)';
    ctx.fillRect(-290 + slideX, -62, 10, 124);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#F4F4F0';
    ctx.font = '700 48px "Bricolage Grotesque", sans-serif';
    ctx.fillText('MOTION & GRAPHIC', -260 + slideX, -8);

    ctx.fillStyle = 'rgba(229, 169, 60, 0.92)';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SAFIQUL ISLAM  ·  STUDIO SHOWREEL', -260 + slideX, 38);
  }
  ctx.restore();

  // Top & Bottom Timeline Scrubber Bar
  const progress = ((phase * 0.18) % 1 + 1) % 1;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(48, height - 30, width - 96, 3);
  ctx.fillStyle = '#E5A93C';
  ctx.fillRect(48, height - 30, (width - 96) * progress, 3);

  // Timecode readout
  const totalFrames = Math.floor((time * 24 + scroll * 240) % 1440);
  const secs = Math.floor(totalFrames / 24);
  const frames = totalFrames % 24;
  const tc = `00:${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  ctx.fillStyle = 'rgba(244, 244, 240, 0.72)';
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.fillText(`REC  ${tc}`, 48, 44);
  ctx.fillText(`SCROLL ${Math.round(scroll * 100)}%`, width - 168, 44);
}

export function MotionStage3D({
  scrollProgress = 0,
  activeChapter = 0,
  className = '',
  showDock = true,
  caption,
}: MotionStage3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef(scrollProgress);
  const chapterRef = useRef(activeChapter);

  const [isPlaying, setIsPlaying] = useState(true);
  const [sceneMode, setSceneMode] = useState<0 | 1 | 2>(0);
  const [exploded, setExploded] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [resetTick, setResetTick] = useState(0);

  const isPlayingRef = useRef(isPlaying);
  const sceneModeRef = useRef(sceneMode);
  const explodedRef = useRef(exploded);
  const resetTickRef = useRef(resetTick);

  scrollRef.current = scrollProgress;
  chapterRef.current = activeChapter;
  isPlayingRef.current = isPlaying;
  sceneModeRef.current = sceneMode;
  explodedRef.current = exploded;

  useEffect(() => {
    setSceneMode((activeChapter % 3) as 0 | 1 | 2);
  }, [activeChapter]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.045);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0.35, 0.35, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // 3-Point Warm / Cool Lighting Rig
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x18181b, 0.65);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe7c2, 2.2);
    keyLight.position.set(4.5, 5.5, 5.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe5a93c, 1.45);
    rimLight.position.set(-4.5, 2.2, -3.5);
    scene.add(rimLight);

    // Composite Hero Rig Group
    const rigGroup = new THREE.Group();
    scene.add(rigGroup);

    // 1. Beveled Cinema Frame Chassis (ExtrudeGeometry)
    const frameW = 3.52;
    const frameH = 2.08;
    const innerW = 3.2;
    const innerH = 1.8;

    const outerShape = new THREE.Shape();
    const r = 0.1;
    outerShape.moveTo(-frameW / 2 + r, -frameH / 2);
    outerShape.lineTo(frameW / 2 - r, -frameH / 2);
    outerShape.quadraticCurveTo(frameW / 2, -frameH / 2, frameW / 2, -frameH / 2 + r);
    outerShape.lineTo(frameW / 2, frameH / 2 - r);
    outerShape.quadraticCurveTo(frameW / 2, frameH / 2, frameW / 2 - r, frameH / 2);
    outerShape.lineTo(-frameW / 2 + r, frameH / 2);
    outerShape.quadraticCurveTo(-frameW / 2, frameH / 2, -frameW / 2, frameH / 2 - r);
    outerShape.lineTo(-frameW / 2, -frameH / 2 + r);
    outerShape.quadraticCurveTo(-frameW / 2, -frameH / 2, -frameW / 2 + r, -frameH / 2);

    const holePath = new THREE.Path();
    holePath.moveTo(-innerW / 2, -innerH / 2);
    holePath.lineTo(innerW / 2, -innerH / 2);
    holePath.lineTo(innerW / 2, innerH / 2);
    holePath.lineTo(-innerW / 2, innerH / 2);
    holePath.closePath();
    outerShape.holes.push(holePath);

    const chassisGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    chassisGeo.center();

    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1c1d22,
      metalness: 0.85,
      roughness: 0.32,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.castShadow = !isSoftwareGl;
    chassisMesh.receiveShadow = !isSoftwareGl;
    rigGroup.add(chassisMesh);

    // 2. Brushed Champagne Gold Accent Brackets & Rotary Jog Dial
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xe5a93c,
      metalness: 0.92,
      roughness: 0.18,
      anisotropy: 0.8,
      clearcoat: 0.4,
    });

    const bracketGeo = new THREE.BoxGeometry(0.32, 0.05, 0.21);
    const bracketPositions: [number, number][] = [
      [-1.56, 1.04],
      [1.56, 1.04],
      [-1.56, -1.04],
      [1.56, -1.04],
    ];
    bracketPositions.forEach(([bx, by]) => {
      const bracket = new THREE.Mesh(bracketGeo, goldMat);
      bracket.position.set(bx, by, 0);
      rigGroup.add(bracket);
    });

    const dialGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 28);
    const dialMesh = new THREE.Mesh(dialGeo, goldMat);
    dialMesh.rotation.z = Math.PI / 2;
    dialMesh.position.set(1.82, -0.52, 0);
    rigGroup.add(dialMesh);

    // 3. Live Kinetic Video CanvasTexture Screen
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = 960;
    videoCanvas.height = 540;
    const videoCtx = videoCanvas.getContext('2d');
    const videoTex = new THREE.CanvasTexture(videoCanvas);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    videoTex.anisotropy = maxAniso;

    const screenGeo = new THREE.PlaneGeometry(innerW, innerH);
    const screenMat = new THREE.MeshBasicMaterial({
      map: videoTex,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.015;
    rigGroup.add(screenMesh);

    // 4. Front Floating Acrylic Registration Glass Layer (Explodes on Scroll)
    const glassOverlayTex = createGlassOverlayTexture(maxAniso);
    const frontGlassGeo = new THREE.PlaneGeometry(innerW * 1.04, innerH * 1.04);
    const frontGlassMat = new THREE.MeshPhysicalMaterial({
      map: glassOverlayTex,
      transparent: true,
      opacity: 0.92,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1.0,
      depthWrite: false,
    });
    const frontGlassMesh = new THREE.Mesh(frontGlassGeo, frontGlassMat);
    frontGlassMesh.position.z = 0.16;
    frontGlassMesh.renderOrder = 3;
    rigGroup.add(frontGlassMesh);

    // 5. Rear Studio Backing Plate (Explodes backward on Scroll)
    const backPlateGeo = new THREE.BoxGeometry(3.1, 1.72, 0.04);
    const backPlateMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      metalness: 0.5,
      roughness: 0.65,
    });
    const backPlateMesh = new THREE.Mesh(backPlateGeo, backPlateMat);
    backPlateMesh.position.z = -0.22;
    rigGroup.add(backPlateMesh);

    // 6. Instanced Timeline Keyframe Ring (24 radial markers)
    const tickCount = 24;
    const tickGeo = new THREE.BoxGeometry(0.035, 0.14, 0.04);
    const tickMat = new THREE.MeshStandardMaterial({
      color: 0xe5a93c,
      metalness: 0.85,
      roughness: 0.22,
    });
    const ringInstanced = new THREE.InstancedMesh(tickGeo, tickMat, tickCount);
    const ringRadius = 2.15;
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      _dummyPos.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, -0.45);
      _dummyEuler.set(0, 0, angle - Math.PI / 2);
      _dummyQuat.setFromEuler(_dummyEuler);
      _dummyScale.set(1, i % 6 === 0 ? 1.5 : 0.85, 1);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      ringInstanced.setMatrixAt(i, _dummyMatrix);
    }
    ringInstanced.instanceMatrix.needsUpdate = true;
    ringInstanced.computeBoundingSphere();
    rigGroup.add(ringInstanced);

    // 7. Grounded Studio Track Rails & Contact Shadow
    const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 4.4, 16);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x2a2b32,
      metalness: 0.78,
      roughness: 0.35,
    });
    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.rotation.z = Math.PI / 2;
    railLeft.position.set(0, -1.36, -0.35);
    scene.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.rotation.z = Math.PI / 2;
    railRight.position.set(0, -1.36, 0.35);
    scene.add(railRight);

    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(5.2, 2.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -1.42, 0);
    scene.add(shadowPlane);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer tracking
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    let frameId = 0;
    let disposed = false;
    let simTime = 0;
    let lastNow = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const delta = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;

      if (isPlayingRef.current) {
        simTime += delta;
      }

      // Reset camera & rig smoothing if reset triggered
      if (resetTickRef.current !== resetTick) {
        resetTickRef.current = resetTick;
      }

      const s = THREE.MathUtils.clamp(scrollRef.current, 0, 1);
      const explodeFactor = explodedRef.current ? 1 : s * 0.85;

      // Update live 2D video texture
      if (videoCtx) {
        drawMotionReelFrame(
          videoCtx,
          videoCanvas.width,
          videoCanvas.height,
          simTime,
          s,
          sceneModeRef.current,
        );
        videoTex.needsUpdate = true;
      }

      // Scroll + Pointer driven 3D transforms with exponential damping
      const targetRotY = -0.22 + s * 0.56 + pointerX * 0.16;
      const targetRotX = 0.08 - s * 0.14 - pointerY * 0.1;
      rigGroup.rotation.y = THREE.MathUtils.damp(rigGroup.rotation.y, targetRotY, 5.5, delta);
      rigGroup.rotation.x = THREE.MathUtils.damp(rigGroup.rotation.x, targetRotX, 5.5, delta);

      // Exploded layers along Z-axis
      frontGlassMesh.position.z = THREE.MathUtils.damp(
        frontGlassMesh.position.z,
        0.14 + explodeFactor * 0.62,
        6,
        delta,
      );
      backPlateMesh.position.z = THREE.MathUtils.damp(
        backPlateMesh.position.z,
        -0.18 - explodeFactor * 0.52,
        6,
        delta,
      );
      ringInstanced.position.z = THREE.MathUtils.damp(
        ringInstanced.position.z,
        -0.42 - explodeFactor * 0.72,
        5,
        delta,
      );
      ringInstanced.rotation.z = THREE.MathUtils.damp(
        ringInstanced.rotation.z,
        s * Math.PI * 0.65 + simTime * 0.08,
        4,
        delta,
      );
      dialMesh.rotation.x = s * Math.PI * 3 + simTime * 0.6;

      // Camera dolly with scroll
      _targetPos.set(0.2 - s * 0.35, 0.25 - s * 0.15, 6.0 - s * 0.85);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, 4.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, 4.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, 4.5, delta);
      camera.lookAt(0, -0.05, 0);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);

      chassisGeo.dispose();
      chassisMat.dispose();
      goldMat.dispose();
      bracketGeo.dispose();
      dialGeo.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      videoTex.dispose();
      frontGlassGeo.dispose();
      frontGlassMat.dispose();
      glassOverlayTex.dispose();
      backPlateGeo.dispose();
      backPlateMat.dispose();
      tickGeo.dispose();
      tickMat.dispose();
      railGeo.dispose();
      railMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [resetTick]);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-[#09090B] ${className}`}>
      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Minimal Top-Left Unobtrusive Caption */}
      {caption && (
        <div className="pointer-events-none absolute top-4 left-4 text-xs font-mono text-[#A1A1AA] bg-[#09090B]/85 px-2.5 py-1 rounded border border-white/10">
          {caption}
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Zero backdrop-filter over WebGL) */}
      {showDock && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[560px] flex flex-col items-center pointer-events-auto">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="mb-1.5 inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-white/10 bg-[#121216] px-3 py-1 text-[11px] font-medium text-[#A1A1AA] hover:text-[#F4F4F0] transition-colors whitespace-nowrap shrink-0"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show Stage Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#121216]/95 px-3 py-2 shadow-xl">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E5A93C] px-3 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655] transition-colors whitespace-nowrap shrink-0"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExploded((e) => !e)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    exploded
                      ? 'border-[#E5A93C]/60 bg-[#E5A93C]/15 text-[#E5A93C]'
                      : 'border-white/10 bg-[#1A1A20] text-[#D4D4D8] hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{exploded ? 'Collapse Layers' : 'Explode Layers'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {(['Motion', 'Brand', 'Title'] as const).map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSceneMode(idx as 0 | 1 | 2)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      sceneMode === idx
                        ? 'bg-white text-[#09090B]'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F0]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setExploded(false);
                    setSceneMode(0);
                    setIsPlaying(true);
                    setResetTick((n) => n + 1);
                  }}
                  title="Reset 3D Stage"
                  aria-label="Reset 3D Stage"
                  className="ml-1 inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-[#A1A1AA] hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
