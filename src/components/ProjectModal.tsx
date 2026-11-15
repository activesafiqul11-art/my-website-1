import { useEffect } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { PortfolioProject } from '../types/portfolio';
import { parseVideoSource } from '../lib/media';
import { ResilientImage } from './ResilientImage';

interface ProjectModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  const video = parseVideoSource(project.videoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-[#121216] overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar inside modal */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="text-[#E5A93C] font-medium">{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{project.client}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{project.year}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/25 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Media Viewport */}
        <div className="bg-[#09090B] aspect-video w-full overflow-hidden">
          {video.kind === 'direct' ? (
            <video
              src={video.src}
              controls
              playsInline
              className="h-full w-full object-contain bg-black"
            />
          ) : video.kind === 'iframe' ? (
            <iframe
              src={video.src}
              title={project.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <ResilientImage
              src={project.coverImage}
              alt={project.title}
              fallbackTitle={project.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Project Details */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3
                id="project-modal-title"
                className="font-display text-2xl font-semibold text-[#F4F4F0]"
              >
                {project.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#A1A1AA] max-w-2xl">
                {project.summary}
              </p>
            </div>

            {project.externalUrl && (
              <a
                href={project.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#E5A93C] px-4 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#ebb655] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open Project Files</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {project.deliverables && (
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#71717A]">Deliverables</span>
              <span className="text-[#D4D4D8]">{project.deliverables}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
