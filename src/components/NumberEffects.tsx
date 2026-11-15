import { useEffect, useRef, useState } from 'react';
import type { PortfolioStat } from '../types/portfolio';

function OdometerDigit({ digit, active, delayMs }: { digit: string; active: boolean; delayMs: number }) {
  const num = Number(digit);
  if (Number.isNaN(num)) {
    return <span className="inline-block">{digit}</span>;
  }

  return (
    <span className="relative inline-block h-[1.15em] overflow-hidden align-top tabular-nums">
      <span
        className="flex flex-col transition-transform duration-900"
        style={{
          transform: active ? `translate3d(0, -${num * 10}%, 0)` : 'translate3d(0, 0%, 0)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: `${delayMs}ms`,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="block h-[1.15em] leading-[1.15em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

interface OdometerStatCardProps {
  stat: PortfolioStat;
  index: number;
}

export function OdometerStatCard({ stat, index }: OdometerStatCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const targetStr = String(Math.max(0, Math.round(stat.number)));
  const stagger = index * 110;

  return (
    <div
      ref={ref}
      className="space-y-1.5 transition-all duration-700"
      style={{
        opacity: triggered ? 1 : 0,
        transform: triggered ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${stagger}ms`,
      }}
    >
      <div className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F4F0] tabular-nums flex items-baseline">
        {Array.from(targetStr).map((ch, i) => (
          <OdometerDigit
            key={i}
            digit={ch}
            active={triggered}
            delayMs={stagger + i * 70}
          />
        ))}
        {stat.suffix && (
          <span className="ml-0.5 text-[#E5A93C]">{stat.suffix}</span>
        )}
      </div>
      <div className="text-xs font-medium text-[#D4D4D8]">{stat.label}</div>
      <div className="text-xs text-[#71717A]">{stat.detail}</div>
    </div>
  );
}

interface SkillProgressRingProps {
  label: string;
  category: string;
  level: number;
  index: number;
}

export function SkillProgressRing({ label, category, level, index }: SkillProgressRingProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!triggered) return;
    let rafId = 0;
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayNum(Math.round(level * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [triggered, level]);

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = triggered ? circumference * (1 - level / 100) : circumference;

  return (
    <div
      ref={ref}
      className="rounded-xl border border-white/10 bg-[#111115] p-5 space-y-4 transition-all duration-500"
      style={{
        opacity: triggered ? 1 : 0,
        transform: triggered ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
        transitionDelay: `${index * 70}ms`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#E5A93C]">{category}</div>
          <h3 className="mt-1 font-display text-base font-semibold text-[#F4F4F0]">{label}</h3>
        </div>

        <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#E5A93C"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 1100ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </svg>
          <span className="absolute font-mono text-xs font-medium text-[#F4F4F0] tabular-nums">
            {displayNum}%
          </span>
        </div>
      </div>

      <AnimatedProgressBar percent={level} triggered={triggered} />
    </div>
  );
}

export function AnimatedProgressBar({
  percent,
  label,
  triggered: externalTriggered,
}: {
  percent: number;
  label?: string;
  triggered?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [internalTriggered, setInternalTriggered] = useState(false);
  const active = externalTriggered ?? internalTriggered;

  useEffect(() => {
    if (externalTriggered !== undefined) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInternalTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [externalTriggered]);

  return (
    <div ref={ref} className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#D4D4D8]">{label}</span>
          <span className="font-mono text-[#E5A93C] tabular-nums">{percent}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full w-full origin-left bg-[#E5A93C] transition-transform duration-1000"
          style={{
            transform: active ? `scaleX(${Math.max(0, Math.min(1, percent / 100))})` : 'scaleX(0)',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  );
}
