'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Maximize2, RotateCcw, Move, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';

interface PanoramaViewerProps {
  imageUrl: string;
  fullscreen?: boolean;
  onClose?: () => void;
}

export function PanoramaViewer({ imageUrl, fullscreen = false, onClose }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDragging   = useRef(false);
  const prevMouse    = useRef({ x: 0, y: 0 });
  const lon          = useRef(0);
  const lat          = useRef(0);
  const fovRef       = useRef(75);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullFS,  setIsFullFS]  = useState(fullscreen);

  // ── Proxy URL through Next.js to avoid CORS ──────────────────────────────
  const proxiedUrl = imageUrl?.startsWith('http')
    ? `/api/img-proxy?url=${encodeURIComponent(imageUrl)}`
    : (imageUrl ?? '');

  useEffect(() => {
    if (!containerRef.current || !proxiedUrl) return;

    const container = containerRef.current;
    const width     = container.clientWidth;
    const height    = container.clientHeight;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fovRef.current, width / height, 1, 1100);
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Sphere (inside-out equirectangular) ────────────────────────────────
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    setIsLoading(true);
    setLoadError(false);

    const texture = textureLoader.load(
      proxiedUrl,
      () => { setIsLoading(false); },
      undefined,
      (err) => {
        console.error('[PanoramaViewer] texture load failed:', err, proxiedUrl);
        setIsLoading(false);
        setLoadError(true);
      },
    );

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter  = THREE.LinearFilter;
    texture.magFilter  = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere   = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // ── Camera look-at ─────────────────────────────────────────────────────
    const updateCamera = () => {
      lat.current = Math.max(-85, Math.min(85, lat.current));
      const phi   = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      );
    };

    // ── Pointer events ─────────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevMouse.current  = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      lon.current -= (e.clientX - prevMouse.current.x) * 0.2;
      lat.current += (e.clientY - prevMouse.current.y) * 0.2;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      fovRef.current = THREE.MathUtils.clamp(fovRef.current + e.deltaY * 0.05, 30, 100);
      camera.fov = fovRef.current;
      camera.updateProjectionMatrix();
    };

    // ── Touch events ───────────────────────────────────────────────────────
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        prevMouse.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        lon.current -= (e.touches[0].clientX - prevMouse.current.x) * 0.2;
        lat.current += (e.touches[0].clientY - prevMouse.current.y) * 0.2;
        prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        fovRef.current = THREE.MathUtils.clamp(fovRef.current - (dist - lastPinchDist) * 0.1, 30, 100);
        camera.fov = fovRef.current;
        camera.updateProjectionMatrix();
        lastPinchDist = dist;
      }
    };
    const onTouchEnd = () => { isDragging.current = false; };

    container.addEventListener('pointerdown',  onPointerDown);
    container.addEventListener('pointermove',  onPointerMove);
    container.addEventListener('pointerup',    onPointerUp);
    container.addEventListener('pointerleave', onPointerUp);
    container.addEventListener('wheel',        onWheel,      { passive: false });
    container.addEventListener('touchstart',   onTouchStart, { passive: false });
    container.addEventListener('touchmove',    onTouchMove,  { passive: false });
    container.addEventListener('touchend',     onTouchEnd);

    // ── Render loop ────────────────────────────────────────────────────────
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (!isDragging.current) lon.current += 0.08; // gentle auto-rotate
      updateCamera();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('pointerdown',  onPointerDown);
      container.removeEventListener('pointermove',  onPointerMove);
      container.removeEventListener('pointerup',    onPointerUp);
      container.removeEventListener('pointerleave', onPointerUp);
      container.removeEventListener('wheel',        onWheel);
      container.removeEventListener('touchstart',   onTouchStart);
      container.removeEventListener('touchmove',    onTouchMove);
      container.removeEventListener('touchend',     onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [proxiedUrl]);

  const reset = () => {
    lon.current    = 0;
    lat.current    = 0;
    fovRef.current = 75;
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const zoomIn = () => {
    fovRef.current = Math.max(30, fovRef.current - 10);
    if (cameraRef.current) { cameraRef.current.fov = fovRef.current; cameraRef.current.updateProjectionMatrix(); }
  };
  const zoomOut = () => {
    fovRef.current = Math.min(100, fovRef.current + 10);
    if (cameraRef.current) { cameraRef.current.fov = fovRef.current; cameraRef.current.updateProjectionMatrix(); }
  };

  const wrapStyle: React.CSSProperties = isFullFS
    ? { position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }
    : { position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: '#0a0a0a', aspectRatio: '16/9' };

  return (
    <div style={wrapStyle}>

      {/* Three.js mount point */}
      <div
        ref={containerRef}
        style={{ flex: 1, width: '100%', minHeight: 0, cursor: 'grab', touchAction: 'none' }}
      />

      {/* Loading */}
      {isLoading && !loadError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', color: '#fff', gap: 14, pointerEvents: 'none',
        }}>
          <div style={{
            width: 44, height: 44,
            border: '3px solid rgba(255,255,255,0.15)',
            borderTop: '3px solid #c0392b',
            borderRadius: '50%',
            animation: 'spin360 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Loading 360° tour…</p>
          <style>{`@keyframes spin360{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Error */}
      {loadError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.9)', color: '#fff', gap: 10, padding: 24, textAlign: 'center',
        }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ fontSize: 13, color: '#fca5a5', maxWidth: 340 }}>
            Could not load the 360° panorama image.
          </p>
        </div>
      )}

      {/* Controls */}
      {!isLoading && !loadError && (
        <>
          <div style={{
            position: 'absolute', top: 14, left: 14,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            borderRadius: 30, padding: '6px 12px',
            fontSize: 12, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none',
          }}>
            <Move size={13} /> Drag to explore · Scroll to zoom
          </div>

          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
            <button onClick={zoomIn}  title="Zoom in"    style={btn}><ZoomIn    size={16} /></button>
            <button onClick={zoomOut} title="Zoom out"   style={btn}><ZoomOut   size={16} /></button>
            <button onClick={reset}   title="Reset view" style={btn}><RotateCcw size={16} /></button>
            {!fullscreen && (
              <button onClick={() => setIsFullFS(f => !f)} title="Fullscreen" style={btn}>
                <Maximize2 size={16} />
              </button>
            )}
            {(isFullFS || onClose) && (
              <button
                onClick={() => { setIsFullFS(false); onClose?.(); }}
                title="Close"
                style={{ ...btn, background: 'rgba(192,57,43,0.8)' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{
            position: 'absolute', bottom: 14, right: 14,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            borderRadius: 20, padding: '4px 10px',
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em',
            pointerEvents: 'none',
          }}>
            360° VIEW
          </div>
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
  color: '#fff', transition: 'background 0.15s',
};