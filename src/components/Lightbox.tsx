import { useCallback, useEffect, useRef, useState } from 'react';

type LightboxImage = { src: string; alt: string };

const ZOOM_STEP = 0.15;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;

/**
 * Port of the original gallery.js lightbox: wheel zoom, click-drag pan,
 * arrow-key navigation with wraparound, close on Esc / backdrop / ×.
 * Thumbnails are the server-rendered <img data-index> inside .masonry-gallery.
 */
export default function Lightbox({ images }: { images: LightboxImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const scale = useRef(1);
  const pos = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isOpen = openIndex !== null;

  const applyTransform = useCallback(() => {
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(${scale.current})`;
    }
  }, []);

  const resetView = useCallback(() => {
    scale.current = 1;
    pos.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  // Open on thumbnail click. Delegated from `document` so it doesn't depend on
  // the gallery being in the DOM at any particular moment during hydration.
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

  // Reset zoom/pan on open and on navigation; lock page scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    resetView();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openIndex, isOpen, resetView]);

  // Keyboard: Esc closes, arrows navigate (wraparound).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close, next, prev]);

  // Wheel zoom — registered manually so preventDefault works (React onWheel is passive).
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scale.current += e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      scale.current = Math.max(ZOOM_MIN, Math.min(scale.current, ZOOM_MAX));
      applyTransform();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen, openIndex, applyTransform]);

  // Drag to pan.
  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      pos.current = { x: e.clientX - drag.current.x, y: e.clientY - drag.current.y };
      applyTransform();
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isOpen, applyTransform]);

  const onImgMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { x: e.clientX - pos.current.x, y: e.clientY - pos.current.y };
  };

  const current = openIndex === null ? null : images[openIndex];

  // TODO: touch support (tap to open, pinch zoom, swipe) — not in the original.
  return (
    <div
      id="lightbox"
      ref={overlayRef}
      className={isOpen ? 'active' : undefined}
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
          onMouseDown={onImgMouseDown}
        />
      )}
      <div className="lightbox-prev" onClick={prev}>{'❮'}</div>
      <div className="lightbox-next" onClick={next}>{'❯'}</div>
    </div>
  );
}
