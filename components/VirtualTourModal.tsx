'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, Move, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface VirtualTourModalProps {
  imageUrl: string;
  propertyTitle: string;
  onClose: () => void;
}

declare global {
  interface Window { THREE: any; }
}

function loadThree(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.THREE) return resolve(window.THREE);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function VirtualTourModal({ imageUrl, propertyTitle, onClose }: VirtualTourModalProps) {
  const canvasRef        = useRef<HTMLDivElement>(null);
  const rendererRef      = useRef<any>(null);
  const cameraRef        = useRef<any>(null);
  const sceneRef         = useRef<any>(null);
  const rafRef           = useRef<number>(0);
  const isDragging       = useRef(false);
  const prevMouse        = useRef({ x: 0, y: 0 });
  const spherical        = useRef({ theta: 0, phi: Math.PI / 2 });
  const autoRotate       = useRef(true);
const autoRotateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastPinchDist    = useRef<number | null>(null);

  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [fov, setFov] = useState(90);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clampPhi = (p: number) => Math.max(0.3, Math.min(Math.PI - 0.3, p));

  const applySpherical = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { theta, phi } = spherical.current;
    cam.lookAt(new window.THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    ));
  }, []);

  const pauseAutoRotate = () => {
    autoRotate.current = false;
    clearTimeout(autoRotateTimer.current);
    autoRotateTimer.current = setTimeout(() => { autoRotate.current = true; }, 4000);
  };

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      try {
        const THREE = await loadThree();
        if (destroyed || !canvasRef.current) return;

        const container = canvasRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 1000);
        camera.position.set(0, 0, 0.01);
        cameraRef.current = camera;
        applySpherical();

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W, H);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Higher-quality sphere: 128×64 segments
        const geo = new THREE.SphereGeometry(500, 128, 64);
        geo.scale(-1, 1, 1);

        const proxiedUrl = imageUrl.startsWith('http')
          ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
          : imageUrl;

        const loader = new THREE.TextureLoader();
        loader.load(
          proxiedUrl,
          (texture: any) => {
            if (destroyed) return;
            texture.encoding   = THREE.sRGBEncoding;
            texture.anisotropy = 8;
            const mat  = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geo, mat);
            scene.add(mesh);
            setLoading(false);
          },
          undefined,
          () => {
            if (!destroyed) setError('Failed to load image. Please try again.');
          },
        );

        const tick = () => {
          if (destroyed) return;
          rafRef.current = requestAnimationFrame(tick);
          if (autoRotate.current) {
            spherical.current.theta += 0.0006;
            applySpherical();
          }
          renderer.render(scene, camera);
        };
        tick();

        const onResize = () => {
          if (destroyed || !container) return;
          const nW = container.clientWidth;
          const nH = container.clientHeight;
          renderer.setSize(nW, nH);
          camera.aspect = nW / nH;
          camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
      } catch {
        if (!destroyed) setError('Failed to initialize 3D viewer.');
      }
    };

    init();

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(autoRotateTimer.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.domElement?.remove();
      }
    };
  }, [imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = fov;
    cameraRef.current.updateProjectionMatrix();
  }, [fov]);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    prevMouse.current  = { x: e.clientX, y: e.clientY };
    pauseAutoRotate();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - prevMouse.current.x;
    const dy = e.clientY - prevMouse.current.y;
    prevMouse.current = { x: e.clientX, y: e.clientY };
    spherical.current.theta -= dx * 0.003;
    spherical.current.phi    = clampPhi(spherical.current.phi + dy * 0.003);
    applySpherical();
  };

  const onPointerUp = () => { isDragging.current = false; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    pauseAutoRotate();
    setFov(prev => Math.max(50, Math.min(90, prev + e.deltaY * 0.05)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      prevMouse.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pauseAutoRotate();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - prevMouse.current.x;
      const dy = e.touches[0].clientY - prevMouse.current.y;
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      spherical.current.theta -= dx * 0.004;
      spherical.current.phi    = clampPhi(spherical.current.phi + dy * 0.004);
      applySpherical();
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setFov(prev => Math.max(30, Math.min(120, prev + (lastPinchDist.current! - dist) * 0.1)));
      lastPinchDist.current = dist;
    }
  };

  const onTouchEnd = () => {
    isDragging.current    = false;
    lastPinchDist.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      const step = 0.05;
      if (e.key === 'ArrowLeft')  { pauseAutoRotate(); spherical.current.theta -= step; applySpherical(); }
      if (e.key === 'ArrowRight') { pauseAutoRotate(); spherical.current.theta += step; applySpherical(); }
      if (e.key === 'ArrowUp')    { pauseAutoRotate(); spherical.current.phi = clampPhi(spherical.current.phi - step); applySpherical(); }
      if (e.key === 'ArrowDown')  { pauseAutoRotate(); spherical.current.phi = clampPhi(spherical.current.phi + step); applySpherical(); }
      if (e.key === '+' || e.key === '=') setFov(p => Math.max(30, p - 5));
      if (e.key === '-')                  setFov(p => Math.min(120, p + 5));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, applySpherical]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFullscreen = () => {
    const el = document.getElementById('vt-modal-root');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const resetView = () => {
    spherical.current = { theta: 0, phi: Math.PI / 2 };
    setFov(90); // Show full panorama
    applySpherical();
    pauseAutoRotate();
  };

  return (
    <div
      id="vt-modal-root"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: '#0a0a0f',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 900, letterSpacing: '0.08em',
            color: '#fff', background: 'rgba(192,57,43,0.9)',
            padding: '4px 10px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>360°</span>
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {propertyTitle}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleFullscreen} style={btnStyle} title="Fullscreen">
            <Maximize2 size={16} />
          </button>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(192,57,43,0.85)' }} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        style={{
          flex: 1, position: 'relative',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          overflow: 'hidden',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove as any}
        onTouchEnd={onTouchEnd}
      >
        {/* Loading */}
        {loading && !error && (
          <div style={centerOverlay}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              background: 'rgba(0,0,0,0.65)', padding: '28px 36px', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
            }}>
              <Loader2 size={36} color="#c0392b" style={{ animation: 'vt-spin 1s linear infinite' }} />
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Loading 360° Tour…</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{propertyTitle}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={centerOverlay}>
            <div style={{
              background: 'rgba(0,0,0,0.75)', padding: '28px 36px', borderRadius: 20,
              border: '1px solid rgba(239,68,68,0.4)', backdropFilter: 'blur(12px)',
              textAlign: 'center', maxWidth: 320,
            }}>
              <p style={{ color: '#ef4444', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>⚠ Tour Unavailable</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>{error}</p>
              <button onClick={onClose} style={{ marginTop: 16, ...btnStyle, padding: '10px 24px', fontSize: 13 }}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Crosshair */}
        {!loading && !error && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20, height: 20, pointerEvents: 'none', opacity: 0.3,
          }}>
            <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 2, background: '#fff', borderRadius: 1 }} />
            <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: '#fff', borderRadius: 1 }} />
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      {!loading && !error && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '20px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
        }}>
          <button onClick={() => setFov(p => Math.min(120, p + 10))} style={btnStyle} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <input
            type="range" min={30} max={120} value={fov}
            onChange={e => setFov(Number(e.target.value))}
            style={{ width: 100, accentColor: '#c0392b', cursor: 'pointer' }}
            title="Field of view"
          />
          <button onClick={() => setFov(p => Math.max(30, p - 10))} style={btnStyle} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <button onClick={resetView} style={btnStyle} title="Reset view">
            <RotateCcw size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
            <Move size={12} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', userSelect: 'none' }}>
              Drag to look around · Scroll to zoom
            </span>
          </div>
        </div>
      )}

      <style>{`@keyframes vt-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 10, padding: '8px 12px',
  color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
  transition: 'background 0.15s',
};

const centerOverlay: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 5,
};
