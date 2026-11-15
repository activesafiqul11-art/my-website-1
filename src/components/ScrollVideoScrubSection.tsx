import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resolveMediaUrl } from '../lib/media';
import { SectionHeading } from './TypographyEffects';

gsap.registerPlugin(ScrollTrigger);

interface ScrollVideoScrubSectionProps {
  videoUrl: string;
  posterImage: string;
}

export function ScrollVideoScrubSection({
  videoUrl,
  posterImage,
}: ScrollVideoScrubSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scrubPercent, setScrubPercent] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);

  const posterSrc = resolveMediaUrl(posterImage);

  useEffect(() => {
    setVideoFailed(false);
  }, [videoUrl]);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const video = videoRef.current;
    if (!section || !frame) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      // 3D perspective tilt scrub on scroll
      gsap.fromTo(
        frame,
        { rotateX: 9, scale: 0.94 },
        {
          rotateX: 0,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 30%',
            scrub: 0.35,
            onUpdate: (self) => {
              setScrubPercent(Math.round(self.progress * 100));
              if (video && video.readyState >= 2 && Number.isFinite(video.duration) && video.duration > 0) {
                const targetTime = self.progress * video.duration;
                if (Math.abs(video.currentTime - targetTime) > 0.02) {
                  video.currentTime = targetTime;
                }
              }
            },
          },
        },
      );
    }, section);

    return () => {
      ctx.revert();
    };
  }, [videoUrl]);

  return (
    <section
      id="showreel"
      ref={sectionRef}
      className="border-t border-white/10 py-20 lg:py-28 bg-[#0B0B0E]"
    >
      <div className="mx-auto max-w-[1200px] px-6 space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            kicker="Scroll-Scrubbed Motion Reel"
            title="Frame-by-frame motion playback driven by scroll"
          />
          <div className="font-mono text-xs text-[#A1A1AA] tabular-nums">
            Scrub Position · <span className="text-[#E5A93C]">{scrubPercent}%</span>
          </div>
        </div>

        <div style={{ perspective: '1200px' }}>
          <div
            ref={frameRef}
            className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-[#09090B] shadow-2xl will-change-transform"
          >
            {videoUrl && !videoFailed ? (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterSrc}
                muted
                playsInline
                preload="auto"
                onError={() => setVideoFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={posterSrc}
                alt="Showreel Poster"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
              <div
                className="h-full bg-[#E5A93C] transition-[width] duration-75"
                style={{ width: `${scrubPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
