import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight, Laptop, Layers, RotateCcw, Smartphone } from 'lucide-react';
import type { PortfolioProject } from '../types/portfolio';
import { parseVideoSource } from '../lib/media';
import { AnimatedProgressBar } from './NumberEffects';
import { MagneticButton } from './MagneticButton';
import { ResilientImage } from './ResilientImage';

const ProjectMockup3D = lazy(() => import('./ProjectMockup3D'));

interface ProjectDetailPageProps {
  project: PortfolioProject;
  onBack: () => void;
}

export function ProjectDetailPage({ project, onBack }: ProjectDetailPageProps) {
  const [mockupMode, setMockupMode] = useState<'laptop' | 'phone'>(project.mockupType);
  const [exploded, setExploded] = useState(false);
  const [assembleKey, setAssembleKey] = useState(0);
  const video = parseVideoSource(project.videoUrl);

  useEffect(() => {
    setMockupMode(project.mockupType);
    setExploded(false);
    setAssembleKey((k) => k + 1);
  }, [project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-[#09090B] text-[#F4F4F0]"
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090B]/95">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            data-cursor="Back"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#D4D4D8] hover:text-[#E5A93C] transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Portfolio</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="text-[#E5A93C] font-medium">{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{project.client}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{project.year}</span>
          </div>

          {project.externalUrl ? (
            <MagneticButton
              label="Open Files"
              href={project.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              arrowType="up-right"
              cursorLabel="Open"
            />
          ) : (
            <div className="w-24" />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-12 lg:py-16 space-y-14">
        {/* Title & Summary */}
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="text-[#E5A93C] font-medium">{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{project.client}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{project.year}</span>
          </div>
          <h1 className="font-display var-heading-hover text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            {project.title}
          </h1>
          <p className="text-base leading-relaxed text-[#A1A1AA]">{project.summary}</p>
        </div>

        {/* Interactive 3D Device Mockup Showcase */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-medium text-[#A1A1AA]">
              Interactive 3D Device Presentation
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExploded((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  exploded
                    ? 'border-[#E5A93C] bg-[#E5A93C]/15 text-[#E5A93C]'
                    : 'border-white/10 bg-[#121216] text-[#A1A1AA] hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{exploded ? 'Assemble' : 'Explode View'}</span>
              </button>
              <button
                type="button"
                onClick={() => setAssembleKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121216] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Rebuild 3D</span>
              </button>
              <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#121216] p-1">
                <button
                  type="button"
                  onClick={() => setMockupMode('laptop')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    mockupMode === 'laptop'
                      ? 'bg-[#E5A93C] text-[#09090B]'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Laptop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMockupMode('phone')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    mockupMode === 'phone'
                      ? 'bg-[#E5A93C] text-[#09090B]'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Phone</span>
                </button>
              </div>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111115]">
                <ResilientImage
                  src={project.coverImage}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              </div>
            }
          >
            <ProjectMockup3D
              imageUrl={project.coverImage}
              title={project.title}
              mockupType={mockupMode}
              exploded={exploded}
              assembleKey={assembleKey}
            />
          </Suspense>
        </section>

        {/* Optional Video Embed */}
        {video.kind !== 'none' && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Motion Reel Preview</h2>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              {video.kind === 'direct' ? (
                <video src={video.src} controls playsInline className="h-full w-full object-contain" />
              ) : (
                <iframe
                  src={video.src}
                  title={project.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              )}
            </div>
          </section>
        )}

        {/* Goal / Approach / Results Case Study Breakdown */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 border-t border-white/10 pt-10">
          <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-2.5">
            <div className="font-mono text-xs text-[#E5A93C]">01. Goal</div>
            <h3 className="font-display text-lg font-semibold">Creative Objective</h3>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">{project.goal}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-2.5">
            <div className="font-mono text-xs text-[#E5A93C]">02. Approach</div>
            <h3 className="font-display text-lg font-semibold">Design &amp; Execution</h3>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">{project.approach}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111115] p-6 space-y-4">
            <div>
              <div className="font-mono text-xs text-[#E5A93C]">03. Results</div>
              <h3 className="mt-1 font-display text-lg font-semibold">Measured Impact</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{project.results}</p>
            </div>
            {project.resultMetrics?.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                {project.resultMetrics.map((m, idx) => (
                  <AnimatedProgressBar key={idx} label={m.label} percent={m.percent} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Deliverables & Footer Action */}
        <section className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <div className="text-xs text-[#A1A1AA]">
            <span className="text-[#71717A] mr-2">Deliverables:</span>
            <span className="text-[#F4F4F0]">{project.deliverables || 'Full Production Suite'}</span>
          </div>
          {project.externalUrl && (
            <a
              href={project.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#E5A93C] hover:underline"
            >
              <span>Inspect Source Deliverables</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </section>
      </main>
    </motion.div>
  );
}
