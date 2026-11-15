import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduced) return;

    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      setVisible(true);

      const targetEl = e.target as HTMLElement | null;
      const cursorNode = targetEl?.closest?.('[data-cursor]') as HTMLElement | null;
      if (cursorNode) {
        setLabel(cursorNode.getAttribute('data-cursor') || 'View');
      } else {
        const interactive = targetEl?.closest?.('a, button');
        setLabel(interactive ? 'Open' : null);
      }
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    let rafId = 0;
    const tick = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.22;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.22;
      const el = cursorRef.current;
      if (el) {
        el.style.transform = `translate3d(${currentRef.current.x.toFixed(1)}px, ${currentRef.current.y.toFixed(1)}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (!enabled || !visible) return null;

  const isExpanded = Boolean(label);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] -translate-x-1/2 -translate-y-1/2 will-change-transform hidden md:flex items-center justify-center"
    >
      <div
        className={`flex items-center justify-center rounded-full transition-all duration-200 ${
          isExpanded
            ? 'h-14 w-14 bg-[#E5A93C] text-[#09090B] shadow-lg'
            : 'h-3 w-3 border border-[#E5A93C]/80 bg-transparent'
        }`}
      >
        {isExpanded && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
