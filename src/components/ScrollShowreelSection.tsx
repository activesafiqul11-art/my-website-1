import { useEffect, useRef, useState } from 'react';
import { MotionStage3D } from './MotionStage3D';
import type { PortfolioService } from '../types/portfolio';

interface ScrollShowreelSectionProps {
  services: PortfolioService[];
}

export function ScrollShowreelSection({ services }: ScrollShowreelSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight * 0.75;
      if (totalScrollable <= 0) {
        setScrollProgress(0);
        return;
      }
      const raw = (-rect.top + window.innerHeight * 0.25) / totalScrollable;
      const clamped = Math.max(0, Math.min(1, raw));
      setScrollProgress(clamped);

      if (services.length > 0) {
        const idx = Math.min(services.length - 1, Math.floor(clamped * services.length));
        setActiveChapter(idx);
      }
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [services.length]);

  return (
    <section
      id="showreel"
      ref={sectionRef}
      className="relative border-t border-white/10 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#E5A93C]">
              Interactive 3D Showreel &amp; Disciplines
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#F4F4F0] md:text-4xl text-balance">
              Scroll to scrub the motion rig and layer depth
            </h2>
          </div>
          <p className="font-mono text-xs text-[#A1A1AA] tabular-nums whitespace-nowrap">
            Timeline Progress · {Math.round(scrollProgress * 100)}%
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Scrollable Chapter Cards */}
          <div className="lg:col-span-5 space-y-6">
            {services.map((service, index) => {
              const isActive = index === activeChapter;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setActiveChapter(index);
                    setScrollProgress((index + 0.35) / Math.max(services.length, 1));
                  }}
                  className={`w-full text-left rounded-2xl border p-6 transition-colors duration-200 ${
                    isActive
                      ? 'border-[#E5A93C]/50 bg-[#141418]'
                      : 'border-white/10 bg-[#0F0F12] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-xs text-[#E5A93C] tabular-nums">
                      {service.number}
                    </span>
                    <span className="text-xs text-[#71717A] tabular-nums">
                      Sequence 0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-[#F4F4F0]">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA]">
                    {service.description}
                  </p>
                  <p className="mt-4 pt-3 border-t border-white/10 text-xs text-[#D4D4D8]">
                    {service.deliverables}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Sticky 3D Video Viewport Driven by Scroll */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="h-[420px] sm:h-[480px] lg:h-[540px] w-full">
              <MotionStage3D
                scrollProgress={scrollProgress}
                activeChapter={activeChapter}
                showDock={true}
                caption={`ACTIVE SEQUENCE · ${services[activeChapter]?.title?.toUpperCase() || 'SHOWREEL'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
