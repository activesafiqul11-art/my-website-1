import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { PortfolioProject } from '../types/portfolio';
import { ResilientImage } from './ResilientImage';

interface TiltProjectCardProps {
  project: PortfolioProject;
  isLead?: boolean;
  index?: number;
  buildKey?: number;
  onOpen: (project: PortfolioProject) => void;
}

export function TiltProjectCard({
  project,
  isLead = false,
  index = 0,
  buildKey = 0,
  onOpen,
}: TiltProjectCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setBuilt(true);
      return;
    }

    setBuilt(false);
    const el = cardRef.current;
    if (!el) return;

    let timerId: number | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          timerId = window.setTimeout(() => {
            setBuilt(true);
          }, Math.min(index, 6) * 90);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [index, buildKey]);

  const handleMove = (e: React.PointerEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 9,
      ry: (px - 0.5) * 11,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  };

  const handleLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  const liftOffset = built ? 0 : 24;

  return (
    <article
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      data-cursor="View"
      className={`group relative rounded-2xl border border-white/10 bg-[#111115] overflow-hidden flex flex-col justify-between hover:border-[#E5A93C]/40 transition-colors will-change-transform ${
        isLead ? 'md:col-span-2 lg:col-span-2' : ''
      }`}
      style={{
        opacity: built ? 1 : 0.08,
        transform: `perspective(950px) translate3d(0, ${liftOffset}px, 0) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
        transition: tilt.active
          ? 'transform 120ms ease-out, opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 680ms cubic-bezier(0.16, 1, 0.3, 1), opacity 550ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Architectural Blueprint Scaffolding Draw-In */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px origin-left bg-gradient-to-r from-[#E5A93C]/70 via-[#E5A93C]/20 to-transparent"
        style={{
          transform: built ? 'scaleX(1)' : 'scaleX(0)',
          opacity: built ? 0.55 : 0,
          transition: 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-px origin-top bg-gradient-to-b from-[#E5A93C]/70 via-[#E5A93C]/20 to-transparent"
        style={{
          transform: built ? 'scaleY(1)' : 'scaleY(0)',
          opacity: built ? 0.55 : 0,
          transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1) 70ms, opacity 600ms ease',
        }}
      />

      {/* Dynamic Specular Glare Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: tilt.active ? 1 : 0,
          background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(229, 169, 60, 0.14), transparent 52%)`,
        }}
      />

      <button
        type="button"
        onClick={() => onOpen(project)}
        data-cursor="View"
        className="text-left flex-1 flex flex-col w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
      >
        <div
          className={`relative w-full overflow-hidden bg-[#09090B] ${
            isLead ? 'aspect-[16/9]' : 'aspect-[4/3]'
          }`}
          style={{
            clipPath: built ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
            transition: 'clip-path 780ms cubic-bezier(0.16, 1, 0.3, 1) 90ms',
          }}
        >
          <ResilientImage
            src={project.coverImage}
            alt={project.title}
            fallbackTitle={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          {project.videoUrl && (
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-md bg-[#09090B]/90 border border-white/15 px-2.5 py-1 text-[11px] font-medium text-[#F4F4F0]">
              <Play className="h-3 w-3 text-[#E5A93C]" />
              <span>Play Reel</span>
            </span>
          )}
        </div>

        <div
          className="p-6 flex-1 flex flex-col justify-between space-y-4"
          style={{
            opacity: built ? 1 : 0,
            transform: built ? 'translate3d(0, 0, 0)' : 'translate3d(0, 12px, 0)',
            transition:
              'opacity 520ms cubic-bezier(0.16, 1, 0.3, 1) 180ms, transform 580ms cubic-bezier(0.16, 1, 0.3, 1) 180ms',
          }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
              <span className="text-[#E5A93C] font-medium">{project.category}</span>
              <span aria-hidden="true">·</span>
              <span>{project.client}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{project.year}</span>
            </div>
            <h3 className="mt-2 font-display var-heading-hover text-xl font-semibold text-[#F4F4F0] group-hover:text-[#E5A93C] transition-colors">
              {project.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA] line-clamp-2">
              {project.summary}
            </p>
          </div>

          {project.deliverables && (
            <p className="pt-3 border-t border-white/10 text-xs text-[#71717A]">
              {project.deliverables}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
