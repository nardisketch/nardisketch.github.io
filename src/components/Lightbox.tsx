import { useCallback, useEffect, useRef, useState } from 'react';

type LightboxImage = { src: string; alt: string };

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_NAV_PX = 60;
const SWIPE_CLOSE_PX = 110;

type Gesture =
  | { mode: 'idle' }
  | { mode: 'swipe'; startX: number; startY: number }
  | { mode: 'pan'; startX: number; startY: number; startPos: { x: number; y: number } }
  | {
      mode: 'pinch';
      startDist: number;
      startScale: number;
      startMid: { x: number; y: number };
      startPos: { x: number; y: number };
    };

/**
 * Full-screen image viewer for the gallery page.
 * Desktop: wheel zoom (toward cursor), drag to pan, double-click to toggle 2.5x,
 *          arrow keys, Esc / backdrop / × to close.
 * Touch:   pinch zoom, one-finger pan when zoomed, swipe left/right to change
 *          image, swipe down to close, double-tap to toggle zoom.
 * Thumbnails are the server-rendered <img data-index> inside .masonry-gallery.
 */
export default function Lightbox({ images }: { images: LightboxImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const scale = useRef(1);
  const pos = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture>({ mode: 'idle' });
  const lastTap = useRef(0);

  const clampScale = (s: number) => Math.min(Math.max(s, ZOOM_MIN), ZOOM_MAX);

  const clampPos = useCallback(() => {
    const maxX = Math.max(0, ((scale.current - 1) * window.innerWidth) / 2);
    const maxY = Math.max(0, ((scale.current - 1) * window.innerHeight) / 2);
    pos.current.x = Math.max(-maxX, Math.min(maxX, pos.current.x));
    pos.current.y = Math.max(-maxY, Math.min(maxY, pos.current.y));
  }, []);

  const applyTransform = useCallback((animate = false) => {
    const el = imgRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.2s ease' : 'none';
    el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(${scale.current})`;
  }, []);

  const reset = useCallback(
    (animate = false) => {
      scale.current = 1;
      pos.current = { x: 0, y: 0 };
      applyTransform(animate);
    },
    [applyTransform],
  );

  // Zoom to `next` while keeping the point (cx, cy) fixed on screen.
  const zoomTo = useCallback(
    (next: number, cx: number, cy: number, animate = false) => {
      const s0 = scale.current;
      const s1 = clampScale(next);
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const k = 1 - s1 / s0;
      pos.current = {
        x: pos.current.x + k * (cx - centerX - pos.current.x),
        y: pos.current.y + k * (cy - centerY - pos.current.y),
      };
      scale.current = s1;
      if (s1 <= 1.001) pos.current = { x: 0, y: 0 };
      else clampPos();
      applyTransform(animate);
    },
    [applyTransform, clampPos],
  );

  const close = useCallback(() => setOpenIndex(null), []);
  const go = useCallback(
    (dir: 1 | -1) =>
      setOpenIndex((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  // Open on thumbnail click (delegated — robust to hydration timing).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(
        '.masonry-gallery [data-index]',
      );
      if (el?.dataset.index != null) setOpenIndex(Number(el.dataset.index));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Reset view + lock page scroll on open / navigate.
  useEffect(() => {
    if (!isOpen) return;
    reset();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openIndex, isOpen, reset]);

  // Keyboard.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close, go]);

  // Wheel zoom (desktop) — non-passive so preventDefault works.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(scale.current * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen, openIndex, zoomTo]);

  // Pointer gestures: 1-finger swipe / pan, 2-finger pinch.
  useEffect(() => {
    if (!isOpen) return;
    const pts = pointers.current;

    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;

      if (g.mode === 'pinch' && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const s1 = clampScale(g.startScale * (dist / g.startDist));
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const k = 1 - s1 / g.startScale;
        pos.current = {
          x: g.startPos.x + (mid.x - g.startMid.x) + k * (g.startMid.x - centerX - g.startPos.x),
          y: g.startPos.y + (mid.y - g.startMid.y) + k * (g.startMid.y - centerY - g.startPos.y),
        };
        scale.current = s1;
        clampPos();
        applyTransform();
      } else if (g.mode === 'pan') {
        pos.current = {
          x: g.startPos.x + (e.clientX - g.startX),
          y: g.startPos.y + (e.clientY - g.startY),
        };
        clampPos();
        applyTransform();
      } else if (g.mode === 'swipe' && imgRef.current) {
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        imgRef.current.style.transition = 'none';
        imgRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
      }
    };

    const onUp = (e: PointerEvent) => {
      const g = gesture.current;
      const last = pts.get(e.pointerId);
      pts.delete(e.pointerId);

      if (g.mode === 'swipe' && last) {
        const dx = last.x - g.startX;
        const dy = last.y - g.startY;
        if (Math.abs(dx) > SWIPE_NAV_PX && Math.abs(dx) > Math.abs(dy)) {
          reset();
          go(dx < 0 ? 1 : -1);
        } else if (dy > SWIPE_CLOSE_PX && dy > Math.abs(dx)) {
          close();
        } else {
          reset(true); // snap back
        }
      }

      if (pts.size === 0) {
        gesture.current = { mode: 'idle' };
        if (scale.current <= 1.001) reset(true);
      } else if (pts.size === 1 && g.mode === 'pinch') {
        const [p] = [...pts.values()];
        gesture.current =
          scale.current > 1
            ? { mode: 'pan', startX: p.x, startY: p.y, startPos: { ...pos.current } }
            : { mode: 'swipe', startX: p.x, startY: p.y };
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      pts.clear();
      gesture.current = { mode: 'idle' };
    };
  }, [isOpen, applyTransform, clampPos, reset, go, close]);

  const onPointerDown = (e: React.PointerEvent) => {
    const pts = pointers.current;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      imgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* not fatal */
    }

    if (pts.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0;
        if (scale.current > 1) reset(true);
        else zoomTo(DOUBLE_TAP_SCALE, e.clientX, e.clientY, true);
        gesture.current = { mode: 'idle' };
        return;
      }
      lastTap.current = now;
      gesture.current =
        scale.current > 1
          ? { mode: 'pan', startX: e.clientX, startY: e.clientY, startPos: { ...pos.current } }
          : { mode: 'swipe', startX: e.clientX, startY: e.clientY };
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      gesture.current = {
        mode: 'pinch',
        startDist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
        startScale: scale.current,
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startPos: { ...pos.current },
      };
    }
  };

  const current = openIndex === null ? null : images[openIndex];

  return (
    <div
      id="lightbox"
      ref={overlayRef}
      className={isOpen ? 'active' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de imagem"
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
    >
      <span className="lightbox-close" onClick={close}>{'×'}</span>
      {current && (
        <img
          ref={imgRef}
          className="lightbox-img"
          src={current.src}
          alt={current.alt}
          draggable={false}
          onPointerDown={onPointerDown}
          onDoubleClick={(e) => {
            if (scale.current > 1) reset(true);
            else zoomTo(DOUBLE_TAP_SCALE, e.clientX, e.clientY, true);
          }}
        />
      )}
      <div className="lightbox-prev" onClick={() => go(-1)}>{'❮'}</div>
      <div className="lightbox-next" onClick={() => go(1)}>{'❯'}</div>
    </div>
  );
}
