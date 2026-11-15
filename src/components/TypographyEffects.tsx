import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface KineticHeroHeadlineProps {
  text: string;
  className?: string;
}

export function KineticHeroHeadline({ text, className = '' }: KineticHeroHeadlineProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const lines = useMemo(() => {
    const words = text.trim().split(/\s+/);
    const result: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > 22 && current.length > 0) {
        result.push(current.trim());
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) result.push(current.trim());
    return result;
  }, [text]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      setPointer({ x: e.clientX, y: e.clientY, active: true });
    };
    const onLeave = () => {
      setPointer((p) => ({ ...p, active: false }));
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  let runningIndex = 0;

  return (
    <h1
      ref={containerRef}
      className={`font-display var-heading-hover text-balance ${className}`}
      aria-label={text}
    >
      {lines.map((line, lineIdx) => {
        const wordsInLine = line.split(' ');
        return (
          <span key={lineIdx} className="block overflow-hidden py-0.5">
            <span className="inline-flex flex-wrap gap-x-[0.26em]">
              {wordsInLine.map((word, wordIdx) => (
                <span key={wordIdx} className="inline-flex whitespace-nowrap">
                  {Array.from(word).map((ch, charIdx) => {
                    const idx = runningIndex++;
                    let offsetY = 0;
                    let scale = 1;
                    const node = charRefs.current[idx];
                    if (pointer.active && node) {
                      const rect = node.getBoundingClientRect();
                      const cx = rect.left + rect.width / 2;
                      const cy = rect.top + rect.height / 2;
                      const dist = Math.hypot(pointer.x - cx, pointer.y - cy);
                      const radius = 115;
                      if (dist < radius) {
                        const strength = 1 - dist / radius;
                        offsetY = -strength * 6;
                        scale = 1 + strength * 0.06;
                      }
                    }

                    return (
                      <motion.span
                        key={charIdx}
                        ref={(r) => {
                          charRefs.current[idx] = r;
                        }}
                        initial={{ y: '110%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{
                          duration: 0.65,
                          delay: 0.05 + idx * 0.014,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block will-change-transform"
                        style={{
                          transform: `translate3d(0, ${offsetY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`,
                          transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        {ch}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </h1>
  );
}

interface SectionHeadingProps {
  kicker: string;
  title: string;
  className?: string;
}

export function SectionHeading({ kicker, title, className = '' }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  const lines = useMemo(() => {
    const words = title.trim().split(/\s+/);
    const out: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > 30 && current.length > 0) {
        out.push(current.trim());
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) out.push(current.trim());
    return out;
  }, [title]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      <p className="text-xs font-medium tracking-wide text-[#E5A93C]">{kicker}</p>
      <h2 className="mt-2 font-display var-heading-hover text-3xl font-semibold tracking-tight text-[#F4F4F0] md:text-4xl text-balance">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <span
              className="block transition-transform duration-700"
              style={{
                transform: inView ? 'translate3d(0, 0, 0)' : 'translate3d(0, 105%, 0)',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: `${i * 90}ms`,
              }}
            >
              {line}
            </span>
          </span>
        ))}
      </h2>
      <div className="mt-3 h-[2px] w-20 overflow-hidden bg-white/10">
        <div
          className="h-full w-full bg-[#E5A93C] origin-left transition-transform duration-700"
          style={{
            transform: inView ? 'scaleX(1)' : 'scaleX(0)',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '180ms',
          }}
        />
      </div>
    </div>
  );
}

interface ScrollRevealParagraphProps {
  text: string;
  className?: string;
}

export function ScrollRevealParagraph({ text, className = '' }: ScrollRevealParagraphProps) {
  const containerRef = useRef<HTMLParagraphElement | null>(null);
  const [progress, setProgress] = useState(0);
  const words = useMemo(() => text.trim().split(/\s+/), [text]);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const start = window.innerHeight * 0.88;
      const end = window.innerHeight * 0.32;
      const p = (start - rect.top) / Math.max(start - end, 1);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <p ref={containerRef} className={`leading-relaxed ${className}`}>
      {words.map((word, idx) => {
        const threshold = idx / Math.max(words.length - 1, 1);
        const lit = progress >= threshold * 0.92;
        return (
          <span
            key={idx}
            className="inline-block mr-[0.28em] transition-opacity duration-300"
            style={{ opacity: lit ? 1 : 0.24 }}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}

interface ScrollFillTextProps {
  text: string;
  className?: string;
}

export function ScrollFillText({ text, className = '' }: ScrollFillTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [fillPercent, setFillPercent] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const start = window.innerHeight * 0.92;
      const end = window.innerHeight * 0.28;
      const p = (start - rect.top) / Math.max(start - end, 1);
      setFillPercent(Math.max(0, Math.min(100, p * 100)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={ref} className={`relative select-none overflow-hidden ${className}`}>
      <div
        className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-transparent"
        style={{ WebkitTextStroke: '1px rgba(244, 244, 240, 0.28)' }}
        aria-hidden="true"
      >
        {text}
      </div>
      <div
        className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#E5A93C] absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
      >
        {text}
      </div>
    </div>
  );
}

interface VelocityMarqueeProps {
  items: string[];
}

export function VelocityMarquee({ items }: VelocityMarqueeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    lastScrollYRef.current = window.scrollY;
    let rafId = 0;
    let lastTime = performance.now();

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;
      velocityRef.current = Math.max(-45, Math.min(45, velocityRef.current + delta * 0.25));
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Decay velocity smoothly
      velocityRef.current *= Math.pow(0.08, dt);

      const baseSpeed = 48; // px per second
      const speed = baseSpeed + Math.abs(velocityRef.current) * 8;
      offsetRef.current -= speed * dt;

      const el = trackRef.current;
      if (el) {
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && Math.abs(offsetRef.current) >= halfWidth) {
          offsetRef.current += halfWidth;
        }
        const skew = Math.max(-7, Math.min(7, -velocityRef.current * 0.22));
        el.style.transform = `translate3d(${offsetRef.current.toFixed(2)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const repeated = [...items, ...items];

  return (
    <div className="border-y border-white/10 bg-[#0D0D10] py-4 overflow-hidden">
      <div
        ref={trackRef}
        className="flex w-max items-center gap-8 will-change-transform px-4"
      >
        {repeated.map((item, i) => (
          <div key={i} className="flex items-center gap-8 whitespace-nowrap shrink-0">
            <span className="font-display text-sm sm:text-base font-medium tracking-wide text-[#D4D4D8]">
              {item}
            </span>
            <span className="text-[#E5A93C] text-xs" aria-hidden="true">
              /
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
